require('dotenv').config();
const { fetchRawLemmyTimeline } = require('./server/services/lemmy.cjs');

async function strictPersonalValidation() {
    console.log('--- Lemmy Strict Personal Validation ---');
    console.log(`Username: ${process.env.LEMMY_USERNAME}`);
    try {
        const items = await fetchRawLemmyTimeline();
        console.log(`Fetched ${items.length} total items.`);

        const posts = items.filter(i => !i.is_reply);
        const comments = items.filter(i => i.is_reply);

        console.log(`- Personal Posts Found: ${posts.length}`);

        const misalignedPosts = posts.filter(p => p.author.toLowerCase() !== process.env.LEMMY_USERNAME.toLowerCase());
        if (misalignedPosts.length > 0) {
            console.log(`WARNING: Found ${misalignedPosts.length} posts NOT by you.`);
            misalignedPosts.forEach(p => console.log(`  - Misaligned Post Author: ${p.author}`));
        } else {
            console.log('SUCCESS: All posts are strictly authored by you.');
        }

        console.log(`- Comments found on YOUR posts: ${comments.length}`);
        if (comments.length > 0) {
            console.log('\nRecent Engagement:');
            comments.slice(0, 5).forEach(c => {
                const authorTag = c.author.toLowerCase() === process.env.LEMMY_USERNAME.toLowerCase() ? '[YOU]' : `[${c.author}]`;
                console.log(`  ${authorTag}: ${c.content.substring(0, 60)}...`);
            });
        }

    } catch (err) {
        console.error('Validation failed:', err.message);
    }
}

strictPersonalValidation();
