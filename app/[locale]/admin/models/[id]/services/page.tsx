import { getTranslations } from "next-intl/server"
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
  const t = await getTranslations("Admin")

  const supabase = createServerClient()

  // Fetch the model with its brand
  const { data: model, error: modelError } = await supabase
    .from("models")
    .select("*, brands(id, name)")
    .eq("id", id)
    .single()

  if (modelError || !model) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("modelServices", { model: model.name })}</h1>
          <p className="text-muted-foreground">
            {t("modelServicesDescription", { model: model.name, brand: model.brands?.name })}
          </p>
        </div>
        <Link href={`/${locale}/admin/models`}>
          <Button variant="outline" size="sm">
            <ChevronLeft className="mr-2 h-4 w-4" />
            {t("backToModels")}
          </Button>
        </Link>
      </div>

      <ModelServicesManager modelId={id} locale={locale} />
    </div>
  )
}
