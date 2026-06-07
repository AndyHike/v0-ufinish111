# Public API Documentation

Цей документ описує зовнішні (публічні) API ендпоінти, доступні для інтеграції з вашим магазином, способи авторизації (**Public Key**, **Secret Key**, **Master Key + domain**), кеш-теги для on-demand ревалідації, SEO, замовлення та форми.

> [!TIP]
> Якщо ви підключаєте новий зовнішній сайт і хочете побачити повну картину інтеграції, почніть з [External Frontend Integration](docs/external-frontends/README.md). Цей файл залишається детальним reference для Public API.

---

## Авторизація 🔐

Public API підтримує **три способи авторизації**. Кожен запит має використати рівно один із них; усі вони визначають, до якого магазину належить запит, і всі поважають site availability / billing (можуть повернути `403`). Ключі й секрети беруться з розділу **Developers** в адмінці.

| Спосіб | Заголовок | Як визначається магазин | Origin-перевірка | Де використовувати |
| :--- | :--- | :--- | :--- | :--- |
| **Public Key** | `x-public-api-key: pk_v1_...` | за самим ключем | **Так** (Allowed Origins) | браузер (клієнтський JS) |
| **Secret Key** | `x-public-api-key: sk_v1_...` | за самим ключем | Ні | сервер (server-to-server) |
| **Master Key + domain** | `Authorization: Bearer <SYSTEM_MASTER_KEY>` | за доменом (див. нижче) | Ні | SSR/SSG будь-якого магазину |

Деталі реалізації — [`src/lib/get-public-store.ts`](src/lib/get-public-store.ts).

### 1. Public Key (`pk_v1_...`)

Для запитів напряму з браузера клієнтського сайту.

```http
GET /api/public/v1/items
x-public-api-key: pk_v1_...
Origin: https://yourdomain.com
```

- Магазин визначається за ключем; передавати `domain` не потрібно.
- Запит дозволено **лише** з доменів зі списку **Allowed Origins** (Developers), плюс власний домен магазину за замовчуванням.
- Якщо `Origin` не збігається з дозволеним — `401` з `CORS Error...`.

### 2. Secret Key (`sk_v1_...`)

Для серверних запитів вашого backend-у до конкретного магазину.

```http
GET /api/public/v1/items
x-public-api-key: sk_v1_...
```

- Магазин визначається за ключем; origin не перевіряється.
- **Ніколи** не передавайте `sk_` у браузер — він дає server-side доступ до публічних даних магазину.

### 3. Master Key + domain (server-to-server, multi-tenant)

Системний ключ `SYSTEM_MASTER_KEY` дає доступ до публічних даних **будь-якого** магазину без знання його індивідуальних ключів. Магазин визначається доменом. Це рекомендований режим для зовнішніх SSR/SSG шаблонів.

```http
GET /api/public/v1/items?domain=example.com
Authorization: Bearer <SYSTEM_MASTER_KEY>
```

Домен резолвиться з першого знайденого джерела (у такому порядку):

1. query `?domain=example.com`
2. header `x-store-domain: example.com`
3. header `Origin`
4. header `Referer`

- `SYSTEM_MASTER_KEY` має бути однаковим у env адмінки і env вашого frontend-сервера; **ніколи** не передається в браузер і не зберігається в БД.
- Якщо Bearer переданий, але домен не знайдено — `404` (`STORE_NOT_FOUND`); якщо ключ невірний — `401`.

> [!WARNING]
> Public Key (`pk_`) — єдиний, що можна використовувати в браузері. `sk_` і `SYSTEM_MASTER_KEY` — тільки серверні.

### Дозволені домени (Allowed Origins)

При використанні **Public Key** запит дозволено лише з доменів, указаних у полі **Allowed Origins** (Developers).
- Формат: `https://yourdomain.com, http://localhost:3000` (з протоколом, через кому).
- Якщо список порожній, дозволено лише власний домен магазину.
- `sk_` і Bearer master key ігнорують origin-обмеження, але **не** обходять site availability/billing-блокування.

### Як отримати `storeId`

Усі відповіді містять `storeId` (або `data.storeId`). Він знадобиться для побудови cache-тегів (див. нижче). Окремо запитувати його не треба — беріть із будь-якої успішної відповіді.

> [!IMPORTANT]
> Використовуйте версіоновані ендпоінти (`/api/public/v1/...`). Старі адреси без `v1` працюють як аліаси для поточної версії з тим самим контрактом.

---

## Доступність сайту та статуси

Усі Public API endpoints перевіряють доступність магазину перед поверненням даних. Це означає, що зовнішній сайт може отримати `403 Forbidden`, навіть якщо ключ валідний і домен існує.

Адмінка підтримує такі ефективні стани публічного сайту:

| Стан | Джерело | Що означає |
| :--- | :--- | :--- |
| `ACTIVE` | none | Сайт доступний, API повертає звичайні `200`/`201` відповіді |
| `MAINTENANCE` | `manual` | Адмін тимчасово поставив сайт на технічне обслуговування |
| `TEMPORARILY_CLOSED` | `manual` | Адмін тимчасово закрив сайт |
| `SUSPENDED` | `billing` | Сайт призупинений через підписку, trial expiry або billing override |

Billing-блокування має пріоритет над ручним режимом. Якщо магазин призупинений через billing, API поверне `mode: "SUSPENDED"` незалежно від того, який `publicSiteMode` вибраний вручну.

### Формат `403 Forbidden`

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

- `STORE_SUSPENDED` - магазин зараз недоступний через billing/access state.
- `SITE_MAINTENANCE` - сайт у ручному режимі технічного обслуговування.
- `SITE_TEMPORARILY_CLOSED` - сайт у ручному режимі тимчасового закриття.

Можливі `mode`:

- `SUSPENDED`
- `MAINTENANCE`
- `TEMPORARILY_CLOSED`

Можливі `source`:

- `billing`
- `manual`

`message` може бути `null`; у такому випадку frontend повинен показати власний дефолтний текст для `code`. `until` може бути `null`; у такому випадку стан діє без визначеної дати завершення.

Frontend не повинен трактувати `403` як `404`: сайт існує, але зараз не має публічного доступу.

---

## Кеш-теги та on-demand ревалідація 🏷️

Адмінка може **активно повідомляти** ваш сторфронт про зміну контенту через вихідний вебхук, щоб ви скинули кеш точково, а не за TTL. Повний опис механізму (контракт вебхука, налаштування шляху/секрету per-store) — [Frontend Revalidation](docs/external-frontends/revalidation.md). Тут — як підготувати ваші читання Public API, щоб ревалідація працювала.

**Ідея:** позначайте кожен fetch до Public API **cache-тегами**; коли в адмінці змінюється відповідний контент, вебхук надсилає ті самі теги, і ваш `/api/revalidate` викликає `revalidateTag()` для них.

Усі теги мають префікс `site:{storeId}:...`, де `storeId` берете з будь-якої відповіді API. Формати тегів і повний мапінг `changeType → теги` — у [revalidation.md, §4](docs/external-frontends/revalidation.md#4-типи-змін-і-теги-що-скидаються).

### Які теги вішати на який endpoint

| Endpoint (читання) | Рекомендовані cache-теги | Скидається при зміні |
| :--- | :--- | :--- |
| `GET /settings` | `site:{id}:settings`, `site:{id}:appearance` | налаштування, вигляд |
| `GET /api/v1/internal/appearance` | `site:{id}:appearance` | вигляд |
| `GET /categories` (список) | `site:{id}:view:home` | категорії (create/update/delete) |
| `GET /categories/[slug]` | `site:{id}:collection:{slug}`, `site:{id}:view:{slug}` | ця категорія |
| `GET /items` (головна/усі) | `site:{id}:view:home` | будь-який товар/категорія |
| `GET /items?categorySlug={key}` | `site:{id}:collection:{key}`, `site:{id}:view:list:{key}` | товари/категорія цієї колекції |
| `GET /items/[slug]` (деталь) | `site:{id}:item:{collectionKey}:{slug}`, `site:{id}:view:detail:{collectionKey}:{slug}` | цей товар, його фото/посилання/варіанти |
| `GET /items?include=availability` | `site:{id}:availability` | склад/залишки (inventory) |
| `GET /filters?categorySlug=...` | `site:{id}:filters` | атрибути/фільтри |
| медіа-ресурси | `site:{id}:media` (+ `site:{id}:media:{mediaId}`) | медіа |

> [!NOTE]
> `collectionKey` для товару — це slug його основної категорії (та сама, що в `categorySlug`). На сторінці деталі товару беріть `collectionKey` з `categories[].slug` (через `include=categories`).

### Приклад (Next.js App Router сторфронт)

```ts
// читання каталогу з тегами
const res = await fetch(
  `${ADMIN_API_BASE_URL}/api/public/v1/items?domain=${domain}&categorySlug=${key}&include=availability`,
  {
    headers: { Authorization: `Bearer ${process.env.SYSTEM_MASTER_KEY}` },
    next: { tags: [
      `site:${storeId}:collection:${key}`,
      `site:${storeId}:view:list:${key}`,
      `site:${storeId}:availability`,
    ] },
  },
);
```

```ts
// ваш endpoint, який приймає вебхук ревалідації від адмінки
// app/api/revalidate/route.ts
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.token || body.token !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  for (const tag of body.tags ?? []) revalidateTag(tag);
  return NextResponse.json({ ok: true });
}
```

`REVALIDATE_SECRET` на сторфронті має дорівнювати per-store секрету ревалідації магазину (Developers → Frontend Revalidation), або `SYSTEM_MASTER_KEY`, якщо окремий секрет не заданий.

---

## SEO у публічних відповідях

SEO-дані доступні для публічних категорій і товарів.

List endpoints повертають поле `seo` тільки якщо явно передати `include=seo`:

```http
GET /api/public/v1/categories?include=seo
GET /api/public/v1/items?include=categories,variants,availability,seo
```

Detail endpoints завжди повертають `seo`, навіть без `include=seo`:

```http
GET /api/public/v1/categories/[slug]
GET /api/public/v1/items/[slug]
```

Застарілі aliases (`/api/public/categories`, `/api/public/items` і slug routes) мають такий самий контракт.

Якщо для ресурсу не задано ручний SEO entry, API повертає згенерований fallback із полів категорії або товару. У list endpoints без `include=seo` поле `seo` відсутнє повністю, а не повертається як `null`.

Базова форма SEO object:

```json
{
  "seo": {
    "profile": "PRODUCT_DETAIL",
    "schemaType": "Product",
    "indexable": true,
    "robots": "index,follow",
    "canonicalPathHint": "/items/macbook-pro",
    "canonicalUrl": "https://shop.devicehelp.cz/uk/product/macbook-pro",
    "locales": {
      "uk": {
        "metaTitle": "MacBook Pro",
        "metaDescription": "Опис...",
        "ogTitle": "MacBook Pro",
        "ogDescription": "Опис...",
        "ogImage": "https://pub-...r2.dev/uploads/...",
        "canonicalUrl": "https://shop.devicehelp.cz/uk/product/macbook-pro",
        "robots": "index,follow",
        "indexable": true,
        "structuredDataFacts": {
          "kind": "product",
          "schemaType": "Product",
          "canonicalUrl": "https://shop.devicehelp.cz/uk/product/macbook-pro"
        },
        "structuredData": {},
        "warnings": []
      }
    }
  }
}
```

### Dedicated SEO endpoints

Для sitemap/SSG краще використовувати окремий endpoint, а не збирати URL-и через повні catalog responses:

```http
GET /api/public/v1/seo/urls
GET /api/public/v1/seo/urls?locale=cs
GET /api/public/v1/seo/urls?type=variant
```

Response повертає тільки indexable URLs:

```json
{
  "success": true,
  "data": [
    {
      "type": "item",
      "id": "item_123",
      "slug": "macbook-pro",
      "locale": "cs",
      "canonicalUrl": "https://shop.devicehelp.cz/cs/product/macbook-pro",
      "updatedAt": "2026-06-05T12:00:00.000Z",
      "lastmod": "2026-06-05T12:00:00.000Z",
      "indexable": true
    }
  ],
  "metadata": {
    "total": 1,
    "locales": ["cs"]
  }
}
```

Response schema:

```ts
type SeoUrlRecord = {
  type: "item" | "category" | "variant";
  id: string;
  itemId?: string;
  variantId?: string;
  slug: string;
  locale: string;
  canonicalUrl: string;
  updatedAt: string | null;
  lastmod: string | null;
  indexable: true;
};

type SeoUrlsResponse = {
  success: true;
  data: SeoUrlRecord[];
  metadata: {
    total: number;
    locales: string[];
  };
};
```

`canonicalUrl` будується backend-ом з primary custom domain/system domain і store SEO route templates. `canonicalPathHint` лишається compatibility hint; для `<link rel="canonical">` і sitemap використовуйте `canonicalUrl`.

Для Google Merchant-compatible JSON feed:

```http
GET /api/public/v1/seo/merchant-feed
GET /api/public/v1/seo/merchant-feed?locale=cs
```

Feed rows включають `id`, `item_group_id`, `title`, `description`, `link`, `image_link`, `additional_image_link`, `availability`, `price`, `sale_price`, `condition`, `brand`, `gtin`, `mpn`, `sku`, `google_product_category`. `barcode` не мапиться в `gtin`; GTIN передається тільки з явного variant/item `gtin`.

Canonical usage rule: use `seo.locales[locale].canonicalUrl` for the page being rendered. `seo.canonicalUrl` is a default-locale compatibility shortcut. For sitemap generation, prefer `/api/public/v1/seo/urls`. `canonicalPathHint` is only a compatibility hint.

Response example:

```json
{
  "success": true,
  "data": [
    {
      "id": "variant-14",
      "item_group_id": "item-1",
      "title": "MacBook Pro - 14 inch",
      "description": "Notebook pro narocnou praci",
      "link": "https://shop.devicehelp.cz/cs/product/macbook-pro/macbook-pro-14",
      "image_link": "https://cdn.example/main.jpg",
      "additional_image_link": ["https://cdn.example/side.jpg"],
      "availability": "in_stock",
      "price": "32000.00 CZK",
      "sale_price": "29900.00 CZK",
      "condition": "new",
      "brand": "Apple",
      "gtin": "00012345678905",
      "mpn": "MBP14-2026",
      "sku": "MBP-14",
      "google_product_category": "Electronics > Computers"
    }
  ],
  "metadata": {
    "total": 1,
    "locale": "cs",
    "format": "google-merchant-json-v1"
  }
}
```

Response schema:

```ts
type MerchantFeedRow = {
  id: string;
  item_group_id?: string;
  title: string;
  description: string;
  link: string;
  image_link?: string;
  additional_image_link?: string[];
  availability: "in_stock" | "out_of_stock" | "preorder" | "backorder";
  price: string;
  sale_price?: string;
  condition?: "new" | "used" | "refurbished";
  brand?: string;
  gtin?: string;
  mpn?: string;
  sku?: string;
  google_product_category?: string;
  identifier_exists?: "no";
};
```

Small `structuredDataFacts` example:

```json
{
  "kind": "product",
  "schemaType": "ProductGroup",
  "canonicalUrl": "https://shop.devicehelp.cz/cs/product/macbook-pro",
  "name": "MacBook Pro",
  "description": "Notebook pro narocnou praci",
  "image": "https://cdn.example/main.jpg",
  "brand": "Apple",
  "condition": "new",
  "price": 32000,
  "salePrice": 29900,
  "currency": "CZK",
  "sku": "MBP-14",
  "gtin": "00012345678905",
  "mpn": "MBP14-2026",
  "availability": "in_stock",
  "variants": [
    {
      "id": "variant-14",
      "slug": "macbook-pro-14",
      "title": "14 inch",
      "canonicalUrl": "https://shop.devicehelp.cz/cs/product/macbook-pro/macbook-pro-14",
      "price": 32000,
      "salePrice": 29900,
      "currency": "CZK",
      "sku": "MBP-14",
      "barcode": "INTERNAL-DO-NOT-USE-AS-GTIN",
      "gtin": "00012345678905",
      "mpn": "MBP14-2026",
      "availability": "in_stock"
    }
  ]
}
```

`seo.locales.*.structuredDataFacts` є typed source для JSON-LD. `seo.locales.*.structuredData` лишається generated compatibility JSON-LD, але frontend не повинен вставляти довільний admin JSON-LD override.

---

## Delivery integrations для checkout

Зовнішній frontend може отримати безпечну конфігурацію інтеграцій через:

**URL**: `GET /api/public/v1/integrations` (або застарілий `/api/public/integrations`)

**Формат відповіді (Success 200 OK):**

```json
{
  "success": true,
  "data": {
    "delivery": {
      "packeta": {
        "enabled": true,
        "widgetApiKey": "public-widget-key",
        "countries": ["cz", "sk"],
        "services": ["PICKUP_POINT", "ZBOX"],
        "defaultWeightKg": 1
      }
    }
  }
}
```

Response schema:

```ts
type PublicIntegrationsResponse = {
  success: true;
  data: {
    delivery: {
      packeta: {
        enabled: boolean;
        widgetApiKey: string | null;
        countries: string[];
        services: Array<"PICKUP_POINT" | "ZBOX" | "CARRIER_PUDO" | "HOME_DELIVERY">;
        defaultWeightKg: number | null;
      };
    };
  };
};
```

Public API ніколи не повертає Packeta `apiPassword`. Він використовується тільки backend-ом адмінки для створення відправлень, label і status sync.

Після вибору точки у Packeta widget frontend передає вибір у `delivery` під час створення order:

```json
{
  "delivery": {
    "provider": "PACKETA",
    "service": "PICKUP_POINT",
    "addressId": "79",
    "point": {
      "name": "Praha 4, Nusle",
      "city": "Praha",
      "country": "cz"
    }
  }
}
```

Для external carrier pickup point можна передати:

```json
{
  "delivery": {
    "provider": "PACKETA",
    "service": "CARRIER_PUDO",
    "carrierId": "3060",
    "carrierPickupPointId": "PL123"
  }
}
```

Адмінка зберігає це в `order.deliverySnapshot`. Після оплати або ручного підтвердження backend може створити `Shipment(provider=PACKETA)`, отримати label PDF і синхронізувати статус через Packeta `packetStatus()`.

---

## 1. Отримати список категорій 🗂️
Повертає список усіх категорій, прив'язаних до конкретного магазину (проекту).

**URL**: `GET /api/public/v1/categories` (або застарілий `/api/public/categories`)

**Параметри запиту (Query Parameters):**
- `include` (string) - Додаткові вкладені дані. Підтримується `seo`; приклад: `include=seo`.

**Формат відповіді (Success 200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "cuid...",
      "storeId": "cuid...",
      "parentId": null,
      "title": { "uk": "Ноутбуки", "en": "Laptops" },
      "slug": "laptops",
      "description": null,
      "position": 0,
      "isActive": true,
      "createdAt": "2024-03-10T15:00:00Z",
      "updatedAt": "2024-03-10T15:00:00Z"
    }
  ]
}
```


---

### 1.1. Отримати одну категорію (за slug) 📄

**URL**: `GET /api/public/v1/categories/[slug]` (або застарілий `/api/public/categories/[slug]`)

**Формат відповіді (Success 200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "cuid...",
    "storeId": "cuid...",
    "slug": "laptops",
    "isActive": true,
    "seo": {
      "profile": "CATEGORY_LISTING",
      "schemaType": "CollectionPage",
      "indexable": true,
      "robots": "index,follow",
      "canonicalPathHint": "/categories/laptops",
      "canonicalUrl": null,
      "locales": {
        "uk": {
          "metaTitle": "Ноутбуки",
          "metaDescription": null,
          "ogTitle": "Ноутбуки",
          "ogDescription": null,
          "ogImage": null,
          "structuredData": {},
          "warnings": []
        }
      }
    },
    ...
  }
}
```

---


## 2. Отримати список товарів 📦
Повертає список товарів магазину з можливістю фільтрації, пошуку та пагінації.

**URL**: `GET /api/public/v1/items` (або застарілий `/api/public/items`)

**Параметри запиту (Query Parameters):**
Усі параметри є необов'язковими (Optional).
- `categorySlug` (string) - Відфільтрувати товари за конкретною категорією.
- `search` (string) - Пошук тексту у назві товару (регістронезалежний).
- `minPrice` (number) - Мінімальна ціна.
- `maxPrice` (number) - Максимальна ціна.
- `page` (number) - Номер сторінки для пагінації (за замовчуванням: `1`).
- `limit` (number) - Кількість товарів на сторінку (за замовчуванням: `20`).
- `include` (string) - Додаткові вкладені дані. Підтримуються `categories`, `variants`, `availability`, `seo`; можна передавати через кому: `include=categories,variants,availability,seo`.

**Приклад запиту:**
`GET /api/public/items?categorySlug=laptops&search=macbook&minPrice=1000&page=1&limit=10`

**Локалізовані поля**

Усі локалізовані текстові поля в Public Items API повертаються у фіксованому sparse shape:

```ts
type PublicLocalizedText = Partial<Record<"uk" | "en" | "cs", string>>;
```

Це стосується щонайменше:
- `title`
- `description`
- `content`
- `linkedItems[].targetItem.title`
- `categories[].title`
- `categories[].ancestors[].title`
- `seo.locales.*`

**Формат відповіді (Success 200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "cuid...",
      "storeId": "cuid...",
      "title": { "uk": "MacBook Pro", "en": "MacBook Pro" },
      "slug": "macbook-pro",
      "description": { "uk": "Опис...", "en": "Desc..." },
      "content": null,
      "price": "1500.00",
      "attributes": { "color": "Space Gray", "ram": "16GB" },
      "position": 0,
      "isActive": true,
      "images": [
        {
          "id": "cuid...",
          "storeId": "cuid...",
          "itemId": "cuid...",
          "filePath": "https://pub-...r2.dev/uploads/...",
          "isMain": true,
          "position": 0
        }
      ],
      "createdAt": "2024-03-10T15:00:00Z",
      "updatedAt": "2024-03-10T15:00:00Z",
      "linkedItems": [
        {
          "type": "cross_sell",
          "targetItem": {
            "id": "cuid...",
            "title": { "uk": "Аксесуар до ноутбука", "en": "Laptop Accessory" },
            "slug": "laptop-accessory",
            "images": [
              {
                "filePath": "https://pub-...r2.dev/uploads/...",
                "isMain": true
              }
            ]
          }
        }
      ]
    }
  ],
  "metadata": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

> [!NOTE]
> Без `include=categories` items endpoints не повертають category tree context.

> [!NOTE]
> Без `include=seo` list endpoints для items/categories не повертають поле `seo`. Для сторінок каталогу або SSG/ISR, де потрібні meta tags для кожної картки, додайте `include=seo`.

> [!CAUTION]
> **БЕЗПЕКА (XSS Prevention)**: Поле `content` може містити сирий HTML-код, доданий адміністратором. 
> При відображенні цього поля на вашій вітрині (наприклад, через `dangerouslySetInnerHTML` у React), ви **ЗОБОВ'ЯЗАНІ** використовувати бібліотеку-санітайзер (наприклад, `DOMPurify` або `sanitize-html`) для запобігання XSS-атакам на ваших користувачів.

**Типи зв'язків (`linkedItems[].type`)**:

| Тип | Назва | Опис |
| :--- | :--- | :--- |
| `cross_sell` | **Cross-sell** (Супутні) | Товари, які доповнюють основний. Наприклад: до телефону — чохол, до стрижки — шампунь. |
| `upsell` | **Upsell** (Апсейл) | Більш дорога або просунута версія товару. Наприклад: до пакету "Стандарт" — пакет "Преміум". |
| `portfolio_photo` | **Portfolio** (Роботи) | Фотографії результатів (кейсів) для конкретної послуги. Використовується для галереї на сторінці послуги. |
| `accessory` | **Accessory** (Аксесуари) | Запчастини або функціональні додатки, необхідні для роботи основного пристрою. |
| `related` | **Related** (Подібні) | Схожі товари, які можуть зацікавити користувача, якщо цей йому не підходить. |

---

### 2.1. Отримати один товар (за slug) 📄

**URL**: `GET /api/public/v1/items/[slug]` (або застарілий `/api/public/items/[slug]`)

**Параметри запиту (Query Parameters):**
- `include` (string) - Додаткові вкладені дані. Підтримуються `categories`, `variants`, `availability`; можна передавати через кому. Поле `seo` для detail endpoint повертається завжди.

**Приклад запиту:**
`GET /api/public/v1/items/macbook-pro`

**Формат відповіді (Success 200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "cuid...",
    "title": { "uk": "MacBook Pro", "en": "MacBook Pro" },
    "slug": "macbook-pro",
    "description": { "uk": "Опис...", "en": "Desc..." },
    "content": null,
    "price": "1500.00",
    "attributes": { "color": "Space Gray", "ram": "16GB" },
    "images": [],
    "linkedItems": [],
    "seo": {
      "profile": "PRODUCT_DETAIL",
      "schemaType": "Product",
      "indexable": true,
      "robots": "index,follow",
      "canonicalPathHint": "/items/macbook-pro",
      "canonicalUrl": null,
      "locales": {
        "uk": {
          "metaTitle": "MacBook Pro",
          "metaDescription": "Опис...",
          "ogTitle": "MacBook Pro",
          "ogDescription": "Опис...",
          "ogImage": null,
          "structuredData": {},
          "warnings": []
        }
      }
    }
  }
}
```

> [!IMPORTANT]
> `GET /api/public/v1/items/[slug]` більше не повертає `categories` за замовчуванням. Для category tree context треба явно додати `include=categories`.

### 2.2. Category Context для item через `include=categories`

Щоб отримати активні категорії item-а разом з їхнім активним lineage, викликайте:

- `GET /api/public/v1/items?include=categories`
- `GET /api/public/v1/items/[slug]?include=categories`

У цьому режимі кожен item отримує поле:

```json
{
  "categories": [
    {
      "id": "cuid...",
      "title": { "uk": "Стрижки", "en": "Haircuts" },
      "slug": "haircuts",
      "parentId": "cuid-parent",
      "position": 10,
      "imageUrl": null,
      "ancestors": [
        {
          "id": "cuid-root",
          "title": { "uk": "Послуги", "en": "Services" },
          "slug": "services",
          "parentId": null,
          "position": 0,
          "imageUrl": null
        }
      ]
    }
  ]
}
```

Правила побудови `categories`:
- Повертаються тільки активні direct categories, до яких реально прив'язаний item.
- `ancestors` ідуть у порядку `root -> direct parent`.
- Якщо parent неактивний або відсутній, lineage на ньому обривається.
- Якщо item не має жодної активної категорії, повертається `categories: []`.

---

### 2.3. Варіанти товарів, доступність і variant slug

`Item` є базовою карткою/контентом, а продажі, POS, склад і замовлення працюють через `ItemVariant`. Навіть товар або послуга без видимих опцій має один default variant; frontend повинен передавати саме `variantId` у замовлення.

Щоб отримати варіанти і залишки:

```http
GET /api/public/v1/items?include=variants,availability
GET /api/public/v1/items/protective-glass?include=categories,variants,availability
```

`GET /api/public/v1/items/[slug]` спочатку шукає `Item.slug`, а якщо не знаходить, шукає активний purchasable `ItemVariant.slugOverride`. Коли detail відкрито через variant slug, відповідь містить `selectedVariantId`.

Приклад фрагмента відповіді:

```json
{
  "success": true,
  "data": {
    "id": "item_123",
    "title": { "uk": "Захисне скло" },
    "slug": "protective-glass",
    "variants": [
      {
        "id": "variant_iphone_11",
        "title": { "uk": "Захисне скло для iPhone 11" },
        "slugOverride": "protective-glass-iphone-11",
        "price": "249.00",
        "salePrice": null,
        "sku": "GLASS-IP11",
        "barcode": "8590000000011",
        "isDefault": false,
        "trackInventory": true,
        "selectedOptions": [
          {
            "attributeSlug": "model",
            "attributeTitle": { "uk": "Модель" },
            "optionId": "store_model_iphone-11",
            "optionSlug": "iphone-11",
            "optionTitle": { "uk": "iPhone 11" }
          }
        ],
        "images": [],
        "availability": {
          "availableStock": 8
        }
      }
    ],
    "selectedVariantId": null,
    "availability": {
      "availableStock": 8
    }
  }
}
```

Правила:

- `sku` і `barcode` належать тільки `ItemVariant`, не базовому `Item`.
- `availability.availableStock` рахується як `InventoryLevel.onHand - InventoryLevel.reserved`.
- Якщо `trackInventory = false`, `availableStock` буде `null`.
- Для category pages можна показувати базовий item у загальній категорії і окремий variant у категорії моделі через `ItemVariantCategory`.
- Item-level stock field більше не є public contract; складська правда тільки в `InventoryLevel` і `StockMovement`.

---

## 3. Створити публічне замовлення 🧾

Створює онлайн-замовлення, customer record за email/phone у межах store, order line snapshots і активні reservations. Усі `variantId` та `locationId` перевіряються в межах магазину, визначеного через public key або `SYSTEM_MASTER_KEY + domain`.

**URL**: `POST /api/public/v1/orders`

**Auth:**
- Browser: `x-public-api-key: pk_...` і дозволений `Origin`.
- Server-to-server: `Authorization: Bearer <SYSTEM_MASTER_KEY>` + `?domain=example.com`.

**Request Body:**

```json
{
  "customer": {
    "name": "Ivan",
    "email": "ivan@example.com",
    "phone": "+420777123456"
  },
  "shippingAddress": {
    "country": "CZ",
    "city": "Praha",
    "line1": "Example 1"
  },
  "billingAddress": null,
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
  "locale": "uk",
  "note": "Call before delivery",
  "lines": [
    {
      "variantId": "variant_iphone_11",
      "quantity": 1,
      "locationId": null
    }
  ]
}
```

`locationId` optional. Якщо variant відстежує склад і `locationId` не переданий, API використовує активну default inventory location магазину.

**Success 201:**

```json
{
  "success": true,
  "data": {
    "order": {
      "id": "order_123",
      "orderNumber": "ORD-20260512-0001",
      "status": "RESERVED",
      "paymentStatus": "UNPAID",
      "fulfillmentStatus": "RESERVED",
      "currency": "CZK",
      "subtotalAmount": 249,
      "totalAmount": 249,
      "reservationExpiresAt": "2026-05-12T12:15:00.000Z",
      "lines": [
        {
          "variantId": "variant_iphone_11",
          "quantity": 1,
          "unitPrice": 249,
          "totalAmount": 249,
          "titleSnapshot": { "uk": "Захисне скло для iPhone 11" },
          "attributesSnapshot": {}
        }
      ]
    },
    "publicToken": "base64url-token"
  }
}
```

Side effects:

- creates or reuses `Customer` in the current store;
- creates `Order(channel=ONLINE)` and `OrderLine` snapshots;
- creates `InventoryReservation` rows for tracked variants;
- increases `InventoryLevel.reserved`; it does not create `SALE` stock movements yet.

Common errors:

```json
{ "success": false, "error": "Variant was not found or is not purchasable." }
```

```json
{ "success": false, "error": "No active default inventory location is available for this store." }
```

---

### 3.1. Підтвердити або скасувати публічне замовлення

Підтвердження споживає reservations, зменшує `onHand`, створює `SALE` movements і переводить order у confirmed flow.

```http
POST /api/public/v1/orders/[id]/confirm
Content-Type: application/json
x-public-api-key: pk_...
```

```json
{
  "publicToken": "base64url-token"
}
```

Скасування released reservations і повертає reserved quantity у доступний залишок.

```http
POST /api/public/v1/orders/[id]/cancel
Content-Type: application/json
x-public-api-key: pk_...
```

```json
{
  "publicToken": "base64url-token"
}
```

`publicToken` можна передати в body або header `x-order-token`. У server-to-server режимі `Authorization: Bearer <SYSTEM_MASTER_KEY>` + `?domain=example.com` може виконати confirm/cancel без public token.

**Success 200:**

```json
{
  "success": true,
  "data": {
    "order": {
      "id": "order_123",
      "status": "CONFIRMED",
      "fulfillmentStatus": "FULFILLED"
    }
  }
}
```

Common errors:

```json
{ "success": false, "error": "Order token is required." }
```

```json
{ "success": false, "error": "Invalid order token." }
```

## 4. Отримати фільтри (Атрибути) для категорії ⚙️
Повертає всі доступні атрибути (опції фільтрації) для конкретної категорії. Зручно для побудови UI фільтрів на вітрині (напр. чекбокси "Колір", "Розмір").

**URL**: `GET /api/public/v1/filters` (або застарілий `/api/public/filters`)

**Параметри запиту (Query Parameters):**
- `categorySlug` (string) - **Обов'язково**. Slug категорії, для якої треба отримати фільтри.
- `locale` (string) - Необов'язково. Мова для перекладу назв атрибутів і опцій (за замовчуванням: `uk`).

**Приклад запиту:**
`GET /api/public/filters?categorySlug=laptops&locale=uk`

**Формат відповіді (Success 200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "ram_size",
      "name": "Об'єм оперативної пам'яті",
      "type": "SELECT",
      "options": [
        {
          "id": "cuid...",
          "slug": "8gb",
          "value": "8 ГБ"
        },
        {
          "id": "cuid...",
          "slug": "16gb",
          "value": "16 ГБ"
        }
      ]
    }
  ]
}
```

---

## 5. Отримати налаштування та локалі сайту 🌐
Повертає глобальні налаштування для конкретного магазину: базову мову, контактну інформацію (разом зі статусом активності), посилання на соцмережі та доступні в системі мови (локалі). Це корисно для динамічної генерації футера або перемикача мов на клієнті.

**URL**: `GET /api/public/v1/settings` (або застарілий `/api/public/settings`)

**Параметри запиту (Query Parameters):**
*Немає*

**Формат відповіді (Success 200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "global",
    "storeId": "cuid...",
    ...
    "appearance": {
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
    },
    "workingHours": {
      "byAppointment": false,
      "days": [
        { "day": "monday", "open": "09:00", "close": "18:00", "isClosed": false },
        ...
      ]
    },
    ...
  }
}
```

### Деталі графіка роботи (`workingHours`)

Об'єкт `workingHours` містить параметри роботи магазину:

- `byAppointment` (boolean) — **"Тільки за записом"** (або "Змінний графік"). Якщо `true`, це означає, що магазин працює за домовленістю, а не за жорстким графіком.
- `days` (array) — Масив з 7 об'єктів (по одному на кожен день тижня):
    - `day` (string) — Назва дня (`monday`, `tuesday` тощо).
    - `open` (string) — Час відкриття у форматі `HH:MM` (наприклад, `"09:00"`).
    - `close` (string) — Час закриття у форматі `HH:MM` (наприклад, `"18:00"`).
    - `isClosed` (boolean) — Чи є цей день вихідним. Якщо `true`, час роботи зазвичай ігнорується.

---

## 6. Надіслати повідомлення або заявку на запис ✉️
Дозволяє відправляти з зовнішнього сайту як прості контактні форми, так і структуровані заявки на запис. Обидва типи потрапляють у розділ "Повідомлення" в адмін-панелі.

**URL**: `POST /api/public/v1/messages` (або застарілий `/api/public/messages`)

**Тіло запиту (Request Body - JSON):**
- `requestType` (`general_message | appointment_request`, optional) - Тип звернення. За замовчуванням `general_message`.
- `name` (string, **required**) - Ім'я клієнта.
- `email` (string, optional) - Email для зв'язку, якщо переданий має містити `@`.
- `phone` (string, optional) - Контактний номер телефону.
- `subject` (string, optional) - Тема звернення.
- `message` (string, optional) - Додатковий текст клієнта. Це поле **не є required** навіть для звичайного повідомлення.
- `locale` (string, optional) - Мова форми, наприклад `uk`, `en`, `cs`.
- `source` (string, optional) - Звідки прийшла форма: `contact_form`, `services_section`, `hero_cta`.
- `pageUrl` (string, optional) - URL сторінки, з якої відправлено заявку.

Має бути переданий хоча б один контакт: `email` або `phone`.

**Поля послуги для `appointment_request`:**
- `serviceId` (string, optional) - ID активної послуги з API. Якщо переданий, backend перевіряє, що це активна послуга цього store.
- `serviceTitle` (string, optional) - Snapshot назви послуги на момент заявки.
- `servicePrice` (string, optional) - Snapshot ціни, наприклад `від 900 Kč`.
- `serviceDurationMinutes` (number, optional) - Snapshot тривалості.
- `categoryId` / `categoryTitle` (string, optional) - Snapshot категорії.

Навіть якщо передається `serviceId`, frontend може дублювати snapshot поля. Адмінка зберігає snapshot у повідомленні, бо назва, ціна або тривалість послуги можуть змінитися пізніше.

**Поведінка `serviceId` і snapshot:**
- `serviceId` використовується для validation/reference: він має належати поточному store, бути `type = SERVICE` і `isActive = true`.
- Якщо `serviceId` невалідний, API повертає `400` з `code: "INVALID_SERVICE_ID"` і не створює повідомлення.
- Snapshot поля (`serviceTitle`, `servicePrice`, `serviceDurationMinutes`, `categoryTitle`) зберігаються у `ContactMessage` як історія заявки.
- Якщо frontend передав snapshot поле, API зберігає саме передане значення.
- Якщо snapshot поле не передане, але `serviceId` валідний, API заповнює відсутній snapshot з поточної послуги на момент створення заявки.
- API не відхиляє заявку лише через те, що переданий snapshot відрізняється від поточних даних послуги. Це дозволяє зберегти те, що клієнт бачив у UI під час відправки.
- `serviceId` optional: для кастомної або вільної заявки frontend може передати тільки `serviceTitle` / бажаний час без ID.

**Поля бажаного часу для `appointment_request`:**
- `preferredDate` (string, optional) - `YYYY-MM-DD`.
- `preferredTime` (string, optional) - `HH:mm`. Якщо переданий, також потрібні `preferredDate` і `timezone`.
- `timezone` (string, optional) - Наприклад `Europe/Prague`.
- `preferredTimeLabel` (string, optional) - Вільний label типу `morning`, `afternoon`, `any`.

Для `requestType = appointment_request` потрібно передати хоча б один контекст запису: `serviceId`, `serviceTitle`, `preferredDate` або `preferredTimeLabel`. `message` все одно optional.

**Приклад запиту:**
```http
POST /api/public/v1/messages
Content-Type: application/json
x-public-api-key: <Ваш_API_Key>

{
  "requestType": "general_message",
  "name": "Іван Іваненко",
  "email": "ivan@example.com",
  "phone": "+380501234567",
  "subject": "Запис на консультацію",
  "message": "Доброго дня, хотів би дізнатися ціни на послуги."
}
```

**Приклад заявки на запис:**
```json
{
  "requestType": "appointment_request",
  "name": "Олена",
  "phone": "+420777123456",
  "message": "Можна майстра, який говорить українською?",
  "serviceId": "service_123",
  "serviceTitle": "Манікюр",
  "servicePrice": "від 900 Kč",
  "serviceDurationMinutes": 60,
  "preferredDate": "2026-05-12",
  "preferredTime": "14:30",
  "timezone": "Europe/Prague",
  "locale": "uk",
  "source": "services_section",
  "pageUrl": "https://example.com/services"
}
```

**Формат відповіді (Success 201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "cuid...",
    "requestType": "appointment_request",
    "status": "NEW",
    "message": "Request successfully received"
  }
}
```

---

## 7. Помилки (Errors) ❌

У разі помилки API повертає відповідний HTTP статус та JSON з описом:

**401 Unauthorized** (Ключ відсутній або невалідний):
```json
{
  "success": false,
  "error": "API Key is missing" // або "Invalid API Key format", "CORS Error..."
}
```

**400 Bad Request** (Відсутній обов'язковий параметр, напр. у `/filters`):
```json
{
  "success": false,
  "error": "categorySlug is required"
}
```

Для `POST /api/public/v1/messages` validation errors мають стабільний structured формат. Старе поле `error` завжди лишається для сумісності, а нові поля можна використовувати для UI:

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

Можливі `code` для `/messages`:

| Code | Field(s) | Meaning |
| :--- | :--- | :--- |
| `INVALID_JSON_BODY` | - | Body не є JSON object |
| `INVALID_REQUEST_TYPE` | `requestType` | Невідомий тип звернення |
| `VALIDATION_ERROR` | конкретне поле | Неправильний тип або перевищена довжина поля |
| `INVALID_EMAIL` | `email` | Email переданий, але невалідний |
| `MISSING_CONTACT` | `email`, `phone` | Потрібен хоча б один контакт |
| `INVALID_DATE_FORMAT` | `preferredDate` | Очікується `YYYY-MM-DD` |
| `INVALID_TIME_FORMAT` | `preferredTime` | Очікується `HH:mm` |
| `MISSING_PREFERRED_TIME_CONTEXT` | `preferredTime`, `preferredDate`, `timezone` | `preferredTime` переданий без дати або timezone |
| `METADATA_TOO_LARGE` | `metadata` | Serialized metadata перевищує ліміт |
| `APPOINTMENT_CONTEXT_REQUIRED` | `serviceId`, `serviceTitle`, `preferredDate`, `preferredTimeLabel` | Для `appointment_request` не передано контекст запису |
| `INVALID_SERVICE_ID` | `serviceId` | ID не належить активній послузі поточного store |

**403 Forbidden** (Сайт існує, але зараз недоступний публічно):
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

**500 Internal Server Error** (Помилка на сервері):
```json
{
  "success": false,
  "error": "Internal Server Error"
}
```
