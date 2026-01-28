# GDPR-Compliant Analytics System - Setup Guide

## Overview

This comprehensive analytics system tracks page views and unique visitors without storing any personally identifiable information (PII). It uses IP masking, SHA-256 hashing, and a 120-second session TTL to provide real-time traffic insights while maintaining complete GDPR compliance.

## Components

### 1. Database Layer (`/scripts/setup-analytics.sql`)
- **daily_stats table**: Aggregates view counts and unique visitor counts by date and page path
- **page_view_hashes table**: Stores SHA-256 hashes of anonymized visitor data (one hash per unique visitor per page per day)
- **RLS Policies**: Allows read access for admin dashboards
- **increment_page_view() RPC function**: Atomically increments view counts and handles unique visitor detection

### 2. Backend API (`/app/api/analytics/ping/route.ts`)
**Anonymization Process:**
1. Extracts IP address from request headers (with fallback to 0.0.0.0)
2. **Masks IP**: Zeros out last octet (IPv4) or last 64 bits (IPv6)
3. **Generates Hash**: `SHA-256(masked_ip + user_agent + date + ANALYTICS_SALT)`
4. **Stores Hash**: Only the hash is stored, never the raw IP or device info

**In-Memory Session Management:**
- Maintains a `Map<sessionKey, lastSeen>` of active sessions
- Session keys: `${visitorHash}::${pagePath}`
- 120-second TTL with automatic cleanup every 60 seconds
- Returns active session count for real-time "Online Now" metric

**Response:**
\`\`\`json
{
  "success": true,
  "isNewSession": true,
  "activeSessions": 42
}
\`\`\`

### 3. Frontend Tracker (`/components/analytics/analytics-tracker.tsx`)
- **Client Component**: Tracks route changes via `usePathname()`
- **Heartbeat Ping**: Sends analytics request every 60 seconds
- **Keepalive**: Uses `keepalive: true` to ensure requests complete even during page navigation
- **No Local Storage**: All tracking is transient and server-based

### 4. Admin Dashboard (`/components/admin/analytics-dashboard.tsx`)
**Real-Time Metrics:**
- **Online Now**: Active sessions count from in-memory manager
- **Page Views Today**: Total view count for current date
- **Unique Visitors**: Count of unique visitor hashes for current date
- **Popular Pages**: Top 5 pages by view count

**Historical Data:**
- **7-Day Trend Chart**: Line chart showing daily view trends and unique visitor trends
- **Auto-refresh**: Updates every 30 seconds

### 5. Queries (`/lib/analytics/queries.ts`)
- `getTodayStats()`: Fetches today's aggregated stats
- `getWeeklyStats()`: Fetches last 7 days of data
- `getPageStats(path, days)`: Fetches stats for specific page

## Environment Variables

Required:
- `ANALYTICS_SALT`: 32+ character random string for hash generation
  - Example: `openssl rand -hex 32`
  - Used to salt visitor hashes for additional anonymity

## API Endpoints

### POST `/api/analytics/ping`
Tracks a page view. Called automatically by AnalyticsTracker component.

**Request:**
\`\`\`json
{
  "pagePath": "/en/services/screen-repair"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "isNewSession": true,
  "activeSessions": 42
}
\`\`\`

### GET `/api/admin/analytics/stats`
Fetches all analytics data for admin dashboard. Includes real-time sessions + historical data.

**Response:**
\`\`\`json
{
  "today": {
    "onlineNow": 42,
    "totalPageViewsToday": 1250,
    "uniqueVisitorsToday": 340,
    "popularPages": [
      { "path": "/en", "views": 450 },
      { "path": "/en/services", "views": 320 }
    ]
  },
  "weekly": [
    {
      "date": "2026-01-21",
      "page_path": "/en",
      "view_count": 450,
      "unique_visitors": 145
    }
  ],
  "activePages": [
    { "path": "/en", "activeUsers": 12 },
    { "path": "/en/services", "activeUsers": 8 }
  ]
}
\`\`\`

## Integration

### 1. Layout Integration
The AnalyticsTracker is automatically included in `/app/[locale]/layout.tsx`. It monitors route changes and sends heartbeat pings every 60 seconds.

### 2. Admin Dashboard
Include the AnalyticsDashboard component in your admin pages:

\`\`\`tsx
import { AnalyticsDashboard } from '@/components/admin/analytics-dashboard'

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <h1>Admin Dashboard</h1>
      <AnalyticsDashboard />
    </div>
  )
}
\`\`\`

## GDPR Compliance

✅ **No PII Stored**: Only anonymized SHA-256 hashes are persisted
✅ **IP Masking**: Last octet (or 64 bits for IPv6) is zeroed
✅ **Ephemeral Sessions**: In-memory data expires after 120 seconds
✅ **User Control**: No tracking initiated without user action (first page load)
✅ **Transparent**: Users can see what data is collected via privacy policy

## Performance Considerations

- **Database**: Atomic RPC function prevents race conditions
- **Memory**: Session manager uses `Map` with automatic cleanup
- **Network**: Heartbeat pings use `keepalive: true` for efficient batching
- **Frontend**: AnalyticsTracker is a lightweight client component with zero DOM impact
- **Caching**: Admin dashboard auto-refreshes every 30 seconds (configurable)

## Debugging

Enable console logs to see analytics flow:

\`\`\`typescript
// In analytics-tracker.tsx during development
console.log('[v0] Analytics tracking:', { pathname, success })

// In ping/route.ts
console.log('[Analytics] Tracking:', { pagePath, visitorHash, activeSessions })
\`\`\`

## Future Enhancements

- Export analytics to CSV/PDF
- Custom date range queries
- Geographic heatmaps (if region headers available)
- Device/Browser breakdown (parsed from User-Agent)
- Goal/Conversion tracking
- Email alerts for traffic spikes
