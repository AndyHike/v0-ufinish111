/**
 * Форматує простий текст в структурований HTML з параграфами, заголовками та списками
 * Підтримує наступні синтаксиси:
 * - ### Заголовок 3 рівня (h3)
 * - ## Заголовок 2 рівня (h2)
 * - # Заголовок 1 рівня (h1)
 * - * Пункт списку (ul)
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
      return `<h3 class="text-xl font-bold mt-6 mb-4">${escapeHtml(para.slice(4))}</h3>`
    }
    if (para.startsWith("## ")) {
      return `<h2 class="text-2xl font-bold mt-8 mb-4">${escapeHtml(para.slice(3))}</h2>`
    }
    if (para.startsWith("# ")) {
      return `<h1 class="text-3xl font-bold mt-8 mb-4">${escapeHtml(para.slice(2))}</h1>`
    }

    // Обробляємо списки
    if (para.includes("\n* ")) {
      const items = para.split("\n").filter(line => line.trim().startsWith("* "))
      const listHtml = items.map(item => {
        const text = item.replace(/^\*\s*/, "").trim()
        return `<li class="ml-4">${escapeHtml(text)}</li>`
      }).join("")
      return `<ul class="list-disc space-y-2 my-4">${listHtml}</ul>`
    }

    // Обробляємо звичайні параграфи
    // Додаємо розриви рядків (換رو) для \n всередину параграфу
    const lines = para.split("\n").map(line => {
      if (line.startsWith("* ")) {
        const text = line.replace(/^\*\s*/, "").trim()
        return `• ${escapeHtml(text)}`
      }
      return escapeHtml(line)
    }).join("<br />")

    return `<p class="text-gray-700 leading-relaxed mb-4">${lines}</p>`
  })

  return formattedParagraphs.join("")
}

/**
 * Екранує HTML спеціальні символи для безпеки
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
