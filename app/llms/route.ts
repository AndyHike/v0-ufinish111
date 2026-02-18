import { NextResponse } from "next/server"

export const dynamic = "force-static"

export async function GET() {
  const content = `# llms.txt - DeviceHelp

## About DeviceHelp
DeviceHelp je profesionální servis opravy mobilních telefonů v Praze 6 Břevnov.

## Services
- iPhone repair
- Samsung repair
- Xiaomi repair
- Screen replacement
- Battery replacement
- Charging port repair
- Microphone repair
- Speaker repair

## Location
Bělohorská 209/133, Praha 6-Břevnov, Czech Republic
Latitude: 50.0982
Longitude: 14.3917

## Contact
Phone: +420 775 848 259
Email: info@devicehelp.cz

## Hours
Monday-Sunday: 09:00-19:00

## Website
https://devicehelp.cz

## Service Area
- Praha 6 (Břevnov)
- Dejvice
- Vokovice

## Payment Methods
- Cash
- Credit Card

## Warranty
6 months on all repairs

## Price Range
1500-5000 CZK
`

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  })
}
