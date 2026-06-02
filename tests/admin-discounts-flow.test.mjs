import { readFile } from "node:fs/promises"
import assert from "node:assert/strict"
import test from "node:test"

async function read(path) {
  return readFile(new URL(path, import.meta.url), "utf8")
}

function extractFunction(source, name) {
  const start = source.indexOf(`export async function ${name}`)
  assert.notEqual(start, -1, `${name} function is missing`)

  const next = source.indexOf("\nexport async function ", start + 1)
  return source.slice(start, next === -1 ? source.length : next)
}

test("admin discounts API lists all discounts, not only currently active discounts", async () => {
  const route = await read("../app/api/admin/discounts/route.ts")
  const queries = await read("../lib/discounts/queries.ts")
  const listFunction = extractFunction(queries, "getAllDiscounts")

  assert.match(route, /getAllDiscounts/)
  assert.doesNotMatch(route, /getActiveDiscounts/)
  assert.match(listFunction, /\.from\(["']discounts["']\)/)
  assert.doesNotMatch(listFunction, /\.eq\(["']is_active["'],\s*true\)/)
  assert.doesNotMatch(listFunction, /starts_at\.lte/)
  assert.doesNotMatch(listFunction, /expires_at\.gt/)
})

test("discount updates persist every editable field from the form", async () => {
  const queries = await read("../lib/discounts/queries.ts")
  const updateFunction = extractFunction(queries, "updateDiscount")

  for (const [field, column] of [
    ["code", "code"],
    ["discountType", "discount_type"],
    ["discountValue", "discount_value"],
    ["serviceIds", "service_ids"],
    ["scopeType", "scope_type"],
    ["brandId", "brand_id"],
    ["seriesId", "series_id"],
    ["modelId", "model_id"],
    ["isActive", "is_active"],
    ["startsAt", "starts_at"],
    ["expiresAt", "expires_at"],
    ["maxUses", "max_uses"],
    ["maxUsesPerUser", "max_uses_per_user"],
    ["userId", "user_id"],
    ["requiresCode", "requires_code"],
    ["showAsOffer", "show_as_offer"],
    ["offerTitle", "offer_title"],
    ["offerDescription", "offer_description"],
    ["offerPriority", "offer_priority"],
  ]) {
    assert.match(updateFunction, new RegExp(`updates\\.${field} !== undefined[\\s\\S]*updateData\\.${column}`))
  }
})

test("discount form supports global or personal discounts and validates scoped selections", async () => {
  const form = await read("../components/admin/discount-form.tsx")

  assert.match(form, /type AdminUser/)
  assert.match(form, /fetchUsers/)
  assert.match(form, /\/api\/admin\/users\?/)
  assert.match(form, /CommandItem[\s\S]*value=["']global["']/)
  assert.match(form, /formData\.userId === ["']global["'] \? null : formData\.userId/)
  assert.match(form, /scopeType === ["']brand["'][\s\S]*!formData\.brandId/)
  assert.match(form, /scopeType === ["']series["'][\s\S]*!formData\.seriesId/)
  assert.match(form, /scopeType === ["']model["'][\s\S]*!formData\.modelId/)
  assert.doesNotMatch(form, /value=["']all_series["']/)
})

test("admin users API used by personal discounts is admin-only", async () => {
  const usersRoute = await read("../app/api/admin/users/route.ts")

  assert.match(usersRoute, /getSession/)
  assert.match(usersRoute, /session\.user\.role !== ["']admin["']/)
  assert.match(usersRoute, /Unauthorized/)
  assert.match(usersRoute, /phoneProfiles/)
  assert.match(usersRoute, /profiles"\)\.select\("id"\)\.ilike\("phone"/)
  assert.match(usersRoute, /id\.eq/)
})

test("admin discounts API validates create payload before inserting", async () => {
  const route = await read("../app/api/admin/discounts/route.ts")

  assert.match(route, /function normalizeDiscountPayload/)
  assert.match(route, /async function validatePersonalDiscountUser/)
  assert.match(route, /\.from\(["']users["']\)\.select\(["']id["']\)/)
  assert.match(route, /String\(body\.code \?\? ""\)\.trim\(\)\.toUpperCase\(\)/)
  assert.match(route, /serviceIds\.length === 0/)
  assert.match(route, /return NextResponse\.json\(\{ error: validation\.error \}, \{ status: 400 \}\)/)
  assert.match(route, /return NextResponse\.json\(\{ error: userValidation\.error \}, \{ status: 400 \}\)/)
  assert.match(route, /isDuplicateDiscountCodeError/)
  assert.match(route, /status: isDuplicateDiscountCodeError\(details\) \? 409 : 500/)
  assert.doesNotMatch(route, /body\.code\.toUpperCase\(\)/)
})

test("discount personal user foreign key targets public users, not auth users", async () => {
  const addUserMigration = await read("../scripts/add_user_id_to_discounts.sql")
  const repairMigration = await read("../scripts/fix_discounts_user_id_fk.sql")
  const createV2 = await read("../scripts/create_discounts_table_v2.sql")

  assert.match(addUserMigration, /REFERENCES public\.users\(id\) ON DELETE SET NULL/)
  assert.doesNotMatch(addUserMigration, /REFERENCES auth\.users/)
  assert.match(repairMigration, /DROP CONSTRAINT IF EXISTS discounts_user_id_fkey/)
  assert.match(repairMigration, /FOREIGN KEY \(user_id\) REFERENCES public\.users\(id\) ON DELETE SET NULL/)
  assert.match(createV2, /user_id UUID REFERENCES public\.users\(id\) ON DELETE SET NULL/)
})

test("admin discounts page shows API error details from failed creates", async () => {
  const page = await read("../app/[locale]/admin/discounts/page.tsx")

  assert.match(page, /const errorPayload = await response\.json\(\)\.catch/)
  assert.match(page, /errorPayload\?\.details \|\| errorPayload\?\.error \|\|/)
  assert.match(page, /setCreateError\(message\)/)
})

test("discount form uses searchable personal user picker", async () => {
  const form = await read("../components/admin/discount-form.tsx")

  assert.match(form, /CommandInput/)
  assert.match(form, /PopoverTrigger/)
  assert.match(form, /function getUserSearchText/)
  assert.match(form, /user\.phone/)
  assert.match(form, /user\.id/)
  assert.match(form, /filteredUsers/)
  assert.doesNotMatch(form, /<Select value=\{formData\.userId\}/)
})

test("legacy non-localized discounts page does not render the stale mock list", async () => {
  const page = await read("../app/admin/discounts/page.tsx")

  assert.match(page, /redirect\(`\/\$\{DEFAULT_LOCALE\}\/admin\/discounts`\)/)
  assert.doesNotMatch(page, /DiscountsList/)
  assert.doesNotMatch(page, /\/admin\/discounts\/new/)
})

test("admin sidebar keeps admin links inside the current locale", async () => {
  const sidebar = await read("../components/admin/admin-sidebar.tsx")

  assert.match(sidebar, /localeMatch/)
  assert.match(sidebar, /localizedHref/)
  assert.match(sidebar, /href=\{localizedHref\}/)
})

test("authenticated discount requests bypass client cache so personal discounts can apply", async () => {
  const files = [
    "../app/[locale]/models/[slug]/model-page-client.tsx",
    "../app/[locale]/services/[slug]/service-page-client.tsx",
    "../app/[locale]/book/standalone-booking-client.tsx",
  ]

  for (const file of files) {
    const source = await read(file)
    assert.match(source, /hasSession/)
    assert.match(source, /if \(!hasSession\)[\s\S]*discountCache\.get/)
    assert.match(source, /if \(!hasSession\)[\s\S]*discountCache\.set/)
  }
})

test("booking discount requests use services.id rather than model_services.id", async () => {
  const standalone = await read("../app/[locale]/book/standalone-booking-client.tsx")
  const confirm = await read("../app/[locale]/book/confirm/booking-confirm-client.tsx")

  assert.match(standalone, /service_id\?: string/)
  assert.match(standalone, /serviceId: s\.service_id \|\| s\.id/)
  assert.match(standalone, /const discountServiceId = service\.service_id \|\| service\.id/)
  assert.match(confirm, /service_id: foundService\.service_id/)
  assert.match(confirm, /serviceId: foundService\.service_id \|\| foundService\.id/)
})

test("discount schema and admin flow support code-only discounts", async () => {
  const types = await read("../lib/discounts/types.ts")
  const queries = await read("../lib/discounts/queries.ts")
  const form = await read("../components/admin/discount-form.tsx")
  const route = await read("../app/api/admin/discounts/route.ts")
  const addCodeOnlyMigration = await read("../scripts/add_requires_code_to_discounts.sql")
  const createV2 = await read("../scripts/create_discounts_table_v2.sql")

  assert.match(types, /requiresCode\??:\s*boolean/)
  assert.match(queries, /requiresCode:\s*row\.requires_code/)
  assert.match(queries, /requires_code:\s*discount\.requiresCode/)
  assert.match(queries, /updateData\.requires_code\s*=\s*updates\.requiresCode/)
  assert.match(form, /requiresCode:\s*initialData\?\.requiresCode/)
  assert.match(form, /id=["']requiresCode["']/)
  assert.match(form, /requiresCode:\s*formData\.requiresCode/)
  assert.match(route, /requiresCode:\s*Boolean\(body\.requiresCode\)/)
  assert.match(addCodeOnlyMigration, /ADD COLUMN IF NOT EXISTS requires_code BOOLEAN NOT NULL DEFAULT false/)
  assert.match(createV2, /requires_code BOOLEAN NOT NULL DEFAULT false/)
})

test("discount schema and admin flow support personal profile offers", async () => {
  const types = await read("../lib/discounts/types.ts")
  const queries = await read("../lib/discounts/queries.ts")
  const form = await read("../components/admin/discount-form.tsx")
  const route = await read("../app/api/admin/discounts/route.ts")
  const addOfferMigration = await read("../scripts/add_personal_offer_fields_to_discounts.sql")
  const createV2 = await read("../scripts/create_discounts_table_v2.sql")

  assert.match(types, /showAsOffer\??:\s*boolean/)
  assert.match(types, /offerTitle\??:\s*string/)
  assert.match(types, /offerDescription\??:\s*string/)
  assert.match(types, /offerPriority\??:\s*number/)
  assert.match(queries, /showAsOffer:\s*row\.show_as_offer/)
  assert.match(queries, /offerTitle:\s*row\.offer_title/)
  assert.match(queries, /show_as_offer:/)
  assert.match(queries, /discount\.showAsOffer/)
  assert.match(queries, /updateData\.show_as_offer/)
  assert.match(queries, /updates\.showAsOffer/)
  assert.match(route, /const showAsOffer = Boolean\(body\.showAsOffer\)/)
  assert.match(route, /showAsOffer,/)
  assert.match(route, /Profile offers require a selected user/)
  assert.match(form, /showAsOffer:\s*initialData\?\.showAsOffer/)
  assert.match(form, /id=["']showAsOffer["']/)
  assert.match(form, /offerTitle/)
  assert.match(form, /formData\.userId !== ["']global["']/)
  assert.match(addOfferMigration, /ADD COLUMN IF NOT EXISTS show_as_offer BOOLEAN NOT NULL DEFAULT false/)
  assert.match(addOfferMigration, /ADD COLUMN IF NOT EXISTS offer_title TEXT/)
  assert.match(addOfferMigration, /idx_discounts_profile_offers/)
  assert.match(createV2, /show_as_offer BOOLEAN NOT NULL DEFAULT false/)
  assert.match(createV2, /offer_priority INTEGER NOT NULL DEFAULT 0/)
})

test("personal profile offers power profile cards and homepage toast", async () => {
  const helper = await read("../lib/discounts/profile-offers.ts")
  const profilePage = await read("../app/[locale]/profile/page.tsx")
  const profileContent = await read("../app/[locale]/profile/profile-content.tsx")
  const offersComponent = await read("../components/profile/personal-offers.tsx")
  const toastComponent = await read("../components/profile/personal-offer-toast.tsx")
  const homePage = await read("../app/[locale]/page.tsx")

  assert.match(helper, /export async function getPersonalProfileOffers/)
  assert.match(helper, /\.eq\(["']show_as_offer["'],\s*true\)/)
  assert.match(helper, /\.eq\(["']user_id["'],\s*userId\)/)
  assert.match(helper, /getRemainingUses/)
  assert.match(helper, /offer_priority/)
  assert.match(profilePage, /getPersonalProfileOffers/)
  assert.match(profilePage, /personalOffers/)
  assert.match(profileContent, /personalOffers/)
  assert.match(profileContent, /<PersonalOffers offers=\{personalOffers\}/)
  assert.match(offersComponent, /specialOffersTitle/)
  assert.match(offersComponent, /offerUsesLeft/)
  assert.match(toastComponent, /sessionStorage/)
  assert.doesNotMatch(toastComponent, /localStorage/)
  assert.match(toastComponent, /personal-offer-toast/)
  assert.match(toastComponent, /offerToastAction/)
  assert.match(homePage, /getSession/)
  assert.match(homePage, /getPersonalProfileOffers/)
  assert.match(homePage, /<PersonalOfferToast/)
})

test("toast callers and renderer share one toast store", async () => {
  const hookToast = await read("../hooks/use-toast.ts")
  const uiToast = await read("../components/ui/use-toast.ts")
  const toaster = await read("../components/ui/toaster.tsx")
  const offerToast = await read("../components/profile/personal-offer-toast.tsx")

  assert.match(uiToast, /let memoryState/)
  assert.match(hookToast, /export \{ useToast, toast \} from ["']@\/components\/ui\/use-toast["']/)
  assert.doesNotMatch(hookToast, /let memoryState/)
  assert.match(toaster, /@\/hooks\/use-toast/)
  assert.match(offerToast, /@\/components\/ui\/use-toast/)
})

test("personal offer toast is shown once per browser session", async () => {
  const offerToast = await read("../components/profile/personal-offer-toast.tsx")

  assert.match(offerToast, /window\.sessionStorage/)
  assert.match(offerToast, /setItem\(storageKey,\s*["']shown["']\)/)
  assert.doesNotMatch(offerToast, /window\.localStorage/)
  assert.doesNotMatch(offerToast, /onOpenChange/)
})

test("automatic discount pricing excludes code-only discounts while keeping personal discounts eligible", async () => {
  const pricing = await read("../lib/discounts/get-applicable-discounts.ts")

  assert.match(pricing, /requires_code/)
  assert.match(pricing, /if \(discount\.requires_code\) \{/)
  assert.match(pricing, /candidatePrice < bestServiceDiscountedPrice/)
  assert.match(pricing, /discount\.user_id && discount\.user_id !== userId/)
})

test("booking discount resolver calculates best final price and records discount usage", async () => {
  const resolver = await read("../lib/discounts/booking-discounts.ts")

  assert.match(resolver, /export async function resolveBookingDiscount/)
  assert.match(resolver, /export async function recordDiscountUsage/)
  assert.match(resolver, /type:\s*["']none["']/)
  assert.match(resolver, /type:\s*["']personal["']/)
  assert.match(resolver, /type:\s*["']code["']/)
  assert.match(resolver, /bestCandidate/)
  assert.match(resolver, /discount_usages/)
  assert.match(resolver, /current_uses/)
  assert.match(resolver, /max_uses_per_user/)
})

test("booking discount matching keeps legacy service-scoped discounts eligible", async () => {
  const resolver = await read("../lib/discounts/booking-discounts.ts")
  const pricing = await read("../lib/discounts/get-applicable-discounts.ts")

  for (const source of [resolver, pricing]) {
    assert.match(source, /service_id\?:\s*string \| null/)
    assert.match(source, /scope_type === ["']service["']/)
    assert.match(source, /scope_type === ["']all_services["']/)
    assert.match(source, /serviceIds\.length > 0[\s\S]*!serviceIds\.includes\(serviceId\)/)
  }
})

test("booking API validates discounts server-side instead of trusting client price", async () => {
  const route = await read("../app/api/book-service/route.ts")

  assert.match(route, /resolveBookingDiscount/)
  assert.match(route, /recordDiscountUsage/)
  assert.match(route, /serviceId,\s*modelId,\s*originalPrice,\s*discountChoice/)
  assert.match(route, /pricing\.formattedFinalPrice/)
  assert.doesNotMatch(route, /priceInfo = price \?/)
})

test("booking confirmation exposes optional discount choice and sends it to booking API", async () => {
  const component = await read("../app/[locale]/book/booking-confirmation.tsx")
  const confirm = await read("../app/[locale]/book/confirm/booking-confirm-client.tsx")

  assert.match(component, /getBookingDiscountPreview/)
  assert.match(component, /discountChoice/)
  assert.match(component, /discountCode/)
  assert.match(component, /type:\s*["']none["']/)
  assert.match(component, /type:\s*["']personal["']/)
  assert.match(component, /type:\s*["']code["']/)
  assert.match(component, /serviceId:\s*localizedService\?\.serviceId/)
  assert.match(component, /originalPrice:\s*localizedService\?\.originalPrice/)
  assert.match(confirm, /originalPrice:\s*foundService\.price/)
  assert.doesNotMatch(confirm, /fetchedService\.price = discount\.discountedPrice/)
})

test("booking confirmation preloads user and initial discount state before rendering the form", async () => {
  const action = await read("../app/actions/booking-discounts.ts")
  const component = await read("../app/[locale]/book/booking-confirmation.tsx")
  const confirm = await read("../app/[locale]/book/confirm/booking-confirm-client.tsx")

  assert.match(action, /export async function getInitialBookingDiscountState/)
  assert.match(confirm, /getInitialBookingDiscountState/)
  assert.match(confirm, /initialDiscountState/)
  assert.match(confirm, /initialCurrentUserStatus/)
  assert.match(confirm, /initialUser/)
  assert.match(component, /initialDiscountPreview/)
  assert.match(component, /initialDiscountChoice/)
  assert.match(component, /hasSkippedInitialDiscountFetch/)
})

test("booking discount code errors are localized and include actionable targets", async () => {
  const resolver = await read("../lib/discounts/booking-discounts.ts")
  const component = await read("../app/[locale]/book/booking-confirmation.tsx")

  assert.match(resolver, /selectionErrorCode/)
  assert.match(resolver, /selectionErrorContext/)
  assert.match(resolver, /buildDiscountErrorContext/)
  assert.match(resolver, /discount_code_not_applicable/)
  assert.match(resolver, /discount_code_wrong_account/)
  assert.match(component, /getDiscountCodeErrorMessage/)
  assert.match(component, /getDiscountCodeErrorAction/)
  assert.match(component, /discountCodeErrorNotApplicable/)
  assert.match(component, /discountCodeGoToService/)
})

test("booking confirmation nudges guests without optional discounts to register", async () => {
  const component = await read("../app/[locale]/book/booking-confirmation.tsx")

  assert.match(component, /<details/)
  assert.match(component, /<summary/)
  assert.match(component, /discountSignupPrompt/)
  assert.match(component, /discountSignupDescription/)
  assert.match(component, /discountSignupButton/)
  assert.match(component, /href=\{`\/\$\{locale\}\/auth\/register`\}/)
  assert.match(component, /currentUserStatus === ["']guest["']/)
  assert.doesNotMatch(component, /!isRegisteredUser \|\| !discountPreview/)
  assert.doesNotMatch(component, /discountPreview\.personalDiscounts\.length === 0/)
})

test("booking discount signup nudge has translations in all locales", async () => {
  for (const locale of ["uk", "en", "cs"]) {
    const messages = await read(`../messages/${locale}.json`)

    assert.match(messages, /"discountSignupPrompt"/)
    assert.match(messages, /"discountSignupDescription"/)
    assert.match(messages, /"discountSignupButton"/)
    assert.match(messages, /"discountCodeErrorNotApplicable"/)
    assert.match(messages, /"discountCodeGoToService"/)
    assert.match(messages, /"discountCodeGoToModel"/)
  }
})

test("personal profile offers have translations in all locales", async () => {
  for (const locale of ["uk", "en", "cs"]) {
    const messages = await read(`../messages/${locale}.json`)

    assert.match(messages, /"specialOffersTitle"/)
    assert.match(messages, /"specialOffersDescription"/)
    assert.match(messages, /"offerExpiresOn"/)
    assert.match(messages, /"offerUsesLeft"/)
    assert.match(messages, /"useOffer"/)
    assert.match(messages, /"viewServices"/)
    assert.match(messages, /"offerToastTitle"/)
    assert.match(messages, /"offerToastAction"/)
  }
})
