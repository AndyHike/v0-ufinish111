import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    // Клонуємо запит, щоб мати можливість прочитати тіло кілька разів
    const clonedRequest = request.clone()

    // Логуємо заголовки
    console.log("Headers:", Object.fromEntries(request.headers.entries()))

    // Логуємо тіло запиту
    const body = await clonedRequest.text()
    console.log("Body:", body)

    // Спробуємо розпарсити JSON
    try {
      const jsonBody = JSON.parse(body)
      console.log("JSON Body:", jsonBody)
    } catch (e) {
      console.log("Not a valid JSON body")
    }

    return NextResponse.json({ success: true, message: "Test webhook received" })
  } catch (error) {
    console.error("Error in test webhook:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
