import * as redis from 'redis';
import dotenv from 'dotenv';

dotenv.config();

let redisClient: redis.RedisClientType | null = null;

export const initializeRedis = async () => {
  redisClient = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  } as any);

  redisClient.on('error', (err) => console.error('Redis error:', err));
  await redisClient.connect();
};

export const getRedisClient = () => {
  if (!redisClient) {
    redisClient = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    } as any);
  }
  return redisClient as redis.RedisClientType;
};

export default redisClient;
