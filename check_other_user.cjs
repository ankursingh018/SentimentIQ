async function checkOtherUser() {
    const instance = 'https://sh.itjust.works';
    const username = 'threelonmusketeers'; // A user we know has posts
    const url = `${instance}/api/v3/user?username=${username}&limit=5`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log(`User: ${data.person_view.person.name}`);
        console.log(`Posts found: ${data.posts?.length || 0}`);
        if (data.posts && data.posts.length > 0) {
            data.posts.forEach(p => console.log(`Post: ${p.post.name} (Author: ${p.creator.name})`));
        }
    } catch (err) {
        console.log(err);
    }
}

checkOtherUser();
