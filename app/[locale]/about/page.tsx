"use client"

import { useTranslations } from "next-intl"

export default function AboutPage() {
  // Use the correct namespace for translations
  const t = useTranslations("About")

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold">{t("about")}</h1>
        <p className="mt-4 text-xl text-muted-foreground">{t("aboutSubtitle")}</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="mb-4 text-2xl font-bold">{t("ourStory")}</h2>
          <p className="mb-4 text-muted-foreground">{t("storyPart1")}</p>
          <p className="mb-4 text-muted-foreground">{t("storyPart2")}</p>
          <p className="text-muted-foreground">{t("storyPart3")}</p>
        </div>
        <div className="flex items-center justify-center">
          <div className="relative h-[300px] w-full overflow-hidden rounded-lg">
            <img
              src="/about-us-pic.jpg"
              alt={t("ourShop")}
              width={600}
              height={300}
              className="w-full h-full object-cover"
              style={{ display: "block" }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
