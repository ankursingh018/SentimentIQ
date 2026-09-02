/**
 * Lemmy integration for fetching posts and comments.
 * Uses Lemmy API v3.
 * No authentication required for read access.
 */

const DEFAULT_INSTANCE = 'https://lemmy.ml';
const PLATFORM = 'Lemmy';

/**
 * Fetch posts from a Lemmy instance.
 */
async function fetchLemmyPosts(instance = DEFAULT_INSTANCE, options = {}) {
    const { limit = 10, sort = 'New', community_name, creator_id } = options;
    let url = `${instance}/api/v3/post/list?limit=${limit}&sort=${sort}`;
    if (community_name) url += `&community_name=${community_name}`;
    if (creator_id) url += `&creator_id=${creator_id}`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Lemmy API error: ${res.status}`);
        const data = await res.json();
        return data.posts || [];
    } catch (err) {
        console.warn(`[Lemmy] Failed to fetch posts from ${instance}:`, err.message);
        return [];
    }
}

/**
 * Fetch comments for a specific Lemmy post.
 */
async function fetchLemmyComments(instance = DEFAULT_INSTANCE, postId) {
    if (!postId) return [];
    const url = `${instance}/api/v3/comment/list?post_id=${postId}&sort=New`;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Lemmy API error: ${res.status}`);
        const data = await res.json();
        return data.comments || [];
    } catch (err) {
        console.warn(`[Lemmy] Failed to fetch comments for post ${postId}:`, err.message);
        return [];
    }
}

/**
 * Fetch raw Lemmy timeline (posts + comments for those posts).
 */
async function fetchRawLemmyTimeline() {
    const instance = process.env.LEMMY_INSTANCE || DEFAULT_INSTANCE;
    const community = process.env.LEMMY_COMMUNITY;
    const username = process.env.LEMMY_USERNAME;

    let postItems = [];
    let commentItems = [];

    // 1. If username is provided, use User API (it is the only reliable way to filter on many instances)
    if (username) {
        try {
            const userUrl = `${instance}/api/v3/user?username=${username}&sort=New&limit=25`;
            const res = await fetch(userUrl);
            if (res.ok) {
                const data = await res.json();

                const personId = data.person_view?.person?.id;

                // Discovery from 'posts' array
                const directPosts = data.posts || [];

                // Discovery from 'comments' array (often more reliable for new posts)
                const postsFromComments = (data.comments || [])
                    .filter(c => c.post && c.post.creator_id === personId)
                    .map(c => ({ post: c.post, creator: data.person_view.person }));

                // Merge and deduplicate posts by ID
                const postMap = new Map();
                [...directPosts, ...postsFromComments].forEach(p => {
                    if (p.post && p.post.id) postMap.set(p.post.id, p);
                });
                postItems = Array.from(postMap.values());

                // Get user's own comments (activity across the instance)
                const myComments = data.comments || [];

                // Fetch ALL comments for these specific personal posts to see engagement from others
                const threadPromises = postItems.map(item => fetchLemmyComments(instance, item.post.id));
                const threadCommentsArrays = await Promise.all(threadPromises);
                const allThreadComments = threadCommentsArrays.flat();

                // Combine and deduplicate
                const commentMap = new Map();
                [...myComments, ...allThreadComments].forEach(c => {
                    if (c.comment && c.comment.id) {
                        commentMap.set(c.comment.id, c);
                    }
                });
                commentItems = Array.from(commentMap.values());

                if (postItems.length === 0 && commentItems.length === 0) {
                    console.log(`[Lemmy] No personal activity found for ${username} on ${instance}.`);
                }
            }
        } catch (err) {
            console.warn(`[Lemmy] User API lookup failed:`, err.message);
        }
    }

    // 2. Fallback to public community feed only if NO username is configured
    if (!username) {
        postItems = await fetchLemmyPosts(instance, { limit: 10, community_name: community });
        const commentPromises = postItems.map(item => fetchLemmyComments(instance, item.post.id));
        const allCommentsArrays = await Promise.all(commentPromises);
        commentItems = allCommentsArrays.flat();
    }

    // 3. Normalize
    const normalized = [];
    postItems.forEach(item => {
        if (!item.post) return;
        normalized.push({
            id: `lemmy_post_${item.post.id}`,
            content: (item.post.body || item.post.name || ''),
            created_at: item.post.published,
            author: item.creator?.name || 'Unknown',
            platform: PLATFORM,
            is_reply: false
        });
    });

    commentItems.forEach(item => {
        if (!item.comment) return;
        normalized.push({
            id: `lemmy_comment_${item.comment.id}`,
            content: item.comment.content || '',
            created_at: item.comment.published,
            author: item.creator?.name || 'Unknown',
            platform: PLATFORM,
            is_reply: true,
            in_reply_to_id: item.comment.post_id
        });
    });

    return normalized;
}

async function fetchPublicLemmy() {
    const raw = await fetchRawLemmyTimeline();
    const seenIds = new Set();
    const unique = [];
    for (const item of raw) {
        if (!item.id || seenIds.has(item.id)) continue;
        seenIds.add(item.id);
        unique.push(item);
    }
    unique.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return unique;
}

module.exports = {
    fetchLemmyPosts,
    fetchLemmyComments,
    fetchRawLemmyTimeline,
    fetchPublicLemmy,
    PLATFORM
};
