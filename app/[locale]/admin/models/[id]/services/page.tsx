import { notFound } from "next/navigation"
import Link from "next/link"
import { createServerClient } from "@/utils/supabase/server"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { ModelServicesManager } from "@/components/admin/model-services-manager"

type Props = {
  params: {
    locale: string
    id: string
  }
}

export default async function ModelServicesPage({ params }: Props) {
  const { id, locale } = params

  const supabase = await createServerClient()

  // Fetch the model with its brand
  const { data: modelData, error: modelError } = await supabase
    .from("models")
    .select("id, name, brand_id, brands(id, name)")
    .eq("id", id)
    .single()

  if (modelError || !modelData) {
    notFound()
  }

  // Serialize only the primitive fields we need to avoid non-serializable objects
  const model = {
    id: String(modelData.id),
    name: String(modelData.name),
    brandName: modelData.brands && !Array.isArray(modelData.brands)
      ? String((modelData.brands as { name: string }).name)
      : "",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Послуги для {model.name}</h1>
          <p className="text-muted-foreground">
            Керування послугами та цінами для {model.name} від {model.brandName}
          </p>
        </div>
        <Link href={`/${locale}/admin/models`}>
          <Button variant="outline" size="sm">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Назад до моделей
          </Button>
        </Link>
      </div>

      <ModelServicesManager modelId={id} locale={locale} />
    </div>
  )
}
