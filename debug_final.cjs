require('dotenv').config();
const { fetchRawTimeline, fetchPublicTimeline } = require('./server/services/mastodon.cjs');
const { buildDashboardData } = require('./server/services/dashboardData.cjs');

async function debugFinal() {
    console.log('--- FINAL DEBUG START ---');
    try {
        console.log('1. Fetching raw timeline...');
        const raw = await fetchRawTimeline();
        console.log(`   Fetched ${raw.length} raw items.`);

        const replies = raw.filter(i => i.in_reply_to_id);
        console.log(`   Found ${replies.length} items marked as replies (in_reply_to_id present).`);

        if (replies.length > 0) {
            console.log('   Sample Reply:', JSON.stringify(replies[0], null, 2));
        } else {
            console.log('   WARNING: No replies found in raw stream.');
        }

        console.log('\n2. Processing for Dashboard...');
        const formatted = await fetchPublicTimeline();
        console.log(`   Formatted ${formatted.length} items.`);

        const dashboard = buildDashboardData(formatted);
        console.log(`   Dashboard 'recentPosts' count: ${dashboard.recentPosts.length}`);

        // precise check
        const dashReplies = dashboard.recentPosts.filter(p => p.is_reply); // is_reply only in my new code?
        // Wait, dashboardData.cjs maps `is_reply: !!p.is_reply`?
        // Let's check dashboardData conversion

        console.log(`   Dashboard Replies Detected: ${dashboard.recentPosts.filter(p => !p.platform.includes('Post')).length} (heuristic)`); // Platform is 'Mastodon'

        // Print first 3 recent posts
        console.log('\n3. Top 3 Recent Posts in Dashboard:');
        dashboard.recentPosts.slice(0, 3).forEach((p, i) => {
            console.log(`   [${i}] ${p.time} - ${p.content.substring(0, 50)}... [Score: ${p.score}]`);
        });

    } catch (e) {
        console.error('FATAL:', e);
    }
}

debugFinal();
