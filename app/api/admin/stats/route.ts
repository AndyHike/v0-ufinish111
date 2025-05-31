import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createClient()

    // Get counts from each table
    const [brandsResult, modelsResult, usersResult, repairsResult] = await Promise.all([
      supabase.from("brands").select("id", { count: "exact" }),
      supabase.from("models").select("id", { count: "exact" }),
      supabase.from("users").select("id", { count: "exact" }),
      supabase.from("repairs").select("id", { count: "exact" }),
    ])

    // Get recent activities
    const activitiesResult = await supabase
      .from("activities")
      .select("*, users(name, email)")
      .order("created_at", { ascending: false })
      .limit(5)

    return NextResponse.json({
      stats: {
        brands: brandsResult.count || 0,
        models: modelsResult.count || 0,
        users: usersResult.count || 0,
        repairs: repairsResult.count || 0,
      },
      activities: activitiesResult.data || [],
    })
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    return NextResponse.json({ error: "Failed to fetch admin stats" }, { status: 500 })
  }
}
