require('dotenv').config();

async function deepInspect() {
    const instance = 'https://sh.itjust.works';
    const creator = 'trendlytic';
    const url = `${instance}/api/v3/post/list?creator_name=${creator}&sort=New&limit=3`;

    console.log(`Inspecting API response for creator_name=${creator}`);
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.posts && data.posts.length > 0) {
            data.posts.forEach((item, i) => {
                console.log(`\n[Post ${i}]`);
                console.log(`Author: ${item.creator.name}`);
                console.log(`Post ID: ${item.post.id}`);
                console.log(`Post Name: ${item.post.name}`);
            });
        } else {
            console.log('No posts found.');
        }
    } catch (err) {
        console.error(err);
    }
}

deepInspect();
