import { NextFunction, Request, Response } from "express";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  windowMs: number;
  limit: number;
  keyPrefix: string;
  message?: string;
};

const buckets = new Map<string, RateLimitBucket>();

function getClientIp(req: Request) {
  const forwardedFor = req.header("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.ip || req.socket.remoteAddress || "unknown";
}

function cleanupExpiredBuckets(now: number) {
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, limit, keyPrefix, message = "Too many requests. Please try again later." } =
    options;

  return function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
    const now = Date.now();
    cleanupExpiredBuckets(now);

    const key = `${keyPrefix}:${getClientIp(req)}`;
    const existing = buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (existing.count >= limit) {
      const retryAfterMs = Math.max(existing.resetAt - now, 0);
      res.setHeader("Retry-After", Math.ceil(retryAfterMs / 1000).toString());
      return res.status(429).json({
        ok: false,
        error: message,
        retryAfterMs,
      });
    }

    existing.count += 1;
    buckets.set(key, existing);
    return next();
  };
}
