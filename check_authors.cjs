require('dotenv').config();

async function checkPostAuthors() {
    const instance = 'https://sh.itjust.works';
    const postIds = [54761859, 54761172];

    for (const id of postIds) {
        console.log(`\nChecking Post ID: ${id}`);
        try {
            const res = await fetch(`${instance}/api/v3/post?id=${id}`);
            const data = await res.json();
            console.log(`Title: ${data.post_view.post.name}`);
            console.log(`Author: ${data.post_view.creator.name}`);
        } catch (err) {
            console.log(`Error checking post ${id}: ${err.message}`);
        }
    }
}

checkPostAuthors();
