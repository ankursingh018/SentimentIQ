/**
 * Mastodon public timeline integration.
 * Fetches from https://mastodon.social/api/v1/timelines/public
 * Uses MASTODON_ACCESS_TOKEN from environment. Polling is done by the caller (e.g. every 30s).
 * Returns posts with platform: 'Mastodon' so Recent Mentions shows the correct name.
 */

const MASTODON_INSTANCE = process.env.MASTODON_INSTANCE || 'https://mastodon.social';
const MASTODON_API = `${MASTODON_INSTANCE}/api/v1/timelines/public`;
const LIMIT = 40;
const PLATFORM = 'Mastodon';

/**
 * Strip HTML tags and decode common entities to get plain text.
 * @param {string} html
 * @returns {string}
 */
function stripHtml(html) {
    if (!html || typeof html !== 'string') return '';
    return html
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Fetch latest public timeline posts.
 * @returns {Promise<Array<{ id: string, content: string, created_at: string, account: { display_name?: string, username?: string } }>>}
 */
/**
 * Fetch raw API response from Mastodon.
 * @returns {Promise<Array>} Raw JSON array of posts
 */
let cachedAccountId = null;

async function resolveMyAccountId(token) {
    if (cachedAccountId) return cachedAccountId;

    // 1. Try verify_credentials if token exists
    if (token) {
        try {
            const res = await fetch(`${MASTODON_INSTANCE}/api/v1/accounts/verify_credentials`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                cachedAccountId = data.id;
                // console.log('[Mastodon] Resolved Account ID via token:', cachedAccountId);
                return cachedAccountId;
            }
        } catch (e) {
            // ignore
        }
    }

    // 2. Try looking up handle if provided
    const handle = process.env.MASTODON_HANDLE;
    if (handle) {
        try {
            const lookupUrl = `${MASTODON_INSTANCE}/api/v1/accounts/lookup?acct=${handle}`;
            const res = await fetch(lookupUrl);
            if (res.ok) {
                const data = await res.json();
                cachedAccountId = data.id;
                console.log('[Mastodon] Resolved Account ID via handle:', cachedAccountId);
                return cachedAccountId;
            }
        } catch (e) {
            console.warn('[Mastodon] Handle lookup failed:', e.message);
        }
    }

    return null;
}

async function fetchRawTimeline() {
    const token = process.env.MASTODON_ACCESS_TOKEN;
    const accountId = await resolveMyAccountId(token);

    let url;
    if (accountId) {
        url = `${MASTODON_INSTANCE}/api/v1/accounts/${accountId}/statuses?limit=${LIMIT}`;
    } else {
        // Fallback to public timeline if we can't identify 'my' account
        url = `${MASTODON_INSTANCE}/api/v1/timelines/public?limit=${LIMIT}`;
    }

    const headers = {
        Accept: 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
    };

    let res = await fetch(url, { headers });

    // If token is invalid/missing scope (403/401), retry without token (only works if public or handle-resolved)
    if (!res.ok && (res.status === 403 || res.status === 401) && token) {
        console.warn(`[Mastodon] Auth failed (${res.status}), retrying without token...`);
        const { Authorization, ...publicHeaders } = headers;
        // Update the main headers object so subsequent calls (context) use the working headers
        Object.keys(headers).forEach(key => delete headers[key]);
        Object.assign(headers, publicHeaders);

        res = await fetch(url, { headers: headers });
    }

    if (!res.ok) {
        if (res.status === 429) throw new Error('RATE_LIMIT');
        throw new Error(`Mastodon API error: ${res.status}`);
    }

    const data = await res.json();
    let statuses = Array.isArray(data) ? data : [];

    // REQUIRED FIX: Fetch context (replies/descendants) for each post
    if (statuses.length > 0) {
        try {
            // Updated Logic:
            // 1. Do NOT filter by replies_count (it can be 0 due to caching/federation lag).
            // 2. Increase limit to 15 to cover more recent ground.

            const contextPromises = statuses.slice(0, 15).map(async (status) => {
                // If it's a reblog, the 'active' ID is likely the original post
                const targetId = status.reblog ? status.reblog.id : status.id;
                const contextUrl = `${MASTODON_INSTANCE}/api/v1/statuses/${targetId}/context`;

                try {
                    const cRes = await fetch(contextUrl, { headers }); // Reuse headers (auth)
                    if (cRes.ok) {
                        const cJson = await cRes.json();
                        if (cJson.descendants && Array.isArray(cJson.descendants)) {
                            return cJson.descendants;
                        }
                    }
                } catch (err) {
                    console.warn(`[Mastodon] Context fetch failed for ${targetId}:`, err.message);
                }
                return [];
            });

            const allDescendants = await Promise.all(contextPromises);
            const flattenedDescendants = allDescendants.flat();
            if (flattenedDescendants.length > 0) {
                // console.log(`[Mastodon] Fetched ${flattenedDescendants.length} additional replies from context.`);
                statuses.push(...flattenedDescendants);
            }

        } catch (err) {
            console.warn('[Mastodon] Context aggregation failed:', err.message);
        }
    }

    // Deduplicate by ID
    const seenIds = new Set();
    const uniqueStatuses = [];
    for (const s of statuses) {
        if (!s.id) continue;
        if (seenIds.has(s.id)) continue;
        seenIds.add(s.id);
        uniqueStatuses.push(s);
    }

    // REQUIRED FIX: Sort by date descending so that new replies (fetched via context)
    // appear at the top and are not cut off by the slice(0, 20) limit in the dashboard.
    uniqueStatuses.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return uniqueStatuses;
}

/**
 * Fetch latest public timeline posts (Formatted).
 * @returns {Promise<Array<{ id: string, content: string, created_at: string, account: { display_name?: string, username?: string } }>>}
 */
async function fetchPublicTimeline() {
    const data = await fetchRawTimeline();
    return data.map((post) => ({
        id: `mastodon_${post.id}`,
        content: stripHtml(post.content || ''),
        created_at: post.created_at,
        account: post.account || {},
        platform: PLATFORM,
        is_reply: !!post.in_reply_to_id, // True if this is a comment/reply
    }));
}

/**
 * Fetch top trending hashtags on Mastodon.
 * @returns {Promise<Array>} Array of tag objects
 */
async function fetchTrends() {
    const token = process.env.MASTODON_ACCESS_TOKEN;
    const url = `${MASTODON_INSTANCE}/api/v1/trends/tags`;
    const headers = {
        Accept: 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
    };

    try {
        let res = await fetch(url, { headers });

        // If auth fails, try public access
        if (!res.ok && (res.status === 403 || res.status === 401) && token) {
            console.warn('[Mastodon] Trends Auth failed, retrying without token...');
            res = await fetch(url, { headers: { Accept: 'application/json' } });
        }

        if (!res.ok) {
            throw new Error(`Mastodon Trends API error: ${res.status}`);
        }
        return await res.json();
    } catch (err) {
        if (err.name === 'AbortError') throw new Error('Mastodon API timeout');
        throw err;
    }
}

module.exports = { fetchPublicTimeline, fetchRawTimeline, fetchTrends, stripHtml, PLATFORM };

