const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth.cjs');
const { router: sentimentRoutes, setRawPosts } = require('./routes/sentiment.cjs');
const { fetchRawTimeline: fetchRawMastodon, stripHtml: stripHtmlMastodon } = require('./services/mastodon.cjs');
const { fetchPublicPosts: fetchRedditPosts, isRedditConfigured } = require('./services/reddit.cjs');
const { fetchRawTimeline: fetchRawBluesky, parseFeedToPosts: parseBlueskyFeed, isBlueskyConfigured } = require('./services/bluesky.cjs');
const { buildDashboardData, getEmptyDashboard } = require('./services/dashboardData.cjs');
const { analyzeSentiments } = require('./services/sentiment.cjs');
const { checkSentimentAlerts } = require('./services/alertSystem.cjs');
const { normalizeWithAI } = require('./services/aiNormalizer.cjs');
const { fetchRawLemmyTimeline } = require('./services/lemmy.cjs');

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sentiment', sentimentRoutes);

const PORT = process.env.PORT || 5000;
const CONNECTION_URL = process.env.MONGO_URI || 'mongodb://localhost:27017/sentiment_ai_db';
const MASTODON_POLL_MS = 30 * 1000; // 30 seconds
const LEMMY_POLL_MS = 10 * 1000; // 10 seconds

// Rolling accumulator: keep posts from the last 24h so trends don't jump every poll.
// Each poll we merge new posts (dedupe by id) and drop posts older than the window.
const POSTS_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_POSTS = 2000; // cap memory
const postStore = new Map(); // id -> { id, content, created_at, platform, is_reply }

function mergePosts(newPosts) {
    if (!Array.isArray(newPosts)) return;
    for (const p of newPosts) {
        if (p && p.id) {
            postStore.set(p.id, {
                id: p.id,
                content: p.content,
                created_at: p.created_at,
                platform: p.platform,
                is_reply: !!p.is_reply // Preserve reply status
            });
        }
    }
    const cutoff = Date.now() - POSTS_TTL_MS;
    const cutoffIso = new Date(cutoff).toISOString();
    for (const [id, p] of postStore.entries()) {
        if (p.created_at < cutoffIso) postStore.delete(id);
    }
    if (postStore.size > MAX_POSTS) {
        const sorted = [...postStore.entries()].sort((a, b) => (b[1].created_at || '').localeCompare(a[1].created_at || ''));
        for (let i = MAX_POSTS; i < sorted.length; i++) postStore.delete(sorted[i][0]);
    }
}

function getAccumulatedPosts() {
    return [...postStore.values()].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
}

/**
 * Poll live social API, merge into accumulator, push dashboard.
 * Uses AI for Mastodon/Bluesky normalization if available, with deterministic fallback.
 * Reddit remains on legacy path.
 */
async function pollAndUpdateDashboard() {
    const useBluesky = isBlueskyConfigured();
    const useReddit = isRedditConfigured();
    const useMastodon = !!process.env.MASTODON_ACCESS_TOKEN;

    const tasks = [];

    // Bluesky: Raw -> AI -> Fallback
    if (useBluesky) {
        tasks.push(async () => {
            try {
                const raw = await fetchRawBluesky();
                let posts = [];
                try {
                    posts = await normalizeWithAI(raw, 'Bluesky');
                } catch (aiErr) {
                    // console.warn('[Bluesky] AI Normalization skipped:', aiErr.message);
                    // Fallback to deterministic logic
                    posts = parseBlueskyFeed(raw);
                }
                if (posts && posts.length) mergePosts(posts);
            } catch (err) {
                if (err.message === 'RATE_LIMIT') {
                    console.warn(`[Bluesky] Rate limit hit.`);
                } else {
                    console.warn(`[Bluesky] Error fetching:`, err.message);
                }
            }
        });
    }

    // Mastodon: Raw -> AI -> Fallback
    if (useMastodon) {
        tasks.push(async () => {
            try {
                const raw = await fetchRawMastodon();
                let posts = [];
                try {
                    posts = await normalizeWithAI(raw, 'Mastodon');
                } catch (aiErr) {
                    // console.warn('[Mastodon] AI Normalization skipped:', aiErr.message);
                    // Fallback to deterministic logic
                    posts = raw.map(p => ({
                        id: `mastodon_${p.id}`,
                        content: stripHtmlMastodon(p.content || ''),
                        created_at: p.created_at,
                        platform: 'Mastodon',
                        is_reply: !!p.in_reply_to_id // Capture reply status in fallback
                    }));
                }
                if (posts && posts.length) mergePosts(posts);
            } catch (err) {
                if (err.message === 'RATE_LIMIT') {
                    console.warn(`[Mastodon] Rate limit hit.`);
                } else {
                    console.warn(`[Mastodon] Error fetching:`, err.message);
                }
            }
        });
    }

    // Reddit: Legacy Service
    if (useReddit) {
        tasks.push(async () => {
            try {
                const posts = await fetchRedditPosts();
                mergePosts(posts);
            } catch (err) {
                if (err.message === 'RATE_LIMIT') console.warn(`[Reddit] Rate limit hit.`);
                else console.warn(`[Reddit] Error fetching:`, err.message);
            }
        });
    }

    if (tasks.length === 0) return;

    await Promise.all(tasks.map(t => t()));
    await updateDashboardAggregates();
}

/**
 * Isolated logic to update dashboard store and trigger alerts.
 * Shared by both the main poller and the high-frequency Lemmy poller.
 */
async function updateDashboardAggregates() {
    const accumulated = getAccumulatedPosts();
    if (accumulated.length === 0) return;

    setRawPosts(accumulated);

    // --- Automated Alert System Integration ---
    const alertSummary = {
        mastodon: { total: 0, negative: 0 },
        bluesky: { total: 0, negative: 0 },
        lemmy: { total: 0, negative: 0 },
        combined: { total: 0, negative: 0 }
    };

    const texts = accumulated.map(p => p.content);
    const sentiments = await analyzeSentiments(texts);

    accumulated.forEach((p, index) => {
        const plat = (p.platform || '').toLowerCase();
        const { label } = sentiments[index] || { label: 'Neutral' };
        const isNegative = label === 'Negative';

        if (plat === 'mastodon' || plat === 'bluesky' || plat === 'lemmy') {
            alertSummary[plat].total++;
            if (isNegative) alertSummary[plat].negative++;
        }

        // "All Dashboard" aggregate
        alertSummary.combined.total++;
        if (isNegative) alertSummary.combined.negative++;
    });

    // Logging only for significant updates (reduce noise)
    if (accumulated.length > 0) {
        const mPct = alertSummary.mastodon.total > 0 ? (alertSummary.mastodon.negative / alertSummary.mastodon.total * 100).toFixed(1) : 0;
        const bPct = alertSummary.bluesky.total > 0 ? (alertSummary.bluesky.negative / alertSummary.bluesky.total * 100).toFixed(1) : 0;
        const lPct = alertSummary.lemmy.total > 0 ? (alertSummary.lemmy.negative / alertSummary.lemmy.total * 100).toFixed(1) : 0;
        const cPct = alertSummary.combined.total > 0 ? (alertSummary.combined.negative / alertSummary.combined.total * 100).toFixed(1) : 0;
        console.log(`[AlertCheck] Negatives -> Mastodon: ${mPct}%, Bluesky: ${bPct}%, Lemmy: ${lPct}%, Total: ${cPct}%`);
    }

    checkSentimentAlerts(alertSummary).catch(e => console.error('[Alert] Cycle failed', e));
}

/**
 * Higher frequency poller for Lemmy as requested.
 */
async function pollLemmy() {
    try {
        const posts = await fetchRawLemmyTimeline();
        if (posts && posts.length) {
            mergePosts(posts);
            await updateDashboardAggregates();
        }
    } catch (err) {
        console.warn(`[Lemmy] Polling error:`, err.message);
    }
}

mongoose.connect(CONNECTION_URL)
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port: ${PORT}`);
            setRawPosts([]); // Initialize with empty array
            const sources = [];
            if (isBlueskyConfigured()) sources.push('Bluesky');
            if (isRedditConfigured()) sources.push('Reddit');
            if (process.env.MASTODON_ACCESS_TOKEN) sources.push('Mastodon');
            sources.push('Lemmy'); // Always enabled (Read-only public)
            console.log('Live data source(s):', sources.length ? sources.join(', ') : 'none');

            pollAndUpdateDashboard();
            setInterval(pollAndUpdateDashboard, MASTODON_POLL_MS);

            pollLemmy();
            setInterval(pollLemmy, LEMMY_POLL_MS);
        });
    })
    .catch((error) => console.log(error.message));
