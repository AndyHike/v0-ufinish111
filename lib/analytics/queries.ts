import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase credentials not configured');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface DailyStats {
  date: string;
  page_path: string;
  view_count: number;
  unique_visitors: number;
}

export interface PopularPage {
  page_path: string;
  view_count: number;
  unique_visitors: number;
}

/**
 * Get today's statistics
 */
export async function getTodayStats(): Promise<{
  totalViews: number;
  totalUniqueVisitors: number;
} | null> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('daily_stats')
    .select('view_count, unique_visitors')
    .eq('date', today);

  if (error) {
    console.error('Error fetching today stats:', error);
    return null;
  }

  const stats = data || [];
  return {
    totalViews: stats.reduce((sum, s) => sum + (s.view_count || 0), 0),
    totalUniqueVisitors: stats.reduce((sum, s) => sum + (s.unique_visitors || 0), 0),
  };
}

/**
 * Get popular pages for today
 */
export async function getPopularPages(limit: number = 10): Promise<PopularPage[]> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('daily_stats')
    .select('page_path, view_count, unique_visitors')
    .eq('date', today)
    .order('view_count', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching popular pages:', error);
    return [];
  }

  return data || [];
}

/**
 * Get stats for the last N days
 */
export async function getStatsTrend(days: number = 7): Promise<DailyStats[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('daily_stats')
    .select('date, page_path, view_count, unique_visitors')
    .gte('date', startDateStr)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching stats trend:', error);
    return [];
  }

  return data || [];
}

/**
 * Get aggregated daily summary for chart
 */
export async function getDailySummary(days: number = 7): Promise<
  Array<{
    date: string;
    views: number;
    visitors: number;
  }>
> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('daily_stats')
    .select('date, view_count, unique_visitors')
    .gte('date', startDateStr)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching daily summary:', error);
    return [];
  }

  const grouped = new Map<
    string,
    { views: number; visitors: number }
  >();

  (data || []).forEach((stat) => {
    const existing = grouped.get(stat.date) || { views: 0, visitors: 0 };
    grouped.set(stat.date, {
      views: existing.views + (stat.view_count || 0),
      visitors: existing.visitors + (stat.unique_visitors || 0),
    });
  });

  return Array.from(grouped.entries()).map(([date, { views, visitors }]) => ({
    date,
    views,
    visitors,
  }));
}
