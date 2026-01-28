import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Upstash Redis client
const UPSTASH_REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase credentials not configured');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Mask IP address to first 3 octets for privacy
 */
function maskIp(ip: string): string {
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  }
  // IPv6 - return first 48 bits
  return ip.substring(0, 12);
}

/**
 * Generate anonymized visitor hash
 */
function generateVisitorHash(ip: string, userAgent: string, date: string): string {
  const salt = process.env.ANALYTICS_SALT || 'analytics-salt';
  const maskedIp = maskIp(ip);
  const data = `${maskedIp}|${userAgent}|${date}|${salt}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Call Upstash Redis API
 */
async function redisCommand(command: string[]): Promise<any> {
  if (!UPSTASH_REDIS_URL || !UPSTASH_REDIS_TOKEN) {
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
      console.error('Redis error:', await response.text());
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Redis command failed:', error);
    return null;
  }
}

/**
 * Track active session in Redis
 */
async function trackActiveSession(
  visitorHash: string,
  pagePath: string
): Promise<void> {
  const sessionKey = `session:${visitorHash}`;
  const activeKey = 'active_sessions';
  const pageKey = `pages:${pagePath}`;

  try {
    // Set session with 2-minute TTL
    await redisCommand(['SETEX', sessionKey, '120', pagePath]);

    // Add to active sessions set with HyperLogLog for counting
    await redisCommand(['PFADD', activeKey, visitorHash]);

    // Add to page-specific tracking
    await redisCommand(['PFADD', pageKey, visitorHash]);

    // Store page activity timestamp
    await redisCommand(['ZADD', 'page_activity', Date.now().toString(), pagePath]);
  } catch (error) {
    console.error('Failed to track active session:', error);
  }
}

/**
 * Main analytics ping endpoint
 */
export async function POST(request: Request) {
  try {
    const { pagePath, referrer } = await request.json();

    if (!pagePath) {
      return new Response(
        JSON.stringify({ error: 'Missing pagePath' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get client IP
    const ip =
      (request.headers.get('x-forwarded-for')?.split(',')[0] || '').trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const userAgent = request.headers.get('user-agent') || 'unknown';
    const today = new Date().toISOString().split('T')[0];

    // Generate visitor hash
    const visitorHash = generateVisitorHash(ip, userAgent, today);

    // Track in Redis for real-time stats
    await trackActiveSession(visitorHash, pagePath);

    // Increment page views in Supabase
    const { error } = await supabase.rpc('increment_page_view', {
      p_date: today,
      p_path: pagePath,
      p_visitor_hash: visitorHash,
    });

    if (error) {
      console.error('Supabase RPC error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to record analytics' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Analytics ping error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
