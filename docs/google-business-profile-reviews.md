# Google Business Profile Reviews Setup

The homepage reviews block reads Google reviews through the Google Business Profile API, not Google Places API.

## Required Google setup

1. Use the Google Cloud project that has access to the DeviceHelp Google Business Profile.
2. Enable these APIs:
   - Google My Business API
   - My Business Account Management API
   - My Business Business Information API
3. Create an OAuth Client ID with application type `Web application`.
4. Add this authorized redirect URI:

```text
http://127.0.0.1:8787/oauth2callback
```

Google docs:
- Reviews endpoint: https://developers.google.com/my-business/reference/rest/v4/accounts.locations.reviews/list
- Basic setup: https://developers.google.com/my-business/content/basic-setup
- Accounts list: https://developers.google.com/my-business/reference/accountmanagement/rest/v1/accounts/list
- Locations list: https://developers.google.com/my-business/reference/businessinformation/rest/v1/accounts.locations/list

## Get the refresh token and location IDs

Set these locally before running the helper:

```powershell
$env:GOOGLE_BUSINESS_PROFILE_CLIENT_ID="your-oauth-client-id"
$env:GOOGLE_BUSINESS_PROFILE_CLIENT_SECRET="your-oauth-client-secret"
node scripts/google-business-profile-oauth.mjs
```

Open the printed Google authorization URL while signed in as a Google account that manages the DeviceHelp Business Profile.
After approval, the helper prints the refresh token and available Business Profile locations.

## Production environment variables

Add these server-only variables to production:

```text
GOOGLE_BUSINESS_PROFILE_CLIENT_ID=
GOOGLE_BUSINESS_PROFILE_CLIENT_SECRET=
GOOGLE_BUSINESS_PROFILE_REFRESH_TOKEN=
GOOGLE_BUSINESS_PROFILE_ACCOUNT_ID=
GOOGLE_BUSINESS_PROFILE_LOCATION_ID=
```

Alternatively, instead of account/location IDs, set:

```text
GOOGLE_BUSINESS_PROFILE_LOCATION_NAME=accounts/{accountId}/locations/{locationId}
```

After this is deployed and verified, `GOOGLE_PLACES_API_KEY` and `GOOGLE_PLACES_ID` are no longer needed for reviews.
