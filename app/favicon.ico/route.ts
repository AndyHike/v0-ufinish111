import { NextResponse } from "next/server"
import { siteFaviconPath } from "@/lib/site-assets"
import { mainSiteUrl } from "@/lib/site-config"

export function GET() {
  return NextResponse.redirect(new URL(siteFaviconPath, mainSiteUrl), 307)
}
