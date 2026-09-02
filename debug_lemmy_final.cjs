require('dotenv').config();

async function debugTrendlytic() {
    const instance = 'https://sh.itjust.works';
    const username = 'trendlytic';
    const url = `${instance}/api/v3/user?username=${username}&sort=New&limit=50`;

    console.log(`Checking account: ${username} on ${instance}`);
    try {
        const res = await fetch(url);
        const data = await res.json();

        console.log(`\n--- Status ---`);
        console.log(`Posts found in data.posts: ${data.posts?.length || 0}`);
        console.log(`Comments found in data.comments: ${data.comments?.length || 0}`);

        if (data.posts && data.posts.length > 0) {
            console.log('\n--- Posts Detail ---');
            data.posts.forEach(p => {
                console.log(`Post ID: ${p.post.id}, Author: ${p.creator.name}, Title: ${p.post.name}`);
            });
        }

        if (data.comments && data.comments.length > 0) {
            console.log('\n--- Comments Detail (User Activity) ---');
            data.comments.slice(0, 5).forEach(c => {
                console.log(`Comment ID: ${c.comment.id}, On Post: ${c.comment.post_id}, Content: ${c.comment.content.substring(0, 50)}`);
            });
        }

        // Check if there are any mentions or replies in a different section
        // Lemmy v3 user object structure can vary.
    } catch (err) {
        console.error(err);
    }
}

debugTrendlytic();
