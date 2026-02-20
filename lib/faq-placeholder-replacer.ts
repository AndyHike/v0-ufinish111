/**
 * Замінює плейсхолдери в тексті FAQ на реальні значення
 * Доступні плейсхолдери: {{model}}, {{brand}}, {{service}}, {{category}}, {{line}}, {{warranty}}, {{price}}, {{duration}}
 */

interface PlaceholderValues {
  model?: string
  brand?: string
  service?: string
  category?: string
  line?: string
  warranty?: string
  price?: string
  duration?: string
  fullModel?: string
  productType?: string
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

  // Замінюємо {{category}} на категорію пристрою
  if (values.category) {
    result = result.replace(/\{\{category\}\}/g, values.category)
  }

  // Замінюємо {{line}} на лінію продукту
  if (values.line) {
    result = result.replace(/\{\{line\}\}/g, values.line)
  }

  // Замінюємо {{warranty}} на гарантійний період
  if (values.warranty) {
    result = result.replace(/\{\{warranty\}\}/g, values.warranty)
  }

  // Замінюємо {{price}} на ціну послуги
  if (values.price) {
    result = result.replace(/\{\{price\}\}/g, values.price)
  }

  // Замінюємо {{duration}} на час виконання
  if (values.duration) {
    result = result.replace(/\{\{duration\}\}/g, values.duration)
  }

  // Замінюємо {{fullModel}} на повну назву (бренд + модель)
  if (values.fullModel) {
    result = result.replace(/\{\{fullModel\}\}/g, values.fullModel)
  }

  // Замінюємо {{productType}} на тип пристрою
  if (values.productType) {
    result = result.replace(/\{\{productType\}\}/g, values.productType)
  }

  return result
}

/**
 * Обробляє текст FAQ: замінює плейсхолдери та очищує від зайвих пробілів
 */
export function processFaqText(text: string, values: PlaceholderValues): string {
  return replaceFaqPlaceholders(text, values).trim()
}
