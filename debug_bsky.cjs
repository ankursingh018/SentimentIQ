require('dotenv').config();
const { fetchRawTimeline } = require('./server/services/bluesky.cjs');
const { analyzeSentiments } = require('./server/services/sentiment.cjs');

async function debugBlueskyDeep() {
    console.log('--- Bluesky Deep Thread Debug ---');
    try {
        const handle = process.env.BLUESKY_HANDLE || 'trendlytic.bsky.social';
        const authorUrl = `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${handle}&limit=5`;
        console.log(`Fetching author feed for ${handle}...`);
        const res = await fetch(authorUrl);
        const data = await res.json();
        const feed = data.feed || [];
        console.log(`Feed items: ${feed.length}`);

        if (feed.length > 0) {
            const firstPost = feed[0].post;
            console.log(`Checking thread for post: ${firstPost.uri}`);
            console.log(`Text: ${firstPost.record.text}`);

            const threadUrl = `https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread?uri=${encodeURIComponent(firstPost.uri)}&depth=1`;
            const tRes = await fetch(threadUrl);
            const tJson = await tRes.json();

            if (tJson.thread && tJson.thread.replies) {
                console.log(`Thread replies count: ${tJson.thread.replies.length}`);
                
                // Get all the reply texts
                const validReplies = tJson.thread.replies.filter(r => r.post && r.post.record && r.post.record.text);
                const texts = validReplies.map(r => r.post.record.text);
                
                // Fetch sentiments from your newly trained local Python model!
                const sentiments = await analyzeSentiments(texts);

                validReplies.forEach((r, i) => {
                    const text = r.post.record.text;
                    const { label, score } = sentiments[i] || { label: 'Neutral', score: 0.5 };
                    console.log(`[${i}] Reply by ${r.post.author.handle}:`);
                    console.log(`    "${text}"`);
                    console.log(`    => Sentiment: ${label} (Confidence: ${(score * 100).toFixed(1)}%)`);
                });
            } else {
                console.log('No replies or thread object missing.');
            }
        }

    } catch (e) {
        console.error(e);
    }
}

debugBlueskyDeep();
