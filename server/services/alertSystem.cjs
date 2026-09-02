/**
 * Automated Email Alert System
 * Triggers when negative sentiment crosses 45% on Mastodon, Bluesky, AND Combined.
 * Uses Nodemailer with Gmail App Password.
 */

const nodemailer = require('nodemailer');

// Cooldown: 1 hour (3600000 ms)
const ALERT_COOLDOWN_MS = 60 * 60 * 1000;
let lastAlertTime = 0;

/**
 * Validates thresholds and sends email alert if conditions are met.
 * @param {Object} sentimentSummary - { mastodon: { total, negative }, bluesky: { total, negative }, combined?: { total, negative } }
 */
async function checkSentimentAlerts(sentimentSummary) {
    try {
        const { mastodon, bluesky, lemmy, combined } = sentimentSummary;

        // 1. Calculate Percentages Safely
        const mastodonNegPct = mastodon.total > 0 ? (mastodon.negative / mastodon.total) * 100 : 0;
        const blueskyNegPct = bluesky.total > 0 ? (bluesky.negative / bluesky.total) * 100 : 0;
        const lemmyNegPct = (lemmy && lemmy.total > 0) ? (lemmy.negative / lemmy.total) * 100 : 0;

        // Calculate combined: use provided combined or sum of others
        let combinedTotal, combinedNeg;
        if (combined) {
            combinedTotal = combined.total;
            combinedNeg = combined.negative;
        } else {
            combinedTotal = mastodon.total + bluesky.total + (lemmy?.total || 0);
            combinedNeg = mastodon.negative + bluesky.negative + (lemmy?.negative || 0);
        }
        const combinedNegPct = combinedTotal > 0 ? (combinedNeg / combinedTotal) * 100 : 0;

        // 2. Business Logic: Trigger if ANY condition is met (> 45%)
        const THRESHOLD = 45;
        const triggers = [];
        if (mastodonNegPct > THRESHOLD) triggers.push(`Mastodon (${mastodonNegPct.toFixed(1)}%)`);
        if (blueskyNegPct > THRESHOLD) triggers.push(`Bluesky (${blueskyNegPct.toFixed(1)}%)`);
        if (lemmyNegPct > THRESHOLD) triggers.push(`Lemmy (${lemmyNegPct.toFixed(1)}%)`);
        if (combinedNegPct > THRESHOLD) triggers.push(`Total Dashboard (${combinedNegPct.toFixed(1)}%)`);

        if (triggers.length === 0) return;

        // 3. Cooldown Logic: Don't spam emails
        const now = Date.now();
        if (now - lastAlertTime < ALERT_COOLDOWN_MS) {
            // console.log('[AlertSystem] Threshold breached, but in cooldown period.');
            return;
        }

        // 4. Send Email
        await sendEmailAlert({
            mastodonNegPct: mastodonNegPct.toFixed(1),
            blueskyNegPct: blueskyNegPct.toFixed(1),
            lemmyNegPct: lemmyNegPct.toFixed(1),
            combinedNegPct: combinedNegPct.toFixed(1),
            triggers: triggers.join(', '),
            timestamp: new Date().toLocaleString()
        });

        lastAlertTime = now;
        console.log(`[AlertSystem] Critical Sentiment Alert Sent. Triggers: ${triggers.join(', ')}`);

    } catch (err) {
        // Fail silently: do not crash the server or ingestion streams
        console.error('[AlertSystem] Error processing alerts:', err.message);
    }
}

/**
 * Sends the actual email using Nodemailer.
 */
async function sendEmailAlert(data) {
    const userEmail = (process.env.ALERT_EMAIL_USER || '').trim();
    const pass = (process.env.ALERT_EMAIL_PASS || '').trim();
    const recipient = (process.env.ALERT_RECIPIENT_EMAIL || userEmail).trim();

    if (!userEmail || !pass) {
        console.warn('[AlertSystem] Email credentials missing. Skipping alert.');
        return;
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: userEmail,
            pass: pass
        }
    });

    const mailOptions = {
        from: `"SentimentIQ Alert" <${userEmail}>`,
        to: recipient,
        subject: '⚠️ CRITICAL: Sentiment Threshold Breached',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; border: 1px solid #ff4444; border-radius: 8px;">
                <h2 style="color: #ff4444;">Critical Negative Sentiment Detected</h2>
                <p>Threshold of <strong>45% negative sentiment</strong> has been breached on: <span style="color: #ff4444; font-weight: bold;">${data.triggers}</span></p>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <tr style="background: #f8f8f8;">
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Platform</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Negative %</th>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;">Mastodon</td>
                        <td style="padding: 10px; border: 1px solid #ddd; color: #ff4444; font-weight: bold;">${data.mastodonNegPct}%</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;">Bluesky</td>
                        <td style="padding: 10px; border: 1px solid #ddd; color: #ff4444; font-weight: bold;">${data.blueskyNegPct}%</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;">Lemmy</td>
                        <td style="padding: 10px; border: 1px solid #ddd; color: #ff4444; font-weight: bold;">${data.lemmyNegPct}%</td>
                    </tr>
                    <tr style="background: #fff4f4;">
                        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Combined Total</td>
                        <td style="padding: 10px; border: 1px solid #ddd; color: #ff0000; font-weight: bold;">${data.combinedNegPct}%</td>
                    </tr>
                </table>

                <p style="margin-top: 20px; font-size: 0.9em; color: #666;">
                    Detected at: ${data.timestamp}<br>
                    <em>Note: A 1-hour cooldown is active. No further emails will be sent for this window.</em>
                </p>
            </div>
        `
    };

    return transporter.sendMail(mailOptions);
}

module.exports = { checkSentimentAlerts };
