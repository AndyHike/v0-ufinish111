"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Upload, Download, Eye, Edit, Info } from "lucide-react"
import { toast } from "sonner"
import ReactMarkdown from "react-markdown"

interface PrivacyPolicyManagerProps {
  locale: string
}

export function PrivacyPolicyManager({ locale }: PrivacyPolicyManagerProps) {
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("edit")

  useEffect(() => {
    loadContent()
  }, [locale])

  const loadContent = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/settings`)
      const data = await response.json()
      const key = `privacy_policy_${locale}`
      const setting = data.find((s: any) => s.key === key)
      setContent(setting?.value || "")
    } catch (error) {
      console.error("Error loading privacy policy:", error)
      toast.error("Помилка завантаження політики конфіденціальності")
    } finally {
      setIsLoading(false)
    }
  }

  const saveContent = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: `privacy_policy_${locale}`,
          value: content,
        }),
      })

      if (response.ok) {
        toast.success("Політику конфіденціальності збережено")
      } else {
        throw new Error("Failed to save")
      }
    } catch (error) {
      console.error("Error saving privacy policy:", error)
      toast.error("Помилка збереження політики конфіденціальності")
    } finally {
      setSaving(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        setContent(text)
        toast.success("Файл завантажено")
      }
      reader.readAsText(file)
    }
  }

  const downloadContent = () => {
    const blob = new Blob([content], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `privacy-policy-${locale}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const markdownHelp = [
    { syntax: "**жирний текст**", description: "Жирний текст" },
    { syntax: "*курсив*", description: "Курсивний текст" },
    { syntax: "# Заголовок 1", description: "Великий заголовок" },
    { syntax: "## Заголовок 2", description: "Середній заголовок" },
    { syntax: "### Заголовок 3", description: "Малий заголовок" },
    { syntax: "- Пункт списку", description: "Маркований список" },
    { syntax: "1. Пункт списку", description: "Нумерований список" },
    { syntax: "[Текст](https://example.com)", description: "Посилання" },
    { syntax: "> Цитата", description: "Блок цитати" },
    { syntax: "`код`", description: "Inline код" },
    { syntax: "---", description: "Горизонтальна лінія" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Політика конфіденціальності
          <Badge variant="outline">{locale.toUpperCase()}</Badge>
        </CardTitle>
        <CardDescription>Керування політикою конфіденціальності для мови {locale}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Підтримується Markdown форматування. Використовуйте вкладку "Попередній перегляд" для перевірки результату.
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => document.getElementById("file-upload")?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Завантажити файл
          </Button>
          <Button variant="outline" size="sm" onClick={downloadContent} disabled={!content}>
            <Download className="h-4 w-4 mr-2" />
            Скачати
          </Button>
          <input id="file-upload" type="file" accept=".txt,.md" onChange={handleFileUpload} className="hidden" />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Редагувати
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Попередній перегляд
            </TabsTrigger>
            <TabsTrigger value="help">Довідка</TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-4">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Введіть політику конфіденціальності..."
              className="min-h-[400px] font-mono"
              disabled={isLoading}
            />
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <div className="border rounded-lg p-4 min-h-[400px] bg-gray-50">
              {content ? (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => <h1 className="text-2xl font-bold mt-6 mb-4 text-gray-900">{children}</h1>,
                      h2: ({ children }) => (
                        <h2 className="text-xl font-semibold mt-5 mb-3 text-gray-800">{children}</h2>
                      ),
                      h3: ({ children }) => <h3 className="text-lg font-medium mt-4 mb-2 text-gray-700">{children}</h3>,
                      p: ({ children }) => <p className="mb-3 text-gray-600 leading-relaxed">{children}</p>,
                      ul: ({ children }) => (
                        <ul className="list-disc list-inside mb-3 space-y-1 text-gray-600">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal list-inside mb-3 space-y-1 text-gray-600">{children}</ol>
                      ),
                      li: ({ children }) => <li className="ml-4">{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold text-gray-800">{children}</strong>,
                      em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
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
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-3">
                          {children}
                        </blockquote>
                      ),
                      code: ({ children }) => (
                        <code className="bg-gray-200 px-2 py-1 rounded text-sm font-mono text-gray-800">
                          {children}
                        </code>
                      ),
                      hr: () => <hr className="my-6 border-gray-300" />,
                    }}
                  >
                    {content}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-gray-500 italic">Попередній перегляд з'явиться тут...</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="help" className="space-y-4">
            <div className="grid gap-4">
              <h3 className="text-lg font-semibold">Markdown форматування</h3>
              <div className="grid gap-2">
                {markdownHelp.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <code className="bg-gray-200 px-2 py-1 rounded text-sm font-mono">{item.syntax}</code>
                    <span className="text-sm text-gray-600">{item.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button onClick={saveContent} disabled={isSaving || isLoading}>
            {isSaving ? "Збереження..." : "Зберегти"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
