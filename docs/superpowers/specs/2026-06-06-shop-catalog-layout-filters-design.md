# Shop Catalog Layout And Filters Design

## Goal

Build the shop as a real catalog experience, not only a product grid: a strong shop home, nested category browsing, category-specific filters, stable product pages, and a mock product with many variants for UX validation.

This spec keeps the DeviceHelp visual system. Rozetka and Shoptet are references for information architecture only, not visual cloning.

## Reference Patterns To Borrow

Rozetka-like patterns worth borrowing:

- A strong catalog entry point near the first viewport.
- A left-side category rail on large screens.
- A large promotional banner with smaller secondary promo tiles.
- Product rails/grids below the first viewport.
- Category pages that shift from general navigation into product discovery.

Shoptet-like patterns worth borrowing:

- Clear top category navigation.
- Large editorial promo banners.
- Simple product/category blocks.
- A calmer visual rhythm that can fit a premium service-adjacent shop.

Patterns to avoid:

- Copying Rozetka density, colors, icons, or aggressive marketplace chrome.
- Copying Shoptet template styling directly.
- Adding account/login-heavy UI before the shop needs it.
- Overloading product pages with duplicate compatibility and delivery sections too early.

## Visual Direction

The shop remains in the DeviceHelp style:

- White background, restrained gray surfaces, black text, blue action color.
- Radius 8px or lower unless an existing component already differs.
- Dense enough to feel like a shop, but calmer than a marketplace.
- Promotional banners should be image-led and stable in aspect ratio.
- Product cards remain compact and scannable.
- Mobile should prioritize search/catalog access, then promo, then products.

## Shop Home

Desktop first viewport:

- Header with shop logo, category nav, search placeholder, language, cart drawer button.
- Main content split into a catalog column and promotional content.
- Left catalog column shows active root categories and their first-level children when available.
- Main promo area shows one large banner plus two smaller banners.
- Below the first viewport: all categories, featured/new products, and service trust points.

Mobile first viewport:

- Header remains compact.
- Category nav becomes horizontal chips.
- Catalog tree is collapsed behind a clear catalog/category entry.
- Promo banners stack without vertical stretching.
- Product sections remain grid/list friendly.

## Category Tree

The backend already supports category trees through `parentId`.

Required behavior:

- Categories can have children.
- Children can also have children.
- Tree rendering should not assume only two levels.
- Root categories are shown on shop home.
- Category pages show sibling/child context so users can move through the catalog.
- Empty parent categories with children are valid and should not look broken.

Category URL behavior:

- Category canonical URL remains `/[locale]/category/[slug]` on the shop host.
- In the future, if the API supports hierarchical slugs, the frontend can still keep canonical URLs flat unless SEO strategy changes.
- Breadcrumbs should represent the actual parent path even if the URL remains flat.

## Category Page Layout

The category page should support two discovery modes:

1. Parent or broad category
   - Emphasize subcategories.
   - Show child category cards near the top.
   - Show product grid if products exist.
   - Filters are secondary or hidden until product volume justifies them.

2. Product-heavy category
   - Emphasize filters and sorting.
   - Show a compact category tree block first.
   - Show attribute filters below it.
   - Product grid/list becomes the main surface.

Recommended sidebar model: hybrid.

- Keep category navigation visible as a compact tree block.
- Add filters below the tree once the category has products and filterable attributes.
- This avoids the Rozetka problem where users can lose category context, and avoids the Shoptet problem where filters can be too weak for a real catalog.

Mobile category behavior:

- Sidebar becomes a filter/catalog drawer.
- Top of category page shows sort control and filter button.
- Active filters appear as removable chips.

## Filters And Sorting

Initial filter/sort scope:

- Sort by recommended/default.
- Sort by cheapest first.
- Sort by most expensive first.
- Price range filter.
- Availability filter.
- Brand filter when products expose brand.
- Attribute filters from the backend category/product data, especially model/compatibility.

Price filtering:

- Use actual variant sell price, preferring `salePrice` when present.
- Price range should be resilient if products have multiple variants.
- For the MVP, filter by the selected/default variant price unless the backend returns category-level min/max prices.

Sorting:

- Default sort should preserve backend/category priority.
- Cheapest/most expensive sort should use the display price shown on the card.
- Future sort options can include newest, most popular, sale first, and in-stock first.

SEO:

- Filtered URLs should not become indexable by default.
- Canonical category URL should remain the clean category URL.
- Sort and filter query params can be crawlable only if the backend later marks specific combinations as indexable.

## Product Page

Keep:

- Gallery.
- Title.
- Short description.
- Purchase panel.
- Variant selector.
- Quantity and stock state.
- Main product description.
- Specifications/characteristics table.
- Related products.

Remove for now:

- Separate compatibility section below the specs.
- Separate delivery/warranty section below the specs.

Reason:

- Variant selection already handles compatibility.
- Delivery/payment policy belongs to checkout, footer/legal pages, or a later compact product-page block once real operations are defined.
- Product page should feel cleaner at this stage.

## Large Variant Product QA

Add one mock product with roughly 20-25 variants.

Purpose:

- Validate the searchable variant selector.
- Validate mobile layout when users choose between many phone models.
- Validate stock and price display across a large variant list.
- Keep this product clearly mock/catalog QA until real API data replaces it.

Recommended mock product:

- Slug: `model-test-protective-glass`.
- Category: protection.
- Variant count: 24.
- Variant attribute: model.
- Models should include a mix of iPhone and Samsung labels.
- Some variants should be out of stock.
- Some variants should have sale prices.
- Default variant should be in stock.

Expected UI:

- Product page uses searchable variant selector, not chip grid.
- Selector list has a max height and internal scroll.
- Search input filters by model title, option title, SKU, or MPN.
- Long model names wrap safely or truncate only where appropriate.
- Adding an in-stock variant opens the cart drawer.

## Backend/API Requirements For Later

The frontend should eventually consume:

- Category tree with parent/child relations.
- Category children and ancestors.
- Product cards for category listing.
- Filter facets for category listing.
- Sort options supported by backend.
- Price min/max for category listing.
- Active filter state and product result count.
- SEO metadata for categories and products.

Important boundary:

- Frontend should not invent indexable filtered URLs.
- Backend/admin should decide which category/filter combinations are SEO pages.

## Implementation Stages

Stage 1: Current UX cleanup and QA mock

- Remove extra product-page compatibility/delivery sections.
- Add mock product with 20-25 variants.
- Keep current selector behavior and verify search mode.
- Update tests.

Stage 2: Category tree helpers

- Add helpers for category children, ancestors, root categories, and recursive tree rendering data.
- Add tests for multi-level category structures.
- Extend mock categories with children and grandchildren.

Stage 3: Shop home catalog layout

- Add desktop catalog column.
- Add mobile catalog entry.
- Keep promo banners in DeviceHelp style.
- Ensure categories with children render clearly.

Stage 4: Category page discovery layout

- Add subcategory section.
- Add hybrid sidebar: compact category tree plus filter placeholder.
- Add sort controls and price filter UI with mock/local behavior.

Stage 5: Real API integration

- Replace mock category/product/filter data with backend public API.
- Keep helpers/components stable so API mapping is isolated.
- Add tests around API mapping and SEO boundaries.

## Open Decisions

Default sidebar behavior:

- Recommended: hybrid category tree plus filters.
- Alternative A: Rozetka-style full replacement with filters on category pages.
- Alternative B: Shoptet-style category tree always visible, filters as top controls.

Current decision for implementation:

- Use the hybrid model. It keeps navigation context and still supports real product filtering.

Filter URL policy:

- Current decision: non-indexable query params by default.
- Future decision can be revisited when backend SEO rules define indexable filter landing pages.

