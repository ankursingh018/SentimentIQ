/**
 * Bluesky API integration for live public/home timeline posts.
 * Uses app password: BLUESKY_HANDLE (e.g. your.bsky.social) and BLUESKY_APP_PASSWORD.
 * Creates session via com.atproto.server.createSession, then fetches timeline via
 * app.bsky.feed.getTimeline. Cleans text (strip HTML, emojis, URLs), returns
 * { id, content, created_at, platform: 'Bluesky' } for dashboard pipeline.
 *
 * Env: BLUESKY_HANDLE, BLUESKY_APP_PASSWORD
 */

const BLUESKY_PDS = 'https://bsky.social';
const BLUESKY_PUBLIC = 'https://public.api.bsky.app';
const DEFAULT_LIMIT = 50;
const PLATFORM = 'Bluesky';
/** Public "What's Hot" feed – no auth. Use when timeline is empty (e.g. new account, no follows). */
const WHATS_HOT_FEED = 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot';

let cachedAccessJwt = null;
let tokenExpiry = 0;
const TOKEN_BUFFER_MS = 5 * 60 * 1000; // refresh 5 min before expiry

/**
 * Clean text for sentiment: remove HTML, emojis, URLs, excess special chars.
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
 * Create session and get access JWT. Throws on failure.
 */
async function createSession() {
    if (cachedAccessJwt && Date.now() < tokenExpiry - TOKEN_BUFFER_MS) {
        return cachedAccessJwt;
    }
    const handle = process.env.BLUESKY_HANDLE;
    const password = process.env.BLUESKY_APP_PASSWORD;
    if (!handle || !password) {
        throw new Error('BLUESKY_HANDLE and BLUESKY_APP_PASSWORD required');
    }

    const res = await fetch(`${BLUESKY_PDS}/xrpc/com.atproto.server.createSession`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: handle.trim(), password: password.trim() }),
    });

    if (!res.ok) {
        cachedAccessJwt = null;
        const text = await res.text();
        if (res.status === 429) throw new Error('RATE_LIMIT');
        throw new Error(`Bluesky auth failed: ${res.status} ${text}`);
    }

    const data = await res.json();
    cachedAccessJwt = data.accessJwt;
    // Bluesky access JWT is short-lived; refresh often. No expires_in in response, use ~1 hour.
    tokenExpiry = Date.now() + 55 * 60 * 1000;
    return cachedAccessJwt;
}

/**
 * Fetch timeline posts. Returns array of { id, content, created_at, platform: 'Bluesky' }.
 * Integration: handles feedViewPost shape (item.post = postView with uri, record).
 */
/**
 * Fetch raw timeline feed (or fallback to What's Hot).
 * @returns {Promise<Array>} Raw feed items
 */
async function fetchRawTimeline() {
    const debug = process.env.BLUESKY_DEBUG === '1' || process.env.BLUESKY_DEBUG === 'true';
    const handle = (process.env.BLUESKY_HANDLE || 'trendlytic.bsky.social').trim();
    const password = process.env.BLUESKY_APP_PASSWORD;
    const limit = Math.min(Number(process.env.BLUESKY_LIMIT) || DEFAULT_LIMIT, 50);

    let allItems = [];

    // 1. Fetch Author Feed (My own posts) - High Priority
    // We can do this publicly if handle is known
    try {
        const authorUrl = `${BLUESKY_PUBLIC}/xrpc/app.bsky.feed.getAuthorFeed?actor=${handle}&limit=${limit}`;
        const aRes = await fetch(authorUrl);
        if (aRes.ok) {
            const aJson = await aRes.json();
            if (aJson.feed) allItems.push(...aJson.feed);
        }
    } catch (err) {
        if (debug) console.warn('[Bluesky] Author feed fetch failed:', err.message);
    }

    // 2. Fetch Notifications (Comments/Replies)
    if (password) {
        try {
            const accessJwt = await createSession();
            // Auth-based: listNotifications (More accurate for direct replies)
            const notifyUrl = `${BLUESKY_PDS}/xrpc/app.bsky.notification.listNotifications?limit=${limit}`;
            const nRes = await fetch(notifyUrl, {
                headers: { Authorization: `Bearer ${accessJwt}`, 'Content-Type': 'application/json' },
            });
            if (nRes.ok) {
                const nJson = await nRes.json();
                const replies = (nJson.notifications || [])
                    .filter(n => n.reason === 'reply' || n.reason === 'mention')
                    .map(n => ({
                        post: {
                            uri: n.uri,
                            cid: n.cid,
                            author: n.author,
                            record: n.record,
                            indexedAt: n.indexedAt
                        }
                    }));
                allItems.push(...replies);
            }
        } catch (err) {
            if (debug) console.warn('[Bluesky] Auth-based fetch failed:', err.message);
        }
    } else {
        // Public-fallback: searchPosts for handle (Finds mentions/comments mentioning the handle)
        try {
            const searchUrl = `${BLUESKY_PUBLIC}/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(handle)}&limit=${limit}`;
            const sRes = await fetch(searchUrl);
            if (sRes.ok) {
                const sJson = await sRes.json();
                if (sJson.posts) {
                    allItems.push(...sJson.posts.map(p => ({ post: p })));
                }
            }
        } catch (err) {
            if (debug) console.warn('[Bluesky] Public mention search failed:', err.message);
        }
    }

    // 3. Fetch Post Threads (Replies context for each post)
    // REQUIRED FIX: Explicitly fetch thread to get comments from others
    if (allItems.length > 0) {
        try {
            // Attempt to get auth token for higher rate limits
            let authHeaders = {};
            if (password) {
                try {
                    const accessJwt = await createSession();
                    authHeaders = { Authorization: `Bearer ${accessJwt}` };
                } catch (e) {
                    // ignore, fallback to public
                }
            }

            // Updated Logic: Check context for ALL recent posts (up to 15) regardless of immediate count
            // due to potential API caching lag or distributed nature.
            const threadPromises = allItems.slice(0, 15).map(async (item) => {
                if (!item.post || !item.post.uri) return [];

                // Uses public endpoint structure but with auth header if available
                const threadUrl = `${BLUESKY_PUBLIC}/xrpc/app.bsky.feed.getPostThread?uri=${encodeURIComponent(item.post.uri)}&depth=1`;

                try {
                    // Start with public access (no headers) to avoid 401s from bad tokens
                    const res = await fetch(threadUrl);
                    if (res.ok) {
                        const json = await res.json();
                        if (json.thread && json.thread.replies) {
                            // Debug logging
                            if (debug) {
                                json.thread.replies.forEach(r => {
                                    if (r.post) console.log(`[Bluesky] Thread reply found from: ${r.post.author.handle}`);
                                });
                            }
                            return json.thread.replies
                                .filter(r => r.post) // Ensure it is a post view
                                .map(r => ({ post: r.post }));
                        }
                    } else {
                        // Fallback to public node if PDS fails?
                        if (debug) console.warn(`[Bluesky] Thread fetch failed ${res.status} for ${item.post.uri}`);
                    }
                } catch (err) {
                    if (debug) console.warn(`[Bluesky] Thread fetch failed for ${item.post.uri}:`, err.message);
                }
                return [];
            });

            const allReplies = await Promise.all(threadPromises);
            const flattenedReplies = allReplies.flat();
            if (debug && flattenedReplies.length > 0) {
                console.log(`[Bluesky] Fetched ${flattenedReplies.length} additional replies from post threads.`);
            }
            allItems.push(...flattenedReplies);

        } catch (err) {
            if (debug) console.warn('[Bluesky] Context fetch failed:', err.message);
        }
    }

    // 4. Final Aggregation
    // Remove duplicates based on URI
    const seenUris = new Set();
    const uniqueItems = [];
    for (const item of allItems) {
        if (!item.post || !item.post.uri) continue;
        if (seenUris.has(item.post.uri)) continue;
        seenUris.add(item.post.uri);
        uniqueItems.push(item);
    }
    allItems = uniqueItems;

    // Sort by date descending
    allItems.sort((a, b) => {
        const dateA = a.post.record?.createdAt || a.post.indexedAt || 0;
        const dateB = b.post.record?.createdAt || b.post.indexedAt || 0;
        return new Date(dateB) - new Date(dateA);
    });

    // Removed the "What's Hot" fallback to ensure the dashboard ONLY shows user-specific content
    // as requested (no general app-wide popular posts).

    if (allItems.length === 0 && debug) {
        console.log(`[Bluesky] No specific activity found for ${handle}. Dashboard will remain empty.`);
    }

    return allItems;
}

async function fetchRawPublicFeed(limit, debug) {
    const url = `${BLUESKY_PUBLIC}/xrpc/app.bsky.feed.getFeed?feed=${encodeURIComponent(WHATS_HOT_FEED)}&limit=${limit}`;
    const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
    const body = await res.text();
    if (!res.ok) {
        if (debug) console.error('[Bluesky] Public feed error:', res.status, body?.slice(0, 200));
        return [];
    }
    let json;
    try {
        json = JSON.parse(body);
    } catch (e) {
        return [];
    }
    return json.feed || [];
}

/**
 * Fetch timeline posts. Returns array of { id, content, created_at, platform: 'Bluesky' }.
 */
async function fetchPublicPosts() {
    const debug = process.env.BLUESKY_DEBUG === '1' || process.env.BLUESKY_DEBUG === 'true';
    let feed = [];
    try {
        feed = await fetchRawTimeline();
    } catch (e) {
        if (e.message === 'RATE_LIMIT') throw e;
        console.error('[Bluesky] Raw fetch failed, using internal error logic', e.message);
    }

    // Fallback logic for parsing currently handled inside fetchRawTimeline's fallback call?
    // Wait, fetchRawTimeline NOW calls fetchRawPublicFeed if empty.
    // So 'feed' contains items.

    const posts = parseFeedToPosts(feed);
    if (debug) console.log('[Bluesky] Parsed posts:', posts.length);
    return posts;
}

/**
 * Fetch a feed from public API (no auth). Same response shape as getTimeline.
 */
// fetchPublicFeed replaced by fetchRawPublicFeed logic usage inside fetchRawTimeline
// keeping parseFeedToPosts as utility

/**
 * Parse feed array (getTimeline or getFeed response) into dashboard post shape.
 */
function parseFeedToPosts(feed) {
    const posts = [];
    for (const item of feed) {
        const post = item?.post;
        if (!post?.uri) continue;
        const record = post?.record || {};
        const text = record?.text ?? record?.Text ?? '';
        if (typeof text !== 'string' || !text.trim()) continue;
        const cleaned = cleanText(text);
        const content = (cleaned && cleaned.trim()) ? cleaned : text.trim().slice(0, 2000);
        const createdAt = record?.createdAt ?? record?.created_at ?? post?.indexedAt;
        const created_at = (typeof createdAt === 'string' && /^\d{4}-\d{2}-\d{2}/.test(createdAt))
            ? createdAt
            : new Date().toISOString();
        posts.push({
            id: post.uri.replace(/^at:\/\//, '').replace(/\//g, '_'),
            content: content.slice(0, 500),
            created_at,
            platform: PLATFORM,
            is_reply: !!record.reply // Check if it has a reply context
        });
    }
    return posts;
}

function isBlueskyConfigured() {
    // Always return true to allow fallback to public "What's Hot" feed
    return true;
}

module.exports = {
    fetchPublicPosts,
    fetchRawTimeline,
    cleanText,
    parseFeedToPosts,
    isBlueskyConfigured,
    PLATFORM,
};
