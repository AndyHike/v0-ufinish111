const UPSTASH_REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

/**
 * Call Upstash Redis API
 */
async function redisCommand(command: string[]): Promise<any> {
  if (!UPSTASH_REDIS_URL || !UPSTASH_REDIS_TOKEN) {
    console.warn('Redis not configured');
    return null;
  }

  try {
    const response = await fetch(UPSTASH_REDIS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_REDIS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Redis error:', error);
      return null;
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Redis command failed:', error);
    return null;
  }
}

/**
 * Get current online visitors count
 */
export async function getOnlineCount(): Promise<number> {
  const result = await redisCommand(['PFCOUNT', 'active_sessions']);
  return result?.result || 0;
}

/**
 * Get unique visitors on a specific page
 */
export async function getPageUniqueVisitors(pagePath: string): Promise<number> {
  const pageKey = `pages:${pagePath}`;
  const result = await redisCommand(['PFCOUNT', pageKey]);
  return result?.result || 0;
}

/**
 * Get list of currently active pages
 */
export async function getActivePages(): Promise<
  Array<{
    page: string;
    visitors: number;
  }>
> {
  try {
    // Get all pages with recent activity
    const result = await redisCommand([
      'ZRANGE',
      'page_activity',
      '-Infinity',
      '+Infinity',
      'BYSCORE',
      'LIMIT',
      Date.now() - 120000, // Last 2 minutes
      100,
    ]);

    if (!result?.result || !Array.isArray(result.result)) {
      return [];
    }

    // Fetch unique visitors for each page
    const pages = await Promise.all(
      result.result.map(async (page: string) => {
        const visitors = await getPageUniqueVisitors(page);
        return { page, visitors };
      })
    );

    return pages.sort((a, b) => b.visitors - a.visitors);
  } catch (error) {
    console.error('Failed to get active pages:', error);
    return [];
  }
}
