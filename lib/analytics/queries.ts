import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface DailyStats {
  date: string
  page_path: string
  view_count: number
  unique_visitors: number
}

export interface StatsOverview {
  onlineNow: number
  totalPageViewsToday: number
  uniqueVisitorsToday: number
  popularPages: Array<{ path: string; views: number }>
}

export async function getTodayStats(): Promise<StatsOverview> {
  const today = new Date().toISOString().split('T')[0]

  try {
    const { data, error } = await supabase
      .from('daily_stats')
      .select('*')
      .eq('date', today)

    if (error) throw error

    const stats = data as DailyStats[]

    const totalPageViews = stats.reduce((sum, s) => sum + s.view_count, 0)
    const totalUniqueVisitors = stats.reduce(
      (sum, s) => sum + s.unique_visitors,
      0
    )
    const popularPages = stats
      .sort((a, b) => b.view_count - a.view_count)
      .slice(0, 5)
      .map((s) => ({ path: s.page_path, views: s.view_count }))

    return {
      onlineNow: 0, // Will be populated from in-memory session manager
      totalPageViewsToday: totalPageViews,
      uniqueVisitorsToday: totalUniqueVisitors,
      popularPages,
    }
  } catch (error) {
    console.error('[Analytics] Error fetching today stats:', error)
    return {
      onlineNow: 0,
      totalPageViewsToday: 0,
      uniqueVisitorsToday: 0,
      popularPages: [],
    }
  }
}

export async function getWeeklyStats(): Promise<DailyStats[]> {
  try {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]

    const { data, error } = await supabase
      .from('daily_stats')
      .select('*')
      .gte('date', sevenDaysAgo)
      .order('date', { ascending: true })

    if (error) throw error

    return data as DailyStats[]
  } catch (error) {
    console.error('[Analytics] Error fetching weekly stats:', error)
    return []
  }
}

export async function getPageStats(
  pagePath: string,
  days: number = 7
): Promise<DailyStats[]> {
  try {
    const cutoffDate = new Date(
      Date.now() - days * 24 * 60 * 60 * 1000
    )
      .toISOString()
      .split('T')[0]

    const { data, error } = await supabase
      .from('daily_stats')
      .select('*')
      .eq('page_path', pagePath)
      .gte('date', cutoffDate)
      .order('date', { ascending: true })

    if (error) throw error

    return data as DailyStats[]
  } catch (error) {
    console.error('[Analytics] Error fetching page stats:', error)
    return []
  }
}
