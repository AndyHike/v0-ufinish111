import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { revalidateCatalog } from "@/lib/revalidate-catalog"

// Транслітерація кирилиці (укр/рос), щоб slug не схлопувався у порожній/однаковий
const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie", ж: "zh", з: "z",
  и: "y", і: "i", ї: "i", й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p",
  р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch",
  ь: "", ю: "iu", я: "ia", ъ: "", ы: "y", э: "e", ё: "e",
}

function createSlug(text: string): string {
  const transliterated = (text || "")
    .toLowerCase()
    .split("")
    .map((ch) => (ch in TRANSLIT ? TRANSLIT[ch] : ch))
    .join("")
  return transliterated
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim()
}

// Генерує глобально унікальний slug для таблиці (slug-індекси унікальні по всій таблиці).
// Якщо базовий slug зайнятий — додає суфікс -2, -3, ...
async function generateUniqueSlug(supabase: any, table: string, name: string): Promise<string> {
  const base = createSlug(name) || table.replace(/s$/, "")
  let slug = base
  let n = 2
  // У межах одного імпорту виклики послідовні, тож гонок немає
  // (а навіть якщо slug проскочить — БД відхилить дубль, але це малоймовірно)
  for (let guard = 0; guard < 1000; guard++) {
    const { data } = await supabase.from(table).select("id").eq("slug", slug).limit(1)
    if (!data || data.length === 0) return slug
    slug = `${base}-${n}`
    n++
  }
  // запобіжник: додаємо випадковий суфікс
  return `${base}-${Date.now()}`
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  let created = 0
  let updated = 0
  let errors = 0
  const errorMessages: string[] = []
  const touchedModelIds = new Set<string>()
  const touchedServiceIds = new Set<string>()

  try {
    const { data, createMissing } = await request.json()

    console.log("[v0] Supabase initialized:", !!supabase)

    if (!data || !Array.isArray(data)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 })
    }

    for (let i = 0; i < data.length; i++) {
      const row = data[i]

      try {
        let brandId = row.brandId || null
        let seriesId = row.seriesId || null
        let modelId = row.modelId || null

        // Create missing brands, series, models if needed
        if (createMissing) {
          // Create brand if missing
          if (!brandId && row.brandName) {
            // Шукаємо існуючий бренд незалежно від регістру
            const { data: brandMatches } = await supabase
              .from("brands")
              .select("id")
              .ilike("name", row.brandName)
            const existingBrand = brandMatches?.[0]

            if (existingBrand) {
              brandId = existingBrand.id
            } else {
              const { data: newBrand, error: brandError } = await supabase
                .from("brands")
                .insert({
                  name: row.brandName,
                  slug: await generateUniqueSlug(supabase, "brands", row.brandName),
                })
                .select("id")
                .single()

              if (brandError) {
                throw new Error(`Brand creation error: ${brandError.message}`)
              }
              brandId = newBrand?.id
            }
          }

          // Create series if missing
          if (!seriesId && row.seriesName && brandId) {
            // Шукаємо існуючу серію в межах бренду незалежно від регістру
            const { data: seriesMatches } = await supabase
              .from("series")
              .select("id")
              .eq("brand_id", brandId)
              .ilike("name", row.seriesName)
            const existingSeries = seriesMatches?.[0]

            if (existingSeries) {
              seriesId = existingSeries.id
            } else {
              const { data: newSeries, error: seriesError } = await supabase
                .from("series")
                .insert({
                  name: row.seriesName,
                  slug: await generateUniqueSlug(supabase, "series", row.seriesName),
                  brand_id: brandId,
                })
                .select("id")
                .single()

              if (seriesError) {
                throw new Error(`Series creation error: ${seriesError.message}`)
              }
              seriesId = newSeries?.id
            }
          }

          // Create model if missing
          if (!modelId && row.modelName && brandId && seriesId) {
            // Шукаємо існуючу модель у межах серії незалежно від регістру
            const { data: modelMatches } = await supabase
              .from("models")
              .select("id")
              .eq("series_id", seriesId)
              .ilike("name", row.modelName)
            const existingModel = modelMatches?.[0]

            if (existingModel) {
              modelId = existingModel.id
            } else {
              const { data: newModel, error: modelError } = await supabase
                .from("models")
                .insert({
                  name: row.modelName,
                  slug: await generateUniqueSlug(supabase, "models", row.modelName),
                  brand_id: brandId,
                  series_id: seriesId,
                })
                .select("id")
                .single()

              if (modelError) {
                throw new Error(`Model creation error: ${modelError.message}`)
              }
              modelId = newModel?.id
            }
          }
        }

        // Validate required fields
        if (!modelId || !row.serviceId) {
          errors++
          errorMessages.push(
            `Рядок ${i + 1}: Відсутня ${!modelId ? "модель" : "послуга"}`
          )
          continue
        }

        // Parse price - null if empty or invalid
        let price: number | null = null
        if (row.price && row.price.toString().trim() !== "") {
          const parsedPrice = Number.parseFloat(
            row.price
              .toString()
              .replace(/[^\d,.-]/g, "")
              .replace(",", "."),
          )
          if (!isNaN(parsedPrice) && parsedPrice > 0) {
            price = parsedPrice
          }
        }

        // Parse warranty period
        let warrantyMonths = 0
        if (row.warrantyPeriod) {
          const warrantyStr = row.warrantyPeriod.toString().toLowerCase()
          const warrantyNum = Number.parseInt(warrantyStr.replace(/[^\d]/g, ""))
          if (!Number.isNaN(warrantyNum)) {
            warrantyMonths = warrantyNum
          }
        }

        // Parse duration in minutes and convert to hours
        const durationMinutes = Number.parseInt(
          row.duration?.toString().replace(/[^\d]/g, "") || "0"
        )
        const durationHours = Math.round((durationMinutes / 60) * 100) / 100

        // Check if service exists
        const { data: existing, error: checkError } = await supabase
          .from("model_services")
          .select("id")
          .eq("service_id", row.serviceId)
          .eq("model_id", modelId)
          .maybeSingle()

        if (checkError) {
          throw new Error(`Check error: ${checkError.message}`)
        }

        const serviceData = {
          service_id: row.serviceId,
          model_id: modelId,
          price,
          warranty_months: warrantyMonths,
          duration_hours: durationHours,
          detailed_description: row.serviceName || "",
          benefits: row.warranty || null,
          part_type: row.partType || null,
        }

        if (existing) {
          const { error: updateError } = await supabase
            .from("model_services")
            .update(serviceData)
            .eq("id", existing.id)

          if (updateError) {
            errors++
            errorMessages.push(
              `Рядок ${i + 1} (оновлення): ${updateError.message}`
            )
          } else {
            updated++
            touchedModelIds.add(modelId)
            if (row.serviceId) touchedServiceIds.add(row.serviceId)
          }
        } else {
          const { error: insertError } = await supabase
            .from("model_services")
            .insert({
              ...serviceData,
              created_at: new Date().toISOString(),
            })

          if (insertError) {
            errors++
            errorMessages.push(
              `Рядок ${i + 1} (вставка): ${insertError.message}`
            )
          } else {
            created++
            touchedModelIds.add(modelId)
            if (row.serviceId) touchedServiceIds.add(row.serviceId)
          }
        }
      } catch (error) {
        errors++
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        errorMessages.push(`Рядок ${i + 1}: ${errorMessage}`)
      }
    }

    // Скидаємо кеш відповідних сторінок (сторінка моделі + сторінка кінцевої послуги через теги,
    // списки/бренди/серії/послуги через шляхи). Не зриваємо імпорт при помилці.
    if (touchedModelIds.size > 0 || touchedServiceIds.size > 0) {
      try {
        await revalidateCatalog(supabase, {
          modelIds: touchedModelIds,
          serviceIds: touchedServiceIds,
        })
      } catch (revalidateError) {
        console.error("[import-export/services] revalidate error:", revalidateError)
      }
    }

    return NextResponse.json({
      success: true,
      created,
      updated,
      errors,
      errorMessages: errorMessages.slice(0, 10),
    })
  } catch (error) {
    console.error("Import error:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: "Помилка імпорту: " + errorMessage },
      { status: 500 }
    )
  }
}
