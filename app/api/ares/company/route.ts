import { NextResponse } from "next/server"

const ARES_COMPANY_DETAIL_URL = "https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty"
const ICO_PATTERN = /^\d{8}$/

type AresAddress = {
  textovaAdresa?: string
  nazevUlice?: string
  nazevCastiObce?: string
  cisloDomovni?: number | string
  cisloOrientacni?: number | string
  cisloOrientacniPismeno?: string
  nazevObce?: string
  psc?: number | string
  kodStatu?: string
}

type AresCompanyResponse = {
  ico?: string
  obchodniJmeno?: string
  dic?: string
  sidlo?: AresAddress
}

function compact(value: unknown) {
  return String(value ?? "").trim()
}

function normalizePostalCode(value: unknown) {
  return compact(value).replace(/\s+/g, "")
}

function buildStreet(sidlo?: AresAddress) {
  if (!sidlo) return ""

  const streetName = compact(sidlo.nazevUlice || sidlo.nazevCastiObce)
  const houseNumber = compact(sidlo.cisloDomovni)
  const orientationNumber = compact(sidlo.cisloOrientacni)
  const orientationLetter = compact(sidlo.cisloOrientacniPismeno)
  const orientation = orientationNumber ? `/${orientationNumber}${orientationLetter}` : ""
  const number = `${houseNumber}${orientation}`

  return [streetName, number].filter(Boolean).join(" ")
}

function normalizeAresCompany(company: AresCompanyResponse) {
  const sidlo = company.sidlo
  const billingStreet = buildStreet(sidlo)
  const billingCity = compact(sidlo?.nazevObce)
  const billingPostalCode = normalizePostalCode(sidlo?.psc)
  const billingCountry = compact(sidlo?.kodStatu) || "CZ"
  const address =
    compact(sidlo?.textovaAdresa) ||
    [billingStreet, [billingPostalCode, billingCity].filter(Boolean).join(" "), billingCountry]
      .filter(Boolean)
      .join(", ")

  return {
    ico: compact(company.ico),
    companyName: compact(company.obchodniJmeno),
    dic: compact(company.dic),
    address,
    billingStreet,
    billingCity,
    billingPostalCode,
    billingCountry,
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ico = compact(searchParams.get("ico")).replace(/\D/g, "")

  if (!ICO_PATTERN.test(ico)) {
    return NextResponse.json(
      {
        success: false,
        message: "ICO must contain exactly 8 digits.",
      },
      { status: 400 },
    )
  }

  try {
    const response = await fetch(`${ARES_COMPANY_DETAIL_URL}/${ico}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    })

    if (response.status === 404) {
      return NextResponse.json(
        {
          success: false,
          message: "Company was not found in ARES.",
        },
        { status: 404 },
      )
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "ARES lookup is temporarily unavailable.",
        },
        { status: 502 },
      )
    }

    const company = (await response.json()) as AresCompanyResponse

    return NextResponse.json({
      success: true,
      company: normalizeAresCompany(company),
    })
  } catch (error) {
    console.error("ARES lookup failed:", error)
    return NextResponse.json(
      {
        success: false,
        message: "ARES lookup is temporarily unavailable.",
      },
      { status: 502 },
    )
  }
}
