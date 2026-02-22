import { createClient } from "@supabase/supabase-js"

// Простий скрипт для генерації локалізованих slug для статей
// Запустити: node scripts/generate-article-slugs.js

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Функція для транслітерації українських Cyrillic символів до Latin
function transliterateUkrainian(text) {
  const cyrillicToLatin = {
    а: "a",
    б: "b",
    в: "v",
    г: "h",
    ґ: "g",
    д: "d",
    е: "e",
    є: "ye",
    ж: "zh",
    з: "z",
    и: "y",
    і: "i",
    ї: "yi",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "kh",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "shch",
    ь: "",
    ю: "yu",
    я: "ya",
    А: "A",
    Б: "B",
    В: "V",
    Г: "H",
    Ґ: "G",
    Д: "D",
    Е: "E",
    Є: "YE",
    Ж: "ZH",
    З: "Z",
    И: "Y",
    І: "I",
    Ї: "YI",
    Й: "Y",
    К: "K",
    Л: "L",
    М: "M",
    Н: "N",
    О: "O",
    П: "P",
    Р: "R",
    С: "S",
    Т: "T",
    У: "U",
    Ф: "F",
    Х: "KH",
    Ц: "TS",
    Ч: "CH",
    Ш: "SH",
    Щ: "SHCH",
    Ь: "",
    Ю: "YU",
    Я: "YA",
  }

  let result = ""
  for (const char of text) {
    result += cyrillicToLatin[char] || char
  }
  return result
}

// Функція для генерації slug з заголовку
function generateSlug(title, locale) {
  let slug = title

  // Применити транслітерацію для українського
  if (locale === "uk") {
    slug = transliterateUkrainian(slug)
  }

  // Перетворити на нижній регістр
  slug = slug.toLowerCase()

  // Видалити наголоси для чеської та англійської
  if (locale === "cs" || locale === "en") {
    slug = slug.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  }

  // Замінити не-буквено-цифрові символи на дефіси
  slug = slug.replace(/[^a-z0-9]+/g, "-")

  // Видалити розпочаткові/кінцеві дефіси
  slug = slug.replace(/^-+|-+$/g, "")

  // Замінити кілька послідовних дефісів одним дефісом
  slug = slug.replace(/-+/g, "-")

  return slug
}

async function generateArticleSlugs() {
  console.log("Починаємо генерацію локалізованих article slug...")

  try {
    // Отримати всі переклади статей
    const { data: translations, error: fetchError } = await supabase
      .from("article_translations")
      .select("id, article_id, locale, title, slug")
      .not("title", "is", null)

    if (fetchError) {
      throw new Error(`Error fetching translations: ${fetchError.message}`)
    }

    console.log(`Знайдено ${translations?.length || 0} переводів статей для обробки`)

    if (!translations || translations.length === 0) {
      console.log("Не знайдено переводів")
      return
    }

    // Генерувати slug та оновити
    const updates = []

    translations.forEach((translation) => {
      const newSlug = generateSlug(translation.title, translation.locale)
      if (newSlug !== translation.slug) {
        updates.push({
          id: translation.id,
          slug: newSlug,
          old_slug: translation.slug,
        })
      }
    })

    console.log(`\nЗнайдено ${updates.length} переводів, які потребують оновлення slug:`)
    updates.forEach((update) => {
      console.log(`  ${update.old_slug} → ${update.slug}`)
    })

    if (updates.length === 0) {
      console.log("Оновлень не потрібно")
      return
    }

    // Оновити в партіях
    const chunkSize = 10
    for (let i = 0; i < updates.length; i += chunkSize) {
      const chunk = updates.slice(i, i + chunkSize)

      for (const update of chunk) {
        const { error: updateError } = await supabase
          .from("article_translations")
          .update({ slug: update.slug })
          .eq("id", update.id)

        if (updateError) {
          console.error(`Error updating translation ${update.id}: ${updateError.message}`)
        } else {
          console.log(`✓ Оновлено ${update.id}: ${update.old_slug} → ${update.slug}`)
        }
      }
    }

    console.log("\nГенерація slug завершена!")
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

generateArticleSlugs()
