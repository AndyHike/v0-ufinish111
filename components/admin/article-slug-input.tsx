'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { generateSlug, normalizeSlug, isValidSlug } from '@/lib/slug-utils'

interface ArticleSlugInputProps {
  title: string
  locale: string
  onSlugChange: (slug: string) => void
  initialSlug?: string
}

export function ArticleSlugInput({
  title,
  locale,
  onSlugChange,
  initialSlug = '',
}: ArticleSlugInputProps) {
  const [slug, setSlug] = useState(initialSlug)
  const [suggestedSlug, setSuggestedSlug] = useState('')
  const [isValid, setIsValid] = useState(true)

  // Генеруємо сроблений slug з заголовку при зміні заголовку
  useEffect(() => {
    if (title && !initialSlug) {
      const suggested = generateSlug(title, locale)
      setSuggestedSlug(suggested)
    }
  }, [title, locale, initialSlug])

  const handleSlugChange = (value: string) => {
    const normalized = normalizeSlug(value)
    setSlug(normalized)
    setIsValid(isValidSlug(normalized))
    onSlugChange(normalized)
  }

  const handleUseSuggested = () => {
    if (suggestedSlug) {
      setSlug(suggestedSlug)
      setIsValid(true)
      onSlugChange(suggestedSlug)
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={`slug-${locale}`}>
        URL Slug ({locale})
      </Label>
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            id={`slug-${locale}`}
            type="text"
            placeholder="e.g., yak-vychystyty-konektor"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            className={!isValid ? 'border-red-500' : ''}
            spellCheck="false"
          />
          {!isValid && (
            <p className="text-xs text-red-500 mt-1">
              Slug може містити тільки букви, цифри та дефіси (до 100 символів)
            </p>
          )}
        </div>
        {suggestedSlug && slug !== suggestedSlug && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUseSuggested}
            title={`Запропонований slug для ${locale}: ${suggestedSlug}`}
          >
            Мов.
          </Button>
        )}
      </div>
      {suggestedSlug && (
        <p className="text-xs text-gray-500">
          <span className="font-medium">Запропонований для {locale}:</span> {suggestedSlug}
        </p>
      )}
      <p className="text-xs text-gray-600">
        Пробіли автоматично замінюються на дефіси (-). Буде использовано як: <code className="bg-gray-100 px-1 rounded">/{locale}/articles/{slug || 'slug'}</code>
      </p>
    </div>
  )
}
