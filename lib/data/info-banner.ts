import { createClient } from "@/utils/supabase/server"

export type InfoBannerData = {
  message: string
  enabled: boolean
  color: string
}

export async function getInfoBanner(): Promise<InfoBannerData> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.from("settings").select("*").eq("key", "info_banner").single()

    if (error) {
      // Return default if not found
      if (error.code === "PGRST116") {
        return {
          message: "Сайт знаходиться в режимі технічного обслуговування. Деякі функції можуть бути недоступні.",
          enabled: true,
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
