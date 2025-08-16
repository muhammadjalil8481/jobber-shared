import { RedisClientType } from '@redis/client';
import { createClient } from 'redis';
import { StrictLogger } from '../logger';

export class Redis {
  redisClient: RedisClientType;
  log: StrictLogger;
  retries: number = 1;
  maxRetries: number = 3;
  constructor(url: string, log: StrictLogger) {
    this.log = log;
    this.redisClient = createClient({
      url,
      socket: {
        reconnectStrategy: (retries) => {
          this.retries = retries
          if (retries >= this.maxRetries) {
            this.log.error(
              `Max Redis reconnect attempts (${this.maxRetries}) exceeded`,
              'redis.ts/reconnectStrategy()'
            );
            process.exit(1)
          }
          return 1000; // wait 1s before next retry
        },
      },
    });

    this.redisClient.on('error', (err) => {
      this.log.error(
        `Error connecting to redis - attempt ${this.retries} of ${this.maxRetries}`,
        'redis.ts/error-callback',
        err
      );
    });
  }

  async createRedisConnection(): Promise<RedisClientType> {
    const context = 'redis.ts/createRedisConnection()';

    if (this.redisClient.isOpen) return this.redisClient as RedisClientType;

    while (this.retries <= this.maxRetries) {
      try {
        await this.redisClient.connect();
        this.log.info(
          `Redis client connected successfully ${await this.redisClient.ping()}`,
          context
        );
        return this.redisClient as RedisClientType;
      } catch (error) {
        this.log.error(
          `Error connecting to redis - attempt ${this.retries} of ${this.maxRetries}`,
          context,
          error as Error
        );

        this.retries++;
        if (this.retries > this.maxRetries) {
          this.log.error('Max Redis connection attempts exceeded', context);
          process.exit(1);
        }

        await new Promise((res) => setTimeout(res, 1000)); // Optional delay before retry
      }
    }

    throw new Error('Unexpected Redis connection failure'); // Fallback (shouldn't be reached)
  }
}
