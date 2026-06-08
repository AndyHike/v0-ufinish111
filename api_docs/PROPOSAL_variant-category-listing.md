# Proposal: expose `ItemVariantCategory` rows in the category listing

**Status:** proposal / not yet implemented in the Public API.
**Owner of the change:** the external admin Public API repo (separate codebase).
**Storefront side:** ready to adapt once the contract below ships.

## Problem

Merchants can already bind a single **variant** to specific categories in the
admin (the `ItemVariantCategory` relation — see `PUBLIC_API_DOCS.md` §2.3,
"Для category pages можна показувати базовий item у загальній категорії і
окремий variant у категорії моделі через `ItemVariantCategory`").

The intended storefront behaviour:

- A variant **without** any `ItemVariantCategory` binding → appears only inside
  its parent item's detail page (status quo).
- A variant **with** a binding → appears **as its own product card** in each
  bound category, with a direct "add to cart" button (no model picker needed,
  because the card already represents one concrete variant).

**Blocker:** `GET /api/public/v1/items?categorySlug=…` currently returns
**item-level rows only**. It does not tell the storefront which variant matched
the category, and it never emits variant-level rows. So the storefront cannot
render the bound variant as a standalone card — the data simply isn't there.

## Requested contract change (pick one)

### Option A — per-item `matchedVariantId` (smallest change)

Add a field to each row in the `categorySlug` listing naming the variant that
caused the row to match this category. When a variant is bound via
`ItemVariantCategory`, return one row **per bound variant**, each carrying the
matched variant id:

```jsonc
// GET /api/public/v1/items?categorySlug=iphone-11&include=variants,availability
{
  "id": "item_123",
  "slug": "protective-glass",
  "title": { "uk": "Захисне скло" },
  "matchedVariantId": "variant_iphone_11",   // NEW — which variant matched
  "variants": [ /* … only need the matched variant, or all */ ],
  // …existing item fields…
}
```

Rules:
- If the item matched the category at the **item** level (no variant binding),
  `matchedVariantId` is `null` → render as today (item card, "from X").
- If the item matched via one or more `ItemVariantCategory` rows, emit one row
  per matched variant with that `matchedVariantId` set.

### Option B — dedicated variant rows

Return a discriminated row type (`type: "item" | "variant"`) so variant cards
are first-class in the listing. More work on the API, cleaner on the client.

**Recommendation:** Option A — it reuses the existing item row shape and the
storefront already maps `variants[]`.

## Storefront adaptation plan (this repo, once the contract ships)

In order (per `CLAUDE.md` "adaptation points"):

1. `lib/shop/api/mappers.ts` — read `matchedVariantId` into `ApiItem` →
   `ShopItem` (new optional field).
2. `lib/shop/catalog.ts` — `toProductCard` gains a "force this variant" path:
   when `matchedVariantId` is set, build the card from that exact variant
   (single-variant semantics: real price, no "from X", quick-buy button) instead
   of the default-variant + "from X" logic.
3. `lib/shop/data.ts` — `getShopCategoryData` maps each listing row through the
   variant-aware card builder.
4. No component change needed: `ProductCard` + `ProductCardAction` already render
   a quick-buy button for single-variant cards.

Estimated storefront effort once the API is live: small (mapper + one card
branch + a catalog test).
