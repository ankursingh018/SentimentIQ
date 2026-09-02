require('dotenv').config();

async function debugIdFilter() {
    const instance = 'https://sh.itjust.works';
    const creator_id = 27329113; // trendlytic's ID
    const url = `${instance}/api/v3/post/list?creator_id=${creator_id}&limit=5`;

    console.log(`URL: ${url}`);
    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log(`Posts found: ${data.posts?.length || 0}`);
        if (data.posts && data.posts.length > 0) {
            data.posts.forEach(p => console.log(`Author: ${p.creator.name} (ID: ${p.creator.id})`));
        }
    } catch (err) {
        console.log(err);
    }
}

debugIdFilter();
