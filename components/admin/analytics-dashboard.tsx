'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DailyStats {
  date: string;
  views: number;
  visitors: number;
}

interface PopularPage {
  page_path: string;
  view_count: number;
  unique_visitors: number;
}

interface RealtimeStats {
  onlineCount: number;
  totalViews: number;
  totalUniqueVisitors: number;
  popularPages: PopularPage[];
  trendData: DailyStats[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function AnalyticsDashboard() {
  const [stats, setStats] = useState<RealtimeStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/analytics/dashboard');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Failed to load analytics data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Real-time Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Online Now</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.onlineCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Active visitors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Unique Visitors Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalUniqueVisitors}</div>
            <p className="text-xs text-muted-foreground mt-1">Total today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Page Views Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalViews}</div>
            <p className="text-xs text-muted-foreground mt-1">Total interactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Popular Pages */}
      <Card>
        <CardHeader>
          <CardTitle>Top Pages Today</CardTitle>
          <CardDescription>Most viewed pages in the last 24 hours</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.popularPages.length > 0 ? (
              stats.popularPages.map((page, idx) => (
                <div key={idx} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{page.page_path}</p>
                    <p className="text-xs text-muted-foreground">
                      {page.unique_visitors} unique visitors
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold text-lg">{page.view_count}</p>
                    <p className="text-xs text-muted-foreground">views</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No page view data available</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Trend Chart */}
      {stats.trendData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>7-Day Traffic Trend</CardTitle>
            <CardDescription>Page views and unique visitors over the last week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="views" stroke="#3b82f6" name="Page Views" />
                <Line type="monotone" dataKey="visitors" stroke="#10b981" name="Unique Visitors" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
