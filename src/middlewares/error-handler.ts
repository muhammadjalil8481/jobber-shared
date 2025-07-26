import { NextFunction, Request, Response } from 'express';
import { CustomError, IErrorResponse } from '../error-handler';
import { StrictLogger } from '../logger';

interface Params {
  log: StrictLogger;
  fileName: string;
  serviceName: string;
}

export function errorHandlerMiddleware({ log, fileName, serviceName }: Params) {
  return (
    error: Error | IErrorResponse,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    try {
      const isCustomError = error instanceof CustomError;
      if (!isCustomError) {
        log.error(
          `Unexpected Error`,
          (error as IErrorResponse).comingFrom,
          error as Error
        );
        res.status(500).json({
          status: 'error',
          message: 'Internal Server Error',
        });
      } else {
        log.error('Custom Error', error.comingFrom);
        res.status(error.statusCode).json(error.serializeErrors());
      }
    } catch (err) {
      log.error(`Unexpected Error`, `${fileName}/${serviceName}`, err as Error);
      res.status(500).json({
        status: 'error',
        message: 'Internal Server Error',
      });
    }
  };
}
