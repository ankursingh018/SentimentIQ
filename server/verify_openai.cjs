require('dotenv').config();
const OpenAI = require('openai');

async function testApiKey() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        console.error('❌ Error: OPENAI_API_KEY is not defined in your .env file.');
        process.exit(1);
    }

    const openai = new OpenAI({
        apiKey: apiKey,
    });

    try {
        console.log('Testing OpenAI API connection...');
        // A simple call to list models is the safest way to check if the key is valid
        const models = await openai.models.list();
        console.log('✅ Success! Your OpenAI API key is working properly.');
        console.log('Available models found:', models.data.length);
    } catch (error) {
        console.error('❌ Error: OpenAI API key verification failed.');
        console.error('Details:', error.message);
        if (error.status === 401) {
            console.error('Reason: Unauthorized. Your API key might be invalid or deleted.');
        }
    }
}

testApiKey();
