import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CookieSettingsManager } from "@/components/admin/cookie-settings-manager"

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Settings</h2>
          <p className="text-muted-foreground">Manage your website settings.</p>
        </div>
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="cookies">Cookies & Analytics</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          <TabsContent value="general" className="space-y-6">
            <div>General settings content</div>
          </TabsContent>
          <TabsContent value="content" className="space-y-6">
            <div>Content settings content</div>
          </TabsContent>
          <TabsContent value="cookies" className="space-y-6">
            <CookieSettingsManager />
          </TabsContent>
          <TabsContent value="advanced" className="space-y-6">
            <div>Advanced settings content</div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
