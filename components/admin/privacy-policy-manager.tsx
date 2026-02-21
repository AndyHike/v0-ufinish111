"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Upload, Save, Eye, FileText } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ReactMarkdown from "react-markdown"

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
          <CardDescription>Manage your privacy policy content with Markdown support</CardDescription>
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
        <CardDescription>
          Manage your privacy policy content with Markdown support. Use **bold**, *italic*, # headers, and more.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="privacy-file">Upload Text File</Label>
          <div className="flex items-center gap-2">
            <Input id="privacy-file" type="file" accept=".txt,.md" onChange={handleFileUpload} className="flex-1" />
            <Upload className="h-4 w-4" />
          </div>
        </div>

        <Tabs defaultValue="edit" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-2">
            <Label htmlFor="privacy-content">Content (Markdown supported)</Label>
            <div className="text-sm text-gray-600 mb-2">
              <p>Markdown formatting examples:</p>
              <ul className="list-disc list-inside text-xs space-y-1 mt-1">
                <li>**bold text** or __bold text__</li>
                <li>*italic text* or _italic text_</li>
                <li># Header 1, ## Header 2, ### Header 3</li>
                <li>- Bullet point or * Bullet point</li>
                <li>1. Numbered list</li>
                <li>[Link text](https://example.com)</li>
                <li>{"> Blockquote"}</li>
              </ul>
            </div>
            <Textarea
              id="privacy-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your privacy policy content here using Markdown formatting..."
              className="min-h-[400px] font-mono text-sm"
            />
          </TabsContent>

          <TabsContent value="preview" className="space-y-2">
            <Label>Preview</Label>
            <div className="border rounded-lg p-4 min-h-[400px] bg-white">
              {content ? (
                <ReactMarkdown
                  className="prose prose-sm max-w-none"
                  components={{
                    h1: ({ children }) => <h1 className="text-2xl font-bold mt-6 mb-3 text-gray-900">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xl font-semibold mt-5 mb-2 text-gray-800">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-lg font-medium mt-4 mb-2 text-gray-700">{children}</h3>,
                    p: ({ children }) => <p className="mb-3 text-gray-600 leading-relaxed">{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                    em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="text-gray-600">{children}</li>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-blue-500 pl-3 py-1 mb-3 bg-gray-50 italic text-gray-700">
                        {children}
                      </blockquote>
                    ),
                    code: ({ children }) => (
                      <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-gray-800">
                        {children}
                      </code>
                    ),
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        className="text-blue-600 hover:text-blue-800 underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {children}
                      </a>
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              ) : (
                <p className="text-gray-400 italic">No content to preview</p>
              )}
            </div>
          </TabsContent>
        </Tabs>

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
