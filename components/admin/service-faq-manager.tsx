"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Plus, Trash2, Save, X, HelpCircle } from "lucide-react"
import { toast } from "sonner"

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

  const locales = [
    { code: "uk", name: "Українська" },
    { code: "en", name: "English" },
    { code: "cs", name: "Čeština" },
  ]

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
                <Input
                  id={`question-${locale.code}`}
                  value={formData.translations[locale.code]?.question || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      translations: {
                        ...formData.translations,
                        [locale.code]: {
                          ...formData.translations[locale.code],
                          question: e.target.value,
                        },
                      },
                    })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor={`answer-${locale.code}`}>Відповідь</Label>
                <Textarea
                  id={`answer-${locale.code}`}
                  value={formData.translations[locale.code]?.answer || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      translations: {
                        ...formData.translations,
                        [locale.code]: {
                          ...formData.translations[locale.code],
                          answer: e.target.value,
                        },
                      },
                    })
                  }
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
