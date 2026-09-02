require('dotenv').config();
const { fetchRawLemmyTimeline } = require('./server/services/lemmy.cjs');

async function finalValidation() {
    console.log('--- Lemmy Final Validation: sh.itjust.works ---');
    try {
        const items = await fetchRawLemmyTimeline();
        console.log(`Fetched ${items.length} total items.`);

        const posts = items.filter(i => !i.is_reply);
        const comments = items.filter(i => i.is_reply);

        console.log(`- Personal Posts: ${posts.length}`);
        console.log(`- Related Comments: ${comments.length}`);

        if (posts.length > 0) {
            console.log('\n--- Posts Found ---');
            posts.slice(0, 5).forEach(p => console.log(`- [${p.author}] ${p.content.substring(0, 50)}...`));

            if (comments.length > 0) {
                console.log('\n--- Comments Found ---');
                // Look for a comment from someone OTHER than trendlytic
                const externalComments = comments.filter(c => c.author !== process.env.LEMMY_USERNAME);
                console.log(`External Comments: ${externalComments.length}`);
                externalComments.slice(0, 3).forEach(c => console.log(`- [${c.author}] on your post: ${c.content.substring(0, 50)}...`));
            }
        }

    } catch (err) {
        console.error('Validation failed:', err.message);
    }
}

finalValidation();
