import jwt from 'jsonwebtoken';
import { env } from '../config/environment.js';

export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      tokenVersion: user.tokenVersion !== undefined ? user.tokenVersion : 0
    },
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN || '2h',
      algorithm: 'HS256'
    }
  );
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ['HS256']
    });
  } catch (error) {
    return null;
  }
};
