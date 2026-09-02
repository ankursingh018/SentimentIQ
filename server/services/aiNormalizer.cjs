const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy',
    dangerouslyAllowBrowser: false
});

/**
 * Pre-process raw data to reduce token usage and extract deterministic IDs.
 * AI mainly cleans the content.
 */
function extractForAI(raw, platform) {
    if (!Array.isArray(raw)) return [];

    if (platform === 'Mastodon') {
        return raw.map(p => ({
            id: `mastodon_${p.id}`,
            text_to_clean: p.content || '',
            created_at: p.created_at,
            is_reply: !!p.in_reply_to_id
        })).filter(p => p.id);
    }

    if (platform === 'Bluesky') {
        return raw.map(item => {
            const record = item?.post?.record || {};
            const text = record?.text || record?.Text || '';
            const uri = item?.post?.uri || '';
            if (!uri) return null;

            // Deterministic ID generation to match fallback
            const id = uri.replace(/^at:\/\//, '').replace(/\//g, '_');
            const created_at = record?.createdAt || item?.post?.indexedAt || new Date().toISOString();
            const is_reply = !!record.reply;

            return { id, text_to_clean: text, created_at, is_reply };
        }).filter(p => p && p.id && p.text_to_clean);
    }

    return [];
}

/**
 * Normalizes raw posts using AI to strictly match dashboard schema.
 * content is cleaned of HTML/spam.
 * @param {Array} rawPosts - Raw API response
 * @param {string} platform - 'Mastodon' | 'Bluesky'
 * @returns {Promise<Array>} Normalized posts [{ id, content, created_at, platform }]
 */
async function normalizeWithAI(rawPosts, platform) {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error("No AI Key configured");
    }

    const candidates = extractForAI(rawPosts, platform);
    if (candidates.length === 0) return [];

    // Limit batch size to 20 to avoid token limits / timeouts
    // (User said "Handle API rate limits gracefully", small batches help)
    // Actually, if we have 50 items, we might need 3 calls or just truncate?
    // Let's take top 20 for AI processing to ensure speed (30s poll).
    const batch = candidates.slice(0, 20);

    const prompt = `You are a data normalization engine for a social dashboard.
    Input: JSON object with key "items" containing array of { id, text_to_clean, created_at, is_reply }.
    Task:
    1. Clean "text_to_clean": Remove HTML, URLs, Emails, and @mentions/handles. Convert to plain text.
    2. Normalize "created_at": Ensure ISO 8601 format.
    3. Return JSON object with key "normalized" containing array of { id, content, created_at, platform, is_reply }.
    4. Set "platform" to "${platform}" for all items.
    5. strictly preserve the "id" and "is_reply" boolean value.
    
    Output format: { "normalized": [{ "id": "...", "content": "...", "created_at": "...", "platform": "...", "is_reply": boolean }] }
    `;

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Efficient model
        messages: [
            { role: "system", content: prompt },
            { role: "user", content: JSON.stringify({ items: batch }) }
        ],
        response_format: { type: "json_object" }
    });

    const responseContent = completion.choices[0].message.content;
    let result;
    try {
        result = JSON.parse(responseContent);
    } catch (err) {
        throw new Error("AI response normalization failed");
    }

    return result.normalized || [];
}

module.exports = { normalizeWithAI };
