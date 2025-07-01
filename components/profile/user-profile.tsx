import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Shell } from "@/components/shell"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserOrderHistory } from "./user-order-history"

export function UserProfile() {
  return (
    <Shell>
      <Tabs defaultValue="profile" className="w-[400px]">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src="/examples/avatar-01.png" alt="Avatar" />
                <AvatarFallback>OM</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg font-medium">Olivia Martin</h2>
                <p className="text-sm text-muted-foreground">olivia.martin@email.com</p>
              </div>
            </div>
            <Separator />
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue="Olivia Martin" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" defaultValue="olivia.martin@email.com" />
            </div>
          </div>
          <Button>Update Profile</Button>
        </TabsContent>
        <TabsContent value="orders" className="space-y-6">
          <UserOrderHistory />
        </TabsContent>
        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
              <CardDescription>Update your billing information here.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>No billing information found.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Shell>
  )
}

export default UserProfile
