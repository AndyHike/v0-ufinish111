"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Upload, Save } from "lucide-react"

export function PrivacyPolicyManager() {
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchPrivacyPolicy()
  }, [])

  const fetchPrivacyPolicy = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/settings")
      if (response.ok) {
        const data = await response.json()
        const privacyPolicy = data.settings?.find((s: any) => s.key === "privacy_policy_content")
        setContent(privacyPolicy?.value || "")
      }
    } catch (error) {
      console.error("Error fetching privacy policy:", error)
      toast({
        title: "Error",
        description: "Failed to load privacy policy content",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: "privacy_policy_content",
          value: content,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Privacy policy content saved successfully",
        })
      } else {
        throw new Error("Failed to save")
      }
    } catch (error) {
      console.error("Error saving privacy policy:", error)
      toast({
        title: "Error",
        description: "Failed to save privacy policy content",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === "text/plain") {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        setContent(text)
      }
      reader.readAsText(file)
    } else {
      toast({
        title: "Error",
        description: "Please select a valid text file (.txt)",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Privacy Policy Content</CardTitle>
          <CardDescription>Manage your privacy policy content</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy Policy Content</CardTitle>
        <CardDescription>Manage your privacy policy content</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="privacy-file">Upload Text File</Label>
          <div className="flex items-center gap-2">
            <Input id="privacy-file" type="file" accept=".txt" onChange={handleFileUpload} className="flex-1" />
            <Upload className="h-4 w-4" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="privacy-content">Content</Label>
          <Textarea
            id="privacy-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter your privacy policy content here..."
            className="min-h-[300px]"
          />
        </div>

        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Privacy Policy
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
