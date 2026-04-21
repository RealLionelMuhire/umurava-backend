import { Request, Response, NextFunction } from 'express';

// This is the mocked implementation
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  (req as any).recruiterId = 'mock_recruiter_id';
  next();
};
