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

export function TermsOfServiceManager() {
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchTermsOfService()
  }, [])

  const fetchTermsOfService = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/settings")
      if (response.ok) {
        const data = await response.json()
        const termsOfService = data.settings?.find((s: any) => s.key === "terms_of_service_content")
        setContent(termsOfService?.value || "")
      }
    } catch (error) {
      console.error("Error fetching terms of service:", error)
      toast({
        title: "Error",
        description: "Failed to load terms of service content",
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
          key: "terms_of_service_content",
          value: content,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Terms of service content saved successfully",
        })
      } else {
        throw new Error("Failed to save")
      }
    } catch (error) {
      console.error("Error saving terms of service:", error)
      toast({
        title: "Error",
        description: "Failed to save terms of service content",
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
          <CardTitle>Terms of Service Content</CardTitle>
          <CardDescription>Manage your terms of service content</CardDescription>
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
        <CardTitle>Terms of Service Content</CardTitle>
        <CardDescription>Manage your terms of service content</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="terms-file">Upload Text File</Label>
          <div className="flex items-center gap-2">
            <Input id="terms-file" type="file" accept=".txt" onChange={handleFileUpload} className="flex-1" />
            <Upload className="h-4 w-4" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="terms-content">Content</Label>
          <Textarea
            id="terms-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter your terms of service content here..."
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
              Save Terms of Service
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
