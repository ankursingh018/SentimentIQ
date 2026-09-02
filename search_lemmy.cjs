require('dotenv').config();

async function searchPosts() {
    const instance = 'https://sh.itjust.works';
    const query = 'trendlytic';
    const url = `${instance}/api/v3/search?q=${query}&type_=Posts&sort=New&limit=20`;

    console.log(`Searching for posts by ${query}...`);
    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log(`Results: ${data.posts?.length || 0}`);
        if (data.posts) {
            data.posts.forEach(p => {
                console.log(`Post ID: ${p.post.id}, Author: ${p.creator.name}, Title: ${p.post.name}`);
            });
        }
    } catch (err) {
        console.error(err);
    }
}

searchPosts();
