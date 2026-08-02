// Vercel Serverless Function: /api/send-line.js
// Handles direct LINE sending from browser without any CORS errors!

const { LINE_TOKEN, sendLineBroadcast, buildShopReportText, buildPersonalReportText } = require('./_lib');

module.exports = async (req, res) => {
    // Enable CORS headers for API endpoint
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const body = req.body || {};
        const reportType = body.type || 'shop';
        const customToken = body.token || LINE_TOKEN;
        const customText = body.text;

        let message = '';

        if (customText) {
            message = customText;
        } else if (reportType === 'shop') {
            message = await buildShopReportText();
        } else {
            message = await buildPersonalReportText();
        }

        await sendLineBroadcast(message, customToken);
        return res.status(200).json({ success: true, message: 'ส่งข้อความเข้า LINE สำเร็จแล้ว!' });
    } catch (err) {
        console.error('Vercel API error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
};
