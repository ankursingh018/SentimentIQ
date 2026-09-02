/**
 * Sentiment analysis using custom python backend (trained model).
 */

/**
 * Pre-process text to remove common noise like @mentions that confuse simpler sentiment models.
 * @param {string} text 
 * @returns {string}
 */
function preProcess(text) {
    if (!text) return '';
    const cleaned = text
        .toLowerCase()
        .replace(/@\s?[\w._-]+(?:@[\w._-]+)?/g, '') // Remove complex @mentions, handling potential spaces after @
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();
    
    console.log(`[Sentiment DEBUG] Original: "${text}" | Cleaned: "${cleaned}"`);
    return cleaned;
}





async function analyzeSentiments(texts) {
    if (!texts || !Array.isArray(texts) || texts.length === 0) {
        return [];
    }

    // Pre-process all texts to ensure consistency across platforms
    const cleanedTexts = texts.map(t => preProcess(t));

    try {
        const response = await fetch('http://127.0.0.1:5001/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texts: cleanedTexts })
        });
        if (!response.ok) {
            throw new Error(`Python backend returned ${response.status}`);
        }
        const data = await response.json();
        if (data.results && data.results.length === texts.length) {
            // Apply rule-based corrections for common double-negatives or nuance the model misses
            const correctedResults = data.results.map((res, i) => {
                const clean = cleanedTexts[i];
                
                // Correction: "not bad" is practically positive
                if (clean.includes('not bad') || clean.includes('no problem') || clean.includes('not too bad')) {
                    console.log(`[Sentiment Override] Correcting "${clean}" from ${res.label} to Positive`);
                    return { label: 'Positive', score: Math.max(res.score, 0.75) };
                }
                
                return res;
            });
            return correctedResults;
        }

    } catch (e) {

        console.error('Sentiment backend failed, returning Neutral fallbacks:', e.message);
    }
    
    // Fallback if the python server is offline or fails
    return texts.map(() => ({ label: 'Neutral', score: 0.5 }));
}

module.exports = { analyzeSentiments };
