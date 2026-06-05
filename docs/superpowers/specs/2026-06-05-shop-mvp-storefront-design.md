# Shop MVP Storefront Design

Date: 2026-06-05
Status: Approved for implementation planning

## Goal

Create a high-quality first version of the DeviceHelp internet shop inside the existing Next.js application.

The shop should feel like a premium technology retail experience backed by DeviceHelp repair expertise. It should support accessories, phone parts, and future phone sales without looking like a generic spare-parts catalog.

The first implementation should prioritize visible storefront quality, SEO structure, product/category rendering, variants, and availability. Cart and checkout should be prepared in the architecture but finished later.

## Context

The current project is a localized Next.js application serving the main DeviceHelp site and the B2B subdomain. The shop should follow the same host-based architecture pattern:

- `devicehelp.cz` remains the repair-service website.
- `b2b.devicehelp.cz` remains the B2B landing experience.
- `shop.devicehelp.cz` becomes the canonical shop experience.
- `devicehelp.cz/{locale}/shop` may exist as a bridge into the shop, but should not become the canonical product catalog.

The external backend/admin system is the source of truth for categories, items, variants, availability, SEO entries, Merchant feed data, delivery integrations, reservations, and orders. The frontend should not duplicate business logic that already belongs to the backend.

The current API documentation supports a strong first SEO implementation:

- Public catalog endpoints for categories and items.
- `include=categories,variants,availability,seo`.
- Detail endpoints returning SEO data by default.
- Dedicated `GET /api/public/v1/seo/urls` for sitemap and ISR URL discovery.
- Dedicated `GET /api/public/v1/seo/merchant-feed` for Merchant-compatible product data.
- Dedicated `GET /api/public/v1/integrations` for public-safe Packeta configuration.
- Variant-first order lines.
- Backend-built canonical URLs.
- Typed `structuredDataFacts` for frontend-generated JSON-LD.

## Product Direction

Use a clean premium ecommerce direction, not a dense marketplace or raw technical inventory UI.

The visual tone should be:

- Light, precise, modern, and spacious.
- Close enough to the main DeviceHelp and B2B style to feel like one ecosystem.
- More retail-oriented than the repair site.
- Practical where compatibility matters, especially for phone model, part quality, and stock state.

The shop should communicate:

- DeviceHelp selects and sells useful phone accessories, parts, and later phones.
- Products are connected to repair expertise.
- Compatibility and availability are clear before the customer adds an item.
- The buying experience is trustworthy and simple.

## Non-Goals For The First Pass

These are intentionally out of scope for the first visible storefront pass:

- Full account-based shopping.
- Login or registration requirements.
- Final production checkout.
- Online card payment or Stripe integration.
- Google Merchant upload/sync automation.
- Complex filter SEO landing page generation.
- Full `/shop` main-domain duplicate catalog.
- Admin/backend changes inside this repository.

The first pass may include visual cart affordances and temporary local add-to-cart behavior, but the real cart and checkout flow should be implemented after the catalog and product experience are stable.

## Recommended Architecture

Use one Next.js application with a separate shop module.

Conceptual structure:

```text
devicehelp.cz/{locale}/...
  main repair website

b2b.devicehelp.cz/{locale}/...
  B2B experience

shop.devicehelp.cz/{locale}/...
  canonical shop experience

devicehelp.cz/{locale}/shop
  optional bridge page into shop.devicehelp.cz
```

The shop code should be isolated enough to evolve without mixing catalog concerns into the repair-service pages.

Expected implementation areas:

- Host-aware routing in middleware.
- Shop-specific route helpers.
- Shop-specific layout, header, and footer.
- Shop data layer with mock data first, then API client.
- Shop SEO utilities.
- Shop product and category components.
- Future shared cart foundation.

The backend API should be accessed from server code by default through `SYSTEM_MASTER_KEY + domain`. Browser-to-admin API calls should be reserved for safe interactions only when they are explicitly needed.

## Routing

Canonical shop routes:

```text
shop.devicehelp.cz/{locale}
shop.devicehelp.cz/{locale}/category/{categorySlug}
shop.devicehelp.cz/{locale}/product/{itemSlug}
shop.devicehelp.cz/{locale}/product/{itemSlug}/{variantSlug}
shop.devicehelp.cz/{locale}/cart
shop.devicehelp.cz/{locale}/checkout
shop.devicehelp.cz/{locale}/checkout/success
```

Optional main-domain bridge routes:

```text
devicehelp.cz/{locale}/shop
devicehelp.cz/{locale}/shop/category/{categorySlug}
devicehelp.cz/{locale}/shop/product/{itemSlug}
```

The recommended initial behavior for main-domain shop catalog routes is:

- `devicehelp.cz/{locale}/shop` may render a bridge/landing page.
- Deep catalog routes on the main domain should either redirect to `shop.devicehelp.cz` or render with canonical pointing to `shop.devicehelp.cz`.
- The shop sitemap should include only `shop.devicehelp.cz` canonical URLs.

The shop subdomain should use Czech as the default locale, matching the existing app.

## Layout

The shop needs its own layout rather than reusing the full repair-site navigation.

Shop header:

- DeviceHelp logo with a shop signal.
- Category navigation.
- Search affordance.
- Language switcher.
- Cart icon with item count.
- Optional compact trust strip for delivery, warranty, and pickup.

Shop footer:

- Contact details.
- Shop terms and conditions.
- Delivery information.
- Returns and complaints.
- Privacy policy.
- Cookie settings.
- Links back to repair services and B2B where useful.

The header/footer should be compact and retail-oriented. They should still use the existing design language, spacing, button styles, and typography conventions where practical.

## Homepage

The homepage should be the first polished screen of the shop, not a marketing placeholder.

Recommended sections:

1. Hero retail banner

   A strong first viewport for accessories, phone parts, and future phones. Use real or generated product imagery, not abstract shapes.

2. Category tiles

   Large, clear category entries such as accessories, protection, charging, replacement parts, and future phones.

3. Featured products

   A curated product row with price, stock state, and quick add affordance.

4. DeviceHelp recommendations

   Products selected by repair expertise, for example protective glass, cases, batteries, charging accessories, or common replacement parts.

5. Compatibility-driven block

   A user can start by device model or product category. This matters for parts and model-specific accessories.

6. Trust and service block

   Short support points: verified compatibility, pickup/delivery options, support from DeviceHelp, and warranty/returns.

## Category Page

The category page should be server-rendered and SEO-friendly.

Core elements:

- Breadcrumbs.
- Localized H1.
- Optional category description/SEO intro.
- Product grid.
- Pagination with real links.
- Basic sort control.
- Filter panel using available attributes.
- Active filter summary.
- SEO text lower on the page when available.

Filtering rules:

- User-facing filters are allowed in the UI.
- Filtered URLs should be `noindex` by default unless the backend exposes them as deliberate SEO landing pages.
- Filter parameters should not create unlimited indexable URL combinations.
- Canonical for ordinary filtered URLs should point back to the canonical category page.

Product cards should show:

- Product image.
- Title.
- Price or price range.
- Sale price if available.
- Availability.
- Badges such as new, sale, recommended, compatible, or limited stock when supported by data.
- Main category or compatibility hint where useful.
- A restrained add-to-cart button or disabled state when unavailable.

## Product Page

The product page is the highest-priority storefront page.

Core elements:

- Breadcrumbs from category context.
- Product gallery.
- Product title.
- Price and sale price.
- Variant selector.
- Availability by selected variant.
- Quantity selector with stock-aware limits.
- Add-to-cart button.
- Short description.
- Product content/long description.
- Compatibility/attributes table.
- Delivery and pickup information.
- Related products, accessories, cross-sell, and upsell.
- SEO-safe JSON-LD generated from typed data.

Product and variant behavior:

- The base `Item` represents content, SEO, and the broad product card.
- `ItemVariant` represents the purchasable unit.
- Cart lines must use `variantId`, never `itemId`.
- If a product has no visible options, use the default variant.
- If detail is opened by `variantSlug`, select that variant on load.
- Variant selection can update price, sale price, SKU, images, availability, and canonical variant URL.
- If `availableStock` is `0`, the product should not be purchasable.
- If `availableStock` is `null` and `trackInventory` is false, treat the item as not stock-tracked and use a business-specific label such as "available" or "on request".

Quantity behavior:

- Default quantity is `1`.
- Maximum quantity should not exceed `availableStock` when stock is tracked.
- If stock changes or the selected variant becomes invalid, refresh variant availability and ask the customer to choose again.

## Mock Data Layer

Use mock data first, but shape it like the public API.

Mock entities:

- Categories with tree structure and localized titles.
- Items with localized title, description, content, images, linked items, and SEO.
- Variants with `variantId`, `slugOverride`, selected options, SKU, barcode, optional GTIN, price, sale price, images, and availability.
- SEO records with `canonicalUrl`, `indexable`, `robots`, localized metadata, and `structuredDataFacts`.
- Merchant-like fields for brand, GTIN, MPN, condition, availability, and image links.

The mock layer should make the later API replacement straightforward:

```text
mock shop data
  -> normalized shop view models
  -> UI components

real API data
  -> same normalized shop view models
  -> same UI components
```

Avoid writing UI components directly against arbitrary mock-only shapes.

## API Integration Plan

When replacing mocks with real data, use server-side fetches:

```http
GET /api/public/v1/categories?domain=shop.devicehelp.cz&include=seo
GET /api/public/v1/items?domain=shop.devicehelp.cz&include=categories,variants,availability,seo
GET /api/public/v1/items/{slug}?domain=shop.devicehelp.cz&include=categories,variants,availability
GET /api/public/v1/filters?domain=shop.devicehelp.cz&categorySlug={slug}
GET /api/public/v1/seo/urls?domain=shop.devicehelp.cz
GET /api/public/v1/seo/merchant-feed?domain=shop.devicehelp.cz&locale=cs
GET /api/public/v1/integrations?domain=shop.devicehelp.cz
```

The frontend should normalize API responses into stable internal view models. It should not spread raw API objects across every component.

Important API rules:

- Prefer `seo.locales[locale].canonicalUrl` for page canonical links.
- Use `/api/public/v1/seo/urls` for sitemap generation.
- Use `structuredDataFacts` as typed input for JSON-LD.
- Do not blindly inject arbitrary admin-provided JSON-LD.
- Use Merchant feed data as a backend export source, not as the main UI source.
- Do not treat `barcode` as GTIN.
- Do not trust client-side prices during order creation.

## SEO And Merchant Design

The shop canonical domain is `shop.devicehelp.cz`.

SEO requirements:

- Product and category pages should be server-rendered.
- Metadata should come from `seo.locales[locale]`, with fallback to product/category content.
- Canonical should use `seo.locales[locale].canonicalUrl`.
- Sitemap should use `GET /api/public/v1/seo/urls`.
- Product pages should generate JSON-LD from typed `structuredDataFacts`, product, variant, and availability fields.
- Breadcrumb JSON-LD should be generated from category context.
- Filtered URLs should be `noindex` unless explicitly designed as SEO landing pages.
- Non-canonical `/shop` main-domain catalog URLs should not enter the sitemap.
- Merchant feed landing page URLs must match canonical product/variant URLs.

Merchant requirements:

- Feed price and landing page price must match.
- Feed availability and landing page availability must match.
- Product images must be crawlable.
- Variant products should share `item_group_id`.
- GTIN should be sent only when known and valid.
- `identifier_exists: "no"` may be used when a product truly has no brand/GTIN/MPN identifiers.
- Product titles should remain human-readable and not become keyword stuffing.

The current backend/API contract is good enough for an 8/10 SEO foundation. To move closer to 9/10 before production, add explicit `hreflang`/alternate URL support and a backend-controlled indexable filter landing page strategy.

## Cart Foundation

The first visual storefront should prepare for cart without making checkout the first milestone.

Recommended first-pass cart behavior:

- Header cart icon with count.
- Local cart state for mock interaction.
- Cart lines store `variantId`, quantity, and a display snapshot.
- Quantity updates respect tracked availability.
- Add-to-cart is disabled when selected variant is out of stock.

Future shared-cart goal:

- The shop cart should be designed so it can later be shared with repair-service flows on the main domain.
- Shared cart should support mixed line types in the future, such as product variants and repair/service booking items.
- For now, implement product variant cart lines only.

Future cart line shape:

```ts
type ShopCartLine = {
  variantId: string;
  itemId: string;
  quantity: number;
  titleSnapshot: string;
  priceSnapshot: number;
  currency: "CZK";
};
```

## Checkout Foundation

Checkout is intentionally later, but the design should reserve the route and data expectations.

Future checkout flow:

1. Customer reviews cart.
2. Customer enters contact details.
3. Customer selects delivery, initially Packeta if enabled.
4. Frontend creates a reserved order through the backend.
5. Backend returns `order` and `publicToken`.
6. UI shows reservation expiry.
7. Payment or final customer confirmation happens.
8. Frontend confirms or cancels the reserved order.

For now:

- Do not require login.
- Do not build account flows.
- Do not integrate Stripe yet.
- Keep Packeta widget support as a documented future integration point.

## Error Handling

Storefront pages should distinguish:

- `404`: missing category/product.
- `403`: store exists but is suspended, under maintenance, or temporarily closed.
- API unavailable: generic shop error with retry.
- Product unavailable: visible unavailable state, not a broken page.
- Variant unavailable: keep product page usable and ask for another variant.

Do not convert backend `403` availability states into `404`.

## Localization

Support existing locales:

- `cs` default.
- `uk`.
- `en`.

For the mock phase, at least Czech and Ukrainian copy should be present for visible shop UI. English can use fallback copy if needed.

Language switching should preserve equivalent shop paths when possible. If exact localized slug support is not available, keep the route stable and switch locale around the same slug.

## Visual Direction

Use restrained premium ecommerce UI:

- White or very light backgrounds.
- High-quality product imagery.
- Compact but readable product cards.
- Clear price and availability hierarchy.
- Soft but not overly rounded cards.
- Strong first viewport with real product/category imagery.
- Minimal decorative gradients.
- No heavy dark marketplace feel.

The shop should feel connected to DeviceHelp but more retail-focused than the repair-service website.

## Testing And Verification

Initial verification should include:

- Shop homepage renders for `cs`, `uk`, and `en`.
- Category route renders product grid from mock data.
- Product route renders selected default variant.
- Variant slug route selects the matching variant.
- Quantity control respects tracked stock.
- Out-of-stock variant disables add-to-cart.
- Product card and product detail show sale price and availability correctly.
- Metadata and canonical are generated from mock SEO records.
- JSON-LD generation uses typed facts, not arbitrary raw JSON.
- Mock sitemap logic uses canonical shop URLs only.
- Main DeviceHelp routes remain unchanged.
- B2B routes remain unchanged.
- Mobile header, category grid, product gallery, variant selector, and sticky add-to-cart do not overlap.

Browser verification should cover desktop and mobile layouts after implementation.

## Implementation Sequence

Recommended order:

1. Create shop mock data and normalization helpers.
2. Add shop route helpers and route constants.
3. Add shop layout, header, and footer.
4. Build shop homepage.
5. Build category page.
6. Build product page with variant selector and availability.
7. Add SEO metadata and JSON-LD utilities.
8. Add visual/local cart shell.
9. Add tests for route helpers, mock normalization, variant selection, and SEO URL behavior.
10. Browser-check desktop and mobile UI.

Cart, checkout, Packeta widget, order reservation, and Stripe/payment integration should come after the storefront pages are stable.

## Open Decisions

- Whether `devicehelp.cz/{locale}/shop/product/...` redirects to `shop.devicehelp.cz` or renders as a non-canonical bridge.
- Whether localized slugs will be added later or stable shared slugs remain acceptable.
- Whether the backend will expose explicit `hreflang`/alternate URLs before production launch.
- Which filter combinations, if any, become backend-controlled SEO landing pages.
- Whether first launch includes only product catalog pages or also a minimal local cart.
