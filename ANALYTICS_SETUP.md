# Analytics System Setup Guide

This document explains how to set up the analytics system for tracking page views and user behavior.

## Prerequisites

- Supabase project configured
- Upstash Redis account (Free tier available)
- Environment variables configured in Vercel

## Step 1: Database Setup (Supabase)

1. Connect to your Supabase project
2. Run the migration script: `scripts/create-analytics-tables.sql`
   - This creates:
     - `daily_stats` table for aggregated daily statistics
     - `page_view_hashes` table for tracking unique visitors
     - `increment_page_view()` RPC function for efficient updates

## Step 2: Configure Environment Variables

Add the following to your Vercel project environment variables:

### Required:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `UPSTASH_REDIS_REST_URL` - Redis REST endpoint
- `UPSTASH_REDIS_REST_TOKEN` - Redis authentication token
- `ANALYTICS_SALT` - Random string for hashing (generate a secure random value)

### Example:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
UPSTASH_REDIS_REST_URL=https://us1-calm-xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXX...
ANALYTICS_SALT=your-secure-random-salt-here
```

## Step 3: Set Up Upstash Redis

1. Go to [Upstash Console](https://console.upstash.io)
2. Create a new Redis database
3. Copy the REST URL and REST token
4. Add to environment variables

## How It Works

### Frontend Tracking
- `AnalyticsTracker` component tracks route changes
- Sends pings to `/api/analytics/ping` on page load and every 60 seconds
- Uses `keepalive: true` to ensure delivery even on page unload

### Backend Processing
1. IP masking: First 3 octets only
2. Visitor hash: SHA-256(masked_ip + user_agent + date + salt)
3. Real-time Redis tracking: 2-minute session TTL
4. Daily Supabase aggregation: Unique visitor counting

### Real-time Stats (Redis)
- Active sessions tracked with 2-minute expiry
- HyperLogLog for efficient unique visitor counting
- Page-specific activity tracking

### Historical Stats (Supabase)
- Daily aggregation by page path
- Unique visitor deduplication
- 7-day trend analysis available

## API Endpoints

### `/api/analytics/ping` (POST)
Tracks page views and user activity.

**Request:**
```json
{
  "pagePath": "/services/iphone-repair",
  "referrer": "https://..."
}
```

**Response:**
```json
{
  "success": true
}
```

### `/api/admin/analytics/dashboard` (GET)
Retrieves dashboard statistics.

**Returns:**
```json
{
  "onlineCount": 5,
  "totalViews": 142,
  "totalUniqueVisitors": 87,
  "popularPages": [...],
  "trendData": [...]
}
```

## Privacy & Security

- **IP Privacy**: Only first 3 octets stored in hash
- **Visitor Anonymization**: SHA-256 hashing with daily rotation
- **No Cookies**: No client-side storage
- **No Tracking Pixels**: Server-side only

## Monitoring

### Real-time Metrics
- Online visitor count
- Page-specific traffic
- Active session tracking

### Historical Analysis
- Daily page view trends
- Unique visitor growth
- Popular content identification

## Troubleshooting

### No data appearing in dashboard
1. Check environment variables are set correctly
2. Verify Supabase RPC function exists
3. Check Redis connection in Upstash console

### Redis connection errors
1. Verify REST URL and token format
2. Check Upstash console for rate limits
3. Ensure IP is allowed (no IP restrictions in Upstash)

### Supabase connection errors
1. Verify service role key permissions
2. Check database is in "online" state
3. Review RLS policies if enabled
