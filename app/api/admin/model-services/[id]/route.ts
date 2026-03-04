import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { revalidateModelServicePages } from "@/lib/revalidate-helpers"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    console.log(`[DELETE] /api/admin/model-services/${id} - Attempting to delete model service`)

    const supabase = createClient()

    // Get the model service before deletion for logging
    const { data: modelService, error: fetchError } = await supabase
      .from("model_services")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError) {
      console.error(`[DELETE] /api/admin/model-services/${id} - Error fetching model service:`, fetchError)
      return NextResponse.json({ error: "Failed to fetch model service", details: fetchError }, { status: 500 })
    }

    if (!modelService) {
      console.error(`[DELETE] /api/admin/model-services/${id} - Model service not found`)
      return NextResponse.json({ error: "Model service not found" }, { status: 404 })
    }

    console.log(`[DELETE] /api/admin/model-services/${id} - Found model service:`, modelService)

    // Delete the model service
    const { error: deleteError } = await supabase.from("model_services").delete().eq("id", id)

    if (deleteError) {
      console.error(`[DELETE] /api/admin/model-services/${id} - Error deleting model service:`, deleteError)
      return NextResponse.json({ error: "Failed to delete model service", details: deleteError }, { status: 500 })
    }

    console.log(`[DELETE] /api/admin/model-services/${id} - Successfully deleted model service`)

    // Revalidate model + service pages
    if (modelService) {
      const { data: modelInfo } = await supabase.from("models").select("slug").eq("id", modelService.model_id).single()
      const { data: serviceInfo } = await supabase.from("services").select("slug").eq("id", modelService.service_id).single()
      revalidateModelServicePages(modelInfo?.slug, serviceInfo?.slug)
    }

    return NextResponse.json({ success: true, deletedService: modelService })
  } catch (error) {
    console.error(`[DELETE] /api/admin/model-services/${id} - Unexpected error:`, error)
    return NextResponse.json({ error: "Failed to delete model service", details: error }, { status: 500 })
  }
}
