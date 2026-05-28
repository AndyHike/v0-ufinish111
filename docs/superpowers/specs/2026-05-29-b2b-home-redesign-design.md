# B2B Homepage Redesign Design

Status: approved concept direction V4 on 2026-05-29.

Accepted visual reference: `docs/superpowers/specs/assets/2026-05-29-b2b-home-v4-concept.png`

## Goal

Redesign the B2B homepage on the B2B subdomain so it feels like a natural, more business-focused extension of DeviceHelp rather than a duplicate consumer homepage or a generic AI/SaaS landing page.

The page should speak to Czech companies, OSVČ, smaller entrepreneurs, offices, and organizations that need reliable mobile phone repair cooperation. Czech remains the default language, with matching Ukrainian and English translations.

## Scope

In scope:

- Redesign `components/b2b/b2b-home-page.tsx`.
- Update B2B homepage message content in `messages/cs.json`, `messages/uk.json`, and `messages/en.json`.
- Keep the existing B2B header, routing, FAQ, sitemap, robots, and main-domain redirects intact unless a small anchor/nav adjustment is required by the new section order.
- Keep CTA links pointing to the main-domain registration flow with `?b2b=1`.

Out of scope:

- Building the actual account dashboard, invoice system, or order tracking backend.
- Changing the Google reviews behavior.
- Changing which B2B pages are indexable.
- Reworking the consumer homepage.

## Page Structure

1. Header
   - Keep the B2B navigation compact and familiar.
   - Suggested order: `Firemní servis`, `Výhody`, `Firemní účet`, `Jak to funguje`, `FAQ`.
   - CTA should use business-account wording, not raw "B2B account" wording.

2. Hero
   - Two-column desktop layout and stacked mobile layout.
   - H1: `Servis mobilních telefonů pro firmy a podnikatele`.
   - Supporting copy should explain fast repair requests, repair-status overview, invoicing/documents, and better conditions for repeated service.
   - Primary CTA: `Registrovat firemní účet`.
   - Secondary action: contact service.
   - Use three quiet proof rows: Prague pickup/return, Czech Republic postal sending, and online repair overview.
   - Hero media should use a real or realistic repair workbench image treatment that matches the existing site. No flashy dashboard, fake metrics, or color overlay.

3. `Výhody spolupráce`
   - This is the first major section after the hero.
   - It must be its own full-width section, not side-by-side with the account or process section.
   - Present benefits as a refined list/table with subtle dividers rather than a repeated icon-card grid.
   - Required benefits:
     - Pickup and return in Prague.
     - Sending devices by post across the Czech Republic.
     - Better prices/conditions for a firemní účet.
     - Priority processing.
     - Warranty on completed service.
     - Ongoing repair-status overview.

4. `Firemní účet`
   - Separate section focused on account capabilities.
   - Use structured rows or a quiet panel, not a loud SaaS dashboard.
   - Required account benefits:
     - Real-time repair status.
     - Order history.
     - Online invoices and documents.
     - Company details in one place.
     - Discounts and conditions for repeated service.

5. `Jak spolupráce funguje`
   - Separate section after account benefits.
   - Use a calm 4-step timeline/process.
   - Steps:
     - Account registration.
     - Company details approval.
     - Device handoff in Prague or postal sending.
     - Repair, online status, and completion/return.

6. Final CTA and contact
   - Use a restrained light gray or very pale blue-tinted band.
   - Include the registration CTA and real contact details:
     - `info@devicehelp.cz`
     - `+420 775 848 259`
   - Do not use fake phone numbers from the visual concept.

## Visual Direction

The accepted direction is modern, restrained, and human-made:

- White and very light neutral gray backgrounds.
- Charcoal text with softer gray secondary copy.
- Blue only for primary CTA, key links, and minimal accents.
- Avoid repeated blue icon circles and generic icon-card grids.
- Prefer typography, whitespace, thin rules, and structured rows.
- Use icons only when they clarify the row; keep them monochrome or very restrained.
- Keep cards/panels subtle with thin borders, low shadow, and the existing site radius style.
- Avoid decorative orbs, bokeh, heavy gradients, fake dashboards, fake metrics, fake testimonials, and loud contrast.
- The page should feel like DeviceHelp, only more business-focused and spacious.

## Responsive Behavior

- Mobile must stack sections in this order: hero, cooperation benefits, company account, process, final CTA.
- CTAs should be full-width or naturally stacked on small screens.
- No text may overlap imagery, buttons, or adjacent sections.
- Structured lists should remain readable without horizontal scrolling.
- Hero image should keep a stable aspect ratio and not dominate the entire mobile first viewport.

## SEO And Routing

- Preserve the existing B2B host behavior:
  - B2B home and FAQ are indexable on the B2B subdomain.
  - Non-B2B paths on the B2B host redirect to the main domain.
  - Czech remains the default B2B locale.
- Metadata can remain semantically focused on company mobile phone repair, business account registration, warranty, and clear cooperation terms.

## Verification

Implementation should be verified with:

- `npm.cmd run test:b2b-content`
- `npm.cmd run test:b2b-routing`
- `npm.cmd run test:b2b-seo`
- `npm.cmd run build`
- Local visual QA on `http://b2b.localhost:3000/cs` and at least one mobile viewport.

