import { Channel, Options } from 'amqplib';
import { StrictLogger } from '../logger';

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

export async function publishDirectMessage({
  channel,
  exchangeName,
  routingKey,
  message,
  logParams,
  publishOptions = {
    persistent: true,
  },
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
