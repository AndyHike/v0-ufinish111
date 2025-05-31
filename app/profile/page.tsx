import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserProfile } from "@/components/profile/user-profile"
import { UserOrders } from "@/components/profile/user-orders"
import { UserDiscounts } from "@/components/profile/user-discounts"

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Особистий кабінет</h1>
        <p className="text-muted-foreground">Керуйте своїм профілем та переглядайте історію ремонтів.</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Профіль</TabsTrigger>
          <TabsTrigger value="orders">Історія ремонтів</TabsTrigger>
          <TabsTrigger value="discounts">Мої знижки</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="space-y-4">
          <UserProfile user={session.user} />
        </TabsContent>
        <TabsContent value="orders" className="space-y-4">
          <UserOrders />
        </TabsContent>
        <TabsContent value="discounts" className="space-y-4">
          <UserDiscounts />
        </TabsContent>
      </Tabs>
    </div>
  )
}
