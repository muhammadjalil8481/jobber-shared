import { NextFunction, Request, Response } from "express";
import { Logger } from "winston";
import { CustomError, IErrorResponse } from "../error-handler";

interface Params {
  log: Logger;
  serviceName: string;
}

function errorHandlerMiddleware({ log, serviceName }: Params) {
  return (
    error: IErrorResponse,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    try {
      const isCustomError = error instanceof CustomError;
      if (!isCustomError)
        log.error(
          `${serviceName} service error ${
            error?.comingFrom || "unknown source"
          }`,
          error
        );

      if (error instanceof CustomError) {
        res.status(error.statusCode).json(error.serializeErrors());
      } else {
        res.status(error.statusCode || 500).json({
          message: error.message || "Internal Server Error",
        });
      }
    } catch (err) {
      log.error(
        `${serviceName} Service Unexpected Error in error handler middleware`,
        err
      );
      res.status(500).json({
        message: "Internal Server Error",
      });
    }
  };
}

export { errorHandlerMiddleware };
