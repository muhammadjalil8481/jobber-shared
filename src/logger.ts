import winston, { Logger, transport } from 'winston';
import {
  ElasticsearchTransformer,
  TransformedData,
  LogData,
  ElasticsearchTransport,
} from 'winston-elasticsearch';
import {
  LoggerOptionArguments,
  LoggerOptions,
} from './interfaces/logger.interface';
import { CustomError } from './error-handler';
import cleanStack from 'clean-stack';

const elasticSearchTransformer = (logData: LogData): TransformedData => {
  const transformed = ElasticsearchTransformer(logData);
  return transformed;
};

export const winstonLogger = ({
  level,
  name,
  elasticSearchNode,
}: LoggerOptionArguments): Logger => {
  const options: LoggerOptions = {
    console: {
      level,
      handleExceptions: true,
      json: true,
      colorize: true,
    },
  };

  const transports: transport[] = [
    new winston.transports.Console(options.console),
  ];

  if (elasticSearchNode) {
    options.elasticsearch = {
      level,
      transformer: elasticSearchTransformer,
      clientOpts: {
        node: elasticSearchNode,
        log: level,
        maxRetries: 2,
        requestTimeout: 10000,
        sniffToStart: false,
      },
    };
    const elasticSearchTransport: ElasticsearchTransport =
      new ElasticsearchTransport(options.elasticsearch);
    transports.push(elasticSearchTransport);
  }

  const logger: Logger = winston.createLogger({
    exitOnError: false,
    defaultMeta: {
      service: name,
    },
    transports,
  });

  // Patch the `.error()` function to always format error logs consistently
  const originalError = logger.error.bind(logger);

  (logger.error as (message: string, err: Error | CustomError) => Logger) = (
    message: string,
    err: Error | CustomError
  ) => {
    if (!err) {
      return originalError(message);
    }
    const isCustom = err instanceof CustomError;

    const rawStack = (err.stack || '').replace(/\\/g, '/');

    const cleaned = cleanStack(rawStack, {
      pretty: true,
      basePath: process.cwd(),
    });

    const filteredStack = cleaned
      .split('\n')
      .filter((line) => !line.includes('node_modules'))
      .join('\n');

    const formattedError = {
      service: name,
      comingFrom: isCustom ? err.comingFrom || 'unknown source' : undefined,
      message: err?.message || 'Unknown error',
      statusCode: isCustom ? err.statusCode : 500,
      status: isCustom ? err.status : 'error',
      stack: !isCustom ? `\n${filteredStack}` : undefined,
    };

    return originalError(message, formattedError);
  };

  return logger;
};
