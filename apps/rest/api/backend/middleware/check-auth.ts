import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  userData?: { email: string; userId: string };
}

const checkAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'token missing' });
  }
  jwt.verify(token, process.env.JWT as string, (err, decodedToken: any) => {
    if (err) {
      return res.status(401).json({ message: 'token invalid' });
    }
    req.userData = { email: decodedToken.email, userId: decodedToken.userId };
    next();
  });
};

export default checkAuth;