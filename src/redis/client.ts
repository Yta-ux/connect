import { Redis } from 'ioredis'
import { env } from '../env'

export const redis = new Redis(env.REDIS_URL + '?family=0')

// const ping = await redis.ping();
