import { NextFunction, Request, Response } from 'express';
import { NotAuthorizedError } from '../error-handler';

export const checkAuthentication = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const userHeader = req.headers['x-user'] as string;
    if (!userHeader)
      throw new NotAuthorizedError(
        'Unauthorized.',
        'Gateway Service checkAuthentication() method'
      );

    next();
  } catch (error) {
    throw new NotAuthorizedError(
      'Unauthorized.',
      'Gateway Service checkAuthentication() method'
    );
  }
};
