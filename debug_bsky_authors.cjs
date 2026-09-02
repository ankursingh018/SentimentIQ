require('dotenv').config();
const { fetchRawTimeline } = require('./server/services/bluesky.cjs');

async function debugBlueskyAuthors() {
    console.log('--- Bluesky Author Debug ---');
    const myHandle = process.env.BLUESKY_HANDLE;
    console.log(`My Handle: ${myHandle}`);

    try {
        const items = await fetchRawTimeline();
        console.log(`Fetched ${items.length} total items.`);

        const otherUserReplies = items.filter(i => {
            const handle = i.post.author.handle;
            const isReply = i.post.record.reply;
            return isReply && handle !== myHandle;
        });

        console.log(`Found ${otherUserReplies.length} replies from OTHER users.`);

        otherUserReplies.forEach((r, idx) => {
            console.log(`[${idx}] From: ${r.post.author.handle}`);
            console.log(`    Text: ${r.post.record.text}`);
        });

        if (otherUserReplies.length === 0) {
            console.log("No replies from others found. Checking for ANY replies...");
            const anyReplies = items.filter(i => i.post.record.reply);
            console.log(`Total replies found: ${anyReplies.length}`);
            anyReplies.forEach((r, idx) => {
                console.log(`[${idx}] From: ${r.post.author.handle} (Self? ${r.post.author.handle === myHandle})`);
            });
        }

    } catch (e) {
        console.error(e);
    }
}

debugBlueskyAuthors();
