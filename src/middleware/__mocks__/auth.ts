import { Request, Response, NextFunction } from 'express';

// This is the mocked implementation, wrapped in the global jest.fn()
export const authMiddleware = jest.fn(
  (req: Request, res: Response, next: NextFunction) => {
    // Default mock behavior: attach a mock recruiterId and proceed
    (req as any).recruiterId = 'mock_recruiter_id';
    next();
  }
);
