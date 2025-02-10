import winston, { Logger } from 'winston';
import {
  ElasticsearchTransformer,
  TransformedData,
  LogData,
  ElasticsearchTransport,
} from 'winston-elasticsearch';

const elasticSearchTransformer = (logData: LogData): TransformedData => {
  const transformed = ElasticsearchTransformer(logData);
  return transformed;
};

export const winstonLogger = (
  elasticSearchNode: string,
  name: string,
  level: string
): Logger => {
  const options = {
    console: {
      level,
      handleExceptions: true,
      json: true,
      colorize: true,
    },
    elasticsearch: {
      level,
      tranformer: elasticSearchTransformer,
      clientOpts: {
        node: elasticSearchNode,
        log: level,
        maxRetries: 2,
        requestTimeout: 10000,
        sniffToStart: false,
      },
    },
  };

  const elasticSearchTransport: ElasticsearchTransport =
    new ElasticsearchTransport(options.elasticsearch);
  const logger: Logger = winston.createLogger({
    exitOnError: false,
    defaultMeta: {
      service: name,
    },
    transports: [
      new winston.transports.Console(options.console),
      elasticSearchTransport,
    ],
  });

  return logger;
};
