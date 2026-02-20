/**
 * FAQ Placeholder Replacer
 * Заміняє плейсхолдери в FAQ на реальні значення
 */

export interface FaqContext {
  model?: {
    name: string
    slug?: string
  }
  brand?: {
    name: string
    slug?: string
  }
  service?: {
    name: string
    slug?: string
  }
  warranty?: {
    months?: number | null
    period?: string
  }
  duration?: {
    hours?: number | null
  }
  price?: {
    value?: number | null
    formatted?: string
  }
}

/**
 * Список всіх доступних плейсхолдерів для FAQ
 */
export const FAQ_PLACEHOLDERS = [
  {
    key: "model",
    label: "Модель",
    description: "Назва моделі (наприклад: iPhone 11 Pro Max)",
    format: "{{model}}",
  },
  {
    key: "model_slug",
    label: "Модель (URL)",
    description: "Slug моделі (наприклад: iphone-11-pro-max)",
    format: "{{model_slug}}",
  },
  {
    key: "brand",
    label: "Бренд",
    description: "Назва бренду (наприклад: Apple)",
    format: "{{brand}}",
  },
  {
    key: "brand_slug",
    label: "Бренд (URL)",
    description: "Slug бренду (наприклад: apple)",
    format: "{{brand_slug}}",
  },
  {
    key: "service",
    label: "Послуга",
    description: "Назва послуги (наприклад: Screen Replacement)",
    format: "{{service}}",
  },
  {
    key: "service_slug",
    label: "Послуга (URL)",
    description: "Slug послуги (наприклад: screen-replacement)",
    format: "{{service_slug}}",
  },
  {
    key: "warranty_months",
    label: "Гарантія (місяці)",
    description: "Кількість місяців гарантії (наприклад: 6)",
    format: "{{warranty_months}}",
  },
  {
    key: "warranty_period",
    label: "Період гарантії",
    description: "Період гарантії (наприклад: months або days)",
    format: "{{warranty_period}}",
  },
  {
    key: "duration_hours",
    label: "Тривалість (години)",
    description: "Тривалість в годинах (наприклад: 1, 2)",
    format: "{{duration_hours}}",
  },
  {
    key: "price",
    label: "Ціна",
    description: "Ціна послуги (відформатована, наприклад: 990 CZK)",
    format: "{{price}}",
  },
  {
    key: "device",
    label: "Пристрій",
    description: "Повна назва пристрою (наприклад: Apple iPhone 11 Pro Max)",
    format: "{{device}}",
  },
] as const

export type PlaceholderKey = (typeof FAQ_PLACEHOLDERS)[number]["key"]

/**
 * Замінює плейсхолдери в тексті на реальні значення
 */
export function replaceFaqPlaceholders(text: string, context: FaqContext): string {
  let result = text

  // Модель
  if (context.model?.name) {
    result = result.replace(/\{\{model\}\}/g, context.model.name)
  }
  if (context.model?.slug) {
    result = result.replace(/\{\{model_slug\}\}/g, context.model.slug)
  }

  // Бренд
  if (context.brand?.name) {
    result = result.replace(/\{\{brand\}\}/g, context.brand.name)
  }
  if (context.brand?.slug) {
    result = result.replace(/\{\{brand_slug\}\}/g, context.brand.slug)
  }

  // Послуга
  if (context.service?.name) {
    result = result.replace(/\{\{service\}\}/g, context.service.name)
  }
  if (context.service?.slug) {
    result = result.replace(/\{\{service_slug\}\}/g, context.service.slug)
  }

  // Гарантія
  if (context.warranty?.months !== null && context.warranty?.months !== undefined) {
    result = result.replace(/\{\{warranty_months\}\}/g, context.warranty.months.toString())
  }
  if (context.warranty?.period) {
    result = result.replace(/\{\{warranty_period\}\}/g, context.warranty.period)
  }

  // Тривалість
  if (context.duration?.hours !== null && context.duration?.hours !== undefined) {
    result = result.replace(/\{\{duration_hours\}\}/g, context.duration.hours.toString())
  }

  // Ціна
  if (context.price?.formatted) {
    result = result.replace(/\{\{price\}\}/g, context.price.formatted)
  } else if (context.price?.value) {
    result = result.replace(/\{\{price\}\}/g, context.price.value.toString())
  }

  // Пристрій (комбінація бренду та моделі)
  if (context.brand?.name && context.model?.name) {
    result = result.replace(/\{\{device\}\}/g, `${context.brand.name} ${context.model.name}`)
  }

  return result
}

/**
 * Отримує передпопередження texto з інформацією про невикористані плейсхолдери
 */
export function getUnusedPlaceholders(text: string, context: FaqContext): string[] {
  const unused: string[] = []

  FAQ_PLACEHOLDERS.forEach((placeholder) => {
    const regex = new RegExp(`\\{\\{${placeholder.key}\\}\\}`, "g")
    if (regex.test(text)) {
      switch (placeholder.key) {
        case "model":
          if (!context.model?.name) unused.push(placeholder.label)
          break
        case "model_slug":
          if (!context.model?.slug) unused.push(placeholder.label)
          break
        case "brand":
          if (!context.brand?.name) unused.push(placeholder.label)
          break
        case "brand_slug":
          if (!context.brand?.slug) unused.push(placeholder.label)
          break
        case "service":
          if (!context.service?.name) unused.push(placeholder.label)
          break
        case "service_slug":
          if (!context.service?.slug) unused.push(placeholder.label)
          break
        case "warranty_months":
          if (context.warranty?.months === null || context.warranty?.months === undefined) {
            unused.push(placeholder.label)
          }
          break
        case "warranty_period":
          if (!context.warranty?.period) unused.push(placeholder.label)
          break
        case "duration_hours":
          if (context.duration?.hours === null || context.duration?.hours === undefined) {
            unused.push(placeholder.label)
          }
          break
        case "price":
          if (!context.price?.formatted && !context.price?.value) unused.push(placeholder.label)
          break
      }
    }
  })

  return unused
}
