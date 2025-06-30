import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase"
import { formatCurrency } from "@/lib/format-currency"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

type PageProps = { params: { locale: string; slug: string } }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createClient()
  const { data } = await supabase
    .from("services")
    .select("services_translations(name,description)")
    .eq("slug", params.slug)
    .single()

  return {
    title: data?.services_translations?.name ?? "Service",
    description: data?.services_translations?.description ?? "",
  }
}

export default async function ServicePage({ params }: PageProps) {
  const supabase = createClient()

  const { data: service } = await supabase
    .from("services")
    .select(
      `
      id,
      price,
      warranty,
      icon_url,
      services_translations(name,description)
    `,
    )
    .eq("slug", params.slug)
    .single()

  if (!service) return notFound()

  return (
    <main className="container max-w-4xl space-y-8 py-10">
      <header className="flex items-center gap-4">
        {service.icon_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={service.icon_url || "/placeholder.svg"}
            alt=""
            width={64}
            height={64}
            className="h-16 w-16 shrink-0 rounded-lg bg-muted object-contain"
          />
        )}
        <h1 className="text-3xl font-bold">{service.services_translations?.name}</h1>
      </header>

      <section className="prose max-w-none">
        <p>{service.services_translations?.description}</p>
      </section>

      <Separator />

      <section className="grid gap-4 sm:grid-cols-2">
        <div>
          <h2 className="mb-2 text-lg font-semibold">Ціна</h2>
          <p className="text-2xl font-bold">{formatCurrency(service.price, params.locale)}</p>
        </div>
        <div>
          <h2 className="mb-2 text-lg font-semibold">Гарантія</h2>
          <Badge variant="secondary">{service.warranty} місяців</Badge>
        </div>
      </section>

      <Button size="lg" className="w-full sm:w-auto">
        Замовити послугу
      </Button>
    </main>
  )
}
