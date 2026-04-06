import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Only instantiate if env vars are present (allows local dev without Upstash)
function makeRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
  return Redis.fromEnv()
}

function makeRatelimit(redis: Redis, requests: number, window: string) {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window as Parameters<typeof Ratelimit.slidingWindow>[1]),
    analytics: true,
  })
}

// Per-email: 10 generations per 24h
export function getEmailLimiter() {
  const redis = makeRedis()
  if (!redis) return null
  return makeRatelimit(redis, 10, '24 h')
}

// Per-IP: 20 requests per 24h (generate only)
export function getIpLimiter() {
  const redis = makeRedis()
  if (!redis) return null
  return makeRatelimit(redis, 20, '24 h')
}

// Per-email: 10 requests per 24h for score + ab-test
export function getToolLimiter() {
  const redis = makeRedis()
  if (!redis) return null
  return makeRatelimit(redis, 10, '24 h')
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return 'unknown'
}

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
