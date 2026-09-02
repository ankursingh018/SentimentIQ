require('dotenv').config();
const { fetchRawLemmyTimeline } = require('./server/services/lemmy.cjs');

async function testLemmyFilter() {
    process.env.LEMMY_USERNAME = 'pete_link'; // Force a known user from previous test
    console.log('--- Lemmy Filter Test ---');
    console.log(`Testing with Username: ${process.env.LEMMY_USERNAME}`);
    try {
        const items = await fetchRawLemmyTimeline();
        console.log(`Fetched ${items.length} total items.`);

        const posts = items.filter(i => !i.is_reply);
        console.log(`Posts found: ${posts.length}`);

        const filteredCorrectly = posts.every(p => p.author === 'pete_link');

        posts.forEach(p => {
            console.log(`- [${p.author}] ${p.content.substring(0, 50)}...`);
        });

        if (filteredCorrectly && posts.length > 0) {
            console.log('\nSuccess: Filter works.');
        } else if (posts.length > 0) {
            console.log('\nFailure: Filter was IGNORED or broken.');
        } else {
            console.log('\nNotice: No posts found for this user.');
        }

    } catch (err) {
        console.error('Test failed:', err.message);
    }
}

testLemmyFilter();
