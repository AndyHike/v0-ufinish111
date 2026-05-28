# B2B Subdomain Landing Page Design

Date: 2026-05-28
Status: Approved for planning

## Goal

Create a B2B-focused experience for DeviceHelp on `b2b.devicehelp.cz` using the existing Next.js application, layout, localization system, and repair-service functionality.

The B2B subdomain should clearly communicate that the advertised repair service is for companies, entrepreneurs, offices, and organizations, while still keeping useful repair-discovery tools such as search and model selection.

## Context

The site is a localized Next.js application with Czech, Ukrainian, and English routes. Czech remains the default locale.

Google Ads restricts third-party consumer technical support advertising, but allows ads for advertisers who provide technical support for businesses exclusively. The B2B landing page therefore needs to make the business-only intent clear, especially in the first viewport and primary CTA.

Reference: https://support.google.com/adspolicy/answer/13527027?hl=en

## Routing And Domain Behavior

The same deployed application will serve both the main domain and B2B subdomain.

- `devicehelp.cz` keeps the current consumer-oriented homepage.
- `b2b.devicehelp.cz` shows the B2B homepage.
- `b2b.devicehelp.cz/cs` is the default B2B Czech page.
- `b2b.devicehelp.cz/uk` shows the Ukrainian B2B page.
- `b2b.devicehelp.cz/en` shows the English B2B page.
- Missing locale on the B2B subdomain redirects to Czech, matching the main site's default-locale behavior.

The implementation should leave room for future subdomains such as `shop.devicehelp.cz`, without hard-coding B2B logic in a way that blocks additional host-based experiences.

## Page Positioning

The B2B homepage is not a duplicate of the consumer homepage. It is a dedicated landing page for business cooperation around mobile phone repair.

The page should target:

- Companies with employee phones.
- Small businesses and entrepreneurs.
- Offices and teams with multiple devices.
- Organizations that need recurring or accountable repair handling.

The page should avoid consumer-first language such as "repair my phone" as the primary message. It should use business-oriented language such as "B2B mobile phone service for companies" and "register a B2B account".

## Navigation

Keep the existing useful navigation and tools:

- Brand/logo.
- Language switcher.
- Site search.
- Model selection / choose model entry point.
- Contact entry point.

The B2B subdomain should add a clear B2B signal in the header, such as a small `B2B` label near the DeviceHelp logo or an active navigation item for B2B cooperation.

The intent is to preserve repair-discovery ergonomics while making the homepage and primary CTA unambiguously B2B.

## Content Structure

The B2B homepage should include these sections:

1. Hero

   Czech headline direction: "B2B servis mobilnich telefonu pro firmy".

   The hero should explain that DeviceHelp repairs company phones for firms, entrepreneurs, offices, and organizations in Prague. It should emphasize clear communication, warranty, and business account registration.

   Primary CTA: "Registrovat B2B ucet".

   Secondary CTA may link to contact or phone/email.

2. Who It Is For

   Short section describing suitable customers:

   - Firms with employee devices.
   - OSVC / entrepreneurs.
   - Small teams and offices.
   - Organizations that need repeated repairs.

3. Benefits

   Focus on practical business value:

   - B2B account with company details.
   - IČO / DIČ registration.
   - Admin approval before account activation.
   - Clear repair communication.
   - Warranty on repairs.
   - Convenient model and service lookup.

4. Cooperation Terms

   Explain the process:

   - Register a B2B account.
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

Primary CTA links to the existing registration page with a B2B hint:

`/{locale}/auth/register?b2b=1`

The registration form should read this query parameter and preselect the B2B checkbox. The user can still edit the form normally.

CTA labels:

- Czech: `Registrovat B2B účet`
- Ukrainian: `Зареєструвати B2B акаунт`
- English: `Register B2B account`

## Localization

The B2B page should use the existing locale structure:

- Czech as default and primary ad-facing language.
- Ukrainian and English translations available.
- Metadata, headings, CTA labels, FAQ, and body copy should be localized.

## SEO And Ads Requirements

The B2B page metadata should be separate from the consumer homepage.

Recommended Czech SEO direction:

- Title: `B2B servis mobilních telefonů pro firmy | DeviceHelp`
- Description: `Opravy firemních mobilních telefonů pro firmy, OSVČ a organizace v Praze. Registrace B2B účtu, záruka a jasná komunikace.`

The first viewport must clearly show the business audience. This reduces ambiguity for ad review and visitors.

## Technical Design

Expected implementation areas:

- Middleware host detection for `b2b.`.
- A localized B2B page route in the app directory.
- A reusable B2B landing component or page-local sections.
- Translation additions in `messages/cs.json`, `messages/uk.json`, and `messages/en.json`.
- Registration form support for `?b2b=1`.
- Metadata for the B2B page.

The implementation should avoid duplicating the full site layout. It should reuse existing UI primitives, header/footer, and styling conventions.

## Testing And Verification

Minimum verification:

- `b2b` host routing sends the root path to the Czech B2B page.
- `b2b` host routes preserve `/cs`, `/uk`, and `/en`.
- Main-domain homepage remains unchanged.
- CTA links include `?b2b=1`.
- Registration page preselects the B2B checkbox when `?b2b=1` is present.
- Build or type check completes as far as the current project permits.
- Browser check confirms desktop and mobile B2B page layouts do not overlap and the CTA is visible in the first viewport.

## Open Decisions

No open product decisions remain before implementation planning.
