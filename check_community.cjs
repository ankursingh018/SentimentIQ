require('dotenv').config();

async function checkCommunity() {
    const instance = 'https://sh.itjust.works';
    const creator = 'trendlytic';
    const url = `${instance}/api/v3/post/list?creator_name=${creator}&sort=New&limit=3`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.posts && data.posts.length > 0) {
            data.posts.forEach((item, i) => {
                console.log(`\n[Post ${i}]`);
                console.log(`Author: ${item.creator.name}`);
                console.log(`Community: ${item.community.name}`);
            });
        }
    } catch (err) {
        console.error(err);
    }
}

checkCommunity();
