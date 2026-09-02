require('dotenv').config();

async function checkCommentPosts() {
    const instance = 'https://sh.itjust.works';
    const username = 'trendlytic';
    const url = `${instance}/api/v3/user?username=${username}&limit=20`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (data.comments) {
            console.log(`Found ${data.comments.length} comments.`);
            for (const c of data.comments) {
                // In Lemmy User API, comments usually have { comment, creator, post, community, counts }
                console.log(`\nComment on Post: ${c.post.name} (ID: ${c.post.id})`);
                // Note: The 'post' object here is the post itself.
                // We don't necessarily have the post author in 'c.post', but we might have 'c.post.creator_id'
                console.log(`Post Creator ID: ${c.post.creator_id}`);
            }
        }
    } catch (err) {
        console.error(err);
    }
}

checkCommentPosts();
