import { HeroSection } from "@/components/hero-section"
import { ContactSection } from "@/components/contact-section"
import { BrandsSection } from "@/components/brands-section"
import { InfoBanner } from "@/components/info-banner"
import { getBrands } from "@/lib/data/brands"
import { getInfoBanner } from "@/lib/data/info-banner"

export const revalidate = 3600 // Revalidate every hour

export default async function HomePage() {
  const [brandsData, infoBannerData] = await Promise.all([getBrands(), getInfoBanner()])

  return (
    <>
      <InfoBanner data={infoBannerData} />
      <HeroSection />
      <BrandsSection data={brandsData} />
      <ContactSection />
    </>
  )
}
