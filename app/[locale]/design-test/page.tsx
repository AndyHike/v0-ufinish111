import { HeroSection } from "@/components/hero-section"
import { ContactSection } from "@/components/contact-section"
import { InfoBanner } from "@/components/info-banner"
import { QuickServicesSection } from "@/components/quick-services-section"
import { BrandsSectionModern } from "@/components/brands-section-modern"

export default function DesignTestPage() {
  return (
    <div className="design-test-page">
      <div className="bg-yellow-100 p-2 text-center text-sm">Тестова сторінка для експериментів з дизайном</div>

      <InfoBanner />

      {/* Оновлена герой-секція */}
      <HeroSection />

      {/* Модернізована секція брендів */}
      <BrandsSectionModern />

      {/* Нова секція швидких послуг */}
      <QuickServicesSection />

      {/* Оновлена контактна секція */}
      <ContactSection />
    </div>
  )
}
