function trimString(value) {
  if (typeof value !== "string") {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed || undefined
}

function normalizeEmail(value) {
  const email = trimString(value)
  return email ? email.toLowerCase() : undefined
}

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => {
      if (fieldValue == null) {
        return false
      }

      if (typeof fieldValue === "string" && fieldValue.trim() === "") {
        return false
      }

      if (Array.isArray(fieldValue) && fieldValue.length === 0) {
        return false
      }

      return true
    }),
  )
}

function joinName(firstName, lastName) {
  const parts = [trimString(firstName), trimString(lastName)].filter(Boolean)
  return parts.length > 0 ? parts.join(" ") : undefined
}

function buildAddress(input) {
  const source = input || {}
  const street = trimString(source.billing_street)
  const city = trimString(source.billing_city)
  const postalCode = trimString(source.billing_postal_code)
  const country = trimString(source.billing_country)
  const hasStructuredAddress = Boolean(street || city || postalCode)

  if (hasStructuredAddress) {
    const postalCity = [postalCode, city].filter(Boolean).join(" ")
    return [street, postalCity, country || "CZ"].filter(Boolean).join(", ")
  }

  return trimString(source.address)
}

function buildPhones(phone) {
  const phones = Array.isArray(phone) ? phone : [phone]
  const primaryPhone = phones.map(trimString).find(Boolean)

  if (!primaryPhone) {
    return undefined
  }

  return [
    {
      title: "Primary",
      phone: primaryPhone,
      notify: true,
      has_viber: false,
      has_whatsapp: false,
    },
  ]
}

function buildRemonlineContactPayload(input) {
  const source = input || {}
  const email = normalizeEmail(source.email)
  const address = buildAddress(source)
  const phones = buildPhones(source.phone)

  if (source.is_b2b) {
    const body = compactObject({
      name: trimString(source.company_name) || joinName(source.first_name, source.last_name) || email,
      email,
      address,
      phones,
      business_registration_number: trimString(source.ico),
      tax_identification_number: trimString(source.dic),
    })

    return {
      contactType: "organization",
      endpoint: "/contacts/organizations",
      body,
    }
  }

  const body = compactObject({
    first_name: trimString(source.first_name) || email,
    last_name: trimString(source.last_name),
    email,
    address,
    phones,
  })

  return {
    contactType: "person",
    endpoint: "/contacts/people",
    body,
  }
}

module.exports = {
  buildAddress,
  buildPhones,
  buildRemonlineContactPayload,
}
