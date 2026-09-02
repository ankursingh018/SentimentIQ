const { analyzeSentiments } = require('c:\\Users\\singh\\npm-global\\Desktop\\New folder (12)\\server\\services\\sentiment.cjs');

async function testComments() {
    const texts = [
        "Wow, this is absolutely amazing! The model works perfectly. 🎉",
        "This is terrible. I hate the new update, it crashes constantly.",
        "Just a regular post. Nothing special to see here.",
        "I'm not exactly sure how I feel about this. It has some pros and cons.",
        "Could you please tell me how to reach the settings menu?"
    ];

    console.log("Analyzing 5 test comments with the custom model...");
    console.log("---------------------------------------------------");
    
    const results = await analyzeSentiments(texts);
    
    texts.forEach((text, i) => {
        const res = results[i];
        console.log(`[${i+1}] TEXT : ${text}`);
        console.log(`    LABEL: ${res.label} (Confidence: ${(res.score * 100).toFixed(1)}%)`);
        console.log("---------------------------------------------------");
    });
}

testComments();
