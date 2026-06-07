# Internal API Documentation: Master Key & Domain Routing

Цей документ описує архітектуру внутрішньої взаємодії між Адмін-панеллю та Фронтенд-шаблонами за допомогою **Master Key** та **Domain-based Routing**.

> [!TIP]
> Для повного onboarding зовнішнього frontend-розробника дивіться [External Frontend Integration](docs/external-frontends/README.md). Цей файл описує саме server-to-server режим з `SYSTEM_MASTER_KEY`.

## 1. Принцип Master Key (Системний Ключ)

**Master Key** (`SYSTEM_MASTER_KEY`) — це секретний рядок (токен), який дозволяє фронтенд-сервісам отримувати повний доступ до публічних даних будь-якого магазину в системі без необхідності знати індивідуальні API ключі кожного магазину.

### Безпека:
- Ключ повинен бути ідентичним у змінних оточення (`.env`) як Адмінки, так і Фронтенду.
- Цей ключ **ніколи** не передається в клієнтський браузер. Він використовується лише для запитів **Server-to-Server**.
- Ключ не зберігається в базі даних.

---

## 2. Пошук за доменом (Domain-based Routing)

На відміну від стандартних API, де магазин ідентифікується за `id` або `pk_...` ключем у заголовках, внутрішні ендпоїнти використовують параметр `domain` у URL. Це дозволяє фронтенду автоматично підвантажувати потрібні дані, просто знаючи свій `hostname`.

---

## 3. Ендпоїнт: Appearance (Вигляд сайту)

Отримання конфігурації дизайну (кольори, шрифти, блоки) для конкретного магазину.

### Request
- **Method**: `GET`
- **URL**: `/api/v1/internal/appearance`
- **Headers**:
  - `Authorization: Bearer <SYSTEM_MASTER_KEY>`
- **Query Parameters**:
  - `domain` (required): Домен магазину (наприклад, `barber-pro.cz`)

### Response (Success)
**Status**: `200 OK`
```json
{
  "success": true,
  "data": {
    "templateKey": "beauty-salon",
    "themeKey": "beauty-salon-classic",
    "tokens": {
      "primaryColor": "#db2777",
      "fontFamily": "'Playfair Display', serif",
      "buttonStyle": "pill",
      "heroOverlay": 0.3,
      "heroBackgroundImage": null,
      "logoUrl": null
    },
    "layout": {
      "blocks": ["hero", "services", "photoGallery", "contacts"]
    },
    "sectionVariants": {
      "services": "cards",
      "photoGallery": "masonry"
    },
    "themeData": {}
  }
}
```

### Response (Error)
- **401 Unauthorized**: Master Key відсутній або невірний.
- **400 Bad Request**: Не вказано параметр `domain`.
- **403 Forbidden**: Магазин знайдено, але публічний сайт зараз недоступний через billing або ручний режим.
- **404 Not Found**: Магазин з таким доменом не знайдено.

---

## 4. Доступність сайту для internal endpoints

Internal endpoints також поважають public site availability. Це важливо для SSR/SSG шаблонів: навіть якщо master key валідний, frontend має показати availability screen, якщо адмінка повернула `403`.

Можливі effective modes:

| Mode | Source | Meaning |
| :--- | :--- | :--- |
| `SUSPENDED` | `billing` | Store заблокований через subscription/trial/billing override |
| `MAINTENANCE` | `manual` | Адмін увімкнув режим технічного обслуговування |
| `TEMPORARILY_CLOSED` | `manual` | Адмін тимчасово закрив сайт |

Приклад `403`:

```json
{
  "success": false,
  "error": "This site is temporarily unavailable due to maintenance.",
  "code": "SITE_MAINTENANCE",
  "mode": "MAINTENANCE",
  "source": "manual",
  "message": null,
  "until": null
}
```

Frontend повинен:

- показати окремий unavailable/maintenance/closed screen;
- використати `message`, якщо він є;
- використати `until`, якщо він є;
- не підміняти `403` на `404`.

Повний контракт описаний у [External Frontend Integration](docs/external-frontends/README.md#blocked-response-contract).

---

## 5. Real-time Preview (postMessage)

Адмінка відправляє події в iframe для миттєвого оновлення стилів без перезавантаження сторінки.

### Protocol
- **Event Type**: `message`
- **Structure**:
```json
{
  "type": "UPDATE_APPEARANCE",
  "payload": {
    "templateKey": "beauty-salon",
    "themeKey": "beauty-salon-classic",
    "tokens": {
      "primaryColor": "#hex",
      "fontFamily": "string",
      "buttonStyle": "pill | square | soft",
      "heroBackgroundImage": "string | url | null",
      "heroOverlay": 0.4,
      "logoUrl": "string | url | null"
    },
    "layout": {
      "blocks": ["hero", "services", "photoGallery", "contacts"]
    },
    "sectionVariants": {
      "services": "list | grid | cards | compact",
      "photoGallery": "grid | masonry | carousel"
    },
    "themeData": {}
  }
}
```

### Приклад обробки на фронтенді (шаблон):
```javascript
window.addEventListener('message', (event) => {
  if (event.data?.type === 'UPDATE_APPEARANCE') {
    const appearance = event.data.payload;
    document.documentElement.style.setProperty('--primary-color', appearance.tokens.primaryColor);
    // Далі використовуйте той самий pipeline, що і для production rendering:
    // themeKey -> theme renderer
    // layout.blocks -> порядок секцій
    // sectionVariants -> renderer секції
    // themeData -> theme-specific налаштування
  }
});
```

---

## 6. Використання в інших Public API

Завдяки оновленню утиліти `getPublicStore`, ви можете використовувати цей же принцип (Master Key + domain) для будь-яких публічних ендпоїнтів.

**Наприклад, отримання товарів:**
`GET /api/public/v1/items?domain=my-store.com`
`Authorization: Bearer <SYSTEM_MASTER_KEY>`

**Category tree context для товарів:**
`GET /api/public/v1/items?domain=my-store.com&include=categories`

**Commerce catalog with variants and availability:**
```http
GET /api/public/v1/items?domain=my-store.com&include=categories,variants,availability
Authorization: Bearer <SYSTEM_MASTER_KEY>
```

```http
GET /api/public/v1/items/protective-glass-iphone-11?domain=my-store.com&include=variants,availability
Authorization: Bearer <SYSTEM_MASTER_KEY>
```

The item detail slug may be `Item.slug` or an active purchasable `ItemVariant.slugOverride`. When a variant slug is used, the response includes `selectedVariantId`. Frontend server code should sell only `ItemVariant.id`; SKU and barcode also live only on `ItemVariant`.

**Create a reserved online order from a frontend server route:**
```http
POST /api/public/v1/orders?domain=my-store.com
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
  "shippingAddress": {
    "country": "CZ",
    "city": "Praha"
  },
  "delivery": {
    "provider": "PACKETA",
    "pickupPointId": "12345"
  },
  "currency": "CZK",
  "lines": [
    {
      "variantId": "variant_123",
      "quantity": 1,
      "locationId": null
    }
  ]
}
```

The response contains `data.order` and `data.publicToken`. Keep `publicToken` server-side or in a secure checkout session; it authorizes public confirm/cancel calls for that exact order.

**Confirm or cancel from server without public token:**
```http
POST /api/public/v1/orders/order_123/confirm?domain=my-store.com
Authorization: Bearer <SYSTEM_MASTER_KEY>
Content-Type: application/json
```

```json
{}
```

```http
POST /api/public/v1/orders/order_123/cancel?domain=my-store.com
Authorization: Bearer <SYSTEM_MASTER_KEY>
Content-Type: application/json
```

```json
{}
```

Order side effects:

- create order: creates/reuses a store-scoped customer, stores snapshots, creates reservations, and increases `InventoryLevel.reserved`;
- confirm order: consumes reservations, decreases `InventoryLevel.onHand`, and creates `SALE` stock movements;
- cancel order: releases reservations and decreases `InventoryLevel.reserved`;
- delivery metadata such as `provider: "PACKETA"` is stored as a snapshot; Packeta API calls are outside this endpoint.

**Надсилання повідомлення або заявки на запис з frontend server route:**
```http
POST /api/public/v1/messages?domain=my-store.com
Authorization: Bearer <SYSTEM_MASTER_KEY>
Content-Type: application/json
```

```json
{
  "requestType": "appointment_request",
  "name": "Client name",
  "phone": "+420777123456",
  "serviceId": "service_123",
  "serviceTitle": "Manicure",
  "servicePrice": "from 900 Kč",
  "preferredDate": "2026-05-12",
  "preferredTime": "14:30",
  "timezone": "Europe/Prague",
  "source": "services_section"
}
```

У цьому режимі `domain` визначає store, а `SYSTEM_MASTER_KEY` лишається тільки на сервері frontend-шаблону. `message` не є обов'язковим; обов'язкові `name` і хоча б один контакт (`email` або `phone`).

Правила `serviceId`/snapshot:

- `serviceId` validation: активний `Item` поточного store з `type = SERVICE`.
- Якщо `serviceId` не пройшов validation, API повертає `400` з `code: "INVALID_SERVICE_ID"`.
- Snapshot поля зберігаються в повідомленні як історичний зріз того, що клієнт бачив у UI.
- Передані frontend snapshot поля мають пріоритет над поточними даними послуги.
- Якщо snapshot поле не передане, але `serviceId` валідний, API заповнює його з поточної послуги.
- API не робить mismatch rejection між `serviceId` і snapshot, бо ціна/назва могли змінитися між рендером сторінки і створенням заявки.

Validation errors для `/messages` мають structured `400` формат:

```json
{
  "success": false,
  "error": "'serviceId' must reference an active service in this store",
  "code": "INVALID_SERVICE_ID",
  "field": "serviceId",
  "details": {
    "requiredType": "SERVICE",
    "requiredState": "active",
    "scope": "current_store"
  }
}
```

Це забезпечує повну автономність фронтенд-шаблонів. Ці public endpoints у master-key режимі також повертають той самий `403` availability contract, якщо сайт зараз призупинений або тимчасово вимкнений.

---

## 7. On-Demand Revalidation (admin → storefront)

Окрім читання даних, адмінка може **активно повідомляти** сторфронт про зміну контенту, щоб той скинув кеш. Це вихідний вебхук у зворотному напрямку (`admin → storefront`):

```http
POST https://example.com/api/revalidate
Content-Type: application/json
```

```json
{
  "token": "<frontendRevalidateSecret магазину або SYSTEM_MASTER_KEY>",
  "domain": "example.com",
  "event": { "siteId": "store_123", "changeType": "item.updated", "collection": "smartphones", "itemSlug": "iphone-11" },
  "tags": ["site:store_123:collection:smartphones", "site:store_123:view:home"]
}
```

Авторизація — той самий принцип, що й Master Key, але з **per-store override**: якщо для магазину згенеровано `frontendRevalidateSecret` (у Developers), `token` дорівнює саме йому, інакше — глобальному `SYSTEM_MASTER_KEY`. Шлях також налаштовується per-store (`frontendRevalidatePath`), з fallback на `FRONTEND_REVALIDATE_PATH` → `/api/revalidate`.

Сторфронт повинен звірити `token`, пройтись по `tags` і викликати `revalidateTag()`. Повний контракт, перелік типів змін, формат тегів і приклад endpoint — [Frontend Revalidation](docs/external-frontends/revalidation.md).
