import { getTodayStats, getPopularPages, getDailySummary } from '@/lib/analytics/queries';
import { getOnlineCount } from '@/lib/analytics/redis';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Verify admin access
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [todayStats, popularPages, dailySummary, onlineCount] = await Promise.all([
      getTodayStats(),
      getPopularPages(10),
      getDailySummary(7),
      getOnlineCount(),
    ]);

    return NextResponse.json({
      onlineCount: onlineCount || 0,
      totalViews: todayStats?.totalViews || 0,
      totalUniqueVisitors: todayStats?.totalUniqueVisitors || 0,
      popularPages: popularPages || [],
      trendData: dailySummary || [],
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
