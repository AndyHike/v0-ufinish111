# Frontend Revalidation (On-Demand Cache Invalidation)

Цей документ описує, як адмін-панель повідомляє зовнішній сторфронт про зміну контенту, щоб той скинув свій кеш (ISR / `revalidateTag` / `revalidatePath`). Це **вихідний вебхук** у напрямку `admin → storefront`, окремий від публічного API (яким сторфронт **читає** дані).

> [!TIP]
> Загальний onboarding — [External Frontend Integration](./README.md). Server-to-server режим з master key — [Internal API Docs](../../INTERNAL_API_DOCS.md).

## 1. Як це працює

Коли в адмінці змінюється контент магазину (товар, категорія, налаштування, вигляд, фільтри, склад тощо), серверний action викликає `triggerFrontendRevalidationForStore(storeId, { change })`. Він:

1. Резолвить **усі активні маршрутизовані домени** магазину (основний домен + кастомні домени).
2. Зчитує per-store конфіг ревалідації (шлях + секрет), з fallback на env.
3. Робить `POST {domain}{path}` на кожен домен із тілом-контрактом нижче.

```text
Admin mutation (server action)
   └─ triggerFrontendRevalidationForStore(storeId, { change })
        ├─ getStoreActiveRoutableHostnames(storeId)          // усі домени
        ├─ resolveRevalidationTags(change)                   // які теги скидати
        ├─ toFrontendRevalidationEvent(change)               // подія для сторфронту
        └─ POST {domain}{revalidatePath}  → storefront /api/revalidate
```

Реалізація: [`src/lib/frontend-revalidate.ts`](../../src/lib/frontend-revalidate.ts), політика тегів/подій: [`src/lib/revalidation-policy.ts`](../../src/lib/revalidation-policy.ts), формат тегів: [`src/lib/cache-tags.ts`](../../src/lib/cache-tags.ts).

## 2. Конфігурація (per-store з fallback на env)

| Параметр | Per-store (Developers) | Fallback (env) | Призначення |
| :--- | :--- | :--- | :--- |
| Шлях вебхука | `Store.frontendRevalidatePath` | `FRONTEND_REVALIDATE_PATH` → `/api/revalidate` | Куди слати POST на домені сторфронту |
| Секрет авторизації | `Store.frontendRevalidateSecret` | `SYSTEM_MASTER_KEY` | Значення поля `token` у тілі запиту |

- Per-store значення задаються в адмінці: **Developers → Frontend Revalidation** (шлях + кнопка генерації секрету). Секрет показується **один раз** при генерації — скопіюйте його у env сторфронту.
- Якщо per-store значення не задане, використовується env-значення. Тому існуючі магазини, налаштовані лише через `SYSTEM_MASTER_KEY` / `FRONTEND_REVALIDATE_PATH`, продовжують працювати без змін.
- Якщо не задано **ні** per-store секрету, **ні** `SYSTEM_MASTER_KEY` — запит пропускається (`skipped: true`), ревалідація не відбувається.

> [!IMPORTANT]
> Секрет, який сторфронт перевіряє на своєму endpoint, має дорівнювати **per-store секрету магазину**, якщо він заданий, інакше — глобальному `SYSTEM_MASTER_KEY`. Не змішуйте: якщо для магазину згенеровано окремий секрет, env-ключ для нього вже не діє.

## 3. Контракт запиту (admin → storefront)

```http
POST https://example.com/api/revalidate
Content-Type: application/json
```

```json
{
  "token": "<frontendRevalidateSecret або SYSTEM_MASTER_KEY>",
  "domain": "example.com",
  "event": {
    "siteId": "store_123",
    "domain": "example.com",
    "changeType": "item.updated",
    "collection": "smartphones",
    "itemSlug": "iphone-11",
    "previousItemSlug": "iphone-11-old"
  },
  "tags": [
    "site:store_123:collection:smartphones",
    "site:store_123:view:list:smartphones",
    "site:store_123:view:smartphones",
    "site:store_123:item:smartphones:iphone-11",
    "site:store_123:view:detail:smartphones:iphone-11",
    "site:store_123:view:home"
  ]
}
```

- `token` — авторизація; сторфронт **зобов'язаний** його звіряти і відхиляти невідповідні запити (`401`).
- `domain` — для якого домену запит (корисно у multi-tenant сторфронті).
- `event` — структурований опис зміни (опціональні поля присутні лише коли релевантні: `collection`, `itemSlug`, `previousItemSlug`, `mediaId`).
- `tags` — **готовий список cache tags** для `revalidateTag()`. Це основний механізм; сторфронту достатньо ітерувати `tags`.

## 4. Типи змін і теги, що скидаються

`changeType` → теги (генерує `resolveRevalidationTags`):

| `changeType` | Теги, що скидаються |
| :--- | :--- |
| `site.updated` | `site:{id}` |
| `settings.updated` | `site:{id}:settings`, `site:{id}:view:home` |
| `appearance.updated` | `site:{id}:appearance`, `site:{id}:view:home` |
| `navigation.updated` | `site:{id}:navigation`, `site:{id}:view:home` |
| `filters.updated` | `site:{id}:filters`, `site:{id}:view:home` |
| `inventory.updated` | `site:{id}:availability`, `site:{id}:view:home` |
| `collection.created` / `updated` / `deleted` / `reordered` | `site:{id}:collection:{key}`, `site:{id}:view:list:{key}`, `site:{id}:view:{key}`, `site:{id}:view:home` |
| `item.created` / `updated` / `deleted` / `links.updated` / `variants.updated` | теги колекції (як вище) + `site:{id}:item:{key}:{slug}`, `site:{id}:view:detail:{key}:{slug}` (для нового і попереднього slug) + `site:{id}:view:home` |
| `item.media.updated` | те саме, що `item.*`, плюс `site:{id}:media` |
| `media.created` / `updated` / `deleted` | `site:{id}:media` (+ `site:{id}:media:{mediaId}`, якщо є) |

Додатково, будь-який `change.affectedViews: string[]` додає `site:{id}:view:{view}` для кожного значення.

### Формат cache tags

| Хелпер (`cacheTags`) | Формат |
| :--- | :--- |
| `site(id)` | `site:{id}` |
| `settings(id)` | `site:{id}:settings` |
| `appearance(id)` | `site:{id}:appearance` |
| `navigation(id)` | `site:{id}:navigation` |
| `filters(id)` | `site:{id}:filters` |
| `availability(id)` | `site:{id}:availability` |
| `collection(id, key)` | `site:{id}:collection:{key}` |
| `item(id, key, slug)` | `site:{id}:item:{key}:{slug}` |
| `media(id)` / `mediaItem(id, mediaId)` | `site:{id}:media` / `site:{id}:media:{mediaId}` |
| `view(id, key)` | `site:{id}:view:{key}` |
| `listView(id, key)` | `site:{id}:view:list:{key}` |
| `detailView(id, key, slug)` | `site:{id}:view:detail:{key}:{slug}` |

> [!NOTE]
> `view:home` — це ключ домашньої сторінки. Контентні зміни майже завжди скидають `home`, бо головна часто агрегує товари/колекції.

## 5. Що покрито (admin-мутація → подія)

| Розділ адмінки | Файл | `changeType` |
| :--- | :--- | :--- |
| Settings | `src/app/api/settings/actions.ts` | `settings.updated` |
| Appearance | `src/app/api/appearance/actions.ts` | `appearance.updated` |
| Categories (create/update/delete) | `src/app/api/categories/actions.ts` | `collection.created` / `updated` / `deleted` |
| Items (create/update/delete) | `src/app/api/items/actions.ts` | `item.created` / `updated` / `deleted` |
| Items — фото/посилання | `src/app/api/items/actions.ts` | `item.media.updated` / `item.links.updated` |
| Item variants | `src/app/api/item-variants/actions.ts` | `item.variants.updated` |
| SEO | `src/app/api/seo/actions.ts` | `item.updated` / `collection.updated` |
| **Attributes / Filters** | `src/app/api/attributes/actions.ts` | `filters.updated` |
| **Inventory / залишки** | `src/app/api/inventory/actions.ts` | `inventory.updated` |
| Store access / billing sync | `src/lib/store-access-sync.ts` | `site.updated` |

Примітки:
- **Фільтри** на сторфронті (`GET /api/public/v1/filters`) похідні від атрибутів, тому ревалідацію тригерять саме мутації атрибутів (`filters.updated`).
- **Inventory** має єдину точку `revalidateInventory(storeId)`, тож усі рухи складу/резервування/інвентаризації одразу шлють `inventory.updated`; публічна доступність живе в `items?include=availability`.
- **Глобальний перемикач мов** (`Locale`, лише SUPER_ADMIN) навмисно **не** тригерить зовнішню ревалідацію. Per-store набір мов (`enabledLocales`) покрито через `settings.updated`.

## 6. Що має реалізувати сторфронт (`/api/revalidate`)

Сторфронт (окремий проєкт) повинен мати endpoint, який:

1. Приймає `POST` за шляхом зі своєї конфігурації (за замовчуванням `/api/revalidate`).
2. Звіряє `token` із секретом цього магазину (per-store секрет, або спільний `SYSTEM_MASTER_KEY`). Невідповідність → `401`.
3. Викликає `revalidateTag()` для кожного тегу з `tags`.
4. (Опційно) використовує `event` для точкової логіки (наприклад, `revalidatePath` конкретного маршруту).

Приклад для Next.js App Router сторфронту:

```ts
// app/api/revalidate/route.ts (на боці сторфронту)
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.token || body.token !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const tags: string[] = Array.isArray(body.tags) ? body.tags : [];
  for (const tag of tags) {
    revalidateTag(tag);
  }

  return NextResponse.json({ ok: true, revalidated: tags.length });
}
```

Щоб теги діяли, fetch-запити сторфронту до публічного API мають бути позначені тими самими тегами, напр.:

```ts
// під час читання каталогу на сторфронті
await fetch(`${ADMIN_API_BASE_URL}/api/public/v1/items?domain=${domain}&include=availability`, {
  headers: { Authorization: `Bearer ${SYSTEM_MASTER_KEY}` },
  next: { tags: [`site:${siteId}:availability`, `site:${siteId}:view:home`] },
});
```

## 7. Поведінка при помилках

- Ревалідація **fire-and-forget**: помилки логуються (`[frontend-revalidate]`), але не зривають основну admin-мутацію. Черги/ретраю немає (за дизайном).
- Якщо у магазину немає активних доменів — запит пропускається (`skipped`).
- Якщо немає ні per-store секрету, ні `SYSTEM_MASTER_KEY` — запит пропускається з відповідним `error`.
- Кілька доменів обробляються паралельно; загальний результат `ok` лише якщо всі домени відповіли успішно.

## 8. Тестування

- Юніт на мапінг тегів: [`test/revalidation-policy/revalidation-policy.test.ts`](../../test/revalidation-policy/revalidation-policy.test.ts) (`npx tsx test/revalidation-policy/revalidation-policy.test.ts`).
- Ручна перевірка: у **Developers → Frontend Revalidation** задати шлях і згенерувати секрет → змінити атрибут і зробити рух складу → у логах адмінки побачити вихідний `POST` на заданий шлях із per-store токеном.
