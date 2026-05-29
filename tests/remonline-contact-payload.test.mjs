import assert from "node:assert/strict"
import test from "node:test"
import contactPayload from "../lib/services/remonline-contact-payload.js"

const { buildRemonlineContactPayload } = contactPayload

test("maps end customer to RO App person with email phone and address", () => {
  const payload = buildRemonlineContactPayload({
    email: "ivan@example.com",
    first_name: "Ivan",
    last_name: "Petrenko",
    is_b2b: false,
    phone: "+420775848259",
    address: "Belohorska 209/133, Praha, CZ",
  })

  assert.deepEqual(payload, {
    contactType: "person",
    endpoint: "/contacts/people",
    body: {
      first_name: "Ivan",
      last_name: "Petrenko",
      email: "ivan@example.com",
      address: "Belohorska 209/133, Praha, CZ",
      phones: [
        {
          title: "Primary",
          phone: "+420775848259",
          notify: true,
          has_viber: false,
          has_whatsapp: false,
        },
      ],
    },
  })
})

test("maps B2B account to RO App organization with email phone address ICO and DIC", () => {
  const payload = buildRemonlineContactPayload({
    email: "office@example.cz",
    first_name: "Anna",
    last_name: "Novakova",
    is_b2b: true,
    company_name: "Device Help s.r.o.",
    ico: "12345678",
    dic: "CZ12345678",
    phone: "+420777111222",
    billing_street: "Vodickova 12",
    billing_city: "Praha",
    billing_postal_code: "11000",
    billing_country: "CZ",
  })

  assert.deepEqual(payload, {
    contactType: "organization",
    endpoint: "/contacts/organizations",
    body: {
      name: "Device Help s.r.o.",
      email: "office@example.cz",
      address: "Vodickova 12, 11000 Praha, CZ",
      phones: [
        {
          title: "Primary",
          phone: "+420777111222",
          notify: true,
          has_viber: false,
          has_whatsapp: false,
        },
      ],
      business_registration_number: "12345678",
      tax_identification_number: "CZ12345678",
    },
  })
})

test("uses address fallback when structured billing fields are absent", () => {
  const payload = buildRemonlineContactPayload({
    email: "office@example.cz",
    is_b2b: true,
    company_name: "Device Help s.r.o.",
    address: "Narodni 20, Praha, CZ",
  })

  assert.equal(payload.body.address, "Narodni 20, Praha, CZ")
})
