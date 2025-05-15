import { StatusCodes } from 'http-status-codes';

export interface IErrorResponse {
  message: string;
  statusCode: number;
  status: string;
  comingFrom: string;
  serializeError(): IError;
}

export interface IError {
  message: string;
  statusCode: number;
  status: string;
  comingFrom?: string;
}

export abstract class CustomError extends Error {
  abstract statusCode: number;
  abstract status: string;
  comingFrom: string;

  constructor(message: string, comingFrom: string) {
    super(message); // calling the error constructor of Error class
    this.comingFrom = comingFrom;
  }

  serializeErrors(): IError {
    return {
      message: this.message,
      statusCode: this.statusCode,
      status: this.status,
      ...(process.env.NODE_ENV === "development" && { comingFrom: this.comingFrom }),
    };
  }
}

export class BadRequestError extends CustomError {
  status: string = 'error';
  statusCode: number = StatusCodes.BAD_REQUEST;

  constructor(message: string, comingFrom: string) {
    super(message, comingFrom);
  }
}

export class NotFoundError extends CustomError {
  status: string = 'error';
  statusCode: number = StatusCodes.NOT_FOUND;

  constructor(message: string, comingFrom: string) {
    super(message, comingFrom);
  }
}

export class NotAuthorizedError extends CustomError {
  status: string = 'error';
  statusCode: number = StatusCodes.UNAUTHORIZED;

  constructor(message: string, comingFrom: string) {
    super(message, comingFrom);
  }
}

export class FileTooLargeError extends CustomError {
  status: string = 'error';
  statusCode: number = StatusCodes.REQUEST_TOO_LONG;

  constructor(message: string, comingFrom: string) {
    super(message, comingFrom);
  }
}

export class ServerError extends CustomError {
  status: string = 'error';
  statusCode: number = StatusCodes.SERVICE_UNAVAILABLE;

  constructor(message: string, comingFrom: string) {
    super(message, comingFrom);
  }
}

export interface ErrorNoException {
  errno?: number;
  code?: string;
  path?: string;
  syscall?: string;
  stack?: string;
}
