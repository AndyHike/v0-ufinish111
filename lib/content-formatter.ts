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
      const text = formatInlineText(para.slice(4))
      return `<h3 class="text-xl font-bold mt-6 mb-4">${text}</h3>`
    }
    if (para.startsWith("## ")) {
      const text = formatInlineText(para.slice(3))
      return `<h2 class="text-2xl font-bold mt-8 mb-4">${text}</h2>`
    }
    if (para.startsWith("# ")) {
      const text = formatInlineText(para.slice(2))
      return `<h1 class="text-3xl font-bold mt-8 mb-4">${text}</h1>`
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
 * Екранує HTML спеціальні символи для безпеки
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
