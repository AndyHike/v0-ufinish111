import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { revalidateUtils } from "@/lib/revalidate-utils"

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

    // Revalidate model page and service/model page after deletion
    try {
      const { data: modelInfo } = await supabase
        .from("models")
        .select("slug")
        .eq("id", modelService.model_id)
        .single()

      const { data: serviceInfo } = await supabase
        .from("services")
        .select("slug")
        .eq("id", modelService.service_id)
        .single()

      if (modelInfo?.slug) {
        revalidateUtils.revalidateModelServices(
          String(modelInfo.slug),
          serviceInfo?.slug ? String(serviceInfo.slug) : undefined
        )
      }
    } catch (revalidateError) {
      console.error(`[DELETE] /api/admin/model-services/${id} - Revalidation error (non-fatal):`, revalidateError)
    }

    // Transform the deleted service to ensure it's serializable
    const transformedService = {
      id: String(modelService.id),
      model_id: String(modelService.model_id),
      service_id: String(modelService.service_id),
      price: modelService.price !== null ? Number(modelService.price) : null,
      warranty_months: modelService.warranty_months !== null ? Number(modelService.warranty_months) : null,
      duration_hours: modelService.duration_hours !== null ? Number(modelService.duration_hours) : null,
      warranty_period: String(modelService.warranty_period || "months"),
      detailed_description: modelService.detailed_description ? String(modelService.detailed_description) : null,
      what_included: modelService.what_included ? String(modelService.what_included) : null,
      benefits: modelService.benefits ? String(modelService.benefits) : null,
      part_type: modelService.part_type ? String(modelService.part_type) : null,
    }
    
    return NextResponse.json({ success: true, deletedService: transformedService })
  } catch (error) {
    console.error(`[DELETE] /api/admin/model-services/${id} - Unexpected error:`, error)
    return NextResponse.json({ error: "Failed to delete model service", details: error }, { status: 500 })
  }
}
