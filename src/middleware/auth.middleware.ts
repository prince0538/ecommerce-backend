import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
      role: string;
    };
    (req as AuthRequest).user = { id: decoded.id, role: decoded.role };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const authorize =
  (...roles: string[]) =>
    (req: Request, res: Response, next: NextFunction) => {
      const user = (req as AuthRequest).user;

      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!roles.includes(user.role)) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      next();
    };