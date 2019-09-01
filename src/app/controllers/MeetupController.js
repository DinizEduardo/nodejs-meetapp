import * as Yup from 'yup';

import {
  isBefore,
  startOfHour,
  parseISO,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { Op } from 'sequelize';
import Meetup from '../models/Meetup';
import File from '../models/File';
import User from '../models/User';
import Subscription from '../models/Subscription';


class MeetupController {
  async update(req, res) {
    const { userId } = req;
    const meetup = await Meetup.findByPk(req.params.id);

    if (!meetup) {
      return res.status(400).json({ error: 'Meetup not found' });
    }

    if (meetup.id_user !== userId) {
      return res.status(400).json({ error: 'Its not yours' });
    }

    const hourStart = startOfHour(parseISO(meetup.date));

    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Cant change past meetups' });
    }

    await meetup.update(req.body);

    return res.json(meetup);
  }

  async delete(req, res) {
    const { userId } = req;

    const meetup = await Meetup.findByPk(req.params.id);

    if (!meetup) {
      return res.status(400).json({ error: 'Meetup not found' });
    }

    if (meetup.id_user !== userId) {
      return res.status(400).json({ error: 'Its not yours' });
    }

    const hourStart = startOfHour(parseISO(meetup.date));

    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Cant delete past meetups' });
    }

    meetup.destroy();

    return res.json({ message: 'deleted' });
  }

  async indexOne(req, res) {
    const codMeetup = req.params.id;

    const meetups = await Meetup.findByPk(codMeetup, {
        include: [
          {
            model: User,
            attributes: ['id','name', 'email'],
          },
          {
            model: File,
          },
        ],
      });

    return res.json(meetups);  

  }

  async indexByUser(req, res) {
    const { page = 1 } = req.query;
    const id_user = req.userId;
    
    const meetups = await Meetup.findAll({
      where: {
        id_user,
      },
      limit: 10,
      offset: (page - 1) * 10,
      include: [
        {
          model: User,
          attributes: ['name', 'email'],
        },
        {
          model: File,
        },
      ],
    });

    return res.json(meetups);
  }

  async index(req, res) {
    const {
      date = new Date().toISOString().split('T')[0], // pega apenas YYYY-MM-DD da data atual
      page = 1,
    } = req.query;
    // se users = 0 significa que são todas os meetups senão só os meetups dele
    const parsedDate = parseISO(date);

    const meetups = await Meetup.findAll({
      where: {
        date: { [Op.between]: [startOfDay(parsedDate), endOfDay(parsedDate)] },
      },
      limit: 10,
      offset: (page - 1) * 10,
      include: [
        {
          model: User,
          attributes: ['name', 'email'],
        },
        {
          model: File,
        },
        {
          model: Subscription,
          where: {
            id_user: req.userId,
          },
          required: false,
        },
      ],
    });

    return res.json(meetups);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string()
        .required()
        .min(5),
      description: Yup.string()
        .required()
        .min(5),
      location: Yup.string()
        .required()
        .min(6),
      date: Yup.date().required(),
      id_file: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const file = await File.findByPk(req.body.id_file);
    if (!file) {
      return res.json({ error: 'id_file not found' });
    }

    const hourStart = startOfHour(parseISO(req.body.date));

    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted' });
    }

    const id_user = req.userId;
    const all = await Meetup.create({
      ...req.body,
      id_user,
    });

    return res.json(all);
  }
}

export default new MeetupController();
