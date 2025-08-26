import { Redis } from 'ioredis';

declare global {
  var redis: Redis | undefined;
}

if (!global.redis) {
  if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL environment variable is not defined');
  }
  global.redis = new Redis(process.env.REDIS_URL);
}

export default global.redis as Redis;
