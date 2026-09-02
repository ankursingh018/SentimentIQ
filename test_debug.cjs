require('dotenv').config();
const { fetchRawTimeline } = require('./server/services/mastodon.cjs');

async function testConfig() {
    console.log('--- Debugging Mastodon Integration ---');

    // 1. Check Env Vars
    const token = process.env.MASTODON_ACCESS_TOKEN;
    const instance = process.env.MASTODON_INSTANCE || 'https://mastodon.social';

    console.log(`Instance: ${instance}`);
    console.log(`Token Present: ${token ? 'YES (' + token.slice(0, 5) + '...)' : 'NO'}`);

    if (!token) {
        console.error('ERROR: No access token found. Please set MASTODON_ACCESS_TOKEN in .env file.');
        return;
    }

    // 2. Try Fetching
    try {
        console.log('Attempting to fetch Home Timeline...');
        const posts = await fetchRawTimeline();
        console.log(`Success! Fetched ${posts.length} posts.`);

        if (posts.length > 0) {
            console.log('Latest Post Preview:');
            const p = posts[0];
            console.log(`- ID: ${p.id}`);
            console.log(`- Created At: ${p.created_at}`);
            console.log(`- Content: ${p.content ? p.content.slice(0, 50) + '...' : 'No content'}`);
        } else {
            console.log('WARNING: Timeline is empty. This means the account follows no one or has mostly empty feed.');
            console.log('Suggestion: Try following some accounts or verify this is the correct instance.');
        }
    } catch (err) {
        console.error('Fetch Failed:', err.message);
        if (err.message.includes('401')) {
            console.error('-> 401 Unauthorized: The token is invalid or does not match the instance.');
        }
    }
}

testConfig();
