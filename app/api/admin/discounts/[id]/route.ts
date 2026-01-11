import { NextResponse } from "next/server"
import { updateDiscount, deleteDiscount } from "@/lib/discounts/queries"
import { getSession } from "@/lib/auth/session"

export const dynamic = "force-dynamic"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const discount = await updateDiscount(id, body)

    return NextResponse.json(discount)
  } catch (error) {
    console.error("Error updating discount:", error)
    return NextResponse.json({ error: "Failed to update discount" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    await deleteDiscount(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting discount:", error)
    return NextResponse.json({ error: "Failed to delete discount" }, { status: 500 })
  }
}
