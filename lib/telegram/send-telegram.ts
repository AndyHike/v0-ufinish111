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
    const chatIdRaw = process.env.TELEGRAM_CHAT_ID

    if (!botToken || !chatIdRaw) {
        console.warn(
            "[Telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured. Skipping notification.",
        )
        return false
    }

    try {
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`

        // Розділяємо рядок за комою та очищуємо від пробілів
        const chatIds = chatIdRaw
            .split(",")
            .map((id: string) => id.trim())
            .filter(Boolean)

        if (chatIds.length === 0) {
            console.warn("[Telegram] No valid chat IDs found in TELEGRAM_CHAT_ID")
            return false
        }

        // Відправляємо повідомлення в усі чати паралельно
        const results = await Promise.all(
            chatIds.map(async (chatId: string) => {
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
                    console.error(`[Telegram] Failed to send message to ${chatId}: ${response.status} ${errorData}`)
                    return false
                }

                return true
            }),
        )

        const allSuccessful = results.every((res: boolean) => res === true)
        if (allSuccessful) {
            console.log(`[Telegram] Notification sent successfully to ${chatIds.length} chat(s)`)
        } else {
            console.warn("[Telegram] Some notifications failed to send")
        }

        return allSuccessful
    } catch (error) {
        console.error("[Telegram] Error sending notification:", error)
        return false
    }
}
