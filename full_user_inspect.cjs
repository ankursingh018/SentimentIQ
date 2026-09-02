require('dotenv').config();

async function fullUserInspect() {
    const instance = 'https://sh.itjust.works';
    const username = 'trendlytic';
    const url = `${instance}/api/v3/user?username=${username}&sort=New&limit=50`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log(`User: ${data.person_view.person.name} (ID: ${data.person_view.person.id})`);
        console.log(`Posts: ${data.posts?.length || 0}`);
        console.log(`Comments: ${data.comments?.length || 0}`);

        if (data.comments && data.comments.length > 0) {
            console.log('\n--- Comments ---');
            data.comments.slice(0, 5).forEach(c => {
                console.log(`- Author: ${c.creator.name}, Post ID: ${c.comment.post_id}, Content: ${c.comment.content.substring(0, 30)}`);
            });
        }
    } catch (err) {
        console.error(err);
    }
}

fullUserInspect();
