// Shared helpers for LINE reporting (used by both /api/send-line and /api/daily-report)

const https = require('https');

const LINE_TOKEN = 'S6eepwLv+PVnpZlRCzSg2KzNZ8Glk5d+sLKQmpHDGNWftOEw5bT37RLuCVheHQijhxK2SH30esKgyIIl/pJo9Mq0KGJd3Aj602Md+c5WYC5oYRrLPmeecuNkq/VlJqQUDDqF77/NzUEnvk5mSIJeOQdB04t89/1O/w1cDnyilFU=';
const SALES_CSV_URL = 'https://docs.google.com/spreadsheets/d/1E74eURpJrim4mrkWQuF0wzrEI649wjxkUDia4uAZz2o/gviz/tq?tqx=out:csv&gid=1044604296';
const COST_CSV_URL = 'https://docs.google.com/spreadsheets/d/1qZf_UrM7UKR2lXSl04vuv_UkDuwH9vZCwKMgSaVoLVM/gviz/tq?tqx=out:csv&gid=1564251212';
const FIREBASE_ROOM_URL = 'https://lifehub-7420d-default-rtdb.asia-southeast1.firebasedatabase.app/rooms/POOH2026.json';

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
        const payload = JSON.stringify({
            messages: [{ type: 'text', text: messageText }]
        });

        const req = https.request('https://api.line.me/v2/bot/message/broadcast', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
                'Authorization': `Bearer ${token || LINE_TOKEN}`
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
    const [salesCsv, costCsv] = await Promise.all([fetchUrl(SALES_CSV_URL), fetchUrl(COST_CSV_URL)]);

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
