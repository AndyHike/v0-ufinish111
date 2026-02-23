"use client"

import Link from "next/link"
import { Shield, Zap, Clock, Wrench, Battery, Monitor, Camera } from "lucide-react"

export interface SeoService {
    id: string
    slug: string
    name: string
    minPrice: number | null
}

interface BrandSeoSectionsProps {
    locale: string
    services: SeoService[]
}

// ─── Advantages ───────────────────────────────────────────────────────────────
const advantagesData = {
    cs: [
        { icon: Shield, title: "Záruka 6 měsíců", text: "... na veškerou práci od našich certifikovaných techniků." },
        { icon: Zap, title: "Superrychlost!", text: "Telefon z ruky na pár chvil. Některé opravy zvládneme již do 30 minut." },
        { icon: Clock, title: "Každý den otevřeno", text: "Otevřeno 7 dní v týdnu od 9:00 do 19:00." },
    ],
    en: [
        { icon: Shield, title: "6-Month Warranty", text: "... on all work done by our certified technicians." },
        { icon: Zap, title: "Super fast!", text: "Phone in and out in minutes. Some repairs done in under 30 minutes." },
        { icon: Clock, title: "Open every day", text: "Open 7 days a week from 9:00 to 19:00." },
    ],
    uk: [
        { icon: Shield, title: "Гарантія 6 місяців", text: "... на всі роботи наших сертифікованих техніків." },
        { icon: Zap, title: "Супершвидко!", text: "Телефон із рук на лічені хвилини. Деякі ремонти — до 30 хвилин." },
        { icon: Clock, title: "Відкрито щодня", text: "Працюємо 7 днів на тиждень з 9:00 до 19:00." },
    ],
}

const servicesSectionTitle = {
    cs: "Nejpopulárnější služby",
    en: "Most popular services",
    uk: "Найпопулярніші послуги",
}

function getServiceIcon(slug: string) {
    if (slug.includes("batter") || slug.includes("bater")) return Battery
    if (slug.includes("screen") || slug.includes("display") || slug.includes("displa")) return Monitor
    if (slug.includes("camera") || slug.includes("kamer")) return Camera
    return Wrench
}

export function BrandSeoSections({ locale, services }: BrandSeoSectionsProps) {
    const lang = (locale in advantagesData ? locale : "cs") as keyof typeof advantagesData
    const advantages = advantagesData[lang]
    const svcTitle = servicesSectionTitle[lang as keyof typeof servicesSectionTitle] ?? servicesSectionTitle.cs
    const priceLabel = locale === "cs" ? "od" : locale === "uk" ? "від" : "from"

    return (
        <div className="bg-white">
            {/* ── Advantages ── */}
            <section className="py-10 border-t border-gray-100">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                        {advantages.map(({ icon: Icon, title, text }) => (
                            <div key={title} className="flex gap-4 items-start">
                                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Icon className="w-6 h-6 text-primary" strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-base leading-tight mb-1">{title}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Popular Services ── */}
            {services.length > 0 && (
                <section className="py-10 border-t border-gray-100">
                    <div className="container mx-auto px-4">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">{svcTitle}</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {services.map((svc) => {
                                const Icon = getServiceIcon(svc.slug)
                                return (
                                    <Link
                                        key={svc.id}
                                        href={`/${locale}/services/${svc.slug}`}
                                        className="group flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
                                    >
                                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                                            <Icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                                                {svc.name}
                                            </p>
                                            {svc.minPrice && (
                                                <p className="text-xs text-primary/80 font-medium mt-0.5">
                                                    {priceLabel} {svc.minPrice} Kč
                                                </p>
                                            )}
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                </section>
            )}
        </div>
    )
}
