# B2B Home Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current simple B2B homepage with the approved V4 restrained, business-focused DeviceHelp landing page.

**Architecture:** Keep the existing B2B routing and SEO architecture. Implement the redesign as one focused server component powered by `next-intl` message content, with small typed helpers for localized arrays. Keep B2B navigation host-safe by linking B2B-only sections on the B2B host and main-domain-only flows through `mainSiteUrl`.

**Tech Stack:** Next.js App Router, React Server Components, `next-intl`, Tailwind CSS, shadcn `Button`, `lucide-react`, Node test runner.

---

## File Structure

- Modify `components/b2b/b2b-home-page.tsx`: Owns the full B2B homepage layout, section ordering, localized list rendering, CTA/contact links, and restrained V4 visual style.
- Modify `messages/cs.json`: Czech default B2B homepage copy and structured section data.
- Modify `messages/uk.json`: Ukrainian B2B homepage copy and structured section data.
- Modify `messages/en.json`: English B2B homepage copy and structured section data.
- Modify `components/header.tsx`: Reorder desktop B2B navigation and add a same-page `#account` anchor.
- Modify `components/mobile-nav.tsx`: Keep mobile B2B bottom nav to four readable items and add `#account`.
- Modify `tests/b2b-content.test.mjs`: Lock the new content shape and B2B navigation anchors.

## Task 1: Lock Redesigned Content And Navigation With Tests

**Files:**
- Modify: `tests/b2b-content.test.mjs`

- [ ] **Step 1: Add B2B homepage content contract tests**

Add these tests after the existing FAQ message test:

```js
test("B2B home messages expose redesigned sections for every supported locale", async () => {
  for (const locale of ["cs", "uk", "en"]) {
    const raw = await readFile(new URL(`../messages/${locale}.json`, import.meta.url), "utf8")
    const messages = JSON.parse(raw)
    const home = messages.B2B?.home

    assert.equal(typeof home?.title, "string", `${locale} title`)
    assert.equal(typeof home?.subtitle, "string", `${locale} subtitle`)
    assert.equal(typeof home?.primaryCta, "string", `${locale} primary CTA`)
    assert.equal(typeof home?.secondaryCta, "string", `${locale} secondary CTA`)

    assert.ok(Array.isArray(home?.proofRows), `${locale} proof rows`)
    assert.equal(home.proofRows.length, 3, `${locale} proof row count`)

    assert.equal(typeof home?.cooperationTitle, "string", `${locale} cooperation title`)
    assert.equal(typeof home?.cooperationText, "string", `${locale} cooperation text`)
    assert.ok(Array.isArray(home?.cooperationBenefits), `${locale} cooperation benefits`)
    assert.equal(home.cooperationBenefits.length, 6, `${locale} cooperation benefit count`)

    assert.equal(typeof home?.accountTitle, "string", `${locale} account title`)
    assert.equal(typeof home?.accountText, "string", `${locale} account text`)
    assert.ok(Array.isArray(home?.accountFeatures), `${locale} account features`)
    assert.equal(home.accountFeatures.length, 5, `${locale} account feature count`)

    assert.equal(typeof home?.processText, "string", `${locale} process text`)
    assert.ok(Array.isArray(home?.processSteps), `${locale} process steps`)
    assert.equal(home.processSteps.length, 4, `${locale} process step count`)

    for (const [key, items] of Object.entries({
      cooperationBenefits: home.cooperationBenefits,
      accountFeatures: home.accountFeatures,
      processSteps: home.processSteps,
    })) {
      for (const item of items) {
        assert.equal(typeof item.title, "string", `${locale} ${key} title`)
        assert.equal(typeof item.text, "string", `${locale} ${key} text`)
      }
    }

    const content = JSON.stringify(home)
    assert.doesNotMatch(content, /B2B account|B2B účet|B2B акаунт/i)
  }
})

test("B2B navigation exposes redesigned section anchors", async () => {
  const headerSource = await readFile(new URL("../components/header.tsx", import.meta.url), "utf8")
  const mobileSource = await readFile(new URL("../components/mobile-nav.tsx", import.meta.url), "utf8")

  assert.match(headerSource, /#benefits/)
  assert.match(headerSource, /#account/)
  assert.match(headerSource, /#how-it-works/)
  assert.match(headerSource, /auth\/register\?b2b=1/)
  assert.match(mobileSource, /#benefits/)
  assert.match(mobileSource, /#account/)
})
```

- [ ] **Step 2: Run the content tests and confirm they fail**

Run:

```powershell
npm.cmd run test:b2b-content
```

Expected: FAIL because `proofRows`, `cooperationBenefits`, `accountFeatures`, `processSteps`, and `#account` are not implemented yet.

- [ ] **Step 3: Commit the failing tests**

```powershell
git add tests/b2b-content.test.mjs
git commit -m "test: lock b2b homepage redesign contract"
```

## Task 2: Add Localized V4 Homepage Content

**Files:**
- Modify: `messages/cs.json`
- Modify: `messages/uk.json`
- Modify: `messages/en.json`

- [ ] **Step 1: Replace the Czech `B2B.home` block with the V4 content shape**

Use this Czech content for `messages/cs.json` under `B2B.home`:

```json
{
  "eyebrow": "Firemní servis mobilních telefonů",
  "title": "Servis mobilních telefonů pro firmy a podnikatele",
  "subtitle": "Firemní účet pro rychlé zadání oprav, přehled stavu, fakturaci a výhodnější podmínky pro opakovaný servis.",
  "primaryCta": "Registrovat firemní účet",
  "secondaryCta": "Kontaktovat servis",
  "proofRows": ["Svoz po Praze", "Zaslání po celé ČR", "Online přehled oprav"],
  "cooperationTitle": "Výhody spolupráce",
  "cooperationText": "Navrhli jsme firemní servis tak, aby šetřil čas, zjednodušil celý proces a přinesl lepší podmínky pro pracovní zařízení.",
  "cooperationBenefits": [
    { "title": "Svoz a předání v Praze", "text": "Vyvedneme zařízení přímo u vás a po opravě je bezpečně vrátíme zpět." },
    { "title": "Zaslání po celé České republice", "text": "Zařízení nám jednoduše pošlete. O průběh opravy a dokončení se postaráme." },
    { "title": "Výhodnější ceny pro firemní účet", "text": "Registrované firmy a podnikatelé mohou využít lepší ceny a podmínky pro opakovaný servis." },
    { "title": "Priorita při zpracování", "text": "Firemní zakázky mají jasný postup, rychlou komunikaci a kratší čekací dobu." },
    { "title": "Záruka na provedený servis", "text": "Na provedené opravy poskytujeme záruku podle typu služby a použitých dílů." },
    { "title": "Průběžný přehled stavu opravy", "text": "Stav zakázky můžete sledovat online, takže vždy víte, co se právě děje." }
  ],
  "accountTitle": "Firemní účet",
  "accountText": "Přehledné místo pro správu oprav, dokumentů, fakturace a firemních údajů.",
  "accountFeatures": [
    { "title": "Stav oprav v reálném čase", "text": "Okamžitý přehled o každé zakázce od převzetí po dokončení." },
    { "title": "Historie zakázek", "text": "Všechny opravy firemních zařízení na jednom místě." },
    { "title": "Faktury a dokumenty online", "text": "Faktury, daňové doklady a servisní dokumenty dostupné v účtu." },
    { "title": "Firemní údaje na jednom místě", "text": "Správa adres, kontaktů a fakturačních údajů bez opakovaného vyplňování." },
    { "title": "Slevy a podmínky pro opakovaný servis", "text": "Individuální ceny a zvýhodnění pro pravidelnou spolupráci." }
  ],
  "processTitle": "Jak spolupráce funguje",
  "processText": "Čtyři jednoduché kroky k rychlé a spolehlivé opravě vašich zařízení.",
  "processSteps": [
    { "title": "Registrace účtu", "text": "Vytvoříte firemní účet během pár minut online." },
    { "title": "Schválení firemních údajů", "text": "Ověříme údaje a aktivujeme účet pro firemní spolupráci." },
    { "title": "Předání zařízení nebo zaslání poštou", "text": "Zařízení předáte v Praze, nebo ho pošlete odkudkoli po ČR." },
    { "title": "Oprava, stav online a dokončení", "text": "Opravu sledujete online a po dokončení zařízení převezmete nebo vám ho vrátíme." }
  ],
  "contactTitle": "Připraveni spolupracovat?",
  "contactText": "Zaregistrujte si firemní účet a získejte výhodnější servis pro pracovní zařízení.",
  "contactHelpTitle": "Potřebujete poradit?",
  "contactHelpText": "Jsme tu pro vás v pracovní dny 9:00–18:00.",
  "emailLabel": "Odpovíme obvykle do 1 hodiny.",
  "phoneLabel": "Zavolejte nám nebo napište.",
  "finalTitle": "Začněte firemní spolupráci s DeviceHelp",
  "finalText": "Registrace firemního účtu zabere jen chvíli. Po kontrole údajů vás budeme informovat o aktivaci."
}
```

- [ ] **Step 2: Replace the Ukrainian `B2B.home` block with the V4 content shape**

Use this Ukrainian content for `messages/uk.json` under `B2B.home`:

```json
{
  "eyebrow": "Сервіс мобільних телефонів для компаній",
  "title": "Ремонт мобільних телефонів для компаній і підприємців",
  "subtitle": "Акаунт компанії для швидкого оформлення ремонтів, перегляду стану, фактурації та вигідніших умов для повторного сервісу.",
  "primaryCta": "Зареєструвати акаунт компанії",
  "secondaryCta": "Зв'язатися із сервісом",
  "proofRows": ["Забір по Празі", "Відправка по всій Чехії", "Онлайн-статус ремонтів"],
  "cooperationTitle": "Переваги співпраці",
  "cooperationText": "Ми побудували сервіс для компаній так, щоб економити час, спростити процес і дати кращі умови для робочих пристроїв.",
  "cooperationBenefits": [
    { "title": "Забір і повернення в Празі", "text": "Ми заберемо пристрої у вас і після ремонту безпечно повернемо назад." },
    { "title": "Відправка по всій Чехії", "text": "Ви просто надсилаєте нам пристрій. Ми подбаємо про ремонт, комунікацію та завершення." },
    { "title": "Кращі ціни для акаунта компанії", "text": "Зареєстровані компанії та підприємці можуть отримати вигідніші ціни й умови для повторного сервісу." },
    { "title": "Пріоритетне опрацювання", "text": "Фірмові замовлення мають зрозумілий процес, швидку комунікацію та коротший час очікування." },
    { "title": "Гарантія на виконаний сервіс", "text": "На виконані ремонти надається гарантія залежно від типу послуги та використаних деталей." },
    { "title": "Поточний огляд стану ремонту", "text": "Стан замовлення можна відстежувати онлайн, щоб завжди знати, що саме відбувається." }
  ],
  "accountTitle": "Акаунт компанії",
  "accountText": "Зручне місце для управління ремонтами, документами, фактурами та фірмовими даними.",
  "accountFeatures": [
    { "title": "Стан ремонту в реальному часі", "text": "Швидкий огляд кожного замовлення від прийняття до завершення." },
    { "title": "Історія замовлень", "text": "Усі ремонти робочих пристроїв в одному місці." },
    { "title": "Фактури й документи онлайн", "text": "Фактури, податкові документи та сервісні документи доступні в акаунті." },
    { "title": "Фірмові дані в одному місці", "text": "Адреси, контакти та платіжні дані не потрібно вводити повторно." },
    { "title": "Знижки та умови для повторного сервісу", "text": "Індивідуальні ціни й переваги для регулярної співпраці." }
  ],
  "processTitle": "Як працює співпраця",
  "processText": "Чотири прості кроки до швидкого й надійного ремонту ваших пристроїв.",
  "processSteps": [
    { "title": "Реєстрація акаунта", "text": "Ви створюєте акаунт компанії онлайн за кілька хвилин." },
    { "title": "Підтвердження фірмових даних", "text": "Ми перевіряємо дані та активуємо акаунт для співпраці." },
    { "title": "Передача пристрою або відправка поштою", "text": "Пристрій можна передати в Празі або надіслати з будь-якого місця в Чехії." },
    { "title": "Ремонт, онлайн-статус і завершення", "text": "Ви стежите за ремонтом онлайн, а після завершення отримуєте пристрій назад." }
  ],
  "contactTitle": "Готові почати співпрацю?",
  "contactText": "Зареєструйте акаунт компанії та отримайте вигідніший сервіс для робочих пристроїв.",
  "contactHelpTitle": "Потрібна порада?",
  "contactHelpText": "Ми на зв'язку в робочі дні з 9:00 до 18:00.",
  "emailLabel": "Зазвичай відповідаємо протягом 1 години.",
  "phoneLabel": "Зателефонуйте або напишіть нам.",
  "finalTitle": "Почніть співпрацю з DeviceHelp для компанії",
  "finalText": "Реєстрація акаунта компанії займає лише кілька хвилин. Після перевірки даних ми повідомимо вас про активацію."
}
```

- [ ] **Step 3: Replace the English `B2B.home` block with the V4 content shape**

Use this English content for `messages/en.json` under `B2B.home`:

```json
{
  "eyebrow": "Company mobile phone service",
  "title": "Mobile phone repair for companies and entrepreneurs",
  "subtitle": "A business account for fast repair requests, repair status overview, invoicing, and better conditions for repeated service.",
  "primaryCta": "Register a business account",
  "secondaryCta": "Contact service",
  "proofRows": ["Pickup in Prague", "Shipping across Czechia", "Online repair overview"],
  "cooperationTitle": "Cooperation benefits",
  "cooperationText": "We designed the company service to save time, simplify the process, and offer better conditions for work devices.",
  "cooperationBenefits": [
    { "title": "Pickup and return in Prague", "text": "We pick up devices directly from you and safely return them after repair." },
    { "title": "Shipping across the Czech Republic", "text": "Send us the device from anywhere. We handle the repair flow and completion." },
    { "title": "Better prices for a business account", "text": "Registered companies and entrepreneurs can use better prices and conditions for repeated service." },
    { "title": "Priority processing", "text": "Company repairs get a clear process, fast communication, and shorter waiting time." },
    { "title": "Warranty on completed service", "text": "Completed repairs include warranty depending on the service type and parts used." },
    { "title": "Ongoing repair status overview", "text": "Track repair progress online so you always know what is happening." }
  ],
  "accountTitle": "Business account",
  "accountText": "A clear place to manage repairs, documents, invoices, and company details.",
  "accountFeatures": [
    { "title": "Real-time repair status", "text": "Immediate overview of every repair from intake to completion." },
    { "title": "Order history", "text": "All repairs of company devices in one place." },
    { "title": "Invoices and documents online", "text": "Invoices, tax documents, and service documents available in the account." },
    { "title": "Company details in one place", "text": "Manage addresses, contacts, and billing details without entering them repeatedly." },
    { "title": "Discounts and conditions for repeated service", "text": "Individual prices and benefits for regular cooperation." }
  ],
  "processTitle": "How cooperation works",
  "processText": "Four simple steps to fast and reliable repair of your devices.",
  "processSteps": [
    { "title": "Account registration", "text": "Create a business account online in a few minutes." },
    { "title": "Company details approval", "text": "We verify the details and activate the account for company cooperation." },
    { "title": "Device handoff or postal shipping", "text": "Hand off the device in Prague or send it from anywhere in the Czech Republic." },
    { "title": "Repair, online status, and completion", "text": "Track the repair online and receive the device back after completion." }
  ],
  "contactTitle": "Ready to cooperate?",
  "contactText": "Register a business account and get better service for work devices.",
  "contactHelpTitle": "Need advice?",
  "contactHelpText": "We are available on business days from 9:00 to 18:00.",
  "emailLabel": "We usually reply within 1 hour.",
  "phoneLabel": "Call us or write to us.",
  "finalTitle": "Start company cooperation with DeviceHelp",
  "finalText": "Business account registration takes only a few minutes. After checking your details, we will inform you about activation."
}
```

- [ ] **Step 4: Run the content tests**

```powershell
npm.cmd run test:b2b-content
```

Expected: still FAIL because `#account` is not yet in the navigation files. The homepage message-shape assertions should pass.

- [ ] **Step 5: Commit the localized content**

```powershell
git add messages/cs.json messages/uk.json messages/en.json
git commit -m "feat: add b2b homepage redesign copy"
```

## Task 3: Update B2B Desktop And Mobile Navigation

**Files:**
- Modify: `components/header.tsx`
- Modify: `components/mobile-nav.tsx`

- [ ] **Step 1: Reorder desktop B2B navigation and add the account anchor**

In `components/header.tsx`, replace the `b2bNavigation` array with:

```tsx
const b2bNavigation = [
  { name: t("b2bHome"), href: `/${locale}`, icon: <Building2 className="h-5 w-5" /> },
  { name: t("b2bBenefits"), href: `/${locale}#benefits`, icon: <Wrench className="h-5 w-5" /> },
  { name: t("businessAccount"), href: `/${locale}#account`, icon: <User className="h-5 w-5" /> },
  { name: t("b2bHowItWorks"), href: `/${locale}#how-it-works`, icon: <Layers className="h-5 w-5" /> },
  { name: t("b2bFaq"), href: `/${locale}/faq`, icon: <MessageSquare className="h-5 w-5" /> },
  { name: t("chooseModel"), href: `${mainDomain}/${locale}/brands`, icon: <Smartphone className="h-5 w-5" /> },
]
```

Keep the existing registration CTA link to `${mainDomain}/${locale}/auth/register?b2b=1`.

- [ ] **Step 2: Keep mobile B2B nav readable and add the account anchor**

In `components/mobile-nav.tsx`, replace the `b2bNavigation` array with four bottom-nav items:

```tsx
const b2bNavigation = [
  {
    name: t("Header.b2bHome"),
    href: `/${locale}`,
    icon: <Home className="h-5 w-5" />,
  },
  {
    name: t("Header.b2bBenefits"),
    href: `/${locale}#benefits`,
    icon: <Wrench className="h-5 w-5" />,
  },
  {
    name: t("Header.businessAccount"),
    href: `/${locale}#account`,
    icon: <Smartphone className="h-5 w-5" />,
  },
  {
    name: t("Header.b2bFaq"),
    href: `/${locale}/faq`,
    icon: <MessageSquare className="h-5 w-5" />,
  },
]
```

- [ ] **Step 3: Run the content tests**

```powershell
npm.cmd run test:b2b-content
```

Expected: PASS.

- [ ] **Step 4: Commit navigation updates**

```powershell
git add components/header.tsx components/mobile-nav.tsx tests/b2b-content.test.mjs
git commit -m "feat: refine b2b navigation anchors"
```

## Task 4: Implement The V4 B2B Homepage Layout

**Files:**
- Modify: `components/b2b/b2b-home-page.tsx`

- [ ] **Step 1: Update imports and helpers**

Use the existing `Button` and `mainSiteUrl`. Add `next/image` and restrained icons:

```tsx
import Image from "next/image"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import {
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  FileText,
  History,
  Mail,
  Package,
  Percent,
  Phone,
  ShieldCheck,
  Truck,
  Wrench,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { mainSiteUrl } from "@/lib/site-config"
```

Add typed item parsing below `getStringArray`:

```tsx
interface B2BListItem {
  title: string
  text: string
}

function getItemArray(value: unknown): B2BListItem[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is B2BListItem => {
    return (
      typeof item === "object" &&
      item !== null &&
      typeof (item as B2BListItem).title === "string" &&
      typeof (item as B2BListItem).text === "string"
    )
  })
}
```

- [ ] **Step 2: Read the new localized arrays**

Inside `B2BHomePage`, read:

```tsx
const proofRows = getStringArray(t.raw("proofRows"))
const cooperationBenefits = getItemArray(t.raw("cooperationBenefits"))
const accountFeatures = getItemArray(t.raw("accountFeatures"))
const processSteps = getItemArray(t.raw("processSteps"))
const registerHref = `${mainSiteUrl}/${locale}/auth/register?b2b=1`
```

Remove reads of the old `audiences`, `benefits`, and `process` arrays.

- [ ] **Step 3: Replace the JSX with the V4 section order**

Use this section order and IDs:

```tsx
return (
  <div className="bg-white text-gray-950">
    <section className="border-b border-gray-100 bg-white">
      <div className="container grid gap-10 px-4 py-10 md:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1fr)] lg:items-center lg:py-20">
        {/* hero copy and CTA */}
      </div>
    </section>

    <section id="benefits" className="bg-gray-50 py-14 md:py-20">
      {/* Výhody spolupráce list/table */}
    </section>

    <section id="account" className="bg-white py-14 md:py-20">
      {/* Firemní účet structured rows */}
    </section>

    <section id="how-it-works" className="border-y border-gray-100 bg-gray-50 py-14 md:py-20">
      {/* 4-step calm process timeline */}
    </section>

    <section id="contact" className="bg-white py-14 md:py-20">
      {/* final CTA and contact */}
    </section>
  </div>
)
```

- [ ] **Step 4: Implement the hero**

Use `/focused-phone-fix.webp` for the hero image so the page stays visually tied to the current DeviceHelp site:

```tsx
<div className="flex flex-col justify-center">
  <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-gray-950 sm:text-4xl md:text-5xl">
    {t("title")}
  </h1>
  <p className="mt-5 max-w-2xl text-base leading-7 text-gray-600 md:text-lg">
    {t("subtitle")}
  </p>
  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
    <Button asChild size="lg" className="shadow-sm">
      <Link href={registerHref}>
        {t("primaryCta")}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </Button>
    <Button asChild size="lg" variant="ghost" className="justify-start px-0 text-primary hover:bg-transparent">
      <a href="#contact">
        {t("secondaryCta")}
        <ArrowRight className="h-4 w-4" />
      </a>
    </Button>
  </div>
  <div className="mt-8 divide-y divide-gray-200 border-y border-gray-200 text-sm text-gray-800">
    {proofRows.map((item) => (
      <div key={item} className="flex items-center gap-3 py-3">
        <Check className="h-4 w-4 text-gray-950" />
        <span>{item}</span>
      </div>
    ))}
  </div>
</div>
<div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-sm">
  <Image
    src="/focused-phone-fix.webp"
    alt={t("title")}
    width={900}
    height={620}
    priority
    className="aspect-[4/3] w-full object-cover"
    sizes="(max-width: 1024px) 100vw, 50vw"
  />
  <div className="absolute bottom-4 left-4 max-w-[260px] rounded-lg border border-gray-200 bg-white/95 p-4 shadow-sm">
    <p className="text-sm font-semibold text-gray-950">{t("eyebrow")}</p>
    <p className="mt-1 text-xs leading-5 text-gray-600">{proofRows[2]}</p>
  </div>
</div>
```

- [ ] **Step 5: Implement cooperation benefits as a structured list**

Use restrained monochrome icons and subtle dividers:

```tsx
const cooperationIcons = [Truck, Package, Percent, Clock3, ShieldCheck, Wrench]
```

Render rows with:

```tsx
<div className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white">
  {cooperationBenefits.map((benefit, index) => {
    const Icon = cooperationIcons[index] ?? Check
    return (
      <div key={benefit.title} className="grid gap-3 p-5 sm:grid-cols-[48px_0.7fr_1fr] sm:items-start md:p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-800">
          <Icon className="h-5 w-5" strokeWidth={1.7} />
        </div>
        <h3 className="text-sm font-semibold leading-6 text-gray-950">{benefit.title}</h3>
        <p className="text-sm leading-6 text-gray-600">{benefit.text}</p>
      </div>
    )
  })}
</div>
```

- [ ] **Step 6: Implement account rows and process timeline**

Use quiet account rows:

```tsx
const accountIcons = [Clock3, History, FileText, Wrench, Percent]
```

Each account row should be `border-b` separated and include `ChevronRight` on desktop. The process section should render `processSteps` as numbered items with a thin connecting line on desktop and simple stacked rows on mobile.

- [ ] **Step 7: Implement final CTA and real contact rows**

Use real details only:

```tsx
<a href="mailto:info@devicehelp.cz">info@devicehelp.cz</a>
<a href="tel:+420775848259">+420 775 848 259</a>
```

The final section should use a restrained border, white/light gray surfaces, and the same primary registration CTA.

- [ ] **Step 8: Run content tests**

```powershell
npm.cmd run test:b2b-content
```

Expected: PASS.

- [ ] **Step 9: Commit the homepage implementation**

```powershell
git add components/b2b/b2b-home-page.tsx
git commit -m "feat: redesign b2b homepage"
```

## Task 5: Verify Routing, Build, And Visual Quality

**Files:**
- No planned source edits unless verification finds a defect.

- [ ] **Step 1: Run B2B routing and SEO tests**

```powershell
npm.cmd run test:b2b-routing
npm.cmd run test:b2b-seo
```

Expected: PASS.

- [ ] **Step 2: Run the production build**

```powershell
npm.cmd run build
```

Expected: PASS. Existing multiple-lockfile warning is acceptable if the build exits 0.

- [ ] **Step 3: Start local dev server for B2B visual QA**

```powershell
$env:NEXT_PUBLIC_SITE_URL="http://localhost:3000"
$env:NEXT_PUBLIC_B2B_SITE_URL="http://b2b.localhost:3000"
npm.cmd run dev -- -p 3000
```

Open `http://b2b.localhost:3000/cs`.

- [ ] **Step 4: Check desktop and mobile visual requirements**

Verify:

- The first viewport feels like DeviceHelp, not a generic SaaS page.
- Section order is hero, `Výhody spolupráce`, `Firemní účet`, `Jak spolupráce funguje`, final CTA.
- Benefits and account sections are separate, not side-by-side.
- Blue is limited to CTA/link accents.
- Icons are restrained and not repeated blue circles.
- Text does not overlap on mobile.
- Mobile bottom navigation remains readable.
- Registration CTA opens the main-domain `/{locale}/auth/register?b2b=1` URL.

- [ ] **Step 5: Commit any visual QA fixes**

If visual QA requires class or copy tweaks:

```powershell
git add components/b2b/b2b-home-page.tsx components/header.tsx components/mobile-nav.tsx messages/cs.json messages/uk.json messages/en.json tests/b2b-content.test.mjs
git commit -m "fix: polish b2b homepage responsive layout"
```

Expected: only commit this if files changed during QA.

## Self-Review

- Spec coverage: The plan covers the approved V4 section order, cooperation benefits, firemní účet features, process, final CTA, restrained visual style, localization, B2B nav anchors, and verification.
- Red-flag scan: No task relies on incomplete markers, unspecified edge handling, or unnamed tests.
- Type consistency: Localized object arrays use `{ title, text }` throughout tests, messages, and component helpers.
