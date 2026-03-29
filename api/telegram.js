// Vercel Serverless Function — BudgetMein Telegram Proxy
// Token is read from Environment Variables (never exposed to browser)

const TG_CHAT_IDS = {
  order:    process.env.TG_CHAT_ORDER,
  feedback: process.env.TG_CHAT_FEEDBACK,
  customer: process.env.TG_CHAT_CUSTOMER
};

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, description: "Method not allowed" });
  }

  const { kind, msg } = req.body;

  const token  = process.env.TG_BOT_TOKEN;
  const chatId = TG_CHAT_IDS[kind] || TG_CHAT_IDS.order;

  if (!token) {
    return res.status(500).json({ ok: false, description: "Bot token not configured" });
  }

  if (!chatId) {
    return res.status(500).json({ ok: false, description: "Chat ID not configured for: " + kind });
  }

  try {
    const tgRes = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          chat_id:                  chatId,
          text:                     msg,
          parse_mode:               "HTML",
          disable_web_page_preview: true
        })
      }
    );

    const data = await tgRes.json();
    return res.status(tgRes.status).json(data);

  } catch (err) {
    return res.status(500).json({ ok: false, description: err.message });
  }
}
