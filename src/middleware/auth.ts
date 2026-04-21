import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Recruiter } from '../models/Recruiter';

export interface AuthRequest extends Request {
  recruiterId?: string;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    
    const recruiter = await Recruiter.findById(decoded.id);
    if (!recruiter) {
      return res.status(401).json({ message: 'Invalid token, recruiter not found' });
    }

    req.recruiterId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
