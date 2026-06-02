import { NextResponse } from "next/server"
import { getAllDiscounts, createDiscount } from "@/lib/discounts/queries"
import { getSession } from "@/lib/auth/session"
import { createClient } from "@/lib/supabase"

export const dynamic = "force-dynamic"

type NormalizedDiscountPayload = {
  name: string
  code: string
  description: string | null
  discountType: "percentage" | "fixed"
  discountValue: number
  serviceIds: string[]
  scopeType: "all_models" | "brand" | "series" | "model"
  brandId: string | null
  seriesId: string | null
  modelId: string | null
  isActive: boolean
  startsAt: string | null
  expiresAt: string | null
  maxUses: number | null
  maxUsesPerUser: number | null
  userId: string | null
  requiresCode: boolean
}

type DiscountPayloadValidation =
  | { ok: true; data: NormalizedDiscountPayload }
  | { ok: false; error: string }

function nullableTrimmedString(value: unknown): string | null {
  const text = String(value ?? "").trim()
  return text || null
}

function nullablePositiveInteger(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null

  const parsed = Number.parseInt(String(value), 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return parsed
}

function normalizeDate(value: unknown): string | null {
  const text = nullableTrimmedString(value)
  if (!text) return null

  const timestamp = Date.parse(text)
  if (Number.isNaN(timestamp)) return null
  return text
}

function isDuplicateDiscountCodeError(details: string) {
  return details.includes("discounts_code_key") || details.toLowerCase().includes("duplicate key")
}

async function validatePersonalDiscountUser(userId: string | null): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!userId) return { ok: true }

  const supabase = createClient()
  const { data, error } = await supabase.from("users").select("id").eq("id", userId).maybeSingle()

  if (error) {
    console.error("Error validating personal discount user:", error)
    return { ok: false, error: "Failed to validate selected user" }
  }

  if (!data) {
    return { ok: false, error: "Selected user does not exist" }
  }

  return { ok: true }
}

function normalizeDiscountPayload(body: any): DiscountPayloadValidation {
  const name = String(body.name ?? "").trim()
  const code = String(body.code ?? "").trim().toUpperCase()
  const discountType = body.discountType
  const scopeType = body.scopeType || "all_models"
  const discountValue =
    typeof body.discountValue === "number" ? body.discountValue : Number.parseFloat(String(body.discountValue ?? ""))
  const serviceIds: string[] = Array.isArray(body.serviceIds)
    ? Array.from(
        new Set(
          body.serviceIds
            .map((id: unknown) => String(id ?? "").trim())
            .filter((id: string): id is string => Boolean(id)),
        ),
      )
    : []

  if (!name) return { ok: false, error: "Discount name is required" }
  if (!code) return { ok: false, error: "Discount code is required" }
  if (discountType !== "percentage" && discountType !== "fixed") {
    return { ok: false, error: "Discount type must be percentage or fixed" }
  }
  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    return { ok: false, error: "Discount value must be greater than 0" }
  }
  if (discountType === "percentage" && discountValue > 100) {
    return { ok: false, error: "Percentage discount cannot be greater than 100" }
  }
  if (serviceIds.length === 0) {
    return { ok: false, error: "At least one service must be selected" }
  }
  if (!["all_models", "brand", "series", "model"].includes(scopeType)) {
    return { ok: false, error: "Unsupported discount scope" }
  }

  const brandId = nullableTrimmedString(body.brandId)
  const seriesId = nullableTrimmedString(body.seriesId)
  const modelId = nullableTrimmedString(body.modelId)

  if (scopeType === "brand" && !brandId) return { ok: false, error: "Brand is required for brand discounts" }
  if (scopeType === "series" && !seriesId) return { ok: false, error: "Series is required for series discounts" }
  if (scopeType === "model" && !modelId) return { ok: false, error: "Model is required for model discounts" }

  return {
    ok: true,
    data: {
      name,
      code,
      description: nullableTrimmedString(body.description),
      discountType,
      discountValue,
      serviceIds,
      scopeType,
      brandId: scopeType === "all_models" ? null : brandId,
      seriesId: scopeType === "brand" || scopeType === "all_models" ? null : seriesId,
      modelId: scopeType === "model" ? modelId : null,
      isActive: body.isActive ?? true,
      startsAt: normalizeDate(body.startsAt),
      expiresAt: normalizeDate(body.expiresAt),
      maxUses: nullablePositiveInteger(body.maxUses),
      maxUsesPerUser: nullablePositiveInteger(body.maxUsesPerUser),
      userId: body.userId === "global" ? null : nullableTrimmedString(body.userId),
      requiresCode: Boolean(body.requiresCode),
    },
  }
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const discounts = await getAllDiscounts()
    return NextResponse.json(discounts)
  } catch (error) {
    console.error("Error fetching discounts:", error)
    return NextResponse.json({ error: "Failed to fetch discounts" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validation = normalizeDiscountPayload(body)

    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const payload = validation.data
    const userValidation = await validatePersonalDiscountUser(payload.userId)

    if (!userValidation.ok) {
      return NextResponse.json({ error: userValidation.error }, { status: 400 })
    }

    const discount = await createDiscount({
      ...payload,
      description: payload.description ?? undefined,
      brandId: payload.brandId ?? undefined,
      seriesId: payload.seriesId ?? undefined,
      modelId: payload.modelId ?? undefined,
      startsAt: payload.startsAt ? new Date(payload.startsAt) : undefined,
      expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : undefined,
      maxUses: payload.maxUses ?? undefined,
      maxUsesPerUser: payload.maxUsesPerUser ?? undefined,
      userId: payload.userId ?? undefined,
      requiresCode: payload.requiresCode,
    })

    return NextResponse.json(discount)
  } catch (error) {
    console.error("Error creating discount:", error)
    const details = error instanceof Error ? error.message : String(error)

    return NextResponse.json(
      {
        error: isDuplicateDiscountCodeError(details) ? "Discount code already exists" : "Failed to create discount",
        details,
      },
      { status: isDuplicateDiscountCodeError(details) ? 409 : 500 },
    )
  }
}
