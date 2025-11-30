import * as redis from 'redis';
import dotenv from 'dotenv';

dotenv.config();

let redisClient: redis.RedisClientType | null = null;

export const initializeRedis = async () => {
  redisClient = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
  } as any);

  redisClient.on('error', (err) => console.error('Redis error:', err));
  redisClient.on('connect', () => console.log('Redis connected'));

  await redisClient.connect();
};

export const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
};

export default redisClient;
