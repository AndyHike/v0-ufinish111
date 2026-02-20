export const FAQ_PLACEHOLDERS = [
  {
    key: "model",
    format: "{{model}}",
    label: "Модель",
    description: "Назва моделі пристрою (напр: iPhone 11 Pro Max)",
  },
  {
    key: "brand",
    format: "{{brand}}",
    label: "Бренд",
    description: "Назва бренду (напр: Apple)",
  },
  {
    key: "service",
    format: "{{service}}",
    label: "Послуга",
    description: "Назва послуги (напр: Заміна екрану)",
  },
  {
    key: "warranty_months",
    format: "{{warranty_months}}",
    label: "Гарантія (місяці)",
    description: "Кількість місяців гарантії",
  },
  {
    key: "warranty_period",
    format: "{{warranty_period}}",
    label: "Період гарантії",
    description: "Період гарантії в текстовому форматі",
  },
  {
    key: "duration_hours",
    format: "{{duration_hours}}",
    label: "Час виконання",
    description: "Кількість годин для виконання",
  },
  {
    key: "device",
    format: "{{device}}",
    label: "Пристрій (повне ім'я)",
    description: "Повна назва пристрою (бренд + модель)",
  },
  {
    key: "price",
    format: "{{price}}",
    label: "Ціна",
    description: "Вартість послуги",
  },
]

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
    months: number | null
    period: string | null
  }
  duration?: {
    hours: number | undefined
  }
  price?: {
    value: number | undefined
    formatted: string | undefined
  }
}

export function replaceFaqPlaceholders(text: string, context: FaqContext): string {
  let result = text

  // Model
  if (context.model?.name) {
    result = result.replace(/{{model}}/g, context.model.name)
  }

  // Brand
  if (context.brand?.name) {
    result = result.replace(/{{brand}}/g, context.brand.name)
  }

  // Service
  if (context.service?.name) {
    result = result.replace(/{{service}}/g, context.service.name)
  }

  // Warranty months
  if (context.warranty?.months) {
    result = result.replace(/{{warranty_months}}/g, String(context.warranty.months))
  }

  // Warranty period
  if (context.warranty?.period) {
    result = result.replace(/{{warranty_period}}/g, context.warranty.period)
  }

  // Duration hours
  if (context.duration?.hours !== undefined) {
    const hours = context.duration.hours
    const hourText =
      hours === 1 ? "годину" : hours >= 2 && hours <= 4 ? "години" : "годин"
    result = result.replace(/{{duration_hours}}/g, `${hours} ${hourText}`)
  }

  // Device (brand + model)
  if (context.brand?.name && context.model?.name) {
    result = result.replace(/{{device}}/g, `${context.brand.name} ${context.model.name}`)
  }

  // Price
  if (context.price?.formatted) {
    result = result.replace(/{{price}}/g, context.price.formatted)
  }

  return result
}
