// Sends a plain-text notification to the owner's Telegram chat via the Bot API.
// Deliberately no `parse_mode`: lead data is user-supplied, and formatting
// modes (Markdown/HTML) would require escaping to avoid the message
// silently breaking or being mis-rendered.
export async function sendTelegramMessage(text: string): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.error(
      "Telegram notification skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not set",
    );
    return;
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("Telegram notification failed:", response.status, body);
    }
  } catch (error) {
    console.error("Telegram notification error:", error);
  }
}
