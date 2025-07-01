import { HeroSection } from "@/components/hero-section"
import { ContactSection } from "@/components/contact-section"
import { BrandsSection } from "@/components/brands-section"
import { InfoBanner } from "@/components/info-banner"

export default function HomePage() {
  return (
    <>
      <InfoBanner />
      <HeroSection />
      <BrandsSection />
      <ContactSection />
    </>
  )
}
