"use client"

import { useTranslations } from "next-intl"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserProfile } from "@/components/profile/user-profile"
import { UserOrders } from "@/components/profile/user-orders"
import { UserDiscounts } from "@/components/profile/user-discounts"

export default function ProfileContent({ userData, locale }: { userData: any; locale: string }) {
  const t = useTranslations("Profile")

  return (
    <div className="container py-4 sm:py-10 px-4 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("userProfile")}</h1>
        <p className="text-sm sm:text-base text-muted-foreground">{t("manageProfileAndOrders")}</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="profile">{t("profile")}</TabsTrigger>
          <TabsTrigger value="orders">{t("repairHistory.title")}</TabsTrigger>
          <TabsTrigger value="discounts">{t("myDiscounts")}</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="space-y-4">
          <UserProfile user={userData} locale={locale} />
        </TabsContent>
        <TabsContent value="orders" className="space-y-4">
          <UserOrders />
        </TabsContent>
        <TabsContent value="discounts" className="space-y-4">
          <UserDiscounts discounts={[]} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
