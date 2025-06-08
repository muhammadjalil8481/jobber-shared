import { NextFunction, Request, Response } from 'express';
import crypto from 'crypto';
import { NotAuthorizedError } from '../error-handler';
import { Logger } from 'winston';

export const GatewayRequestVerification = (log: Logger, publicKey: string) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const signature = req.headers['x-gateway-token'] as string;

      const verifier = crypto.createVerify('SHA256');
      verifier.end();

      const isValid = verifier.verify(publicKey, signature, 'base64');

      if (!isValid) {
        throw new NotAuthorizedError(
          'Unauthorized request',
          'GatewayRequestVerification method()'
        );
      }

      next();
    } catch (error) {
      log.error('Unexpected Error GatewayRequestVerification method', error);
      throw new NotAuthorizedError(
        'Unauthorized request',
        'GatewayRequestVerification method()'
      );
    }
  };
};
