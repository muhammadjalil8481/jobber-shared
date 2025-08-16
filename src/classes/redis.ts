import { RedisClientType } from '@redis/client';
import { createClient } from 'redis';
import { StrictLogger } from '../logger';

export class Redis {
  redisClient: RedisClientType;
  log: StrictLogger;
  constructor(url: string, log: StrictLogger) {
    this.log = log;
    this.redisClient = createClient({
      url,
    });

    this.redisClient.on('error', (err) => {
      this.log.error('Error connecting to redis', 'redis.ts/error-callback', err);
    });
  }

  async createRedisConnection(): Promise<RedisClientType> {
    const context = 'redis.ts/createRedisConnection()';
    let retries = 1;
    const maxRetries = 3;

    if (this.redisClient.isOpen) return this.redisClient as RedisClientType;

    while (retries <= maxRetries) {
      try {
        await this.redisClient.connect();
        this.log.info(`Redis client connected successfully ${await this.redisClient.ping()}`, context);
        return this.redisClient as RedisClientType;
      } catch (error) {
        this.log.error(
          `Error connecting to redis - attempt ${retries} of ${maxRetries}`,
          context,
          error as Error
        );

        retries++;
        if (retries > maxRetries) {
          this.log.error('Max Redis connection attempts exceeded', context);
          process.exit(1);
        }

        await new Promise((res) => setTimeout(res, 1000)); // Optional delay before retry
      }
    }

    throw new Error('Unexpected Redis connection failure'); // Fallback (shouldn't be reached)
  }
}
