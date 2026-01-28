# Analytics System Testing Guide

## Quick Start Testing

### 1. Verify Environment Setup
\`\`\`bash
# Check that ANALYTICS_SALT is set in Vercel dashboard
# Vars section should show ANALYTICS_SALT with a value
\`\`\`

### 2. Generate Test Traffic
1. Open your site in a browser
2. Navigate between pages (use internal links)
3. Wait for at least one heartbeat (60 seconds)
4. Repeat on a few different pages

### 3. Check Admin Dashboard
1. Go to admin panel at `/[locale]/admin`
2. Scroll to "Analytics" section
3. Should see:
   - **Online Now**: 0-1 (depending on if you're currently on the page)
   - **Page Views Today**: Increasing number
   - **Unique Visitors**: Should be 1 (you)
   - **Popular Pages**: List of pages you visited
   - **7-Day Trend Chart**: Line showing today's data

## Browser Console Testing

### Monitor Real-time Requests
1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Interact with the site
4. You should see POST requests to `/api/analytics/ping` with 200 status
5. Click request → Preview to see response:
\`\`\`json
{
  "success": true,
  "isNewSession": true,
  "activeSessions": 1
}
\`\`\`

### Monitor Log Output
Add temporary logging to see the flow (remove after testing):

\`\`\`typescript
// In /components/analytics/analytics-tracker.tsx
console.log('[v0] Analytics tracking:', { pathname, response })

// In /app/api/analytics/ping/route.ts
console.log('[Analytics] Tracking:', { pagePath, visitorHash, activeSessions })
\`\`\`

## Database Verification

### Check Supabase directly:

1. Go to Supabase dashboard → Your project
2. SQL Editor → New Query
3. Run these queries:

\`\`\`sql
-- Check daily stats for today
SELECT * FROM daily_stats 
WHERE date = CURRENT_DATE 
ORDER BY view_count DESC;

-- Check visitor hashes (should be anonymized)
SELECT * FROM page_view_hashes 
WHERE date = CURRENT_DATE 
LIMIT 10;

-- Count unique visitors today
SELECT COUNT(DISTINCT visitor_hash) as unique_visitors
FROM page_view_hashes 
WHERE date = CURRENT_DATE;
\`\`\`

### Expected Results:
- `daily_stats`: Should have 1+ rows with increasing `view_count`
- `page_view_hashes`: Should see SHA-256 hashes (not readable)
- Unique count: Should match or be less than total page views (some repeat visitors)

## Performance Testing

### Check Session Cleanup
1. Make a request to `/api/analytics/ping`
2. Wait 2+ minutes
3. The session should be removed from memory (in-memory only, DB persists)

### Load Testing
\`\`\`bash
# Simulate 10 concurrent users hitting the analytics endpoint
# (Replace URL with your actual domain)
for i in {1..10}; do
  curl -X POST https://yoursite.com/api/analytics/ping \
    -H "Content-Type: application/json" \
    -d '{"pagePath":"/test"}'
done
\`\`\`

## Debugging

### If analytics aren't appearing:

1. **Check AnalyticsTracker is loaded**
   \`\`\`typescript
   // In browser console
   fetch('/api/analytics/ping', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ pagePath: '/test' })
   }).then(r => r.json()).then(console.log)
   \`\`\`

2. **Verify ANALYTICS_SALT environment variable**
   - Should be set in Vercel project Vars
   - Should be 32+ characters
   - Used for hashing, not revealed in logs

3. **Check Supabase RPC function**
   \`\`\`sql
   -- Test the RPC function directly
   SELECT increment_page_view(
     CURRENT_DATE,
     '/test-path',
     'test-hash-12345'
   );
   \`\`\`

4. **Review server logs**
   - Check Vercel deployment logs for errors
   - Look for `[Analytics]` or `[v0]` log lines

## Common Issues

### "Invalid pagePath"
- **Cause**: Frontend sending empty or non-string pagePath
- **Fix**: Check AnalyticsTracker component is properly mounted

### "Failed to track analytics" (500 error)
- **Cause**: ANALYTICS_SALT not set or Supabase connection issue
- **Fix**: Verify environment variables in Vercel dashboard

### "Chart shows no data"
- **Cause**: AnalyticsDashboard querying before data exists
- **Fix**: Generate some page views first, then refresh dashboard

### Session count doesn't increase
- **Cause**: Multiple requests from same visitor within 120 seconds
- **Fix**: Wait 2+ minutes or open in private window

## Expected Behavior Timeline

**Minute 0**: 
- Load page
- AnalyticsTracker mounts

**Minute 0-1**: 
- First heartbeat sent (60 seconds)
- Request appears in Network tab
- `isNewSession: true` in response

**Minute 1-2**: 
- Second heartbeat sent
- `isNewSession: false` (same visitor)
- `view_count` incremented
- `unique_visitors` unchanged

**Admin Dashboard**:
- Updates every 30 seconds
- Shows current metrics
- 7-day chart shows historical data

## Success Criteria

✅ Analytics ping requests appear in Network tab
✅ Database contains today's data (daily_stats)
✅ Hashes are stored (page_view_hashes) 
✅ Admin dashboard displays metrics
✅ Chart shows trend data
✅ "Online Now" shows current visitors
✅ No errors in browser console
✅ No errors in server logs
