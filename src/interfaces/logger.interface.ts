import { LogData, TransformedData } from 'winston-elasticsearch';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  SILLY = 'silly',
}

export interface LoggerOptionArguments {
  elasticSearchNode?: string;
  name: string;
  level: LogLevel;
}

export interface ConsoleLoggerOptions {
  level: string;
  handleExceptions: boolean;
  json: boolean;
  colorize: boolean;
}

export interface ElasticLoggerOptions {
  level: string;
  transformer: (arg: LogData) => TransformedData;
  clientOpts: {
    node: string;
    log: string;
    maxRetries: number;
    requestTimeout: number;
    sniffToStart: boolean;
  };
}
export interface LoggerOptions {
  console: ConsoleLoggerOptions;
  elasticsearch?: ElasticLoggerOptions;
}
