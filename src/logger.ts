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

  const logMethods = ['info', 'warn', 'error', 'debug'] as const;

  const isDebug = Boolean(process.env.DEBUG);
  logMethods.forEach((method) => {
    const original = logger[method].bind(logger);
    logger[method] = (...args) => {
      // Pipe to original logger
      !isDebug && original(...args);

      // Pipe to VS Code Debug Console
      const tag = `[${method.toUpperCase()}]`;

      // @ts-ignore - Ignore the type error here
      isDebug && console[method === 'debug' ? 'log' : method](tag, ...args);

      return logger;
    };
  });

  const logger: Logger = winston.createLogger({
    exitOnError: false,
    defaultMeta: {
      service: name,
    },
    transports,
  });

  return logger;
};
