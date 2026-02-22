/**
 * Форматує простий текст в структурований HTML з параграфами, заголовками та списками
 * Підтримує наступні синтаксиси:
 * - ### Заголовок 3 рівня (h3)
 * - ## Заголовок 2 рівня (h2)
 * - # Заголовок 1 рівня (h1)
 * - * Пункт списку (ul)
 * - **жирний текст** (bold)
 * - Порожні рядки розділяють параграфи
 */
export function formatContent(content: string): string {
  if (!content) return ""

  // Видаляємо порожні рядки на початку та кінці
  let html = content.trim()

  // Розділяємо на параграфи за допомогою подвійних новорядків
  const paragraphs = html.split(/\n\n+/).filter(p => p.trim())

  const formattedParagraphs = paragraphs.map(para => {
    para = para.trim()

    // Обробляємо заголовки
    if (para.startsWith("### ")) {
      const text = para.slice(4).trim()
      const formattedText = formatInlineText(text)
      const id = generateId(text)
      return `<h3 id="${id}" class="text-xl font-bold mt-6 mb-4 scroll-mt-32">${formattedText}</h3>`
    }
    if (para.startsWith("## ")) {
      const text = para.slice(3).trim()
      const formattedText = formatInlineText(text)
      const id = generateId(text)
      return `<h2 id="${id}" class="text-2xl font-bold mt-8 mb-4 scroll-mt-32">${formattedText}</h2>`
    }
    if (para.startsWith("# ")) {
      const text = para.slice(2).trim()
      const formattedText = formatInlineText(text)
      const id = generateId(text)
      return `<h1 id="${id}" class="text-3xl font-bold mt-8 mb-4 scroll-mt-32">${formattedText}</h1>`
    }

    // Обробляємо списки
    if (para.includes("\n* ")) {
      const items = para.split("\n").filter(line => line.trim().startsWith("* "))
      const listHtml = items.map(item => {
        const text = item.replace(/^\*\s*/, "").trim()
        const formattedText = formatInlineText(text)
        return `<li class="ml-4">${formattedText}</li>`
      }).join("")
      return `<ul class="list-disc space-y-2 my-4">${listHtml}</ul>`
    }

    // Обробляємо звичайні параграфи
    // Додаємо розриви рядків для \n всередину параграфу
    const lines = para.split("\n").map(line => {
      if (line.startsWith("* ")) {
        const text = line.replace(/^\*\s*/, "").trim()
        const formattedText = formatInlineText(text)
        return `• ${formattedText}`
      }
      return formatInlineText(line)
    }).join("<br />")

    return `<p class="text-gray-700 leading-relaxed mb-4">${lines}</p>`
  })

  return formattedParagraphs.join("")
}

/**
 * Форматує інлайн текст з підтримкою жирного шрифту **текст**
 */
function formatInlineText(text: string): string {
  // Екрануємо HTML спеціальні символи спочатку
  const escaped = escapeHtml(text)
  
  // Замінюємо **текст** на <strong>текст</strong>
  return escaped.replace(/\*\*([^\*]+)\*\*/g, '<strong class="font-bold">$1</strong>')
}

/**
 * Екранює HTML спеціальні символи для безпеки
 */
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, (char) => map[char])
}

/**
 * Генерує ID з тексту заголовку для якорів
 */
export function generateId(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Інтерфейс для елементів Table of Contents
 */
export interface TableOfContentsItem {
  id: string
  title: string
  level: number
}

/**
 * Генерує Table of Contents з контенту
 */
export function generateTableOfContents(content: string): TableOfContentsItem[] {
  if (!content) return []

  const items: TableOfContentsItem[] = []
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim())

  paragraphs.forEach(para => {
    para = para.trim()

    // Шукаємо заголовки
    if (para.startsWith('### ')) {
      const title = para.slice(4).trim()
      items.push({
        id: generateId(title),
        title,
        level: 3,
      })
    } else if (para.startsWith('## ')) {
      const title = para.slice(3).trim()
      items.push({
        id: generateId(title),
        title,
        level: 2,
      })
    } else if (para.startsWith('# ')) {
      const title = para.slice(2).trim()
      items.push({
        id: generateId(title),
        title,
        level: 1,
      })
    }
  })

  return items
}
