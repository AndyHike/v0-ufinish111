'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RichTextEditor } from './rich-text-editor'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

const LANGUAGES = [
  { code: 'cs', label: 'Čeština' },
  { code: 'uk', label: 'Українська' },
  { code: 'en', label: 'English' },
]

interface ArticleTranslation {
  locale: string
  title: string
  content: string
}

interface ArticleEditorProps {
  articleId?: string
  initialData?: {
    title: string
    tags: string
    featured_image?: string
    featured: boolean
    published: boolean
    translations: ArticleTranslation[]
  }
  locale: string
}

export function ArticleEditor({ articleId, initialData, locale }: ArticleEditorProps) {
  const t = useTranslations('Admin')
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState(locale)

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    tags: initialData?.tags || '',
    featured: initialData?.featured || false,
    published: initialData?.published || false,
    featured_image: initialData?.featured_image || '',
  })

  const [translations, setTranslations] = useState<ArticleTranslation[]>(
    initialData?.translations || LANGUAGES.map(lang => ({
      locale: lang.code,
      title: '',
      content: '',
    }))
  )

  const handleTranslationChange = (locale: string, field: 'title' | 'content', value: string) => {
    setTranslations(prev =>
      prev.map(t => (t.locale === locale ? { ...t, [field]: value } : t))
    )
  }

  const handleImageUpload = async (file: File): Promise<string> => {
    // Для демонстрації використовуємо base64
    // У реальному застосунку потрібно завантажити на сервер
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        resolve(reader.result as string)
      }
      reader.readAsDataURL(file)
    })
  }

  const calculateReadingTime = (html: string): number => {
    const text = html.replace(/<[^>]*>/g, '')
    const wordCount = text.trim().split(/\s+/).length
    return Math.ceil(wordCount / 200) // 200 слів на хвилину
  }

  const generateMetaDescription = (html: string): string => {
    const text = html.replace(/<[^>]*>/g, '')
    return text.substring(0, 160).trim() + (text.length > 160 ? '...' : '')
  }

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // Валідація
    if (!formData.title.trim()) {
      setError('Назва статті не може бути порожною')
      return
    }

    const mainTranslation = translations.find(t => t.locale === locale)
    if (!mainTranslation?.title || !mainTranslation?.content) {
      setError(`Заголовок та вміст статті мовою ${locale} обов'язкові`)
      return
    }

    setLoading(true)

    try {
      const slug = generateSlug(formData.title)
      const readingTime = calculateReadingTime(mainTranslation.content)
      const metaDescription = generateMetaDescription(mainTranslation.content)

      const payload = {
        title: formData.title,
        slug,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        featured_image: formData.featured_image,
        featured: formData.featured,
        published: formData.published,
        reading_time_minutes: readingTime,
        meta_description: metaDescription,
        content: mainTranslation.content,
        translations: translations.map(t => ({
          locale: t.locale,
          title: t.title || formData.title,
          content: t.content || mainTranslation.content,
        })),
      }

      const url = articleId
        ? `/api/articles/${articleId}`
        : '/api/articles'

      const response = await fetch(url, {
        method: articleId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Помилка при збереженні статті')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(`/${locale}/admin/articles`)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Невідома помилка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Alerts */}
      {error && (
        <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-green-800">Статтю успішно збережено!</p>
        </div>
      )}

      {/* Main Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Основна інформація</h2>

        <div>
          <Label htmlFor="title">Назва статті *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Введіть назву статті"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="tags">Теги (через кому)</Label>
          <Input
            id="tags"
            value={formData.tags}
            onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
            placeholder="ремонт, телефон, інструкція"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="image">URL основного зображення</Label>
          <Input
            id="image"
            value={formData.featured_image}
            onChange={(e) => setFormData(prev => ({ ...prev, featured_image: e.target.value }))}
            placeholder="https://example.com/image.jpg"
            className="mt-1"
          />
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.featured}
              onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span>Рекомендована статтю</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.published}
              onChange={(e) => setFormData(prev => ({ ...prev, published: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span>Опубліковано</span>
          </label>
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {LANGUAGES.map(lang => (
            <TabsTrigger key={lang.code} value={lang.code}>
              {lang.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {LANGUAGES.map(lang => (
          <TabsContent key={lang.code} value={lang.code} className="space-y-4">
            <div>
              <Label htmlFor={`title-${lang.code}`}>Заголовок ({lang.label}) {lang.code === locale ? '*' : ''}</Label>
              <Input
                id={`title-${lang.code}`}
                value={translations.find(t => t.locale === lang.code)?.title || ''}
                onChange={(e) => handleTranslationChange(lang.code, 'title', e.target.value)}
                placeholder={`Заголовок статті мовою ${lang.label}`}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Вміст ({lang.label}) {lang.code === locale ? '*' : ''}</Label>
              <RichTextEditor
                value={translations.find(t => t.locale === lang.code)?.content || ''}
                onChange={(content) => handleTranslationChange(lang.code, 'content', content)}
                onImageUpload={handleImageUpload}
                placeholder={`Напишіть вміст статті мовою ${lang.label}...`}
              />
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Actions */}
      <div className="flex gap-4 justify-end pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Скасувати
        </Button>
        <Button type="submit" disabled={loading} className="gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {articleId ? 'Оновити' : 'Створити'} статтю
        </Button>
      </div>
    </form>
  )
}
