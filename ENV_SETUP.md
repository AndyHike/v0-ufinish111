# Environment Variables Setup

## New Variables for Middleware Optimization

To optimize middleware performance and remove database queries, add these variables to your environment:

### NEXT_PUBLIC_MAINTENANCE_MODE
Controls whether the site is in maintenance mode.

- **Values**: `true` or `false`
- **Default**: `false`
- **Example**: `NEXT_PUBLIC_MAINTENANCE_MODE=false`

When set to `true`, all users except admins will be redirected to the maintenance page.

### NEXT_PUBLIC_DEFAULT_LOCALE
Sets the default language/locale for the application.

- **Values**: `uk`, `en`, or `cs`
- **Default**: `uk`
- **Example**: `NEXT_PUBLIC_DEFAULT_LOCALE=uk`

This is used for locale detection and redirects in the middleware.

## How to Add Variables

### For Development (v0)
Add these variables in the **Vars** section of the in-chat sidebar.

### For Vercel Deployment
1. Go to your project settings in Vercel
2. Navigate to **Environment Variables**
3. Add both variables with their values
4. Redeploy your application

### For Local Development
Add these lines to your `.env.local` file:

\`\`\`env
NEXT_PUBLIC_MAINTENANCE_MODE=false
NEXT_PUBLIC_DEFAULT_LOCALE=uk
\`\`\`

## Cookie-Based Authentication

The middleware now uses `user_role` cookie instead of database queries to check admin access. This cookie is automatically set during login and removed during logout.

**No action needed** - the authentication system will handle this automatically.

## Telegram Bot Notifications

Notifications are sent to a Telegram chat when a contact form, booking, or discount request is submitted.

### TELEGRAM_BOT_TOKEN
Bot API token obtained from [@BotFather](https://t.me/BotFather).

- **Example**: `TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`

### TELEGRAM_CHAT_ID
Your personal chat ID with the bot. You can get it by sending `/start` to your bot and then checking `https://api.telegram.org/bot<TOKEN>/getUpdates`.

**Supports multiple IDs**: you can provide a single ID or a comma-separated list of IDs if you want notifications to be sent to multiple people.

- **Example (single)**: `TELEGRAM_CHAT_ID=123456789`
- **Example (multiple)**: `TELEGRAM_CHAT_ID=123456789, 987654321`

If these variables are not set, Telegram notifications are silently skipped — email notifications still work independently.
