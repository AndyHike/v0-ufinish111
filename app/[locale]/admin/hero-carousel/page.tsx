export const dynamic = "force-dynamic"

import { HeroCarouselManager } from "@/components/admin/hero-carousel-manager"

export default async function HeroCarouselPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Hero Карусель</h1>
                <p className="text-muted-foreground">
                    Керуйте каруселлю зображень на головній сторінці замість стандартного зображення
                </p>
            </div>
            <HeroCarouselManager />
        </div>
    )
}
