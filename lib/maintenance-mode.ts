import { getAppSetting } from "@/lib/app-settings"

export async function isMaintenanceModeEnabled(): Promise<boolean> {
  try {
    const setting = await getAppSetting("maintenance_mode_enabled")
    return setting === "true"
  } catch (error) {
    console.error("Error checking maintenance mode:", error)
    return false
  }
}

export async function getMaintenanceSettings() {
  try {
    const [enabled, title, message, estimatedCompletion] = await Promise.all([
      getAppSetting("maintenance_mode_enabled"),
      getAppSetting("maintenance_mode_title"),
      getAppSetting("maintenance_mode_message"),
      getAppSetting("maintenance_mode_estimated_completion"),
    ])

    return {
      enabled: enabled === "true",
      title: title || "Технічні роботи",
      message: message || "Наразі проводяться технічні роботи. Будь ласка, спробуйте пізніше.",
      estimatedCompletion: estimatedCompletion || "",
    }
  } catch (error) {
    console.error("Error getting maintenance settings:", error)
    return {
      enabled: false,
      title: "Технічні роботи",
      message: "Наразі проводяться технічні роботи. Будь ласка, спробуйте пізніше.",
      estimatedCompletion: "",
    }
  }
}
