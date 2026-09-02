// Node 18+ has built-in fetch

async function checkDashboard() {
    try {
        console.log('--- All Platforms Check ---');
        const resAll = await fetch('http://localhost:5000/api/sentiment/dashboard?platform=All');
        const dataAll = await resAll.json();
        console.log(`Total Recent Posts (All): ${dataAll.recentPosts.length}`);

        dataAll.recentPosts.forEach((p, i) => {
            console.log(`[${i}] ${p.platform} - ${p.time} - ${p.content.substring(0, 30)}... (Reply: ${p.is_reply})`);
        });

    } catch (e) {
        console.error('Failed to connect to local server:', e.message);
    }
}

checkDashboard();
