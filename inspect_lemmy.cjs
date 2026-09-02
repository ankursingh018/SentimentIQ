require('dotenv').config();

async function inspectUser() {
    const instance = process.env.LEMMY_INSTANCE || 'https://sh.itjust.works';
    const username = process.env.LEMMY_USERNAME || 'trendlytic';
    const url = `${instance}/api/v3/user?username=${username}&sort=New&limit=20`;

    console.log(`Checking Lemmy User: ${username} on ${instance}`);
    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.log(`Error: ${res.status}`);
            const text = await res.text();
            console.log(text);
            return;
        }
        const data = await res.json();
        console.log('--- User Response ---');
        console.log(`Person Name: ${data.person_view?.person?.name}`);
        console.log(`Posts count in response: ${data.posts?.length || 0}`);
        console.log(`Comments count in response: ${data.comments?.length || 0}`);

        if (data.posts && data.posts.length > 0) {
            console.log('\n--- Posts ---');
            data.posts.forEach((p, i) => {
                console.log(`[${i}] ID: ${p.post.id}, Name: ${p.post.name}`);
            });
        }
    } catch (err) {
        console.error('Fetch failed:', err.message);
    }
}

inspectUser();
