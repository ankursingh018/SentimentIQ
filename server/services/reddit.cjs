/**
 * Reddit API integration for live public posts.
 * Uses OAuth2 "script" app: client_id, client_secret, username, password, user_agent.
 * Fetches from /r/popular (or /r/all), cleans text (HTML, emojis, URLs, special chars),
 * returns { id, content, created_at, platform: 'Reddit' } for dashboard pipeline.
 *
 * Env: REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD, REDDIT_USER_AGENT
 */

const REDDIT_AUTH_URL = 'https://www.reddit.com/api/v1/access_token';
const REDDIT_API_BASE = 'https://oauth.reddit.com';
const DEFAULT_LIMIT = 40;
const PLATFORM = 'Reddit';

/** In-memory token; refresh when expired (Reddit tokens typically last 1 hour). */
let cachedToken = null;
let tokenExpiry = 0;
const TOKEN_BUFFER_MS = 60 * 1000; // refresh 1 min before expiry

/**
 * Clean text for sentiment: remove HTML, emojis, URLs, excess special chars.
 * @param {string} raw
 * @returns {string}
 */
function cleanText(raw) {
    if (!raw || typeof raw !== 'string') return '';
    let s = raw
        .replace(/<[^>]*>/g, ' ')
        .replace(/https?:\/\/[^\s]+/gi, ' ')
        .replace(/www\.[^\s]+/gi, ' ')
        .replace(/[\u{1F300}-\u{1F9FF}]/gu, ' ')
        .replace(/[\u2600-\u26FF\u2700-\u27BF]/g, ' ')
        .replace(/[^\p{L}\p{N}\s.,!?'-]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    return s.slice(0, 2000);
}

/**
 * Get OAuth2 access token (password grant). Throws on failure.
 * @returns {Promise<string>}
 */
async function getAccessToken() {
    if (cachedToken && Date.now() < tokenExpiry - TOKEN_BUFFER_MS) {
        return cachedToken;
    }
    const clientId = process.env.REDDIT_CLIENT_ID;
    const clientSecret = process.env.REDDIT_CLIENT_SECRET;
    const username = process.env.REDDIT_USERNAME;
    const password = process.env.REDDIT_PASSWORD;
    const userAgent = process.env.REDDIT_USER_AGENT || 'SentimentDashboard/1.0';

    if (!clientId || !clientSecret || !username || !password) {
        throw new Error('REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD required');
    }

    const body = new URLSearchParams({
        grant_type: 'password',
        username,
        password,
    }).toString();

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const res = await fetch(REDDIT_AUTH_URL, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': userAgent,
        },
        body,
    });

    if (!res.ok) {
        const text = await res.text();
        if (res.status === 429) throw new Error('RATE_LIMIT');
        throw new Error(`Reddit auth failed: ${res.status} ${text}`);
    }

    const data = await res.json();
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in || 3600) * 1000;
    return cachedToken;
}

/**
 * Fetch latest public posts from /r/popular. Cleans text per post.
 * @returns {Promise<Array<{ id: string, content: string, created_at: string, platform: string }>>}
 */
async function fetchPublicPosts() {
    const token = await getAccessToken();
    const userAgent = process.env.REDDIT_USER_AGENT || 'SentimentDashboard/1.0';
    const limit = Math.min(Number(process.env.REDDIT_LIMIT) || DEFAULT_LIMIT, 100);
    const subreddit = process.env.REDDIT_SUBREDDIT || 'popular';

    const url = `${REDDIT_API_BASE}/r/${subreddit}?limit=${limit}&raw_json=1`;
    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
            'User-Agent': userAgent,
        },
    });

    if (!res.ok) {
        if (res.status === 429) throw new Error('RATE_LIMIT');
        throw new Error(`Reddit API error: ${res.status}`);
    }

    const json = await res.json();
    const children = json?.data?.children || [];
    const posts = [];

    for (const child of children) {
        const d = child?.data;
        if (!d?.id) continue;
        const title = d.title || '';
        const selftext = d.selftext || '';
        const raw = `${title} ${selftext}`.trim();
        const content = cleanText(raw);
        if (!content) continue;
        const createdUtc = d.created_utc;
        const created_at = createdUtc
            ? new Date(createdUtc * 1000).toISOString()
            : new Date().toISOString();
        posts.push({
            id: `reddit_${d.id}`,
            content,
            created_at,
            platform: PLATFORM,
        });
    }

    return posts;
}

/**
 * Check if Reddit integration is configured (all required env vars set).
 */
function isRedditConfigured() {
    return !!(
        process.env.REDDIT_CLIENT_ID &&
        process.env.REDDIT_CLIENT_SECRET &&
        process.env.REDDIT_USERNAME &&
        process.env.REDDIT_PASSWORD
    );
}

module.exports = {
    fetchPublicPosts,
    cleanText,
    isRedditConfigured,
    PLATFORM,
};
