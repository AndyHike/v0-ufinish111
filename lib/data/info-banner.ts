import { createClient } from "@/lib/supabase"

export type InfoBannerData = {
  message: string
  enabled: boolean
  color: string
}

/**
 * Fetch info banner data using the non-cookie Supabase client.
 * IMPORTANT: Uses @/lib/supabase (not @/utils/supabase/server) to avoid
 * calling cookies(), which would make the entire layout dynamic and break SSG.
 */
export async function getInfoBanner(): Promise<InfoBannerData> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.from("settings").select("*").eq("key", "info_banner").single()

    if (error) {
      // Return default (disabled) if not found
      if (error.code === "PGRST116") {
        return {
          message: "",
          enabled: false,
          color: "bg-amber-500 text-white",
        }
      }
      throw error
    }

    return data.value
  } catch (error) {
    console.error("Error fetching banner info:", error)
    return {
      message: "",
      enabled: false,
      color: "bg-amber-500 text-white",
    }
  }
}
