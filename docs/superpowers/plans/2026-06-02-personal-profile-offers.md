# Personal Profile Offers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add admin-managed personal offer presentation for existing personal discounts, show those offers on the profile main tab, and show a one-time homepage toast for logged-in users.

**Architecture:** The `discounts` table remains the source of truth. A new `lib/discounts/profile-offers.ts` helper queries eligible marked personal discounts and maps them into a small view model used by profile UI and homepage toast UI.

**Tech Stack:** Next.js 15 App Router, React client components, Supabase, `next-intl`, Radix/shadcn toast, Node test runner.

---

### Task 1: Red Tests

**Files:**
- Modify: `tests/admin-discounts-flow.test.mjs`

- [ ] **Step 1: Add failing coverage**

Add tests that expect:
- discount schema/type/query support for `show_as_offer`, `offer_title`, `offer_description`, `offer_priority`
- a `profile-offers` helper with `getPersonalProfileOffers`
- profile page passes `personalOffers` into `ProfileContent`
- homepage page renders `PersonalOfferToast`
- profile/toast translations exist in all locales

- [ ] **Step 2: Verify red**

Run:

```bash
node --test tests/admin-discounts-flow.test.mjs
```

Expected: FAIL because the new fields/helper/components do not exist yet.

### Task 2: Discount Schema And Admin Form

**Files:**
- Create: `scripts/add_personal_offer_fields_to_discounts.sql`
- Modify: `scripts/create_discounts_table_v2.sql`
- Modify: `lib/discounts/types.ts`
- Modify: `lib/discounts/queries.ts`
- Modify: `app/api/admin/discounts/route.ts`
- Modify: `components/admin/discount-form.tsx`

- [ ] **Step 1: Add database fields**

Add `show_as_offer`, `offer_title`, `offer_description`, and `offer_priority` to the migration script and base create script.

- [ ] **Step 2: Map fields through API**

Extend `Discount`, `mapDiscountRow`, `createDiscount`, `updateDiscount`, and create payload normalization. Reject `showAsOffer` when no specific `userId` is selected.

- [ ] **Step 3: Add admin controls**

Add a disabled-until-personal section to `DiscountForm`: toggle, title, description, priority. Submit the fields with the existing payload.

- [ ] **Step 4: Verify green for schema/admin tests**

Run:

```bash
node --test tests/admin-discounts-flow.test.mjs
```

Expected: the schema/admin assertions pass; remaining UI assertions may still fail until Task 3.

### Task 3: Profile Offers Helper And UI

**Files:**
- Create: `lib/discounts/profile-offers.ts`
- Create: `components/profile/personal-offers.tsx`
- Modify: `app/[locale]/profile/page.tsx`
- Modify: `app/[locale]/profile/profile-content.tsx`
- Modify: `messages/uk.json`
- Modify: `messages/en.json`
- Modify: `messages/cs.json`

- [ ] **Step 1: Query eligible offers**

Create `getPersonalProfileOffers({ userId, locale, limit })` using active, non-expired, marked personal discounts with remaining usage. Resolve first service/model slug when possible.

- [ ] **Step 2: Render profile block**

Add `PersonalOffers` below the existing `UserProfile` card on the main profile tab. Hide it when the list is empty.

- [ ] **Step 3: Add translations**

Add profile keys for title, description, expiration, remaining uses, actions, and toast labels in Ukrainian, English, and Czech.

- [ ] **Step 4: Verify profile tests**

Run:

```bash
node --test tests/admin-discounts-flow.test.mjs
```

Expected: profile/helper/translation assertions pass; homepage toast assertions may still fail until Task 4.

### Task 4: Homepage Toast

**Files:**
- Create: `components/profile/personal-offer-toast.tsx`
- Modify: `app/[locale]/page.tsx`

- [ ] **Step 1: Add client toast**

Create a tiny client component that receives one offer, checks `localStorage`, and calls the existing `toast()` with an action to `/${locale}/profile`.

- [ ] **Step 2: Wire homepage server data**

On the non-B2B homepage, get the session user and fetch one personal offer. Render `PersonalOfferToast` only when an offer exists.

- [ ] **Step 3: Verify homepage tests**

Run:

```bash
node --test tests/admin-discounts-flow.test.mjs
```

Expected: all tests in this file pass.

### Task 5: Final Verification

**Files:**
- All touched files

- [ ] **Step 1: Typecheck**

Run:

```bash
npx tsc --noEmit
```

Expected: no TypeScript errors.

- [ ] **Step 2: Build**

Run:

```bash
npm run build
```

Expected: production build completes.

- [ ] **Step 3: Review diff**

Run:

```bash
git diff --stat
git diff --check
```

Expected: focused changes, no whitespace errors.

