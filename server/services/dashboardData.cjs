/**
 * Aggregates Mastodon posts + sentiment into the exact shape expected by the dashboard UI.
 * No UI changes; this matches existing Dashboard.jsx data structures.
 */

const { analyzeSentiments } = require('./sentiment.cjs');

const PIE_COLORS = { Positive: '#10b981', Neutral: '#94a3b8', Negative: '#ef4444' };
const PLATFORM_DEFAULT = 'Mastodon';

/**
 * Format relative time for "Recent Mentions" column.
 * @param {string} isoDate
 * @returns {string}
 */
function timeAgo(isoDate) {
    const d = new Date(isoDate);
    const now = new Date();
    const sec = Math.floor((now - d) / 1000);
    if (sec < 60) return 'Just now';
    if (sec < 3600) return `${Math.floor(sec / 60)} mins ago`;
    if (sec < 86400) return `${Math.floor(sec / 3600)} hours ago`;
    return `${Math.floor(sec / 86400)} days ago`;
}

/**
 * Build dashboard payload from list of posts with plain text content.
 * @param {Array<{ id: string, content: string, created_at: string }>} posts
 * @returns Dashboard-shaped object for Dashboard.jsx
 */
async function buildDashboardData(posts) {
    if (!Array.isArray(posts) || posts.length === 0) {
        return getEmptyDashboard();
    }

    const validPosts = posts.filter(p => p.content && p.content.trim().length > 0);

    const texts = validPosts.map(p => p.content);
    const sentiments = await analyzeSentiments(texts);

    const withSentiment = validPosts.map((p, index) => {
        const { label, score } = sentiments[index] || { label: 'Neutral', score: 0.5 };
        return {
            id: p.id,
            platform: p.platform || PLATFORM_DEFAULT,
            content: p.content.slice(0, 200) + (p.content.length > 200 ? '...' : ''),
            sentiment: label,
            score: Math.round(score * 100) / 100,
            time: timeAgo(p.created_at),
            created_at: p.created_at,
            _label: label,
            _score: score,
            is_reply: !!p.is_reply
        };
    });

    const totalStats = withSentiment.length; // Full interaction count
    const totalPosts = totalStats; // User wants to see all activity in the count

    const positive = withSentiment.filter((p) => p._label === 'Positive').length;
    const neutral = withSentiment.filter((p) => p._label === 'Neutral').length;
    const negative = withSentiment.filter((p) => p._label === 'Negative').length;
    const sumScore = withSentiment.reduce((s, p) => s + p._score, 0);
    const avgScore = totalStats ? sumScore / totalStats : 0;

    const sentimentPieData = [
        { name: 'Positive', value: positive, color: PIE_COLORS.Positive },
        { name: 'Neutral', value: neutral, color: PIE_COLORS.Neutral },
        { name: 'Negative', value: negative, color: PIE_COLORS.Negative },
    ].filter((d) => d.value > 0);
    if (sentimentPieData.length === 0) {
        sentimentPieData.push({ name: 'Neutral', value: 1, color: PIE_COLORS.Neutral });
    }

    const pctPos = totalStats ? Math.round((positive / totalStats) * 100) : 0;
    const pctNeg = totalStats ? Math.round((negative / totalStats) * 100) : 0;

    const kpiData = [
        { title: 'Total Posts', value: totalPosts, change: 'Live', color: 'text-green', icon: 'MessageSquare' },
        { title: 'Positive Sentiment', value: `${pctPos}%`, change: 'Live', color: 'text-green', icon: 'TrendingUp' },
        { title: 'Negative Sentiment', value: `${pctNeg}%`, change: 'Live', color: pctNeg > 20 ? 'text-red' : 'text-green', icon: 'AlertTriangle' },
        { title: 'Avg. Sentiment', value: avgScore.toFixed(2), change: 'Live', color: 'text-green', icon: 'BarChart2' },
        { title: 'Dominant Emotion', value: pctPos >= 50 ? 'Joy' : pctNeg >= 30 ? 'Concern' : 'Neutral', change: 'Stable', color: 'text-blue', icon: 'Users' },
        { title: 'Active Alerts', value: pctNeg > 25 ? '1' : '0', change: 'Live', color: 'text-red', icon: 'Bell' },
    ];

    // Trend over time: Granular view (Last 60 mins, bucketed by 5 mins)
    // Changing from hourly to minute-based to show live activity immediately
    const buckets = {};
    const now = new Date();
    // 12 buckets of 5 minutes = 60 minutes history
    for (let i = 11; i >= 0; i--) {
        const t = new Date(now.getTime() - (i * 5 * 60 * 1000));
        // Round to nearest 5 min
        t.setMinutes(Math.floor(t.getMinutes() / 5) * 5, 0, 0);

        // Key: HH:mm
        const key = t.toTimeString().slice(0, 5);
        buckets[key] = { time: key, positive: 0, neutral: 0, negative: 0 };
    }

    withSentiment.forEach((p) => {
        const d = new Date(p.created_at);
        // Align to same 5-min bucket logic
        const t = new Date(d.getTime());
        t.setMinutes(Math.floor(t.getMinutes() / 5) * 5, 0, 0);
        const key = t.toTimeString().slice(0, 5);

        if (buckets[key]) {
            if (p._label === 'Positive') buckets[key].positive += 1;
            else if (p._label === 'Negative') buckets[key].negative += 1;
            else buckets[key].neutral += 1;
        }
    });
    const trendData = Object.values(buckets);

    const recentPosts = withSentiment.slice(0, 20).map(({ id, platform, content, sentiment, score, time, is_reply }) => ({
        id,
        platform,
        content,
        sentiment,
        score,
        time,
        is_reply
    }));

    const emotionData = calculateEmotionData(withSentiment);
    const aspectData = calculateAspectData(withSentiment);
    const keywords = calculateKeywords(withSentiment);

    return {
        kpiData,
        sentimentPieData,
        trendData,
        recentPosts,
        emotionData,
        aspectData,
        keywords,
    };
}

// --- Dynamic Analysis Helpers ---

// Keyword dictionaries for heuristics
const EMOTION_KEYWORDS = {
    Joy: ['happy', 'love', 'great', 'awesome', 'best', 'good', 'success', 'win', 'fun', 'joy', 'smile', 'laugh', 'excited', 'amazing', 'hope', 'wonderful'],
    Anger: ['hate', 'angry', 'mad', 'fail', 'stupid', 'bad', 'hell', 'annoy', 'disgust', 'terrible', 'worst', 'awful', 'rage', 'furious', 'damn'],
    Sadness: ['sad', 'cry', 'miss', 'sorry', 'lost', 'fail', 'pain', 'grief', 'lonely', 'depressed', 'tear', 'hurt', 'regret'],
    Fear: ['fear', 'scared', 'afraid', 'worry', 'danger', 'panic', 'risk', 'threat', 'nervous', 'stress', 'anxiety', 'concerned'],
    Surprise: ['wow', 'omg', 'surprise', 'shock', 'weird', 'strange', 'sudden', 'unexpected', 'amazed', 'unbelievable']
};

const ASPECT_KEYWORDS = {
    Price: ['price', 'cost', 'money', 'expensive', 'cheap', 'pay', 'value', 'worth', 'buy', 'afford', 'fee', 'charge'],
    Quality: ['quality', 'build', 'broken', 'solid', 'feel', 'look', 'design', 'material', 'texture', 'standard', 'sturdy', 'flimsy'],
    Service: ['service', 'support', 'staff', 'help', 'team', 'answer', 'reply', 'rude', 'polite', 'waiting', 'response'],
    Features: ['feature', 'option', 'setting', 'mode', 'update', 'new', 'capability', 'func', 'tool', 'version'],
    Performance: ['speed', 'slow', 'fast', 'lag', 'crash', 'bug', 'performance', 'stable', 'smooth', 'quick', 'reliability']
};

function calculateEmotionData(postsWithSentiment) {
    const counts = { Joy: 0, Anger: 0, Sadness: 0, Fear: 0, Surprise: 0 };

    // Baseline: every post contributes slightly to an emotion based on its raw sentiment? 
    // Or just simple keyword counting? Let's do keyword counting + sentiment bias.

    postsWithSentiment.forEach(p => {
        const text = p.content.toLowerCase();

        let found = false;
        for (const [emotion, words] of Object.entries(EMOTION_KEYWORDS)) {
            if (words.some(w => text.includes(w))) {
                counts[emotion]++;
                found = true;
            }
        }

        // Fallback based on sentiment alone if no keywords found
        if (!found) {
            if (p._label === 'Positive') counts.Joy += 0.5; // Implied joy
            else if (p._label === 'Negative') counts.Anger += 0.5; // Implied dissatisfaction
        }
    });

    const maxVal = Math.max(...Object.values(counts)) || 1;
    const fullMark = Math.ceil(maxVal * 1.2); // 20% buffer

    return Object.keys(counts).map(subject => ({
        subject,
        A: Math.round(counts[subject]),
        fullMark
    }));
}

function calculateAspectData(postsWithSentiment) {
    const aspects = {
        Price: { score: 0, count: 0 },
        Quality: { score: 0, count: 0 },
        Service: { score: 0, count: 0 },
        Features: { score: 0, count: 0 },
        Performance: { score: 0, count: 0 }
    };

    postsWithSentiment.forEach(p => {
        const text = p.content.toLowerCase();
        for (const [aspect, words] of Object.entries(ASPECT_KEYWORDS)) {
            if (words.some(w => text.includes(w))) {
                aspects[aspect].score += p._score; // 0..1
                aspects[aspect].count++;
            }
        }
    });

    return Object.keys(aspects).map(name => {
        const data = aspects[name];
        // Calculate average sentiment 0..100
        // If no data, default to 50 (Neutral)
        const avg = data.count > 0 ? (data.score / data.count) * 100 : 50;
        return {
            name,
            sentiment: Math.round(avg)
        };
    });
}

function calculateKeywords(posts) {
    // Expanded stop words list
    const stopWords = new Set([
        'the', 'and', 'this', 'that', 'with', 'from', 'have', 'for', 'just', 'like', 'what', 'your', 'https', 'http', 'com', 'www',
        'are', 'but', 'not', 'was', 'can', 'all', 'how', 'when', 'who', 'why', 'will', 'more', 'about', 'they', 'our', 'out', 'now',
        'there', 'has', 'had', 'been', 'which', 'its', 'some', 'than', 'into', 'them', 'then', 'over', 'only', 'very', 'even', 'most',
        'also', 'after', 'before', 'would', 'should', 'could', 'social', 'user', 'people'
    ]);
    const freq = {};

    posts.forEach(p => {
        const words = p.content.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
        words.forEach(w => {
            if (!stopWords.has(w)) {
                freq[w] = (freq[w] || 0) + 1;
            }
        });
    });

    const topCandidates = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 30);

    if (topCandidates.length === 0) return [];

    const shuffled = topCandidates.sort(() => 0.5 - Math.random());

    return shuffled.slice(0, 7).map(([text, count]) => ({
        text,
        value: 40 + (count * 10)
    }));
}

function getEmptyDashboard() {
    return {
        kpiData: [
            { title: 'Total Posts', value: '0', change: 'Live', color: 'text-green', icon: 'MessageSquare' },
            { title: 'Positive Sentiment', value: '0%', change: 'Live', color: 'text-green', icon: 'TrendingUp' },
            { title: 'Negative Sentiment', value: '0%', change: 'Live', color: 'text-green', icon: 'AlertTriangle' },
            { title: 'Avg. Sentiment', value: '0.00', change: 'Live', color: 'text-green', icon: 'BarChart2' },
            { title: 'Dominant Emotion', value: 'Neutral', change: 'Stable', color: 'text-blue', icon: 'Users' },
            { title: 'Active Alerts', value: '0', change: 'Live', color: 'text-red', icon: 'Bell' },
        ],
        sentimentPieData: [{ name: 'Neutral', value: 1, color: PIE_COLORS.Neutral }],
        trendData: [],
        recentPosts: [],
        emotionData: [
            { subject: 'Joy', A: 0, fullMark: 100 },
            { subject: 'Anger', A: 0, fullMark: 100 },
            { subject: 'Sadness', A: 0, fullMark: 100 },
            { subject: 'Fear', A: 0, fullMark: 100 },
            { subject: 'Surprise', A: 0, fullMark: 100 },
        ],
        aspectData: [
            { name: 'Price', sentiment: 50 },
            { name: 'Quality', sentiment: 50 },
            { name: 'Service', sentiment: 50 },
            { name: 'Features', sentiment: 50 },
            { name: 'Performance', sentiment: 50 },
        ],
        keywords: [],
    };
}

module.exports = { buildDashboardData, getEmptyDashboard };
