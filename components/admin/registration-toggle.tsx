"use client"

import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Card } from "@/components/ui/card"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"

export function RegistrationToggle() {
  const [isEnabled, setIsEnabled] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch current setting on component mount
  useEffect(() => {
    const fetchSetting = async () => {
      try {
        const response = await fetch("/api/admin/settings", {
          method: "GET",
          credentials: "include", // Include cookies for authentication
        })

        if (response.status === 401) {
          setError("You don't have permission to access this setting")
          return
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
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
        credentials: "include", // Include cookies for authentication
        body: JSON.stringify({
          key: "registration_enabled",
          value: checked.toString(),
        }),
      })

      if (response.status === 401) {
        setError("You don't have permission to modify this setting")
        toast({
          title: "Unauthorized",
          description: "You don't have permission to modify this setting",
          variant: "destructive",
        })
        return
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
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

  if (isLoading && !error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between space-x-2">
          <div>
            <Label className="text-base font-medium">User Registration</Label>
            <p className="text-sm text-muted-foreground">Enable or disable new user registration on the site</p>
          </div>
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      </div>
    )
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
          disabled={isLoading || !!error}
          aria-label="Toggle user registration"
        />
      </div>

      {error && (
        <Card className="bg-destructive/10 p-3 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span>{error}</span>
        </Card>
      )}

      {!error && (
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
      )}
    </div>
  )
}
