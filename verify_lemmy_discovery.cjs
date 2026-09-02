require('dotenv').config();
const { fetchRawLemmyTimeline } = require('./server/services/lemmy.cjs');

async function verifyDiscovery() {
    console.log('--- Lemmy Discovery Verification ---');
    console.log(`Username: ${process.env.LEMMY_USERNAME}`);
    try {
        const items = await fetchRawLemmyTimeline();
        console.log(`Fetched ${items.length} total items.`);

        const posts = items.filter(i => !i.is_reply);
        const comments = items.filter(i => i.is_reply);

        console.log(`- Discovered Posts: ${posts.length}`);
        posts.forEach(p => console.log(`  [Post] ${p.author}: ${p.content}`));

        console.log(`- Comments/Engagement: ${comments.length}`);
        if (comments.length > 0) {
            console.log('\nSample Engagement:');
            comments.slice(0, 10).forEach(c => {
                const authorTag = c.author === process.env.LEMMY_USERNAME ? '[YOU]' : `[${c.author}]`;
                console.log(`  ${authorTag}: ${c.content.substring(0, 50)}...`);
            });
        }

    } catch (err) {
        console.error('Verification failed:', err.message);
    }
}

verifyDiscovery();
