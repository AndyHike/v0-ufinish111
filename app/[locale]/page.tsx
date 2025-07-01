import { HeroSection } from "@/components/hero-section"
import { LazySection } from "@/components/lazy-section"
import { BrandsSectionLazy } from "@/components/brands-section-lazy"
import { ServicesSectionLazy } from "@/components/services-section-lazy"
import { ContactSection } from "@/components/contact-section"
import { InfoBanner } from "@/components/info-banner"

export default function HomePage() {
  return (
    <main>
      <InfoBanner />
      <HeroSection />

      {/* Ліниво завантажувана секція брендів */}
      <LazySection>
        <BrandsSectionLazy />
      </LazySection>

      {/* Ліниво завантажувана секція послуг */}
      <LazySection>
        <ServicesSectionLazy />
      </LazySection>

      <ContactSection />
    </main>
  )
}
