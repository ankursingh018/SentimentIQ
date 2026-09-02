require('dotenv').config();

async function inspectPostFact() {
    const instance = 'https://sh.itjust.works';
    const id = 54761859;

    try {
        const res = await fetch(`${instance}/api/v3/post?id=${id}`);
        const data = await res.json();
        console.log('--- Post Fact ---');
        console.log(`Creator Name: ${data.post_view.creator.name}`);
        console.log(`Creator ID: ${data.post_view.creator.id}`);
        console.log(`Post ID: ${data.post_view.post.id}`);
    } catch (err) {
        console.error(err);
    }
}

inspectPostFact();
