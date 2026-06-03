# Google Business Profile Reviews Setup

The homepage reviews block reads Google reviews through the Google Business Profile API, not Google Places API.

## Required Google setup

1. Use the Google Cloud project that has access to the DeviceHelp Google Business Profile.
2. Make sure the project is approved for Google Business Profile API access. Without approval, the Google My Business API may not appear in Google Cloud.
3. Google's current basic setup says to enable the eight Business Profile APIs:
   - Google My Business API
   - My Business Account Management API
   - My Business Lodging API
   - My Business Place Actions API
   - My Business Notifications API
   - My Business Verifications API
   - My Business Business Information API
   - My Business Q&A API
4. This app directly uses:
   - Google My Business API for `/v4/accounts/{accountId}/locations/{locationId}/reviews`
   - My Business Account Management API to discover accounts in the OAuth helper
   - My Business Business Information API to discover locations in the OAuth helper
5. Create an OAuth Client ID with application type `Web application`.
6. Add this authorized redirect URI:

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

Optional debugging:

```text
DEBUG_GOOGLE_REVIEWS=true
```

After this is deployed and verified, `GOOGLE_PLACES_API_KEY` and `GOOGLE_PLACES_ID` are no longer needed for reviews. The current homepage reviews code does not read the Places API variables.

If the app is deployed with `docker-compose.yml`, keep the `GOOGLE_BUSINESS_PROFILE_*` variables listed in the `nextjs.environment` block so they are available at runtime inside the container.

## Search result stars

Do not add `AggregateRating` structured data for DeviceHelp's own Google reviews expecting organic Google Search stars. Google treats reviews controlled by the reviewed local business itself as self-serving; pages using `LocalBusiness` or `Organization` structured data for their own reviews are ineligible for the star review feature.

The correct goal for Google-visible stars is to strengthen the Google Business Profile itself so ratings show in Google Maps, the local pack, and the business knowledge panel. Keep the on-site reviews widget for trust and conversion, but don't rely on it to force organic star snippets.
