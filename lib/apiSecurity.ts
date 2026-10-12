import { NextRequest } from 'next/server';

// Simple in-memory rate limiter per client IP: 60 requests per minute
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const ipRateLimits = new Map<string, RateLimitRecord>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 60;

export function checkRateLimit(req: NextRequest): { allowed: boolean; remaining: number } {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';

  const now = Date.now();
  const existing = ipRateLimits.get(ip);

  // Periodically clean up stale entries if map grows
  if (ipRateLimits.size > 5000) {
    ipRateLimits.forEach((record, key) => {
      if (record.resetAt < now) {
        ipRateLimits.delete(key);
      }
    });
  }

  if (!existing || existing.resetAt < now) {
    ipRateLimits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS - 1 };
  }

  if (existing.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  existing.count += 1;
  return { allowed: true, remaining: MAX_REQUESTS - existing.count };
}

/**
 * Validates the x-api-key header against the API_KEY environment variable.
 * 
 * NOTE: In a real-world enterprise production deployment, shared demo API keys
 * would be replaced by authenticated sessions, OAuth2 tokens, or signed client JWTs.
 */
export function validateApiKey(req: NextRequest): { valid: boolean; error?: string } {
  const expectedKey = process.env.API_KEY;
  if (!expectedKey) {
    // If not set on server, allow request in local development mode
    return { valid: true };
  }

  const providedKey = req.headers.get('x-api-key');
  if (providedKey && providedKey === expectedKey) {
    return { valid: true };
  }

  // Also allow same-origin requests from the demo browser frontend
  const origin = req.headers.get('origin');
  const host = req.headers.get('host');
  const secFetchSite = req.headers.get('sec-fetch-site');
  if (secFetchSite === 'same-origin' || (origin && host && origin.includes(host))) {
    return { valid: true };
  }

  return {
    valid: false,
    error: 'Unauthorized: Invalid or missing x-api-key header',
  };
}
