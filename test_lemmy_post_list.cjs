require('dotenv').config();

async function testPostList() {
    const instance = 'https://sh.itjust.works';
    const creator = 'trendlytic';
    const url = `${instance}/api/v3/post/list?creator_name=${creator}&sort=New&limit=10`;

    console.log(`Searching posts by creator: ${creator} on ${instance}`);
    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log(`Found ${data.posts?.length || 0} posts.`);
        if (data.posts && data.posts.length > 0) {
            data.posts.forEach(p => console.log(`Post: ${p.post.name} (ID: ${p.post.id})`));
        }
    } catch (err) {
        console.error(err);
    }
}

testPostList();
