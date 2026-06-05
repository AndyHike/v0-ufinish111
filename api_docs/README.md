# External Frontend Integration

Цей документ - головна точка входу для розробника зовнішнього вебсайту, який підключається до адмін-панелі. Якщо треба швидко зрозуміти, як отримувати дані, як поводитись зі статусами сайту, що можна рендерити і як працювати з темами, починайте звідси.

Детальні reference-документи залишаються окремо:

- [Public API Docs](../../PUBLIC_API_DOCS.md) - browser/server API для контенту, налаштувань, категорій, товарів, SEO, фільтрів і повідомлень.
- [Internal API Docs](../../INTERNAL_API_DOCS.md) - server-to-server доступ через `SYSTEM_MASTER_KEY` і `domain`.
- [Theme Contract](./theme-contract.md) - як створювати теми так, щоб адмінка могла ними керувати.
- [Frontend Integration Guide](../../FRONTEND_INTEGRATION_GUIDE.md) - rendering pipeline для appearance/layout/preview.

## Integration Modes

Зовнішній frontend може працювати у двох режимах.

| Режим | Коли використовувати | Авторизація |
| :--- | :--- | :--- |
| Browser Public API | Запити напряму з браузера клієнта сайту | `x-public-api-key: pk_...` + allowed origins |
| Server-to-server | SSR, SSG, edge/server routes, власний frontend backend | `Authorization: Bearer <SYSTEM_MASTER_KEY>` + `?domain=...` |

Рекомендований production-підхід для шаблонів сайтів: frontend server робить server-to-server запити з master key, а браузеру віддає вже відрендерений HTML або власні безпечні client endpoints.

## Required Runtime Configuration

Зовнішній frontend-шаблон повинен мати:

- `ADMIN_API_BASE_URL` - base URL адмін-панелі.
- `SYSTEM_MASTER_KEY` - тільки для server-to-server запитів, ніколи не передавати в браузер.
- Поточний `hostname`, який передається в `domain` для domain-based routing.

Для browser-only інтеграції потрібен public API key (`pk_...`) і правильно налаштований `Allowed Origins` у дашборді.

## Recommended Startup Flow

1. Визначити домен поточного сайту.
2. Отримати appearance через internal endpoint:

```http
GET /api/v1/internal/appearance?domain=example.com
Authorization: Bearer <SYSTEM_MASTER_KEY>
```

3. Отримати settings через public API у master-key режимі:

```http
GET /api/public/v1/settings?domain=example.com
Authorization: Bearer <SYSTEM_MASTER_KEY>
```

4. Отримувати секційні дані за потреби:

```http
GET /api/public/v1/categories?domain=example.com
GET /api/public/v1/items?domain=example.com&include=categories
GET /api/public/v1/integrations?domain=example.com
GET /api/public/v1/seo/urls?domain=example.com
GET /api/public/v1/seo/merchant-feed?domain=example.com&locale=cs
GET /api/public/v1/filters?domain=example.com&categorySlug=services
```

Для SEO у list endpoints додавайте `include=seo`, наприклад `GET /api/public/v1/items?domain=example.com&include=categories,seo`. Detail endpoints `GET /api/public/v1/categories/[slug]` і `GET /api/public/v1/items/[slug]` повертають `seo` завжди.

Для sitemap/ISR використовуйте `GET /api/public/v1/seo/urls`: він повертає тільки indexable canonical URLs з `locale`, `type`, `slug`, `updatedAt` і `lastmod`. Для Merchant export використовуйте `GET /api/public/v1/seo/merchant-feed`; `barcode` там не вважається GTIN, тільки явне поле `gtin`.

5. Надсилати контактні форми або заявки на запис через messages endpoint:

```http
POST /api/public/v1/messages?domain=example.com
Authorization: Bearer <SYSTEM_MASTER_KEY>
Content-Type: application/json
```

6. Перед рендером перевірити HTTP status. Якщо API повернув `403`, рендерити спеціальний екран доступності сайту, а не звичайну сторінку.

## Commerce Catalog And Checkout Flow

Для продажів frontend має працювати з `ItemVariant`, а не з базовим `Item`. Базовий item відповідає за контент, SEO, загальну картку і fallback fields. Variant відповідає за SKU, barcode, ціну override, фото override, категорії конкретної моделі, склад, reservations, order lines і POS.

Recommended flow:

1. Load catalog:

```http
GET /api/public/v1/items?domain=example.com&include=categories,variants,availability
Authorization: Bearer <SYSTEM_MASTER_KEY>
```

Для SSG/ISR або сторінок, де потрібно одразу мати meta tags для кожного ресурсу, використовуйте `include=categories,variants,availability,seo`. Для живого каталогу без SEO-рендеру можна залишати коротший include.

2. Render base item cards for broad categories, but use `variants` when a category or model page needs exact options like `iPhone 11`.
3. When the customer selects an option, keep the selected `variantId`. For products/services without visible options, use the default variant returned in `variants[]`.
4. Create a reserved order:

```http
POST /api/public/v1/orders?domain=example.com
Authorization: Bearer <SYSTEM_MASTER_KEY>
Content-Type: application/json
```

```json
{
  "customer": {
    "name": "Client name",
    "email": "client@example.com",
    "phone": "+420777123456"
  },
  "delivery": {
    "provider": "PACKETA",
    "service": "PICKUP_POINT",
    "addressId": "79",
    "point": {
      "name": "Praha 4, Nusle",
      "city": "Praha",
      "country": "cz"
    }
  },
  "currency": "CZK",
  "lines": [
    {
      "variantId": "variant_123",
      "quantity": 1
    }
  ]
}
```

5. Store the returned `publicToken` for this checkout session. The order is `RESERVED`; stock is reserved but not sold yet.
6. Confirm after payment or final customer confirmation:

```http
POST /api/public/v1/orders/order_123/confirm?domain=example.com
Authorization: Bearer <SYSTEM_MASTER_KEY>
Content-Type: application/json
```

```json
{}
```

7. Cancel if checkout is abandoned or payment fails:

```http
POST /api/public/v1/orders/order_123/cancel?domain=example.com
Authorization: Bearer <SYSTEM_MASTER_KEY>
Content-Type: application/json
```

```json
{}
```

Important rules:

- Do not submit `itemId` as an order line. Order lines require `variantId`.
- Do not rely on item-level stock fields; public availability comes from `variants[].availability.availableStock`.
- SEO belongs to the base item/category. List endpoints include it only with `include=seo`; detail endpoints include it by default.
- For canonical links and sitemap XML, prefer `seo.locales[locale].canonicalUrl` or `/api/public/v1/seo/urls`; `canonicalPathHint` is only a compatibility hint.
- Generate frontend JSON-LD from typed public item/category/variant fields or `seo.locales[locale].structuredDataFacts`; do not blindly inject admin-provided arbitrary JSON-LD.
- Load `GET /api/public/v1/integrations` before checkout. If `delivery.packeta.enabled` is true, initialize the Packeta widget with `widgetApiKey`, let the customer choose a pickup point/Z-BOX, and send that selection in the public order `delivery` object.
- Keep Packeta `apiPassword` only in the admin backend. The external frontend receives only widget-safe delivery config.
- If `availableStock` is `null`, that variant is not stock-tracked.
- Reservation expiry is returned as `order.reservationExpiresAt`; the UI should show a checkout timer or re-check availability before confirmation.
- If API returns insufficient stock, inactive variant, invalid token, or expired reservation errors, reload the item with `include=variants,availability` and ask the customer to pick again.
- Packeta delivery selection is sent as `delivery` snapshot metadata; the admin backend can then create a Packeta shipment, download the label, and sync status from the order detail.

## Public Site Availability

Адмінка керує доступністю зовнішнього сайту через `publicSiteMode`, billing state і subscription health. Зовнішній frontend не повинен сам обчислювати ці стани з billing-даних. Він повинен довіряти API response.

| Effective state | Source | Meaning | Frontend behavior |
| :--- | :--- | :--- | :--- |
| `ACTIVE` | none | Сайт доступний | Рендерити звичайний сайт |
| `MAINTENANCE` | manual | Адмін тимчасово поставив сайт на технічне обслуговування | Рендерити maintenance сторінку |
| `TEMPORARILY_CLOSED` | manual | Адмін тимчасово закрив сайт | Рендерити temporarily closed сторінку |
| `SUSPENDED` | billing | Сайт заблокований через оплату, trial expiry або manual billing override | Рендерити suspended/unavailable сторінку |

Блокування через billing має пріоритет над ручним `publicSiteMode`. Якщо магазин suspended через billing, API поверне `mode: "SUSPENDED"` навіть якщо ручний режим був `MAINTENANCE` або `TEMPORARILY_CLOSED`.

## Blocked Response Contract

Коли сайт недоступний, public/internal endpoints повертають `403` з таким JSON:

```json
{
  "success": false,
  "error": "This site is temporarily closed.",
  "code": "SITE_TEMPORARILY_CLOSED",
  "mode": "TEMPORARILY_CLOSED",
  "source": "manual",
  "message": "Ми сьогодні зачинені через ремонт.",
  "until": "2026-05-01T09:00:00.000Z"
}
```

Можливі `code`:

- `STORE_SUSPENDED` - сайт заблокований billing/access state.
- `SITE_MAINTENANCE` - ручний режим технічного обслуговування.
- `SITE_TEMPORARILY_CLOSED` - ручний режим тимчасового закриття.

Можливі `mode`:

- `SUSPENDED`
- `MAINTENANCE`
- `TEMPORARILY_CLOSED`

Можливі `source`:

- `billing`
- `manual`

`message` може бути `null`; тоді frontend повинен показати власний дефолтний текст для `code`. `until` може бути `null`; тоді стан діє без визначеної дати завершення.

## Frontend Error Handling Rules

- `200` - рендерити нормальний сайт.
- `400` - integration/configuration error, зазвичай неправильний або відсутній параметр.
- `401` - неправильний ключ або відсутня авторизація.
- `403` - сайт існує, але зараз недоступний для публіки; показати availability screen.
- `404` - домен або ресурс не знайдено.
- `500` - тимчасова помилка адмінки; показати generic error або fallback.

Frontend не повинен перетворювати `403` у `404`: це різні сценарії. `403` означає, що сайт є, але зараз не має публічного доступу.

## Contact And Appointment Requests

Зовнішній frontend має один стабільний endpoint для форм:

```http
POST /api/public/v1/messages
```

У browser-only режимі використовуйте `x-public-api-key: pk_...` і allowed origins. У SSR/server-to-server режимі використовуйте `Authorization: Bearer <SYSTEM_MASTER_KEY>` разом із `?domain=...`; master key не можна віддавати в браузер.

Підтримуються два типи:

- `general_message` - проста контактна форма.
- `appointment_request` - заявка на запис із послугою та бажаним часом.

Базові правила:

- `name` required.
- хоча б один контакт required: `email` або `phone`.
- `message` optional для всіх типів, frontend не повинен генерувати штучний текст.
- `appointment_request` має мати хоча б `serviceId`, `serviceTitle`, `preferredDate` або `preferredTimeLabel`.
- якщо передаєте `preferredTime`, передайте також `preferredDate` і `timezone`.

Приклад заявки на запис:

```json
{
  "requestType": "appointment_request",
  "name": "Client name",
  "phone": "+420777123456",
  "serviceId": "service_123",
  "serviceTitle": "Manicure",
  "servicePrice": "from 900 Kč",
  "serviceDurationMinutes": 60,
  "preferredDate": "2026-05-12",
  "preferredTime": "14:30",
  "timezone": "Europe/Prague",
  "locale": "uk",
  "source": "services_section",
  "pageUrl": "https://example.com/services"
}
```

Якщо frontend знає `serviceId`, він може передати його для backend validation. При цьому snapshot поля (`serviceTitle`, `servicePrice`, `serviceDurationMinutes`, `categoryTitle`) все одно варто передавати або дозволити API заповнити їх з поточної послуги, бо ціна чи назва можуть змінитися після створення заявки.

### `serviceId` And Snapshot Rules

`serviceId` не є бронюванням і не є єдиним джерелом правди для історії заявки. Він використовується як validation/reference:

- має належати поточному store;
- має бути активною послугою (`type = SERVICE`, `isActive = true`);
- якщо невалідний, API повертає `400` з `code: "INVALID_SERVICE_ID"` і `field: "serviceId"`.

Snapshot fields зберігаються в повідомленні:

- якщо frontend передав `serviceTitle`, `servicePrice`, `serviceDurationMinutes` або `categoryTitle`, API зберігає ці значення;
- якщо snapshot поле відсутнє, але `serviceId` валідний, API заповнює його з поточної послуги;
- API не блокує заявку через mismatch між `serviceId` і snapshot, бо snapshot описує те, що користувач бачив у UI на момент submit.

Structured `400` приклад:

```json
{
  "success": false,
  "error": "Either 'email' or 'phone' is required",
  "code": "MISSING_CONTACT",
  "fields": ["email", "phone"],
  "details": {
    "requiredAny": ["email", "phone"]
  }
}
```

Frontend може використовувати `field` або `fields` для підсвітки конкретних controls, але має залишити fallback на текстове `error`.

## What Frontend Developers Can Add

Frontend-шаблон може додавати:

- нові theme renderers для існуючого `templateKey`;
- нові layout/rendering variants, якщо адмінка вже може передати відповідний `sectionVariants` або `themeData`;
- власні presentation-only компоненти, які читають існуючі API fields;
- contact forms and appointment-request forms, якщо вони відправляють payload за contract вище;
- graceful fallback UI для unavailable/error states;
- preview handling через `postMessage`.

Frontend-шаблон не повинен додавати приховані business states, які адмінка не контролює. Якщо потрібен новий mode, новий theme knob або новий section variant, його треба спочатку додати в admin/API contract.

## Preview Contract

В iframe preview адмінка надсилає:

```json
{
  "type": "UPDATE_APPEARANCE",
  "payload": {
    "templateKey": "beauty-salon",
    "themeKey": "beauty-salon-classic",
    "tokens": {},
    "layout": {},
    "sectionVariants": {},
    "themeData": {}
  }
}
```

Preview renderer повинен використовувати той самий pipeline, що й production renderer:

```text
templateKey -> themeKey -> layout.blocks -> sectionVariants -> themeData -> tokens
```

## Theme Work

Для створення або розширення тем відкрийте [Theme Contract](./theme-contract.md). Там описано, що є стабільним API, що може бути theme-specific, і які умови треба виконати, щоб адмінка могла керувати темою без змін у frontend-коді для кожного клієнта.
