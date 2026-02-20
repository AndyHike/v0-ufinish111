/**
 * Замінює плейсхолдери в тексті FAQ на реальні значення
 * Доступні плейсхолдери: {{model}}, {{brand}}, {{service}}
 */

interface PlaceholderValues {
  model?: string
  brand?: string
  service?: string
}

export function replaceFaqPlaceholders(text: string, values: PlaceholderValues): string {
  let result = text

  // Замінюємо {{model}} на назву моделі
  if (values.model) {
    result = result.replace(/\{\{model\}\}/g, values.model)
  }

  // Замінюємо {{brand}} на назву бренду
  if (values.brand) {
    result = result.replace(/\{\{brand\}\}/g, values.brand)
  }

  // Замінюємо {{service}} на назву послуги
  if (values.service) {
    result = result.replace(/\{\{service\}\}/g, values.service)
  }

  return result
}

/**
 * Обробляє текст FAQ: замінює плейсхолдери та очищує від зайвих пробілів
 */
export function processFaqText(text: string, values: PlaceholderValues): string {
  return replaceFaqPlaceholders(text, values).trim()
}
