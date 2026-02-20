"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Plus, Trash2, Save, X, HelpCircle, Code2, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { FAQ_PLACEHOLDERS } from "@/lib/faq-placeholders"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface FaqTranslation {
  locale: string
  question: string
  answer: string
}

interface Faq {
  id: string
  position: number
  service_faq_translations: FaqTranslation[]
}

interface ServiceFaqManagerProps {
  serviceId: string
}

export function ServiceFaqManager({ serviceId }: ServiceFaqManagerProps) {
  const [faqs, setFaqs] = useState<Faq[]>([])
  const [loading, setLoading] = useState(true)
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [expandedPlaceholders, setExpandedPlaceholders] = useState<Record<string, boolean>>({})

  const locales = [
    { code: "uk", name: "Українська" },
    { code: "en", name: "English" },
    { code: "cs", name: "Čeština" },
  ]

  const questionRefMap = useRef<Record<string, HTMLInputElement | null>>({})
  const answerRefMap = useRef<Record<string, HTMLTextAreaElement | null>>({})

  useEffect(() => {
    fetchFaqs()
  }, [serviceId])

  const fetchFaqs = async () => {
    try {
      const response = await fetch(`/api/admin/services/${serviceId}/faqs`)
      const data = await response.json()
      setFaqs(data.faqs || [])
    } catch (error) {
      console.error("Error fetching FAQs:", error)
      toast.error("Помилка завантаження FAQ")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveFaq = async (faqData: any) => {
    try {
      const url = editingFaq
        ? `/api/admin/services/${serviceId}/faqs/${editingFaq.id}`
        : `/api/admin/services/${serviceId}/faqs`
      const method = editingFaq ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(faqData),
      })

      if (response.ok) {
        toast.success(editingFaq ? "FAQ оновлено" : "FAQ створено")
        setIsDialogOpen(false)
        setEditingFaq(null)
        fetchFaqs()
      } else {
        toast.error("Помилка збереження FAQ")
      }
    } catch (error) {
      console.error("Error saving FAQ:", error)
      toast.error("Помилка збереження FAQ")
    }
  }

  const handleDeleteFaq = async (faqId: string) => {
    if (!confirm("Ви впевнені, що хочете видалити це FAQ?")) return

    try {
      const response = await fetch(`/api/admin/services/${serviceId}/faqs/${faqId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("FAQ видалено")
        fetchFaqs()
      } else {
        toast.error("Помилка видалення FAQ")
      }
    } catch (error) {
      console.error("Error deleting FAQ:", error)
      toast.error("Помилка видалення FAQ")
    }
  }

  const insertPlaceholder = (placeholder: string, fieldType: "question" | "answer", locale: string) => {
    const key = `${locale}-${fieldType}`

    if (fieldType === "question") {
      const input = questionRefMap.current[key]
      if (input) {
        const start = input.selectionStart || 0
        const end = input.selectionEnd || 0
        const text = input.value
        const before = text.substring(0, start)
        const after = text.substring(end)
        input.value = before + placeholder + after
        input.selectionStart = input.selectionEnd = start + placeholder.length
        input.focus()

        // Trigger change event for form state update
        input.dispatchEvent(new Event("input", { bubbles: true }))
      }
    } else {
      const textarea = answerRefMap.current[key]
      if (textarea) {
        const start = textarea.selectionStart || 0
        const end = textarea.selectionEnd || 0
        const text = textarea.value
        const before = text.substring(0, start)
        const after = text.substring(end)
        textarea.value = before + placeholder + after
        textarea.selectionStart = textarea.selectionEnd = start + placeholder.length
        textarea.focus()

        textarea.dispatchEvent(new Event("input", { bubbles: true }))
      }
    }

    toast.success(`Додано: ${placeholder}`)
  }

  const PlaceholderButtonsBar = ({
    fieldType,
    locale,
  }: {
    fieldType: "question" | "answer"
    locale: string
  }) => {
    const key = `${locale}-${fieldType}`
    const isExpanded = expandedPlaceholders[key]

    // Show first 3 placeholders, rest in expandable menu
    const visiblePlaceholders = FAQ_PLACEHOLDERS.slice(0, 3)
    const hiddenPlaceholders = FAQ_PLACEHOLDERS.slice(3)

    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1">
          {visiblePlaceholders.map((placeholder) => (
            <Button
              key={placeholder.key}
              type="button"
              size="sm"
              variant="outline"
              onClick={() => insertPlaceholder(placeholder.format, fieldType, locale)}
              className="text-xs h-7"
              title={placeholder.description}
            >
              {placeholder.label}
            </Button>
          ))}

          {hiddenPlaceholders.length > 0 && (
            <Collapsible
              open={isExpanded}
              onOpenChange={(open) =>
                setExpandedPlaceholders({ ...expandedPlaceholders, [key]: open })
              }
              className="flex items-center"
            >
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 gap-1"
                >
                  <Code2 className="h-3 w-3" />
                  Ще {hiddenPlaceholders.length}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="col-span-full mt-2 flex flex-wrap gap-1">
                {hiddenPlaceholders.map((placeholder) => (
                  <Button
                    key={placeholder.key}
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => insertPlaceholder(placeholder.format, fieldType, locale)}
                    className="text-xs h-7"
                    title={placeholder.description}
                  >
                    {placeholder.label}
                  </Button>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>
    )
  }

  const FaqForm = ({ faq }: { faq?: Faq }) => {
    const [formData, setFormData] = useState({
      position: faq?.position || 0,
      translations: locales.reduce(
        (acc, locale) => {
          const translation = faq?.service_faq_translations?.find((t) => t.locale === locale.code)
          acc[locale.code] = {
            question: translation?.question || "",
            answer: translation?.answer || "",
          }
          return acc
        },
        {} as Record<string, { question: string; answer: string }>,
      ),
    })

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      handleSaveFaq(formData)
    }

    const handleQuestionChange = (locale: string, value: string) => {
      setFormData({
        ...formData,
        translations: {
          ...formData.translations,
          [locale]: {
            ...formData.translations[locale],
            question: value,
          },
        },
      })
    }

    const handleAnswerChange = (locale: string, value: string) => {
      setFormData({
        ...formData,
        translations: {
          ...formData.translations,
          [locale]: {
            ...formData.translations[locale],
            answer: value,
          },
        },
      })
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="position">Позиція</Label>
          <Input
            id="position"
            type="number"
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: Number.parseInt(e.target.value) })}
            required
          />
        </div>

        <Tabs defaultValue="uk" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            {locales.map((locale) => (
              <TabsTrigger key={locale.code} value={locale.code}>
                {locale.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {locales.map((locale) => (
            <TabsContent key={locale.code} value={locale.code} className="space-y-4">
              <div>
                <Label htmlFor={`question-${locale.code}`}>Питання</Label>
                <PlaceholderButtonsBar fieldType="question" locale={locale.code} />
                <Input
                  ref={(el) => {
                    if (el) questionRefMap.current[`${locale.code}-question`] = el
                  }}
                  id={`question-${locale.code}`}
                  value={formData.translations[locale.code]?.question || ""}
                  onChange={(e) => handleQuestionChange(locale.code, e.target.value)}
                  placeholder="Напр: {{brand}} {{model}} не включається - що робити?"
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label htmlFor={`answer-${locale.code}`}>Відповідь</Label>
                <PlaceholderButtonsBar fieldType="answer" locale={locale.code} />
                <Textarea
                  ref={(el) => {
                    if (el) answerRefMap.current[`${locale.code}-answer`] = el
                  }}
                  id={`answer-${locale.code}`}
                  value={formData.translations[locale.code]?.answer || ""}
                  onChange={(e) => handleAnswerChange(locale.code, e.target.value)}
                  placeholder="Напр: {{service}} для {{device}} займає {{duration_hours}} години. Гарантія {{warranty_months}} {{warranty_period}}."
                  rows={4}
                  className="mt-2"
                  required
                />
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
            <X className="h-4 w-4 mr-2" />
            Скасувати
          </Button>
          <Button type="submit">
            <Save className="h-4 w-4 mr-2" />
            Зберегти
          </Button>
        </div>
      </form>
    )
  }

  if (loading) {
    return <div className="p-6">Завантаження FAQ...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            FAQ для послуги
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingFaq(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Додати FAQ
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingFaq ? "Редагувати FAQ" : "Додати FAQ"}</DialogTitle>
              </DialogHeader>
              <FaqForm faq={editingFaq || undefined} />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {faqs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Поки що немає FAQ для цієї послуги</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Позиція</TableHead>
                <TableHead>Питання (UK)</TableHead>
                <TableHead>Відповідь (UK)</TableHead>
                <TableHead>Дії</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {faqs.map((faq) => {
                const ukTranslation = faq.service_faq_translations?.find((t) => t.locale === "uk")
                return (
                  <TableRow key={faq.id}>
                    <TableCell>{faq.position}</TableCell>
                    <TableCell className="max-w-xs truncate">{ukTranslation?.question || "Без питання"}</TableCell>
                    <TableCell className="max-w-xs truncate">{ukTranslation?.answer || "Без відповіді"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingFaq(faq)
                            setIsDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteFaq(faq.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
  }

  const FaqForm = ({ faq }: { faq?: Faq }) => {
    const [formData, setFormData] = useState({
      position: faq?.position || 0,
      translations: locales.reduce(
        (acc, locale) => {
          const translation = faq?.service_faq_translations?.find((t) => t.locale === locale.code)
          acc[locale.code] = {
            question: translation?.question || "",
            answer: translation?.answer || "",
          }
          return acc
        },
        {} as Record<string, { question: string; answer: string }>,
      ),
    })

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      handleSaveFaq(formData)
    }

    const handleQuestionChange = (locale: string, value: string) => {
      setFormData({
        ...formData,
        translations: {
          ...formData.translations,
          [locale]: {
            ...formData.translations[locale],
            question: value,
          },
        },
      })
    }

    const handleAnswerChange = (locale: string, value: string) => {
      setFormData({
        ...formData,
        translations: {
          ...formData.translations,
          [locale]: {
            ...formData.translations[locale],
            answer: value,
          },
        },
      })
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="position">Позиція</Label>
          <Input
            id="position"
            type="number"
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: Number.parseInt(e.target.value) })}
            required
          />
        </div>

        <Tabs defaultValue="uk" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            {locales.map((locale) => (
              <TabsTrigger key={locale.code} value={locale.code}>
                {locale.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {locales.map((locale) => (
            <TabsContent key={locale.code} value={locale.code} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor={`question-${locale.code}`}>Питання</Label>
                  <PlaceholderPanel fieldType="question" locale={locale.code} />
                </div>
                <Input
                  ref={(el) => {
                    if (el) questionRefMap.current[`${locale.code}-question`] = el
                  }}
                  id={`question-${locale.code}`}
                  value={formData.translations[locale.code]?.question || ""}
                  onChange={(e) => handleQuestionChange(locale.code, e.target.value)}
                  placeholder="Напр: {{brand}} {{model}} не включається - що робити?"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor={`answer-${locale.code}`}>Відповідь</Label>
                  <PlaceholderPanel fieldType="answer" locale={locale.code} />
                </div>
                <Textarea
                  ref={(el) => {
                    if (el) answerRefMap.current[`${locale.code}-answer`] = el
                  }}
                  id={`answer-${locale.code}`}
                  value={formData.translations[locale.code]?.answer || ""}
                  onChange={(e) => handleAnswerChange(locale.code, e.target.value)}
                  placeholder="Напр: {{service}} для {{device}} займає {{duration_hours}} годину(н). Гарантія {{warranty_months}} {{warranty_period}}."
                  rows={4}
                  required
                />
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
            <X className="h-4 w-4 mr-2" />
            Скасувати
          </Button>
          <Button type="submit">
            <Save className="h-4 w-4 mr-2" />
            Зберегти
          </Button>
        </div>
      </form>
    )
  }

  if (loading) {
    return <div className="p-6">Завантаження FAQ...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            FAQ для послуги
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingFaq(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Додати FAQ
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingFaq ? "Редагувати FAQ" : "Додати FAQ"}</DialogTitle>
              </DialogHeader>
              <FaqForm faq={editingFaq || undefined} />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {faqs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Поки що немає FAQ для цієї послуги</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Позиція</TableHead>
                <TableHead>Питання (UK)</TableHead>
                <TableHead>Відповідь (UK)</TableHead>
                <TableHead>Дії</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {faqs.map((faq) => {
                const ukTranslation = faq.service_faq_translations?.find((t) => t.locale === "uk")
                return (
                  <TableRow key={faq.id}>
                    <TableCell>{faq.position}</TableCell>
                    <TableCell className="max-w-xs truncate">{ukTranslation?.question || "Без питання"}</TableCell>
                    <TableCell className="max-w-xs truncate">{ukTranslation?.answer || "Без відповіді"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingFaq(faq)
                            setIsDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteFaq(faq.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
