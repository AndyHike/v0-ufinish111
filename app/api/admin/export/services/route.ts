import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import Papa from "papaparse"

export async function GET() {
  try {
    const supabase = createClient()

    // Get all model services with related data
    const { data: modelServices, error } = await supabase.from("model_services").select(`
        id,
        price,
        models!inner(
          id,
          name,
          brands!inner(
            id,
            name
          )
        ),
        services!inner(
          id
        )
      `)

    if (error) {
      throw error
    }

    // Get all service translations
    const { data: allTranslations, error: translationsError } = await supabase
      .from("services_translations")
      .select("service_id, name, description, locale")

    if (translationsError) {
      throw translationsError
    }

    // Group translations by service_id and locale
    const translationsByService = allTranslations.reduce((acc, translation) => {
      if (!acc[translation.service_id]) {
        acc[translation.service_id] = {}
      }
      acc[translation.service_id][translation.locale] = {
        name: translation.name,
        description: translation.description,
      }
      return acc
    }, {})

    // Transform data for CSV export
    const csvData = modelServices.map((ms) => {
      const translations = translationsByService[ms.services.id] || {}

      return {
        brand: ms.models.brands.name,
        model: ms.models.name,
        service_uk: translations.uk?.name || "",
        description_uk: translations.uk?.description || "",
        service_en: translations.en?.name || "",
        description_en: translations.en?.description || "",
        service_cs: translations.cs?.name || "",
        description_cs: translations.cs?.description || "",
        price: ms.price === null ? "" : ms.price,
      }
    })

    // Convert to CSV
    const csv = Papa.unparse(csvData)

    // Return as downloadable file
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="services_export_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("Error exporting services:", error)
    return NextResponse.json(
      { error: "Failed to export services", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
