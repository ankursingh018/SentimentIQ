require('dotenv').config();
const { checkSentimentAlerts } = require('c:\\Users\\singh\\npm-global\\Desktop\\New folder (12)\\server\\services\\alertSystem.cjs');

async function testAlert() {
    console.log("Forcing an alert trigger with 60% negative sentiment...");
    
    // Simulate data where Bluesky has >45% negative sentiment
    const fakeData = {
        mastodon: { total: 10, negative: 1 }, // 10%
        bluesky: { total: 10, negative: 6 },  // 60% (Triggers Alert)
        lemmy: { total: 0, negative: 0 },
        combined: { total: 20, negative: 7 }  // 35%
    };

    try {
        await checkSentimentAlerts(fakeData);
        console.log("Check complete.");
    } catch (e) {
        console.error("Failed:", e);
    }
}

testAlert();
