// Shared helpers for LINE reporting (used by both /api/send-line and /api/daily-report)

const https = require('https');

const LINE_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || process.env.LINE_TOKEN || '';
const SALES_CSV_URL = process.env.SALES_CSV_URL || '';
const COST_CSV_URL = process.env.COST_CSV_URL || '';
const SYNC_ROOM_CODE = process.env.SYNC_ROOM_CODE || process.env.NEXT_PUBLIC_SYNC_ROOM_CODE || 'DEMO-2026';
const FIREBASE_ROOM_URL = `https://lifehub-7420d-default-rtdb.asia-southeast1.firebasedatabase.app/rooms/${SYNC_ROOM_CODE}.json`;

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

async function fetchJson(url) {
    const text = await fetchUrl(url);
    try {
        return JSON.parse(text);
    } catch (e) {
        return null;
    }
}

function toArray(value) {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') return Object.values(value);
    return [];
}

function formatMoney(n) {
    return Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 });
}

function sendLineBroadcast(messageText, token) {
    return new Promise((resolve, reject) => {
        const activeToken = token || LINE_TOKEN;
        if (!activeToken) {
            return reject(new Error('ยังไม่ได้ตั้งค่า LINE Token (กรุณาตั้งค่า LINE_CHANNEL_ACCESS_TOKEN บน Vercel หรือในเมนูตั้งค่า)'));
        }

        const payload = JSON.stringify({
            messages: [{ type: 'text', text: messageText }]
        });

        const req = https.request('https://api.line.me/v2/bot/message/broadcast', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
                'Authorization': `Bearer ${activeToken}`
            }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(body);
                } else {
                    reject(new Error(`LINE API HTTP ${res.statusCode}: ${body}`));
                }
            });
        });

        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

// 🛍️ Report 1: ยอดขาย & ต้นทุนร้านค้า (ดึงตรงจาก Google Sheets)
async function buildShopReportText() {
    let salesCsv = '';
    let costCsv = '';
    if (SALES_CSV_URL && COST_CSV_URL) {
        try {
            [salesCsv, costCsv] = await Promise.all([fetchUrl(SALES_CSV_URL), fetchUrl(COST_CSV_URL)]);
        } catch (e) {
            console.warn('CSV fetch skipped or error:', e);
        }
    }

    let totalSales = 0;
    let salesCount = 0;
    const salesItems = [];

    salesCsv.split('\n').slice(1).forEach(line => {
        const parts = line.trim().replace(/\r/g, '').split(',').map(p => p.replace(/^"|"$/g, '').trim());
        if (parts.length >= 3) {
            const name = parts[0];
            const qty = parseInt(parts[1], 10) || 0;
            const revenue = parseFloat(parts[2]) || 0;
            if (revenue > 0) {
                totalSales += revenue;
                salesCount++;
                salesItems.push({ name, qty, revenue });
            }
        }
    });

    let totalCosts = 0;
    let costCount = 0;
    costCsv.split('\n').slice(1).forEach(line => {
        const parts = line.trim().replace(/\r/g, '').split(',').map(p => p.replace(/^"|"$/g, '').trim());
        if (parts.length >= 2) {
            const cost = parseFloat(parts[1]) || 0;
            if (cost > 0) {
                totalCosts += cost;
                costCount++;
            }
        }
    });

    const netProfit = totalSales - totalCosts;
    salesItems.sort((a, b) => b.revenue - a.revenue);
    const top5 = salesItems.slice(0, 5).map(x => `   • ${x.name} (ขาย ${x.qty} ไม้): ฿${formatMoney(x.revenue)}`).join('\n');

    const dateStr = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

    return `📊 [รายงานยอดขายร้านค้า (Google Sheets)]\n📅 ${dateStr}\n\n` +
        `🛍️ 【สรุปยอดขาย & กำไร】\n` +
        `• ยอดขายสินค้ารวม (${salesCount} รายการ): ฿${formatMoney(totalSales)}\n` +
        `• ต้นทุนวัตถุดิบรวม (${costCount} รอบ): ฿${formatMoney(totalCosts)}\n` +
        `• 📈 กำไรสุทธิ: ฿${formatMoney(netProfit)}\n\n` +
        `🔥 【สินค้าขายดี 5 อันดับแรก】\n${top5 || '   • ไม่มีข้อมูล'}\n\n` +
        `✅ ดึงข้อมูลตรงจาก Google Sheets ของคุณ 100%`;
}

// 👤 Report 2: เงินส่วนตัว & นัดหมายวันนี้ (ดึงจาก Firebase ห้อง sync ของแอป)
async function buildPersonalReportText() {
    const data = await fetchJson(FIREBASE_ROOM_URL);

    const finance = toArray(data && data.finance);
    const tasks = toArray(data && data.tasks);
    const calendar = (data && data.calendar) || {};

    const personalIncome = finance.filter(x => x.type === 'income').reduce((s, x) => s + Number(x.amount || 0), 0);
    const personalExpense = finance.filter(x => x.type === 'expense').reduce((s, x) => s + Number(x.amount || 0), 0);
    const personalBalance = personalIncome - personalExpense;

    const todayStr = new Date().toISOString().split('T')[0];
    const dayInfo = calendar[todayStr] || {};
    const todayTasks = tasks.filter(x => x.dueDate === todayStr && x.status !== 'completed');
    const allPendingTasks = tasks.filter(x => x.status !== 'completed');

    let scheduleStatusStr = '';
    if (dayInfo.status === 'busy') {
        const reasonStr = dayInfo.title ? ` (📌 ธุระ: ${dayInfo.title})` : '';
        scheduleStatusStr = `🔴 วันนี้วันไม่ว่าง${reasonStr}`;
    } else if (dayInfo.status === 'free') {
        scheduleStatusStr = '🟢 วันนี้เป็นวันว่าง (Free Day)';
    } else {
        scheduleStatusStr = todayTasks.length > 0 ? '📌 วันนี้มีนัดหมาย/งานค้าง' : '✨ วันนี้เป็นวันว่าง (ไม่มีนัดหมาย)';
    }

    const busyDaysList = [];
    Object.keys(calendar).forEach(dateKey => {
        const item = calendar[dateKey];
        if (item && item.status === 'busy') {
            const title = item.title || 'ติดภารกิจ/ไม่ว่าง';
            busyDaysList.push(`   • วันที่ ${dateKey}: ${title}`);
        }
    });

    const tasksDetailStr = todayTasks.length > 0
        ? todayTasks.map(t => `   • ${t.title}`).join('\n')
        : '   • ไม่มีงานด่วนวันนี้';

    const formattedDate = new Date().toLocaleDateString('th-TH', {
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
    });

    return `👤 [รายงานสรุปข้อมูลส่วนตัว & นัดหมาย]\n📅 ${formattedDate}\n\n` +
        `💵 【รายรับ-รายจ่ายส่วนตัว】\n` +
        `• รายรับส่วนตัว: ฿${formatMoney(personalIncome)}\n` +
        `• รายจ่ายส่วนตัว: ฿${formatMoney(personalExpense)}\n` +
        `• คงเหลือส่วนตัว: ฿${formatMoney(personalBalance)}\n\n` +
        `📅 【สถานะวันนี้ & เหตุผลที่ไม่ว่าง】\n` +
        `• สถานะวันนี้: ${scheduleStatusStr}\n` +
        `• รายการวันที่ลงไม่ว่างไว้ (${busyDaysList.length} วัน):\n${busyDaysList.length > 0 ? busyDaysList.join('\n') : '   • ไม่มีวันที่บันทึกว่าไม่ว่าง'}\n\n` +
        `📋 【นัดหมาย/งานวันนี้ (${todayTasks.length} รายการ)】\n${tasksDetailStr}\n\n` +
        `📋 งานค้างทั้งหมดในระบบ: ${allPendingTasks.length} รายการ`;
}

module.exports = {
    LINE_TOKEN,
    fetchUrl,
    fetchJson,
    sendLineBroadcast,
    buildShopReportText,
    buildPersonalReportText,
    formatMoney
};
