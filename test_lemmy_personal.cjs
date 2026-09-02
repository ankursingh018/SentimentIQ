require('dotenv').config();
const { fetchRawLemmyTimeline } = require('./server/services/lemmy.cjs');

async function testLemmyPersonal() {
    console.log('--- Lemmy Personal Post Test ---');
    console.log(`Testing with Username: ${process.env.LEMMY_USERNAME}`);
    try {
        const items = await fetchRawLemmyTimeline();
        console.log(`Fetched ${items.length} total items.`);

        const posts = items.filter(i => !i.is_reply);
        console.log(`Posts found: ${posts.length}`);
        posts.forEach(p => {
            console.log(`- [${p.author}] ${p.content.substring(0, 50)}...`);
        });

        if (posts.length > 0) {
            console.log('\nSuccess: Personal posts fetched.');
        } else {
            console.log('\nNotice: No posts found for this user. (Verify if username/instance is correct)');
        }

    } catch (err) {
        console.error('Test failed:', err.message);
    }
}

testLemmyPersonal();
