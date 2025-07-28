import { NextFunction, Request, Response } from "express";
import { StrictLogger } from "../logger";
import { CustomError, IErrorResponse } from "../error-handler";



interface Params {
  log: StrictLogger;
  serviceName: string;
}

export function errorHandlerMiddleware({ log, serviceName }: Params) {
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
          message: 'Internal Server Error. Please try again later',
        });
      } else {
        log.error('Custom Error', error.comingFrom, error);
        res.status(error.statusCode).json(error.serializeErrors());
      }
    } catch (err) {
      log.error(`Unexpected Error in global error handler`, serviceName, err as Error);
      res.status(500).json({
        status: 'error',
        message: 'Internal Server Error',
      });
    }
  };
}
