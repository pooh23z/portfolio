// Vercel Serverless Function: /api/daily-report.js
// Triggered automatically every day by Vercel Cron (see "crons" in vercel.json).
// Sends BOTH the shop report and the personal report to LINE as two separate messages.

const { sendLineBroadcast, buildShopReportText, buildPersonalReportText } = require('./_lib');

module.exports = async (req, res) => {
    // If a CRON_SECRET env var is set on the Vercel project, only allow requests
    // that carry it (Vercel's own cron scheduler sends this automatically).
    // If no CRON_SECRET is configured yet, this check is skipped so the feature
    // still works out of the box.
    if (process.env.CRON_SECRET) {
        const authHeader = req.headers['authorization'] || '';
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
    }

    const results = { shop: null, personal: null };

    try {
        const shopMessage = await buildShopReportText();
        await sendLineBroadcast(shopMessage);
        results.shop = 'sent';
    } catch (err) {
        console.error('Daily report - shop report failed:', err);
        results.shop = 'failed: ' + err.message;
    }

    try {
        const personalMessage = await buildPersonalReportText();
        await sendLineBroadcast(personalMessage);
        results.personal = 'sent';
    } catch (err) {
        console.error('Daily report - personal report failed:', err);
        results.personal = 'failed: ' + err.message;
    }

    return res.status(200).json({ success: true, results });
};
