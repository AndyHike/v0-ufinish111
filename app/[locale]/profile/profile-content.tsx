"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, User, Mail, Phone, MapPin, Save } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { createUserProfile } from "@/app/actions/auth-api"

export default function ProfileContent() {
  const t = useTranslations("Profile")
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    address: "",
  })

  useEffect(() => {
    const supabase = createClient()

    const getProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setIsLoading(false)
          return
        }

        setUser(user)

        const { data: profileData, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (error) {
          console.error("Error fetching profile:", error)
        } else {
          setProfile(profileData)
          setFormData({
            first_name: profileData?.first_name || "",
            last_name: profileData?.last_name || "",
            phone: profileData?.phone || "",
            address: profileData?.address || "",
          })
        }
      } catch (error) {
        console.error("Error in getProfile:", error)
      } finally {
        setIsLoading(false)
      }
    }

    getProfile()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setMessage(null)

    try {
      const result = await createUserProfile(formData)

      if (result.success) {
        setMessage({ type: "success", text: t("profileUpdated") })

        // Refresh profile data
        const supabase = createClient()
        const { data: updatedProfile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (updatedProfile) {
          setProfile(updatedProfile)
        }
      } else {
        setMessage({ type: "error", text: result.message || t("updateFailed") })
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      setMessage({ type: "error", text: t("updateFailed") })
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">{t("notAuthenticated")}</p>
      </div>
    )
  }

  const displayName = profile
    ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || user.email
    : user.email

  const initials =
    profile && profile.first_name && profile.last_name
      ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
      : user.email?.[0]?.toUpperCase() || "U"

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} alt={displayName} />
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{displayName}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              {t("personalInformation")}
            </CardTitle>
            <CardDescription>{t("personalInformationDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            {message && (
              <Alert
                className={`mb-4 ${message.type === "error" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}
              >
                <AlertDescription className={message.type === "error" ? "text-red-800" : "text-green-800"}>
                  {message.text}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">{t("firstName")}</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange("first_name", e.target.value)}
                    placeholder={t("firstNamePlaceholder")}
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">{t("lastName")}</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange("last_name", e.target.value)}
                    placeholder={t("lastNamePlaceholder")}
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center">
                  <Mail className="mr-2 h-4 w-4" />
                  {t("email")}
                </Label>
                <Input id="email" type="email" value={user.email} disabled className="bg-gray-50" />
                <p className="text-xs text-gray-500">{t("emailCannotBeChanged")}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center">
                  <Phone className="mr-2 h-4 w-4" />
                  {t("phone")}
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder={t("phonePlaceholder")}
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center">
                  <MapPin className="mr-2 h-4 w-4" />
                  {t("address")}
                </Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder={t("addressPlaceholder")}
                  disabled={isSaving}
                  rows={3}
                />
              </div>

              <Button type="submit" disabled={isSaving} className="w-full">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("saving")}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {t("saveChanges")}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
