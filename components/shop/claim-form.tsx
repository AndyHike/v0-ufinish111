"use client"

import { useState } from "react"

type Kind = "COMPLAINT" | "WITHDRAWAL"
type Resolution = "UNSPECIFIED" | "REPAIR" | "REPLACEMENT" | "REFUND" | "DISCOUNT"
type Step = "identify" | "items" | "review" | "done"

type OrderLine = { orderLineId: string; title: string; quantity: number; unitPrice: number | null }
type LookupResult = {
  order: { orderNumber: string; lines: OrderLine[] }
  returnAddress: { companyName: string | null; address: string | null }
}

const REVIEW_DAYS: Record<Kind, number> = { COMPLAINT: 30, WITHDRAWAL: 14 }

type Copy = {
  intro: string
  kind: string
  kindComplaint: string
  kindWithdrawal: string
  orderNumber: string
  email: string
  name: string
  phone: string
  resolution: string
  resolutions: Record<Resolution, string>
  description: string
  descriptionPlaceholder: string
  identify: string
  identifying: string
  selectItems: string
  selectAll: string
  qty: string
  continue: string
  back: string
  instructionsTitle: string
  instr1: string
  instr2: (address: string) => string
  instr3: (days: number) => string
  instr4: string
  submit: string
  submitting: string
  successTitle: string
  successBody: string
  errorNotFound: string
  errorGeneric: string
  required: string
  selectAtLeastOne: string
}

const COPY: Record<string, Copy> = {
  cs: {
    intro: "Zadejte číslo objednávky a e-mail použitý při nákupu. Poté vyberete položky.",
    kind: "Typ žádosti",
    kindComplaint: "Reklamace (vada zboží)",
    kindWithdrawal: "Odstoupení od smlouvy (do 14 dnů)",
    orderNumber: "Číslo objednávky",
    email: "E-mail z objednávky",
    name: "Jméno a příjmení",
    phone: "Telefon (nepovinné)",
    resolution: "Preferované řešení",
    resolutions: { UNSPECIFIED: "Nerozhodnuto", REPAIR: "Oprava", REPLACEMENT: "Výměna", REFUND: "Vrácení peněz", DISCOUNT: "Sleva" },
    description: "Popis",
    descriptionPlaceholder: "Popište závadu nebo důvod odstoupení…",
    identify: "Najít objednávku",
    identifying: "Hledám…",
    selectItems: "Vyberte položky, kterých se žádost týká",
    selectAll: "Vybrat vše",
    qty: "Počet",
    continue: "Pokračovat",
    back: "Zpět",
    instructionsTitle: "Jak postupovat dál",
    instr1: "Zboží pečlivě zabalte, ideálně v původním obalu, a přiložte číslo žádosti.",
    instr2: (address) => `Zásilku odešlete na adresu: ${address}.`,
    instr3: (days) => `Vaši žádost vyřídíme do ${days} dnů od doručení zboží.`,
    instr4: "O stavu žádosti vás budeme informovat e-mailem.",
    submit: "Odeslat žádost",
    submitting: "Odesílám…",
    successTitle: "Žádost byla přijata",
    successBody: "Vaše žádost byla zaevidována pod číslem",
    errorNotFound: "K zadanému číslu objednávky a e-mailu nebyla nalezena žádná objednávka.",
    errorGeneric: "Žádost se nepodařilo odeslat. Zkuste to prosím znovu.",
    required: "Vyplňte prosím povinná pole.",
    selectAtLeastOne: "Vyberte alespoň jednu položku.",
  },
  uk: {
    intro: "Введіть номер замовлення та email із покупки. Далі оберете позиції.",
    kind: "Тип звернення",
    kindComplaint: "Рекламація (дефект товару)",
    kindWithdrawal: "Відступ від договору (протягом 14 днів)",
    orderNumber: "Номер замовлення",
    email: "Email із замовлення",
    name: "Ім'я та прізвище",
    phone: "Телефон (необов'язково)",
    resolution: "Бажане вирішення",
    resolutions: { UNSPECIFIED: "Не визначено", REPAIR: "Ремонт", REPLACEMENT: "Заміна", REFUND: "Повернення коштів", DISCOUNT: "Знижка" },
    description: "Опис",
    descriptionPlaceholder: "Опишіть дефект або причину відмови…",
    identify: "Знайти замовлення",
    identifying: "Пошук…",
    selectItems: "Оберіть позиції, яких стосується звернення",
    selectAll: "Обрати всі",
    qty: "К-сть",
    continue: "Далі",
    back: "Назад",
    instructionsTitle: "Що робити далі",
    instr1: "Акуратно запакуйте товар, бажано в оригінальній упаковці, і вкладіть номер заявки.",
    instr2: (address) => `Надішліть посилку на адресу: ${address}.`,
    instr3: (days) => `Вашу заявку ми розглянемо протягом ${days} днів від отримання товару.`,
    instr4: "Про стан заявки ми будемо інформувати вас електронною поштою.",
    submit: "Надіслати звернення",
    submitting: "Надсилання…",
    successTitle: "Звернення прийнято",
    successBody: "Ваше звернення зареєстровано під номером",
    errorNotFound: "За вказаним номером замовлення та email замовлення не знайдено.",
    errorGeneric: "Не вдалося надіслати звернення. Спробуйте ще раз.",
    required: "Будь ласка, заповніть обов'язкові поля.",
    selectAtLeastOne: "Оберіть хоча б одну позицію.",
  },
  en: {
    intro: "Enter your order number and the email used at checkout. Then pick the items.",
    kind: "Request type",
    kindComplaint: "Complaint (defective goods)",
    kindWithdrawal: "Contract withdrawal (within 14 days)",
    orderNumber: "Order number",
    email: "Order email",
    name: "Full name",
    phone: "Phone (optional)",
    resolution: "Preferred resolution",
    resolutions: { UNSPECIFIED: "Undecided", REPAIR: "Repair", REPLACEMENT: "Replacement", REFUND: "Refund", DISCOUNT: "Discount" },
    description: "Description",
    descriptionPlaceholder: "Describe the defect or reason for withdrawal…",
    identify: "Find order",
    identifying: "Searching…",
    selectItems: "Select the items this request applies to",
    selectAll: "Select all",
    qty: "Qty",
    continue: "Continue",
    back: "Back",
    instructionsTitle: "What happens next",
    instr1: "Pack the goods carefully, ideally in the original packaging, and include the request number.",
    instr2: (address) => `Send the parcel to: ${address}.`,
    instr3: (days) => `We will process your request within ${days} days of receiving the goods.`,
    instr4: "We will keep you informed about the status by email.",
    submit: "Submit request",
    submitting: "Submitting…",
    successTitle: "Request received",
    successBody: "Your request has been registered under number",
    errorNotFound: "No order matches the given order number and email.",
    errorGeneric: "Could not submit the request. Please try again.",
    required: "Please fill in the required fields.",
    selectAtLeastOne: "Select at least one item.",
  },
}

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-900/10"
const labelClass = "mb-1 block text-sm font-semibold text-gray-800"
const primaryBtn =
  "rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
const ghostBtn = "rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-gray-500"

export function ClaimForm({ locale }: { locale: string }) {
  const t = COPY[locale] ?? COPY.cs
  const [step, setStep] = useState<Step>("identify")
  const [orderNumber, setOrderNumber] = useState("")
  const [email, setEmail] = useState("")
  const [kind, setKind] = useState<Kind>("COMPLAINT")
  const [resolution, setResolution] = useState<Resolution>("UNSPECIFIED")
  const [description, setDescription] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [lookup, setLookup] = useState<LookupResult | null>(null)
  // orderLineId -> selected quantity (0 = not selected)
  const [selected, setSelected] = useState<Record<string, number>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [claimNumber, setClaimNumber] = useState<string | null>(null)

  const returnAddress = lookup
    ? [lookup.returnAddress.companyName, lookup.returnAddress.address].filter(Boolean).join(", ") || "—"
    : "—"

  async function handleIdentify(event: React.FormEvent) {
    event.preventDefault()
    setError("")
    if (!orderNumber.trim() || !email.trim()) {
      setError(t.required)
      return
    }
    setBusy(true)
    try {
      const response = await fetch("/api/shop/claims/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: orderNumber.trim(), email: email.trim(), locale }),
      })
      if (response.ok) {
        const data = (await response.json()) as LookupResult
        setLookup(data)
        // Default to all lines selected at full quantity.
        const initial: Record<string, number> = {}
        for (const line of data.order.lines) initial[line.orderLineId] = line.quantity
        setSelected(initial)
        setStep("items")
      } else if (response.status === 404) {
        setError(t.errorNotFound)
      } else {
        setError(t.errorGeneric)
      }
    } catch {
      setError(t.errorGeneric)
    } finally {
      setBusy(false)
    }
  }

  function toggleLine(line: OrderLine) {
    setSelected((current) => {
      const next = { ...current }
      if (next[line.orderLineId] > 0) next[line.orderLineId] = 0
      else next[line.orderLineId] = line.quantity
      return next
    })
  }

  function setLineQty(line: OrderLine, qty: number) {
    setSelected((current) => ({ ...current, [line.orderLineId]: Math.max(0, Math.min(line.quantity, qty)) }))
  }

  const allSelected = lookup ? lookup.order.lines.every((line) => (selected[line.orderLineId] ?? 0) > 0) : false
  function toggleSelectAll() {
    if (!lookup) return
    const next: Record<string, number> = {}
    for (const line of lookup.order.lines) next[line.orderLineId] = allSelected ? 0 : line.quantity
    setSelected(next)
  }

  function goReview(event: React.FormEvent) {
    event.preventDefault()
    setError("")
    const anySelected = Object.values(selected).some((qty) => qty > 0)
    if (lookup && lookup.order.lines.length > 0 && !anySelected) {
      setError(t.selectAtLeastOne)
      return
    }
    setStep("review")
  }

  async function handleSubmit() {
    setError("")
    setBusy(true)
    const lines = Object.entries(selected)
      .filter(([, qty]) => qty > 0)
      .map(([orderLineId, quantity]) => ({ orderLineId, quantity }))
    try {
      const response = await fetch("/api/shop/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: orderNumber.trim(),
          email: email.trim(),
          locale,
          kind,
          desiredResolution: resolution,
          description: description.trim() || undefined,
          contact: { name: name.trim() || undefined, phone: phone.trim() || undefined },
          lines,
        }),
      })
      if (response.ok) {
        const data = (await response.json()) as { claimNumber?: string }
        setClaimNumber(data.claimNumber ?? "—")
        setStep("done")
      } else if (response.status === 404) {
        setError(t.errorNotFound)
      } else {
        setError(t.errorGeneric)
      }
    } catch {
      setError(t.errorGeneric)
    } finally {
      setBusy(false)
    }
  }

  function instructions(extraClass = "") {
    return (
      <div className={`rounded-xl border border-gray-200 bg-gray-50 p-5 ${extraClass}`}>
        <h3 className="text-sm font-bold text-gray-900">{t.instructionsTitle}</h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-700">
          <li>{t.instr1}</li>
          <li>{t.instr2(returnAddress)}</li>
          <li>{t.instr3(REVIEW_DAYS[kind])}</li>
          <li>{t.instr4}</li>
        </ul>
      </div>
    )
  }

  if (step === "done" && claimNumber) {
    return (
      <div className="grid max-w-2xl gap-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
          <h2 className="text-lg font-bold text-emerald-800">{t.successTitle}</h2>
          <p className="mt-2 text-sm text-emerald-700">
            {t.successBody} <strong className="font-mono">{claimNumber}</strong>.
          </p>
        </div>
        {instructions()}
      </div>
    )
  }

  if (step === "identify") {
    return (
      <form onSubmit={handleIdentify} className="grid max-w-2xl gap-4">
        <p className="text-sm text-gray-600">{t.intro}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>{t.orderNumber} *</label>
            <input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>{t.email} *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
          </div>
        </div>
        {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
        <div>
          <button type="submit" disabled={busy} className={primaryBtn}>
            {busy ? t.identifying : t.identify}
          </button>
        </div>
      </form>
    )
  }

  if (step === "items" && lookup) {
    return (
      <form onSubmit={goReview} className="grid max-w-2xl gap-5">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-bold text-gray-900">{t.selectItems}</label>
            {lookup.order.lines.length > 0 ? (
              <button type="button" onClick={toggleSelectAll} className="text-xs font-semibold text-gray-600 underline">
                {t.selectAll}
              </button>
            ) : null}
          </div>
          <div className="grid gap-2">
            {lookup.order.lines.map((line) => {
              const qty = selected[line.orderLineId] ?? 0
              return (
                <div key={line.orderLineId} className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5">
                  <input type="checkbox" checked={qty > 0} onChange={() => toggleLine(line)} className="h-4 w-4" />
                  <span className="min-w-0 flex-1 truncate text-sm text-gray-800">{line.title}</span>
                  <span className="text-xs text-gray-400">×{line.quantity}</span>
                  {qty > 0 && line.quantity > 1 ? (
                    <input
                      type="number"
                      min={1}
                      max={line.quantity}
                      value={qty}
                      onChange={(e) => setLineQty(line, Number(e.target.value))}
                      className="w-16 rounded border border-gray-300 px-2 py-1 text-sm"
                      aria-label={t.qty}
                    />
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>{t.kind}</label>
            <select value={kind} onChange={(e) => setKind(e.target.value as Kind)} className={inputClass}>
              <option value="COMPLAINT">{t.kindComplaint}</option>
              <option value="WITHDRAWAL">{t.kindWithdrawal}</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>{t.resolution}</label>
            <select value={resolution} onChange={(e) => setResolution(e.target.value as Resolution)} className={inputClass}>
              {(Object.keys(t.resolutions) as Resolution[]).map((value) => (
                <option key={value} value={value}>
                  {t.resolutions[value]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>{t.name}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{t.phone}</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>{t.description}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder={t.descriptionPlaceholder}
            className={`${inputClass} resize-y`}
          />
        </div>

        {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
        <div className="flex gap-3">
          <button type="button" onClick={() => setStep("identify")} className={ghostBtn}>
            {t.back}
          </button>
          <button type="submit" className={primaryBtn}>
            {t.continue}
          </button>
        </div>
      </form>
    )
  }

  // review
  return (
    <div className="grid max-w-2xl gap-5">
      {instructions()}
      {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
      <div className="flex gap-3">
        <button type="button" onClick={() => setStep("items")} className={ghostBtn}>
          {t.back}
        </button>
        <button type="button" onClick={handleSubmit} disabled={busy} className={primaryBtn}>
          {busy ? t.submitting : t.submit}
        </button>
      </div>
    </div>
  )
}
