import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import Papa from "papaparse"

export async function GET() {
  try {
    const supabase = createClient()

    // Get all models with brand information
    const { data: models, error } = await supabase.from("models").select(`
        id,
        name,
        image_url,
        brands!inner(
          id,
          name
        )
      `)

    if (error) {
      throw error
    }

    // Transform data for CSV export
    const csvData = models.map((model) => ({
      brand: model.brands.name,
      model: model.name,
      image_url: model.image_url || "",
    }))

    // Convert to CSV
    const csv = Papa.unparse(csvData)

    // Return as downloadable file
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="models_export_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("Error exporting models:", error)
    return NextResponse.json(
      { error: "Failed to export models", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
