require('dotenv').config();

async function inspectUserObject() {
    const instance = 'https://sh.itjust.works';
    const username = 'trendlytic';
    const url = `${instance}/api/v3/user?username=${username}&sort=New&limit=50`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log('Keys in user response:', Object.keys(data));
        // Check if there is anything other than person_view, posts, comments, counts, moderators
    } catch (err) {
        console.error(err);
    }
}

inspectUserObject();
