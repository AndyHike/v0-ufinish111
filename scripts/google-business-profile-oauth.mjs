#!/usr/bin/env node

import { randomBytes } from "node:crypto"
import http from "node:http"
import { URL } from "node:url"

const GOOGLE_BUSINESS_PROFILE_SCOPE = "https://www.googleapis.com/auth/business.manage"
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
const GOOGLE_ACCOUNTS_URL = "https://mybusinessaccountmanagement.googleapis.com/v1/accounts"
const port = Number(process.env.GOOGLE_BUSINESS_PROFILE_OAUTH_PORT || 8787)
const redirectUri = `http://127.0.0.1:${port}/oauth2callback`
const clientId = process.env.GOOGLE_BUSINESS_PROFILE_CLIENT_ID
const clientSecret = process.env.GOOGLE_BUSINESS_PROFILE_CLIENT_SECRET

if (!clientId || !clientSecret) {
  console.error("Missing GOOGLE_BUSINESS_PROFILE_CLIENT_ID or GOOGLE_BUSINESS_PROFILE_CLIENT_SECRET in the environment.")
  process.exit(1)
}

const state = randomBytes(16).toString("hex")
const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
authUrl.searchParams.set("client_id", clientId)
authUrl.searchParams.set("redirect_uri", redirectUri)
authUrl.searchParams.set("response_type", "code")
authUrl.searchParams.set("scope", GOOGLE_BUSINESS_PROFILE_SCOPE)
authUrl.searchParams.set("access_type", "offline")
authUrl.searchParams.set("prompt", "consent")
authUrl.searchParams.set("state", state)

function sendHtml(response, statusCode, body) {
  response.writeHead(statusCode, { "Content-Type": "text/html; charset=utf-8" })
  response.end(body)
}

async function fetchJson(url, accessToken) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-GOOG-API-FORMAT-VERSION": "2",
    },
  })
  const text = await response.text()
  const data = text ? JSON.parse(text) : {}

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${JSON.stringify(data)}`)
  }

  return data
}

async function exchangeCodeForTokens(code) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  })
  const data = await response.json()

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${JSON.stringify(data)}`)
  }

  return data
}

function accountIdFromName(accountName) {
  return String(accountName || "").replace(/^accounts\//, "")
}

function locationIdFromName(locationName) {
  return String(locationName || "")
    .replace(/^accounts\/[^/]+\/locations\//, "")
    .replace(/^locations\//, "")
}

function fullLocationName(accountName, locationName) {
  if (String(locationName || "").startsWith("accounts/")) {
    return locationName
  }
  if (String(locationName || "").startsWith("locations/")) {
    return `${accountName}/${locationName}`
  }
  return `${accountName}/locations/${locationName}`
}

async function listAccountsAndLocations(accessToken) {
  const accountsData = await fetchJson(GOOGLE_ACCOUNTS_URL, accessToken)
  const accounts = accountsData.accounts || []
  const locations = []

  for (const account of accounts) {
    const locationsUrl = new URL(`https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations`)
    locationsUrl.searchParams.set("readMask", "name,title,metadata")
    locationsUrl.searchParams.set("pageSize", "100")

    const locationsData = await fetchJson(locationsUrl, accessToken)

    for (const location of locationsData.locations || []) {
      const locationName = fullLocationName(account.name, location.name)
      locations.push({
        accountName: account.name,
        accountId: accountIdFromName(account.name),
        accountDisplayName: account.accountName || account.name,
        locationName,
        locationId: locationIdFromName(locationName),
        title: location.title || locationName,
      })
    }
  }

  return locations
}

function printEnvBlock(refreshToken, locations) {
  console.log("\nAdd these server-only variables to your production environment:\n")
  console.log(`GOOGLE_BUSINESS_PROFILE_CLIENT_ID=${clientId}`)
  console.log("GOOGLE_BUSINESS_PROFILE_CLIENT_SECRET=<keep the same client secret you used for this script>")
  console.log(`GOOGLE_BUSINESS_PROFILE_REFRESH_TOKEN=${refreshToken}`)

  if (locations.length === 1) {
    console.log(`GOOGLE_BUSINESS_PROFILE_ACCOUNT_ID=${locations[0].accountId}`)
    console.log(`GOOGLE_BUSINESS_PROFILE_LOCATION_ID=${locations[0].locationId}`)
    return
  }

  console.log("GOOGLE_BUSINESS_PROFILE_ACCOUNT_ID=<copy accountId from the selected location below>")
  console.log("GOOGLE_BUSINESS_PROFILE_LOCATION_ID=<copy locationId from the selected location below>")
}

function printLocations(locations) {
  if (locations.length === 0) {
    console.log("\nNo locations were returned. Check API access, the signed-in Google account, and Business Profile permissions.")
    return
  }

  console.log("\nAvailable Business Profile locations:\n")

  for (const location of locations) {
    console.log(`- ${location.title}`)
    console.log(`  accountId: ${location.accountId}`)
    console.log(`  locationId: ${location.locationId}`)
    console.log(`  locationName: ${location.locationName}`)
  }
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url || "/", redirectUri)

  if (requestUrl.pathname !== "/oauth2callback") {
    sendHtml(response, 404, "<p>Not found.</p>")
    return
  }

  const code = requestUrl.searchParams.get("code")
  const returnedState = requestUrl.searchParams.get("state")
  const error = requestUrl.searchParams.get("error")

  if (error) {
    sendHtml(response, 400, `<p>Google authorization failed: ${error}</p>`)
    return
  }

  if (!code || returnedState !== state) {
    sendHtml(response, 400, "<p>Invalid OAuth response.</p>")
    return
  }

  try {
    const tokens = await exchangeCodeForTokens(code)
    const refreshToken = tokens.refresh_token

    if (!refreshToken) {
      throw new Error("Google did not return a refresh_token. Revoke the app access and run this script again with prompt=consent.")
    }

    const locations = await listAccountsAndLocations(tokens.access_token)

    sendHtml(response, 200, "<p>Authorization complete. You can close this tab and return to the terminal.</p>")
    printEnvBlock(refreshToken, locations)
    printLocations(locations)
  } catch (oauthError) {
    sendHtml(response, 500, "<p>Authorization failed. Check the terminal output.</p>")
    console.error(oauthError)
  } finally {
    server.close()
  }
})

server.listen(port, "127.0.0.1", () => {
  console.log(`Listening on ${redirectUri}`)
  console.log("\nOpen this URL while signed in as a Google account that manages the DeviceHelp Business Profile:\n")
  console.log(authUrl.toString())
})
