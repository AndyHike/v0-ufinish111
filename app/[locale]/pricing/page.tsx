"use client"

import { useTranslations } from "next-intl"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"

export default function PricingPage() {
  // Use the correct namespace for translations
  const t = useTranslations("Pricing")

  // Mock pricing data
  const pricingData = [
    { service: "Screen Replacement - iPhone", price: "1500-3000 ₴" },
    { service: "Screen Replacement - Samsung", price: "1200-2500 ₴" },
    { service: "Battery Replacement - iPhone", price: "800-1500 ₴" },
    { service: "Battery Replacement - Samsung", price: "700-1300 ₴" },
    { service: "Water Damage Repair", price: "from 1000 ₴" },
    { service: "Charging Port Repair", price: "600-1200 ₴" },
    { service: "Speaker/Microphone Repair", price: "500-1000 ₴" },
    { service: "Software Issues", price: "400-800 ₴" },
  ]

  // Mock pricing plans
  const plans = [
    {
      name: t("basic"),
      price: t("free"),
      description: t("basicDescription"),
      features: ["Device inspection", "Problem identification", "Repair cost estimate", "No obligation consultation"],
    },
    {
      name: t("standard"),
      price: "from 500 ₴",
      description: t("standardDescription"),
      features: [
        "All Basic features",
        "Common hardware repairs",
        "Software troubleshooting",
        "30-day warranty",
        "Free follow-up check",
      ],
    },
    {
      name: t("premium"),
      price: "from 1500 ₴",
      description: t("premiumDescription"),
      features: [
        "All Standard features",
        "Complex hardware repairs",
        "Data recovery attempts",
        "90-day warranty",
        "Priority service",
        "Free protective case",
      ],
    },
  ]

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold">{t("pricing")}</h1>
        <p className="mt-4 text-xl text-muted-foreground">{t("pricingSubtitle")}</p>
      </div>

      <div className="mb-16">
        <h2 className="mb-6 text-2xl font-bold">{t("serviceRates")}</h2>
        <Table>
          <TableCaption>{t("priceNote")}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[70%]">{t("service")}</TableHead>
              <TableHead>{t("priceRange")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pricingData.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{item.service}</TableCell>
                <TableCell>{item.price}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-bold">{t("repairPlans")}</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <div className="mt-2 text-3xl font-bold">{plan.price}</div>
                <CardDescription className="mt-2">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <Check className="mr-2 h-4 w-4 text-primary" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
