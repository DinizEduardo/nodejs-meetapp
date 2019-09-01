import { startOfHour, isBefore, parseISO } from 'date-fns';
import Subscription from '../models/Subscription';
import Meetup from '../models/Meetup';
import User from '../models/User';
import Mail from '../../lib/Mail';
import File from '../models/File';

class SubscriptionController {
  async store(req, res) {
    const meetup = await Meetup.findByPk(req.params.id, {
      include: [
        {
          model: User,
          attributes: ['name', 'email'],
        },
      ],
    });

    if (!meetup) {
      return res.status(400).json({ error: 'Meetup not found' });
    }
    const { userId } = req;
    if (meetup.id_user === userId) {
      return res
        .status(401)
        .json({ error: 'You cant subscribe to your own meetups ' });
    }

    const hourStart = startOfHour(parseISO(meetup.date));

    if (isBefore(hourStart, new Date())) {
      return res
        .status(400)
        .json({ error: 'You cant subscribe to past meetups' });
    }

    const sub = await Subscription.findOne({
      where: {
        id_user: userId,
        id_meetup: meetup.id,
      },
    });

    if (sub) {
      return res
        .status(401)
        .json({ error: 'You cant subscribe twice to the same meetup' });
    }

    const checkDate = await Subscription.findOne({
      where: {
        id_user: userId,
      },
      include: [
        {
          model: Meetup,
          required: true,
          where: {
            date: meetup.date,
          },
        },
      ],
    });

    if (checkDate) {
      return res
        .status(400)
        .json({ error: 'Cant subscribe to two meetups at the same time' });
    }

    // meetup.User.email
    await Mail.sendMail({
      to: `${meetup.User.name} <${meetup.User.email}>`,
      subject: 'Nova inscrição',
      text: `Novo usuario inscrito no seu meetup: ${meetup.title}`,
    });

    const subscription = await Subscription.create({
      id_user: userId,
      id_meetup: meetup.id,
    });

    return res.json(subscription);
  }

  async delete(req, res){
    const { userId } = req;
    // id é o id do meetup
    const {id} = req.params;
    const subs = await Subscription.findOne({
          where : {
            id_user : userId,
            id_meetup: id
          }
        });

    if (!subs) {
      return res.status(400).json({ error: 'Meetup not found or you are not subscribe to it.' });
    }

    const hourStart = startOfHour(parseISO(subs.date));

    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Cant unsub to past meetups.' });
    }

    subs.destroy();

    return res.json({ message: 'deleted' });

  }

  async index(req, res) {
    const { page = 1 } = req.query;
    
    const users = await Subscription.findAll({
      where: {
        id_user: req.userId,
      },
      limit: 10,
      offset: (page - 1) * 10,
      attributes: [],
      include: [
        {
          model: Meetup,
          required: true,
          include: [{
            model: File,

          }, {
            model: User
          }],
        },
        {
          model: User,
          required: true,
          attributes: ['name', 'email'],
        },
      ],
      order: [[Meetup, 'date']],
    });
    return res.json(users);
  }
}

export default new SubscriptionController();
