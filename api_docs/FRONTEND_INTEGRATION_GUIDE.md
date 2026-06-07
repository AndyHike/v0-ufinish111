# Frontend Integration Guide: Appearance & Dynamic Layout

This guide explains how to integrate the Admin Panel's appearance settings into your site template. It covers data retrieval, real-time preview (postMessage), and rendering best practices.

> For the complete external website integration contract, start with [External Frontend Integration](docs/external-frontends/README.md). For theme authoring rules, see [Theme Contract](docs/external-frontends/theme-contract.md).
> Commerce flows are documented in [External Frontend Integration](docs/external-frontends/README.md#commerce-catalog-and-checkout-flow) and [Public API Docs](PUBLIC_API_DOCS.md). In short: catalog content is `Item`, sellable identity is `ItemVariant`, and order lines must submit `variantId`.

---

## 1. Unified Appearance Data

The styling and layout of the site are controlled by the `SiteAppearance` model. You can fetch this data using the Internal API.

### Endpoint
`GET /api/v1/internal/appearance?domain=your-domain.com`
**Header**: `Authorization: Bearer <SYSTEM_MASTER_KEY>`

### Data Structure
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

---

## 2. Site Availability Handling

Before rendering normal site content, the frontend must handle the availability response from the Admin API. Public and internal endpoints can return `403 Forbidden` when the site exists but is not publicly available.

Blocked response shape:

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

The frontend should render a dedicated availability screen for:

- `STORE_SUSPENDED`
- `SITE_MAINTENANCE`
- `SITE_TEMPORARILY_CLOSED`

Do not treat `403` as `404`. The site exists; it is just not available to visitors right now.

---

## 3. Real-time Preview (postMessage)

The Admin Panel uses an `iframe` to preview changes. It sends `UPDATE_APPEARANCE` messages whenever a user modifies a setting.

### Protocol
Listen for the `message` event:
```javascript
window.addEventListener('message', (event) => {
  if (event.data?.type === 'UPDATE_APPEARANCE') {
    handleAppearanceUpdate(event.data.payload);
  }
});
```

### Handling Updates
| Field | Action |
| :--- | :--- |
| `themeKey` | Choose the real theme renderer for the active template. |
| `tokens.primaryColor` | Update CSS variable(s) and all accent points of the current theme. |
| `tokens.fontFamily` | Update font loading / CSS font variables. |
| `tokens.buttonStyle` | Apply the current button treatment for the active theme. |
| `tokens.heroBackgroundImage` | Update the Hero background image. |
| `tokens.heroOverlay` | Update the Hero overlay opacity. |
| `layout.blocks` | Update the order and visibility of sections in the page renderer. |
| `sectionVariants.services` | Choose the Services section variant. |
| `sectionVariants.photoGallery` | Choose the Gallery section variant. |
| `themeData` | Apply theme-specific rendering decisions without changing the template data model. |

> The iframe preview payload is now normalized and uses the same appearance contract as the API.

---

## 4. Implementation Recommendations

### Theme Rendering
Do not derive the whole design from tokens alone. The frontend should render by:

- `templateKey` -> data model
- `themeKey` -> real design system
- `layout.blocks` -> section order
- `sectionVariants` -> section renderer variant
- `themeData` -> theme-specific design knobs
- `tokens` -> mutable styling values

For `beauty-salon`, the frontend should support at least:

- `beauty-salon-classic`
- `beauty-salon-editorial`

When adding a new theme, follow the contract in [docs/external-frontends/theme-contract.md](docs/external-frontends/theme-contract.md).

### Dynamic Layout Rendering
Use a main engine to render sections in the order specified by `layout.blocks`.

```tsx
// Example in React
const SECTION_MAP = {
  hero: Hero,
  services: Services,
  photoGallery: Gallery,
  contacts: Contacts
};

export function LandingPage({ appearance }) {
  return (
    <main>
      {appearance.layout.blocks.map(id => {
        const Component = SECTION_MAP[id];
        return Component ? <Component key={id} {...appearance} /> : null;
      })}
    </main>
  );
}
```

### Button Style System
Define border-radius based on the `buttonStyle` field:
- **pill**: `9999px`
- **square**: `0px`
- **soft**: `8px - 14px` (variable)

### Hero Section
The Hero section should be prepared for an image background:
- If `heroBackgroundImage` is present, use it as `background-image: url(...)`.
- The overlay opacity should be controlled by `heroOverlay` (0.0 to 1.0).
- Text should always have a drop shadow or high contrast for readability.
- If `heroBackgroundImage` is missing, use a gradient based on `primaryColor`.

### Gallery Layout System
Implement three distinct layouts for the gallery:
- **grid**: Standard CSS Grid with aspect-square items.
- **masonry**: Staggered layout (e.g., using `columns` or a dedicated library).
- **carousel**: Horizontal scroll with `snap-to-center` behavior.

Use `appearance.sectionVariants.photoGallery` as the renderer input instead of the legacy flat `galleryLayout` field.

---

## 5. Fonts
The `fontFamily` field contains the name of the font. We recommend using a font loader (like `next/font/google` or a standard WebFont loader) to dynamically load the selected font if it's not a system default.
