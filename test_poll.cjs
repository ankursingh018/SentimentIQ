require('dotenv').config();
const { fetchRawTimeline: fetchRawBluesky, parseFeedToPosts: parseBlueskyFeed } = require('./server/services/bluesky.cjs');
const { normalizeWithAI } = require('./server/services/aiNormalizer.cjs');

async function testPoll() {
    console.log('--- Testing Bluesky Poll Path ---');
    try {
        const raw = await fetchRawBluesky();
        console.log(`Raw fetch returned ${raw.length} items.`);

        let posts = [];
        try {
            console.log('Attempting AI normalization...');
            posts = await normalizeWithAI(raw, 'Bluesky');
        } catch (aiErr) {
            console.warn('AI Normalization failed/skipped, using fallback:', aiErr.message);
            posts = parseBlueskyFeed(raw);
        }

        console.log(`Final processed posts: ${posts.length}`);
        const replyCount = posts.filter(p => p.is_reply).length;
        console.log(`Replies detected: ${replyCount}`);

        if (replyCount > 0) {
            console.log('Sample Reply:', posts.find(p => p.is_reply));
        }

    } catch (err) {
        console.error('Poll failed:', err);
    }
}

testPoll();
