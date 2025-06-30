import { ServiceCard } from "@/components/service-card"
import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"

interface Params {
  locale: string
  slug: string
}

interface Props {
  params: Params
}

async function getData(locale: string, slug: string) {
  const supabase = createClient()

  const { data: model, error: modelError } = await supabase.from("models").select("id").eq("slug", slug).single()

  if (modelError || !model) {
    notFound()
  }

  const { data: model_services, error: modelServicesError } = await supabase
    .from("model_services")
    .select(
      `position,
      services(id, slug, position, services_translations(name, description, languages(code)))`,
    )
    .eq("model_id", model.id)
    .order("position")

  if (modelServicesError) {
    console.error(modelServicesError)
    return {
      title: `Error fetching data for model ${slug} in ${locale}`,
      description: `Error description for model ${slug} in ${locale}`,
      services: [],
    }
  }

  const services = model_services.map((modelService) => {
    const translations = modelService.services?.services_translations.filter(
      (translation) => translation.languages?.code === locale,
    )

    return {
      service: {
        id: modelService.services.id,
        slug: modelService.services.slug,
        position: modelService.services.position,
        name: translations[0]?.name || "",
        description: translations[0]?.description || "",
      },
    }
  })

  const { data: models_translations, error: modelsTranslationsError } = await supabase
    .from("models_translations")
    .select("name, description")
    .eq("model_id", model.id)
    .eq("languages", locale)
    .single()

  if (modelsTranslationsError) {
    console.error(modelsTranslationsError)
    return {
      title: `Model ${slug} in ${locale}`,
      description: `Description of model ${slug} in ${locale}`,
      services: [],
    }
  }

  return {
    title: models_translations?.name || `Model ${slug} in ${locale}`,
    description: models_translations?.description || `Description of model ${slug} in ${locale}`,
    services: services.map((item) => item.service),
  }
}

export default async function Page({ params }: Props) {
  const data = await getData(params.locale, params.slug)
  const { title, description, services } = data

  return (
    <div>
      <h1>{title}</h1>
      <p>{description}</p>

      <h2>Services:</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <ServiceCard key={service.id} service={service} locale={params.locale} />
        ))}
      </div>
    </div>
  )
}
