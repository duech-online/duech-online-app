import { NextRequest } from 'next/server';
import { LRUCache } from 'lru-cache';

const rateLimitCache = new LRUCache<string, { count: number; resetTime: number }>({
  max: 1000, // Max IPs in cache
  ttl: 1000 * 60 * 1, // 1 min (window for rate limiting)
});

export async function applyRateLimit(
  request: NextRequest,
  options?: { limit?: number }
): Promise<{ success: boolean }> {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'anonymous';
  const now = Date.now();
  const window = 60 * 1000;

  // Check if this is a metadata-only request (lightweight)
  const url = new URL(request.url);
  const isMetadataOnly = url.searchParams.get('metaOnly') === 'true';

  // More generous limits for normal browsing
  const limit = options?.limit ?? (isMetadataOnly ? 200 : 100); // 100-200 requests per minute

  const entry = rateLimitCache.get(ip);
  const currentCount = entry ? entry.count : 0;

  if (currentCount >= limit) {
    return { success: false };
  }

  rateLimitCache.set(ip, { count: currentCount + 1, resetTime: now + window });

  return { success: true };
}
