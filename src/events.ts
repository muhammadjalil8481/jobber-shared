import client, { Channel, ChannelModel, Options } from 'amqplib';
import { StrictLogger } from './logger';

interface CREATE_CONNECTION_PARAMS {
  log: StrictLogger;
  connectionUrl: string;
}

interface DirectProducerParams {
  channel: Channel;
  exchangeName: string;
  routingKey: string;
  message: string | object;
  logParams: LogParams;
  publishOptions?: Options.Publish;
  exchangeOptions?: Options.AssertExchange;
}

interface LogParams {
  log: StrictLogger;
  logMessage: string;
  context: string;
}

async function createConnection({
  log,
  connectionUrl,
}: CREATE_CONNECTION_PARAMS): Promise<Channel | undefined> {
  const context = 'connection.ts/createConnection()';
  let retries = 0;
  const maxRetries = 3;

  log.info(`Connecting to RabbitMQ ${connectionUrl}...`, context);

  while (retries < maxRetries) {
    try {
      const connection: ChannelModel = await client.connect(`${connectionUrl}`);
      const channel: Channel = await connection.createChannel();
      log.info('Connected to RabbitMQ successfully', context);
      closeConnection(channel, connection);
      return channel;
    } catch (error) {
      retries++;
      if (retries >= 3) {
        log.error(
          `Failed to connect Rabbitmq retries:${retries}`,
          context,
          error as Error
        );
        process.exit(1);
      }
    }
  }
}

function closeConnection(channel: Channel, connection: ChannelModel): void {
  process.once('SIGINT', async () => {
    await channel.close();
    await connection.close();
  });
}

async function publishDirectMessage({
  channel,
  exchangeName,
  routingKey,
  message,
  logParams,
  publishOptions = {},
  exchangeOptions = {},
}: DirectProducerParams): Promise<boolean> {
  const { log, logMessage, context } = logParams;
  try {
    // 1. Assert the exchange first
    await channel.assertExchange(exchangeName, 'direct', exchangeOptions);

    // 2. Convert message to string if it's an object
    const messageContent =
      typeof message === 'string' ? message : JSON.stringify(message);

    // 3. Publish with merged options
    const published = channel.publish(
      exchangeName,
      routingKey,
      Buffer.from(messageContent),
      publishOptions
    );
    if (!published) {
      log.error(
        `Message not published to exchange ${exchangeName} with routing key ${routingKey}`,
        context
      );
      return false;
    }

    log.info(logMessage, context);
    return true;
  } catch (error) {
    log.error(
      `Error in publishing message - exchange: ${exchangeName}, routingKey: ${routingKey}`,
      context,
      error as Error
    );
    return false;
  }
}

export { createConnection, publishDirectMessage };
