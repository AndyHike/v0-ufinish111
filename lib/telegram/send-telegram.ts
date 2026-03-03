/**
 * Telegram Bot notification utility.
 *
 * Sends messages to a specific Telegram chat via the Bot API.
 * Requires two environment variables:
 *   - TELEGRAM_BOT_TOKEN  – Bot API token from @BotFather
 *   - TELEGRAM_CHAT_ID    – Numeric chat ID (your personal chat with the bot)
 */

export async function sendTelegramNotification(message: string): Promise<boolean> {
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID

    if (!botToken || !chatId) {
        console.warn(
            "[Telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured. Skipping notification.",
        )
        return false
    }

    try {
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: "HTML",
            }),
        })

        if (!response.ok) {
            const errorData = await response.text()
            console.error(`[Telegram] Failed to send message: ${response.status} ${errorData}`)
            return false
        }

        console.log("[Telegram] Notification sent successfully")
        return true
    } catch (error) {
        console.error("[Telegram] Error sending notification:", error)
        return false
    }
}
