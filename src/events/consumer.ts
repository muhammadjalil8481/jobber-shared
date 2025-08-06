import { Channel, ConsumeMessage, Options } from 'amqplib';
import { StrictLogger } from '../logger';

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

export async function consumeMessage(data: ConsumerParams): Promise<void> {
  const {
    channel,
    exchangeName,
    queueName,
    bindingKey,
    handler,
    exchangeType,
    queueOptions = {
      durable: true,
      autoDelete: false,
    },
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
            context,
            error as Error
          );
          channel.nack(message!, false, true);
        }
      },
      {
        noAck: false, // Must manually ack or nack message if set to false
      }
    );
  } catch (error) {
    log.error(
      `Failed to consume message - exchange ${data.exchangeName}`,
      context,
      error as Error
    );
  }
}
