"use server"

import { createClient } from "@/lib/supabase"

export async function getBrands() {
  try {
    const supabase = createClient()

    // First try to get brands ordered by position
    let { data, error } = await supabase
      .from("brands")
      .select("*, series(id, name, position, slug)")
      .order("position", { ascending: true, nullsLast: true })

    // If there's an error or no brands with position, try fetching without ordering
    if (error || !data || data.length === 0) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("brands")
        .select("*, series(id, name, position, slug)")
        .order("name")

      if (fallbackError) throw fallbackError
      data = fallbackData
    }

    // Sort brands by position if available, otherwise by name
    return data.sort((a, b) => {
      // If both have position, sort by position
      if (a.position !== null && a.position !== undefined && b.position !== null && b.position !== undefined) {
        return a.position - b.position
      }
      // If only one has position, prioritize the one with position
      if (a.position !== null && a.position !== undefined) return -1
      if (b.position !== null && b.position !== undefined) return 1
      // If neither has position, sort by name
      return a.name.localeCompare(b.name)
    })
  } catch (error) {
    console.error("Error fetching brands:", error)
    return []
  }
}
