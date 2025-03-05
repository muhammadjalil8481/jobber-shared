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

  const logger: Logger = winston.createLogger({
    exitOnError: false,
    defaultMeta: {
      service: name,
    },
    transports,
  });

  return logger;
};
