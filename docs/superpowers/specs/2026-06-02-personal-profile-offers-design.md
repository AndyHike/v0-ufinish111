# Personal Profile Offers Design

## Goal

Show selected personal offers on the main profile page for logged-in users. Offers are based on existing personal discounts, so discount calculation, usage limits, expiration dates, service/model scope, and booking behavior stay in one system.

The profile should feel useful immediately: if a user has an active offer, they see it on the first profile tab without opening the full discounts tab.

## Scope

- Add offer presentation fields to personal discounts.
- Let admins mark a personal discount as a profile offer.
- Show active marked offers on the main profile tab.
- Keep general and role discounts in the current discount flow.
- Keep the existing "My discounts" tab as the full list.

## Non-Goals

- Do not create a separate `special_offers` system.
- Do not show general or role discounts as profile offers.
- Do not add popups, global banners, or notification mechanics in this step.
- Do not change the best-price discount calculation rule.

## Data Model

Extend `discounts` with presentation-only fields:

- `show_as_offer boolean not null default false`
- `offer_title text null`
- `offer_description text null`
- `offer_priority integer not null default 0`

An offer is eligible for the profile when:

- `discounts.user_id` equals the current user id
- `is_active = true`
- `show_as_offer = true`
- `starts_at` is empty or not in the future
- `expires_at` is empty or not expired
- global and per-user usage limits are not exhausted

The discount remains the source of truth. The offer fields only control how it is displayed.

## Admin Experience

In the discount create/edit form, add a section for personal offer display:

- Toggle: "Show as personal offer in profile"
- Offer title
- Offer description
- Optional priority

The section is enabled only for a discount assigned to a specific user. If no user is selected, the toggle and offer fields are disabled with helper text explaining that profile offers require a specific account.

The existing user search flow remains the way to pick the target account.

## Profile Experience

On the main profile tab, show a compact "Specially for you" block directly below the account card.

The block should:

- Render only when at least one eligible personal offer exists.
- Show up to three offers by priority, then nearest expiration date.
- Display title, short description, discount value, remaining uses if limited, and expiration date if present.
- Use a clear action:
  - link to the scoped service/model page when the offer has a resolvable target
  - otherwise link to booking/service browsing
- Stay compact on mobile and avoid pushing the profile details too far down.

If there are no personal offers, the block is not shown. The current discounts tab remains available for the user's full discount list.

## Booking Behavior

Booking continues to use the current discount preview and best-final-price logic.

If a profile offer is applicable to the selected service/model, it appears as a personal discount option in booking. The user can apply it or choose the base role/general discount instead, as already designed.

Using an offer records normal discount usage. There is no separate offer usage counter.

## Data Flow

1. Profile page loads the current session user.
2. Server queries eligible personal discounts marked as offers.
3. Server maps discount rows into profile offer view models.
4. Profile content receives both existing discount list data and the highlighted offer list.
5. The main profile tab renders the offer block only when the list is non-empty.

## Error Handling

- If offer query fails, do not block the profile page. Log the issue server-side and render the profile without offers.
- If target service/model data is missing, show the offer without a specific target link and use a safe fallback action.
- If a discount expires or usage is exhausted between profile view and booking, booking validation rejects it using the existing unavailable-discount flow.

## Translations

Add profile translation keys for Ukrainian, Czech, and English:

- `specialOffersTitle`
- `specialOffersDescription`
- `offerExpiresOn`
- `offerUsesLeft`
- `useOffer`
- `viewServices`

Admin labels can be added in the existing admin translation/location pattern if that section already uses shared text. If the admin discount form is still mostly hard-coded Ukrainian, keep labels consistent with the current form and avoid a partial translation rewrite.

## Testing

Add focused tests for:

- The profile query only returns active, non-expired, user-specific offers marked with `show_as_offer`.
- General and role discounts are not rendered as profile offers.
- Offer cards render title, value, expiration, and remaining uses.
- The profile page still renders when the offer query returns an error.
- Booking still records usage through the existing discount usage path.

Run:

- `node --test tests/admin-discounts-flow.test.mjs`
- `npx tsc --noEmit`
- `npm run build`
