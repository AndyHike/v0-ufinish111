# B2B Subdomain Landing Page Design

Date: 2026-05-28
Status: Approved for planning

## Goal

Create a B2B-focused microsite for DeviceHelp on `b2b.devicehelp.cz` using the existing Next.js application, layout, localization system, and selected repair-service functionality.

The B2B subdomain should clearly communicate that the advertised repair service is for companies, entrepreneurs, offices, and organizations. It must not become an indexable duplicate of the main consumer site.

## Context

The site is a localized Next.js application with Czech, Ukrainian, and English routes. Czech remains the default locale.

Google Ads restricts third-party consumer technical support advertising, but allows ads for advertisers who provide technical support for businesses exclusively. The B2B landing page therefore needs to make the business-only intent clear, especially in the first viewport and primary CTA.

Reference: https://support.google.com/adspolicy/answer/13527027?hl=en

Google Search supports canonical URLs and noindex for duplicate-control cases, but this design should prevent duplicate B2B copies from existing where possible by redirecting non-B2B routes to the main domain.

References:

- https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- https://developers.google.com/search/docs/crawling-indexing/block-indexing

## Routing And Domain Behavior

The same deployed application will serve both the main domain and B2B subdomain.

- `devicehelp.cz` keeps the current consumer-oriented homepage.
- `b2b.devicehelp.cz` shows the B2B homepage.
- `b2b.devicehelp.cz/cs` is the default B2B Czech page.
- `b2b.devicehelp.cz/uk` shows the Ukrainian B2B page.
- `b2b.devicehelp.cz/en` shows the English B2B page.
- `b2b.devicehelp.cz/cs/faq`, `/uk/faq`, and `/en/faq` show localized B2B FAQ pages if the FAQ is implemented as a standalone page.
- Missing locale on the B2B subdomain redirects to Czech, matching the main site's default-locale behavior.
- Any non-B2B route on the B2B subdomain redirects to the same localized path on the main domain.

Examples:

- `b2b.devicehelp.cz/cs/brands/apple` redirects to `devicehelp.cz/cs/brands/apple`.
- `b2b.devicehelp.cz/uk/articles/example` redirects to `devicehelp.cz/uk/articles/example`.
- `b2b.devicehelp.cz/en/services/screen-replacement` redirects to `devicehelp.cz/en/services/screen-replacement`.

The implementation should leave room for future subdomains such as `shop.devicehelp.cz`, without hard-coding B2B logic in a way that blocks additional host-based experiences.

## Page Positioning

The B2B homepage is not a duplicate of the consumer homepage. It is a dedicated landing page for business cooperation around mobile phone repair.

The page should target:

- Companies with employee phones.
- Small businesses and entrepreneurs.
- Offices and teams with multiple devices.
- Organizations that need recurring or accountable repair handling.

The page should avoid consumer-first language such as "repair my phone" as the primary message. It should use business-oriented language such as "mobile phone service for companies" and "register a company account". Avoid using `B2B` as the main visible CTA wording when a clearer business/customer-friendly phrase works better.

## Navigation

B2B should use a dedicated navigation, not the full consumer navigation.

Recommended B2B navigation:

- Brand/logo.
- Language switcher.
- B2B cooperation / homepage.
- How it works.
- Benefits.
- FAQ.
- Contact.
- Primary action: register a company/business account.

General repair-discovery tools may remain available, but they should not create indexable B2B copies of the main catalog:

- A "choose model" link should point to the main domain version of the model-selection route.
- Search may be available only if result links resolve to the main domain, or it may be omitted from the B2B header if that is simpler and clearer.
- Links to brands, models, services, articles, booking, profile, and other non-B2B routes should resolve to `devicehelp.cz`, not to `b2b.devicehelp.cz`.

The B2B subdomain should add a clear B2B signal in the header, such as a small `B2B` label near the DeviceHelp logo or an active navigation item for B2B cooperation.

The intent is to keep B2B user journeys clear while preventing the B2B subdomain from becoming a second indexable copy of the consumer site.

## Content Structure

The B2B homepage should include these sections:

1. Hero

   Czech headline direction: "B2B servis mobilnich telefonu pro firmy".

   The hero should explain that DeviceHelp repairs company phones for firms, entrepreneurs, offices, and organizations in Prague. It should emphasize clear communication, warranty, and company account registration.

   Primary CTA: "Registrovat firemni ucet".

   Secondary CTA may link to contact or phone/email.

2. Who It Is For

   Short section describing suitable customers:

   - Firms with employee devices.
   - OSVC / entrepreneurs.
   - Small teams and offices.
   - Organizations that need repeated repairs.

3. Benefits

   Focus on practical business value:

   - Company account with business details.
   - IČO / DIČ registration.
   - Admin approval before account activation.
   - Clear repair communication.
   - Warranty on repairs.
   - Convenient model and service lookup.

4. Cooperation Terms

   Explain the process:

   - Register a company/business account.
   - Fill in company details including IČO and DIČ.
   - Confirm email.
   - Wait for admin approval.
   - Use the account for cooperation and repair handling.

5. CTA Block

   Repeat the B2B registration CTA near the end of the page.

6. FAQ

   Include concise answers for likely questions:

   - Can a small entrepreneur register?
   - Can a company register even with only one device?
   - What happens after registration?
   - Are repairs covered by warranty?
   - How do we contact DeviceHelp before registering?

## CTA Behavior

Primary CTA links to the existing registration page on the main domain with a B2B hint:

`https://devicehelp.cz/{locale}/auth/register?b2b=1`

When writing route-local code, the path portion is `/{locale}/auth/register?b2b=1`, but links rendered on the B2B subdomain should use the main-domain URL directly to avoid creating a B2B-subdomain auth duplicate.

The registration form should read this query parameter and preselect the company/B2B checkbox. The user can still edit the form normally.

Visible copy should prefer human-readable "company", "business", or "entrepreneur" language over raw `B2B` wording. `B2B` may remain in technical names, route logic, and internal query parameters.

CTA labels:

- Czech: `Registrovat firemní účet`
- Ukrainian: `Зареєструвати акаунт для компанії`
- English: `Register a business account`

## Localization

The B2B page should use the existing locale structure:

- Czech as default and primary ad-facing language.
- Ukrainian and English translations available.
- Metadata, headings, CTA labels, FAQ, and body copy should be localized.

## SEO And Ads Requirements

The B2B page metadata should be separate from the consumer homepage. Only true B2B pages should be indexable on `b2b.devicehelp.cz`.

Recommended Czech SEO direction:

- Title: `B2B servis mobilních telefonů pro firmy | DeviceHelp`
- Description: `Opravy firemních mobilních telefonů pro firmy, OSVČ a organizace v Praze. Registrace firemního účtu, záruka a jasná komunikace.`

The first viewport must clearly show the business audience. This reduces ambiguity for ad review and visitors.

Indexing rules:

- B2B home pages should have self-referencing canonicals on `https://b2b.devicehelp.cz/{locale}`.
- B2B FAQ pages, if standalone, should have self-referencing canonicals on `https://b2b.devicehelp.cz/{locale}/faq`.
- The B2B sitemap should include only B2B pages.
- General catalog, model, service, article, booking, auth-flow, profile, and admin pages should not be indexable as B2B-subdomain URLs.
- Prefer redirects from B2B non-B2B routes to the main domain. Use canonical/noindex only for edge cases where a route cannot be redirected.

## Technical Design

Expected implementation areas:

- Middleware host detection for `b2b.`.
- A localized B2B page route in the app directory.
- Optional localized B2B FAQ route.
- B2B route allowlist for paths that may stay on the B2B subdomain.
- Redirect handling from disallowed B2B-subdomain routes to the main domain while preserving locale, path, and query string.
- A dedicated B2B header/nav variant or host-aware header mode.
- A reusable B2B landing component or page-local sections.
- Translation additions in `messages/cs.json`, `messages/uk.json`, and `messages/en.json`.
- Registration form support for `?b2b=1`.
- Metadata for the B2B page.
- B2B sitemap behavior, or exclusion of non-B2B pages from any B2B sitemap generation.

The implementation should avoid duplicating the full site layout. It should reuse existing UI primitives, header/footer, and styling conventions.

## Testing And Verification

Minimum verification:

- `b2b` host routing sends the root path to the Czech B2B page.
- `b2b` host routes preserve `/cs`, `/uk`, and `/en`.
- B2B FAQ routes work for `/cs/faq`, `/uk/faq`, and `/en/faq` if implemented.
- B2B non-B2B routes redirect to the same path on the main domain.
- Main-domain homepage remains unchanged.
- Main-domain catalog, service, model, article, booking, auth, profile, and admin routes remain unchanged.
- B2B navigation does not link to indexable B2B copies of main-domain catalog pages.
- CTA links include `?b2b=1`.
- Registration page preselects the B2B checkbox when `?b2b=1` is present.
- B2B metadata and canonical URLs point to B2B URLs only for true B2B pages.
- Build or type check completes as far as the current project permits.
- Browser check confirms desktop and mobile B2B page layouts do not overlap and the CTA is visible in the first viewport.

## Open Decisions

No open product decisions remain before implementation planning.
