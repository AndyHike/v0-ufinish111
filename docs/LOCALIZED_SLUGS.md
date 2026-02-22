## Система локалізованих URL Slug для статей

### Вступ
Кожна стаття тепер може мати різні URL slug для різних мов, що значно покращує SEO. Наприклад:
- **Чеська**: `/cs/articles/jak-vycistit-konektor`
- **Українська**: `/uk/articles/yak-vychystyty-konektor` 
- **Англійська**: `/en/articles/how-to-clean-connector`

### Установка залежностей
Бібліотека `transliteration` вже додана до `package.json`. Якщо ви встановлюєте проект вперше:

```bash
pnpm install
```

### Як використовувати

#### 1. Автоматичне генерування slug (рекомендується)
При створенні статті система автоматично пропонує локалізований slug на основі заголовку:

```typescript
import { generateSlug } from '@/lib/slug-utils'

// Українська
const ukSlug = generateSlug("Як вичистити конектор", "uk")
// Результат: "yak-vychystyty-konektor"

// Чеська
const csSlug = generateSlug("Jak vyčistit konektor", "cs")
// Результат: "jak-vycistit-konektor"

// Англійська
const enSlug = generateSlug("How to clean connector", "en")
// Результат: "how-to-clean-connector"
```

#### 2. Ручне введення slug
У адмін-панелі користувачі можуть вручну вводити slug:

```typescript
import { ArticleSlugInput } from '@/components/admin/article-slug-input'

<ArticleSlugInput
  title="Як вичистити конектор"
  locale="uk"
  onSlugChange={(slug) => {
    // slug автоматично нормалізується:
    // "Як вичистити конектор" → "yak-vychystyty-konektor"
    // "yak vychystyty konektor" → "yak-vychystyty-konektor"
    console.log(slug)
  }}
/>
```

#### 3. Трансліт
Бібліотека `transliteration` автоматично конвертує:
- **Українські букви** в **латиницю**: 
  - "йаккий" → "yakkyy"
  - "ч" → "ch"
  - "ш" → "sh"
  - "щ" → "sch"

- **Інші символи** нормалізуються:
  - Діакритика видаляється (ě → e)
  - Спеціальні символи видаляються
  - Пробіли замінюються на дефіси

### Функції в `lib/slug-utils.ts`

#### `generateSlug(text: string, locale: string): string`
Генерує SEO-friendly slug з заголовку з підтримкою транслітерації.

**Параметри:**
- `text` - Заголовок для конвертації
- `locale` - Мова (cs, uk, en)

**Приклад:**
```typescript
generateSlug("Як вичистити конектор", "uk")
// → "yak-vychystyty-konektor"
```

#### `normalizeSlug(input: string): string`
Нормалізує вручно введений slug (замінює пробіли на дефіси).

**Приклад:**
```typescript
normalizeSlug("yak vychystyty konektor")
// → "yak-vychystyty-konektor"
```

#### `isValidSlug(slug: string): boolean`
Перевіряє, чи валідний slug.

**Приклад:**
```typescript
isValidSlug("yak-vychystyty-konektor") // → true
isValidSlug("yak_vychystyty_konektor") // → false (містить _)
isValidSlug("123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890") // → false (>100 символів)
```

### Правила для slug

✅ **Дозволено:**
- Буквини (a-z, а-я)
- Цифри (0-9)
- Дефіси (-)
- До 100 символів

❌ **Не дозволено:**
- Пробіли (автоматично замінюються на -)
- Спеціальні символи (!@#$%^&*)
- Підкреслення (_) - замінюються на -
- Більше 100 символів

### Приклади локалізованих slug

| Українська | Чеська | Англійська |
|-----------|--------|-----------|
| yak-vychystyty-konektor | jak-vycistit-konektor | how-to-clean-connector |
| yak-zminyty-ekran | jak-vymenit-displej | how-to-replace-screen |
| yak-vidnovyty-batariu | jak-obnovit-baterii | how-to-restore-battery |

### Fallback логіка

Якщо локалізований slug не знайдений для певної мови, система автоматично повертається до основного slug статті (зберігаючи контент в правильній мові). Це забезпечує безперервну роботу навіть якщо slug не були встановлені для всіх мов.

### Примітки

1. **SEO**: Кожна мова матиме свій унікальний URL, що краще для SEO
2. **Користувацький досвід**: URL буде на правильній мові для користувача
3. **301 редіректи**: Старі URL з query параметрами автоматично редирекуються на нові
4. **Sitemap**: Автоматично генерується з правильними hreflang альтернативами
