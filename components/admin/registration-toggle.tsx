"use client"

import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Card } from "@/components/ui/card"
import { AlertCircle, CheckCircle } from "lucide-react"

export function RegistrationToggle() {
  const [isEnabled, setIsEnabled] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch current setting on component mount
  useEffect(() => {
    const fetchSetting = async () => {
      try {
        const response = await fetch("/api/admin/settings")
        if (!response.ok) {
          throw new Error("Failed to fetch settings")
        }

        const data = await response.json()
        const registrationSetting = data.settings.find((setting: any) => setting.key === "registration_enabled")

        if (registrationSetting) {
          setIsEnabled(registrationSetting.value === "true")
        }
        setError(null)
      } catch (err) {
        console.error("Error fetching registration setting:", err)
        setError("Failed to load registration setting")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSetting()
  }, [])

  // Handle toggle change
  const handleToggleChange = async (checked: boolean) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: "registration_enabled",
          value: checked.toString(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update setting")
      }

      setIsEnabled(checked)
      toast({
        title: "Setting updated",
        description: `User registration is now ${checked ? "enabled" : "disabled"}`,
        variant: "default",
      })
      setError(null)
    } catch (err) {
      console.error("Error updating registration setting:", err)
      setError("Failed to update setting")
      toast({
        title: "Error",
        description: "Failed to update registration setting",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-x-2">
        <div>
          <Label htmlFor="registration-toggle" className="text-base font-medium">
            User Registration
          </Label>
          <p className="text-sm text-muted-foreground">Enable or disable new user registration on the site</p>
        </div>
        <Switch
          id="registration-toggle"
          checked={isEnabled}
          onCheckedChange={handleToggleChange}
          disabled={isLoading}
          aria-label="Toggle user registration"
        />
      </div>

      {error && (
        <Card className="bg-destructive/10 p-3 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span>{error}</span>
        </Card>
      )}

      <Card className={`p-3 text-sm flex items-center gap-2 ${isEnabled ? "bg-green-50" : "bg-amber-50"}`}>
        {isEnabled ? (
          <>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-green-700">User registration is currently enabled</span>
          </>
        ) : (
          <>
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <span className="text-amber-700">User registration is currently disabled</span>
          </>
        )}
      </Card>
    </div>
  )
}
