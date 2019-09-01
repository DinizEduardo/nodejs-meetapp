import jwt from 'jsonwebtoken';

import authConfig from '../../config/auth';

import User from '../models/User';

class SessionController {
  async store(req, res) {
    // return res.status(200).json({ error: 'Email not found' });

    const { email, password } = req.body;

    const user = await User.findOne({
      where: { email },
    });
    if (!user) {
      return res.status(401).json({ error: 'Email not found' });
    }

    if (!(await user.checkPassword(password))) {
      return res.status(401).json({ error: 'Password does not match' });
    }

    const { id, name, avatar } = user;

    // jwt.sign recebe 3 parametros
    // 1. O valor que estará na primeira parte do token
    // 2. uma string para criptografar o token
    //      Recomendado usar MD5 ONLINE e escrever algo UNICO.
    // 3. Um objeto com algumas informações referentes ao token
    //      Como por exemplo quanto tempo o token é valido (expiresIn)
    return res.json({
      user: {
        id,
        name,
        email,
        avatar,
      },
      token: jwt.sign({ id }, authConfig.secret, {
        expiresIn: authConfig.expiresIn,
      }),
    });
  }
}

export default new SessionController();
