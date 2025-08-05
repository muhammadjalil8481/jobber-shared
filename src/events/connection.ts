import client, { Channel, ChannelModel } from 'amqplib';
import { StrictLogger } from '../logger';

interface CREATE_CONNECTION_PARAMS {
  log: StrictLogger;
  connectionUrl: string;
}

export async function createConnection({
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
      await channel.prefetch(1)
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
