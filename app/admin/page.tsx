import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminStats } from "@/components/admin/admin-stats"
import { RecentActivity } from "@/components/admin/recent-activity"
import { UsersList } from "@/components/admin/users-list"

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Панель адміністратора</h1>
        <p className="text-muted-foreground">Керуйте брендами, моделями телефонів та знижками для користувачів.</p>
      </div>

      <AdminStats />

      <Tabs defaultValue="activity">
        <TabsList>
          <TabsTrigger value="activity">Остання активність</TabsTrigger>
          <TabsTrigger value="users">Користувачі</TabsTrigger>
        </TabsList>
        <TabsContent value="activity" className="space-y-4">
          <RecentActivity />
        </TabsContent>
        <TabsContent value="users" className="space-y-4">
          <UsersList />
        </TabsContent>
      </Tabs>
    </div>
  )
}
