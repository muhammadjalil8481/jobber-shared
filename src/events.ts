import client, {
  Channel,
  ChannelModel,
  ConsumeMessage,
  Options,
} from 'amqplib';
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

interface ConsumerParams {
  channel: Channel;
  exchangeName: string;
  queueName: string;
  bindingKey: string;
  handler: (message: ConsumeMessage) => Promise<void>;
  exchangeType: 'direct' | 'topic' | 'headers' | 'fanout' | 'match';
  log: StrictLogger;
  context: string;
  queueOptions?: Options.AssertQueue;
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

async function consumeMessage(data: ConsumerParams): Promise<void> {
  const {
    channel,
    exchangeName,
    queueName,
    bindingKey,
    handler,
    exchangeType,
    queueOptions = {},
    log,
    context,
  } = data;
  try {
    if (!channel) {
      throw new Error('Channel is not defined');
    }

    await channel.assertExchange(exchangeName, exchangeType || 'direct');
    const jobberQueue = await channel.assertQueue(queueName, queueOptions);
    await channel.bindQueue(jobberQueue.queue, exchangeName, bindingKey);

    channel.consume(
      jobberQueue.queue,

      async (message: ConsumeMessage | null) => {
        try {
          log.info(
            `Received message exchange - ${exchangeName} - data ${message?.content}`,
            context
          );
          await handler(message!);
          channel.ack(message!);
          log.info(
            `Message successfully process and acknowledged - exhcange ${exchangeName}`,
            context
          );
        } catch (error) {
          log.error(
            `Failed to consume message - exchange ${data.exchangeName}`,
            context
          );
          channel.nack(message!, false, true);
        }
      },
      {
        noAck: true, // Must manually ack or nack message if set to false
      }
    );
  } catch (error) {
    log.error(
      `Failed to consume message - exchange ${data.exchangeName}`,
      context
    );
  }
}

export { createConnection, publishDirectMessage, consumeMessage };
