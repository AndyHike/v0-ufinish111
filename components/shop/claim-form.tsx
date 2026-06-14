"use client"

import { useState } from "react"

type Kind = "COMPLAINT" | "WITHDRAWAL"
type Resolution = "UNSPECIFIED" | "REPAIR" | "REPLACEMENT" | "REFUND" | "DISCOUNT"

type Copy = {
  title: string
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
  submit: string
  submitting: string
  successTitle: string
  successBody: string
  errorNotFound: string
  errorGeneric: string
  required: string
}

const COPY: Record<string, Copy> = {
  cs: {
    title: "Reklamace a odstoupení od smlouvy",
    intro: "Vyplňte formulář pomocí čísla objednávky a e-mailu, který jste použili při nákupu.",
    kind: "Typ žádosti",
    kindComplaint: "Reklamace (vada zboží)",
    kindWithdrawal: "Odstoupení od smlouvy (do 14 dnů)",
    orderNumber: "Číslo objednávky",
    email: "E-mail z objednávky",
    name: "Jméno a příjmení",
    phone: "Telefon (nepovinné)",
    resolution: "Preferované řešení",
    resolutions: {
      UNSPECIFIED: "Nerozhodnuto",
      REPAIR: "Oprava",
      REPLACEMENT: "Výměna",
      REFUND: "Vrácení peněz",
      DISCOUNT: "Sleva",
    },
    description: "Popis",
    descriptionPlaceholder: "Popište závadu nebo důvod odstoupení…",
    submit: "Odeslat žádost",
    submitting: "Odesílám…",
    successTitle: "Žádost byla přijata",
    successBody: "Vaše žádost byla zaevidována pod číslem",
    errorNotFound: "K zadanému číslu objednávky a e-mailu nebyla nalezena žádná objednávka.",
    errorGeneric: "Žádost se nepodařilo odeslat. Zkuste to prosím znovu.",
    required: "Vyplňte prosím povinná pole.",
  },
  uk: {
    title: "Рекламація та відступ від договору",
    intro: "Заповніть форму за номером замовлення та email, який ви вказали під час покупки.",
    kind: "Тип звернення",
    kindComplaint: "Рекламація (дефект товару)",
    kindWithdrawal: "Відступ від договору (протягом 14 днів)",
    orderNumber: "Номер замовлення",
    email: "Email із замовлення",
    name: "Ім'я та прізвище",
    phone: "Телефон (необов'язково)",
    resolution: "Бажане вирішення",
    resolutions: {
      UNSPECIFIED: "Не визначено",
      REPAIR: "Ремонт",
      REPLACEMENT: "Заміна",
      REFUND: "Повернення коштів",
      DISCOUNT: "Знижка",
    },
    description: "Опис",
    descriptionPlaceholder: "Опишіть дефект або причину відмови…",
    submit: "Надіслати звернення",
    submitting: "Надсилання…",
    successTitle: "Звернення прийнято",
    successBody: "Ваше звернення зареєстровано під номером",
    errorNotFound: "За вказаним номером замовлення та email замовлення не знайдено.",
    errorGeneric: "Не вдалося надіслати звернення. Спробуйте ще раз.",
    required: "Будь ласка, заповніть обов'язкові поля.",
  },
  en: {
    title: "Complaint & contract withdrawal",
    intro: "Fill in the form using your order number and the email used at checkout.",
    kind: "Request type",
    kindComplaint: "Complaint (defective goods)",
    kindWithdrawal: "Contract withdrawal (within 14 days)",
    orderNumber: "Order number",
    email: "Order email",
    name: "Full name",
    phone: "Phone (optional)",
    resolution: "Preferred resolution",
    resolutions: {
      UNSPECIFIED: "Undecided",
      REPAIR: "Repair",
      REPLACEMENT: "Replacement",
      REFUND: "Refund",
      DISCOUNT: "Discount",
    },
    description: "Description",
    descriptionPlaceholder: "Describe the defect or reason for withdrawal…",
    submit: "Submit request",
    submitting: "Submitting…",
    successTitle: "Request received",
    successBody: "Your request has been registered under number",
    errorNotFound: "No order matches the given order number and email.",
    errorGeneric: "Could not submit the request. Please try again.",
    required: "Please fill in the required fields.",
  },
}

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-900/10"
const labelClass = "mb-1 block text-sm font-semibold text-gray-800"

export function ClaimForm({ locale }: { locale: string }) {
  const t = COPY[locale] ?? COPY.cs
  const [kind, setKind] = useState<Kind>("COMPLAINT")
  const [orderNumber, setOrderNumber] = useState("")
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [resolution, setResolution] = useState<Resolution>("UNSPECIFIED")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [claimNumber, setClaimNumber] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError("")
    if (!orderNumber.trim() || !email.trim()) {
      setError(t.required)
      return
    }
    setSubmitting(true)
    try {
      const response = await fetch("/api/shop/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: orderNumber.trim(),
          email: email.trim(),
          kind,
          desiredResolution: resolution,
          description: description.trim() || undefined,
          contact: { name: name.trim() || undefined, phone: phone.trim() || undefined },
        }),
      })
      if (response.ok) {
        const data = (await response.json()) as { claimNumber?: string }
        setClaimNumber(data.claimNumber ?? "—")
      } else if (response.status === 404) {
        setError(t.errorNotFound)
      } else {
        setError(t.errorGeneric)
      }
    } catch {
      setError(t.errorGeneric)
    } finally {
      setSubmitting(false)
    }
  }

  if (claimNumber) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
        <h2 className="text-lg font-bold text-emerald-800">{t.successTitle}</h2>
        <p className="mt-2 text-sm text-emerald-700">
          {t.successBody} <strong className="font-mono">{claimNumber}</strong>.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="grid max-w-2xl gap-4">
      <p className="text-sm text-gray-600">{t.intro}</p>

      <div>
        <label className={labelClass}>{t.kind}</label>
        <select value={kind} onChange={(e) => setKind(e.target.value as Kind)} className={inputClass}>
          <option value="COMPLAINT">{t.kindComplaint}</option>
          <option value="WITHDRAWAL">{t.kindWithdrawal}</option>
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>{t.orderNumber} *</label>
          <input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} className={inputClass} required />
        </div>
        <div>
          <label className={labelClass}>{t.email} *</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
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
        <label className={labelClass}>{t.description}</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          placeholder={t.descriptionPlaceholder}
          className={`${inputClass} resize-y`}
        />
      </div>

      {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}

      <div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? t.submitting : t.submit}
        </button>
      </div>
    </form>
  )
}
