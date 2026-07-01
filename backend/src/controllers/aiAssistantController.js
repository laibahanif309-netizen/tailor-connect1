const { sendSuccess, sendError } = require('../utils/response');

const SYSTEM_PROMPT = `You are "Stitch", the in-app assistant for TailorConnect — a mobile app that connects customers with professional tailors for custom garments, alterations, fittings, fabric choices, home visits, order updates, and direct chat with tailors.

Your job:
1) Explain how to use the TailorConnect app in plain steps: discovering tailors, viewing portfolios and fabrics, placing an order, measurements, delivery vs pickup, booking a home visit, leaving reviews, using in-app chat with a tailor, and notifications.
2) Offer practical tailoring and fashion guidance for custom clothing: fit and sizing concepts, common alterations, fabric types (cotton, linen, wool, silk, blends), garment care, occasion styling at a high level, and what to discuss with a tailor before ordering.

Rules:
- Be concise; use short paragraphs or bullets when helpful.
- Do not invent specific prices, deadlines, or a tailor's availability — tell the user to confirm in the app or with their tailor.
- No medical, legal, or financial advice. No political topics.
- You cannot see the user's account, orders, or messages. If they ask about "my order", say you do not have access and suggest they open Orders or Chat in the app.
- If the question is unrelated to tailoring, custom clothing, fashion for made-to-measure, or the TailorConnect app, politely steer back to those topics.
- Tone: warm, professional, and respectful.`;

const MAX_USER_MESSAGES = 24;
const MAX_MESSAGE_CHARS = 2000;

/**
 * POST /api/ai-assistant/chat
 * Body: { messages: { role: 'user'|'assistant', content: string }[] }
 */
async function chat(req, res) {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    return sendError(
      res,
      'AI assistant is not configured. Add OPENAI_API_KEY to the server environment.',
      503
    );
  }

  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return sendError(res, 'Provide a non-empty messages array.', 400);
  }

  const sanitized = [];
  for (const m of messages) {
    if (!m || typeof m !== 'object') continue;
    const role = m.role;
    const content = typeof m.content === 'string' ? m.content.trim() : '';
    if (!content || content.length > MAX_MESSAGE_CHARS) {
      return sendError(res, `Each message must be 1–${MAX_MESSAGE_CHARS} characters.`, 400);
    }
    if (role !== 'user' && role !== 'assistant') {
      return sendError(res, 'Messages may only use roles user or assistant.', 400);
    }
    sanitized.push({ role, content });
  }

  if (sanitized.length === 0) {
    return sendError(res, 'No valid messages to send.', 400);
  }

  const tail = sanitized.slice(-MAX_USER_MESSAGES);
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.65,
        max_tokens: 700,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...tail],
      }),
    });

    const raw = await r.text();
    if (!r.ok) {
      console.error('[ai-assistant] OpenAI HTTP', r.status, raw.slice(0, 500));
      return sendError(res, 'Assistant is temporarily unavailable. Please try again later.', 502);
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return sendError(res, 'Invalid response from assistant provider.', 502);
    }

    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) {
      return sendError(res, 'Assistant returned an empty reply.', 502);
    }

    return sendSuccess(res, 'ok', { message: text });
  } catch (e) {
    console.error('[ai-assistant]', e);
    return sendError(res, 'Assistant request failed.', 502);
  }
}

module.exports = { chat };
