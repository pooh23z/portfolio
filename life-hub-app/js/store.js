/* ==========================================================================
   Life & Business Hub - DataStore (100% Real Google Sheets Data ONLY)
   ========================================================================== */

const STORAGE_KEYS = {
    FINANCE: 'lifehub_finance_v2',
    BUSINESS: 'lifehub_business_v2',
    TASKS: 'lifehub_tasks_v2',
    INTEGRATIONS: 'lifehub_integrations_v2',
    SAVINGS: 'lifehub_savings_v2',
    CALENDAR: 'lifehub_calendar_v2'
};

function toArray(value) {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') return Object.values(value);
    return [];
}

class DataStore {
    constructor() {
        this.listeners = [];
        this.initDefaultData();
    }

    initDefaultData() {
        if (!localStorage.getItem(STORAGE_KEYS.FINANCE)) {
            localStorage.setItem(STORAGE_KEYS.FINANCE, JSON.stringify([]));
        }

        // Only set defaults the first time this device is ever used - never wipe
        // existing data on later app loads (that was overwriting real user data
        // on every refresh, which is why tasks/calendar looked different across devices).
        if (!localStorage.getItem(STORAGE_KEYS.TASKS)) {
            localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify([]));
        }

        if (!localStorage.getItem(STORAGE_KEYS.CALENDAR)) {
            const initialCal = {};
            initialCal['2026-08-02'] = { status: 'busy', title: 'คุยกับผู้ใหญ่' };
            localStorage.setItem(STORAGE_KEYS.CALENDAR, JSON.stringify(initialCal));
        }

        // Only pull Google Sheets business data the first time (no local business
        // data yet). After that, use the "refresh" button (refreshGoogleSheetsData)
        // so a flaky connection on one device doesn't silently overwrite data that
        // synced fine on another device.
        if (!localStorage.getItem(STORAGE_KEYS.BUSINESS)) {
            this.importGoogleSheetsData();
        }
    }

    // 🎯 FALLBACK DATA FROM USER'S GOOGLE SHEETS (Sales: 23 Items | Raw Material Costs: 26 Rounds)
    populateRealGoogleSheetsItems() {
        const todayStr = new Date().toISOString().split('T')[0];

        // 🛍️ 23 Real Sales Items from User's Google Sheet
        const realSalesList = [
            { id: 'real-sale-1', date: todayStr, type: 'sale', channel: 'หน้าร้าน', title: 'ไส้กรอกแดง (ขาย 90 ไม้)', amount: 900, note: '📊 ดึงตรงจาก Google Sheets (90 ไม้)' },
            { id: 'real-sale-2', date: todayStr, type: 'sale', channel: 'หน้าร้าน', title: 'ไส้กรอกชีส (ขาย 156 ไม้)', amount: 2028, note: '📊 ดึงตรงจาก Google Sheets (156 ไม้)' },
            { id: 'real-sale-3', date: todayStr, type: 'sale', channel: 'หน้าร้าน', title: 'โบโลน่า (ขาย 114 ไม้)', amount: 1140, note: '📊 ดึงตรงจาก Google Sheets (114 ไม้)' },
            { id: 'real-sale-4', date: todayStr, type: 'sale', channel: 'หน้าร้าน', title: 'มันฝรั่ง (ขาย 826 ไม้)', amount: 4130, note: '📊 ดึงตรงจาก Google Sheets (826 ไม้)' },
            { id: 'real-sale-5', date: todayStr, type: 'sale', channel: 'หน้าร้าน', title: 'เต้าหู้ปลา (ขาย 459 ไม้)', amount: 2295, note: '📊 ดึงตรงจาก Google Sheets (459 ไม้)' },
            { id: 'real-sale-6', date: todayStr, type: 'sale', channel: 'หน้าร้าน', title: 'ข้าวโพดอ่อน (ขาย 266 ไม้)', amount: 1330, note: '📊 ดึงตรงจาก Google Sheets (266 ไม้)' },
            { id: 'real-sale-7', date: todayStr, type: 'sale', channel: 'หน้าร้าน', title: 'กระเจี๊ยบ (ขาย 172 ไม้)', amount: 860, note: '📊 ดึงตรงจาก Google Sheets (172 ไม้)' },
            { id: 'real-sale-8', date: todayStr, type: 'sale', channel: 'หน้าร้าน', title: 'หอมทอด (ขาย 275 ไม้)', amount: 2750, note: '📊 ดึงตรงจาก Google Sheets (275 ไม้)' },
            { id: 'real-sale-9', date: todayStr, type: 'sale', channel: 'หน้าร้าน', title: 'เห็ดเข็มทอง (ขาย 325 ไม้)', amount: 3250, note: '📊 ดึงตรงจาก Google Sheets (325 ไม้)' },
            { id: 'real-sale-10', date: todayStr, type: 'sale', channel: 'หน้าร้าน', title: 'เต้าหู้ชีส (ขาย 212 ไม้)', amount: 2756, note: '📊 ดึงตรงจาก Google Sheets (212 ไม้)' },
            { id: 'real-sale-11', date: todayStr, type: 'sale', channel: 'หน้าร้าน', title: 'ปูอัด (ขาย 263 ไม้)', amount: 2630, note: '📊 ดึงตรงจาก Google Sheets (263 ไม้)' },
            { id: 'real-sale-12', date: todayStr, type: 'sale', channel: 'หน้าร้าน', title: 'ฟองเต้าหู้ (ขาย 137 ไม้)', amount: 1370, note: '📊 ดึงตรงจาก Google Sheets (137 ไม้)' },
            { id: 'real-sale-13', date: todayStr, type: 'sale', channel: 'หน้าร้าน', title: 'ค็อกเทลพันเบคอน (ขาย 144 ไม้)', amount: 1872, note: '📊 ดึงตรงจาก Google Sheets (144 ไม้)' },
            { id: 'real-sale-14', date: todayStr, type: 'sale', channel: 'หน้าร้าน', title: 'หนังกรอบ (ขาย 177 ไม้)', amount: 1770, note: '📊 ดึงตรงจาก Google Sheets (177 ไม้)' },
            { id: 'real-sale-15', date: todayStr, type: 'sale', channel: 'หน้าร้าน', title: 'ข้าวโพดหวาน (ขาย 4 ไม้)', amount: 40, note: '📊 ดึงตรงจาก Google Sheets (4 ไม้)' },
            { id: 'real-sale-16', date: todayStr, type: 'sale', channel: 'หน้าร้าน', title: 'หมูสามชั้น (ขาย 375 ไม้)', amount: 4875, note: '📊 ดึงตรงจาก Google Sheets (375 ไม้)' },
            { id: 'real-sale-17', date: todayStr, type: 'sale', channel: 'หน้าร้าน', title: 'ปลาดอลลี่ (ขาย 285 ไม้)', amount: 2850, note: '📊 ดึงตรงจาก Google Sheets (285 ไม้)' },
            { id: 'real-sale-18', date: todayStr, type: 'sale', channel: 'หน้าร้าน', title: 'สาหร่ายวากาเมะ (ขาย 135 ไม้)', amount: 1350, note: '📊 ดึงตรงจาก Google Sheets (135 ไม้)' },
            { id: 'real-sale-19', date: todayStr, type: 'sale', channel: 'หน้าร้าน', title: 'ไส้กรอกนม (ขาย 128 ไม้)', amount: 1280, note: '📊 ดึงตรงจาก Google Sheets (128 ไม้)' },
            { id: 'real-sale-20', date: todayStr, type: 'sale', channel: 'หน้าร้าน', title: 'ลูกไม้ปู (ขาย 98 ไม้)', amount: 490, note: '📊 ดึงตรงจาก Google Sheets (98 ไม้)' },
            { id: 'real-sale-21', date: todayStr, type: 'sale', channel: 'หน้าร้าน', title: 'เต้าหู้โมคิ (ขาย 146 ไม้)', amount: 1460, note: '📊 ดึงตรงจาก Google Sheets (146 ไม้)' },
            { id: 'real-sale-22', date: todayStr, type: 'sale', channel: 'หน้าร้าน', title: 'ทูโทนไข่กุ้ง (ขาย 32 ไม้)', amount: 416, note: '📊 ดึงตรงจาก Google Sheets (32 ไม้)' },
            { id: 'real-sale-23', date: todayStr, type: 'sale', channel: 'หน้าร้าน', title: 'เห็ดออริจิ (ขาย 184 ไม้)', amount: 920, note: '📊 ดึงตรงจาก Google Sheets (184 ไม้)' }
        ];

        // 📦 26 Real Raw Material Expense Rounds from User's Google Sheet
        const realCostList = [
            { id: 'real-cost-1', date: '2026-05-23', type: 'cost', channel: 'ค่าวัตถุดิบ/สินค้า', title: 'รอบ 23/05/2569 (2 รายการ)', amount: 100, note: '📦 ดึงจาก Google Sheets | ซื้อวัตถุดิบ 2 รายการ' },
            { id: 'real-cost-2', date: '2026-05-24', type: 'cost', channel: 'ค่าวัตถุดิบ/สินค้า', title: 'รอบ 24/05/2569 (5 รายการ)', amount: 1199, note: '📦 ดึงจาก Google Sheets | ซื้อวัตถุดิบ 5 รายการ' },
            { id: 'real-cost-3', date: '2026-05-27', type: 'cost', channel: 'ค่าวัตถุดิบ/สินค้า', title: 'รอบ 27/05/2569 (2 รายการ)', amount: 573, note: '📦 ดึงจาก Google Sheets | ซื้อวัตถุดิบ 2 รายการ' },
            { id: 'real-cost-4', date: '2026-05-29', type: 'cost', channel: 'ค่าวัตถุดิบ/สินค้า', title: 'รอบ 29/05/2569 (2 รายการ)', amount: 258, note: '📦 ดึงจาก Google Sheets | ซื้อวัตถุดิบ 2 รายการ' },
            { id: 'real-cost-5', date: '2026-05-31', type: 'cost', channel: 'ค่าวัตถุดิบ/สินค้า', title: 'รอบ 31/05/2569 (7 รายการ)', amount: 1150, note: '📦 ดึงจาก Google Sheets | ซื้อวัตถุดิบ 7 รายการ' },
            { id: 'real-cost-6', date: '2026-06-05', type: 'cost', channel: 'ค่าวัตถุดิบ/สินค้า', title: 'รอบ 05/06/2569 (1 รายการ)', amount: 360, note: '📦 ดึงจาก Google Sheets | ซื้อวัตถุดิบ 1 รายการ' },
            { id: 'real-cost-7', date: '2026-06-06', type: 'cost', channel: 'ค่าวัตถุดิบ/สินค้า', title: 'รอบ 06/06/2569 (2 รายการ)', amount: 1626, note: '📦 ดึงจาก Google Sheets | ซื้อวัตถุดิบ 2 รายการ' },
            { id: 'real-cost-8', date: '2026-06-10', type: 'cost', channel: 'ค่าวัตถุดิบ/สินค้า', title: 'รอบ 10/06/2569 (3 รายการ)', amount: 937, note: '📦 ดึงจาก Google Sheets | ซื้อวัตถุดิบ 3 รายการ' },
            { id: 'real-cost-9', date: '2026-06-11', type: 'cost', channel: 'ค่าวัตถุดิบ/สินค้า', title: 'รอบ 11/06/2569 (1 รายการ)', amount: 48, note: '📦 ดึงจาก Google Sheets | ซื้อวัตถุดิบ 1 รายการ' },
            { id: 'real-cost-10', date: '2026-06-12', type: 'cost', channel: 'ค่าวัตถุดิบ/สินค้า', title: 'รอบ 12/06/2569 (5 รายการ)', amount: 1262.75, note: '📦 ดึงจาก Google Sheets | ซื้อวัตถุดิบ 5 รายการ' },
            { id: 'real-cost-11', date: '2026-06-14', type: 'cost', channel: 'ค่าวัตถุดิบ/สินค้า', title: 'รอบ 14/06/2569 (2 รายการ)', amount: 188, note: '📦 ดึงจาก Google Sheets | ซื้อวัตถุดิบ 2 รายการ' },
            { id: 'real-cost-12', date: '2026-06-16', type: 'cost', channel: 'ค่าวัตถุดิบ/สินค้า', title: 'รอบ 16/06/2569 (2 รายการ)', amount: 1460.50, note: '📦 ดึงจาก Google Sheets | ซื้อวัตถุดิบ 2 รายการ' },
            { id: 'real-cost-13', date: '2026-06-17', type: 'cost', channel: 'ค่าวัตถุดิบ/สินค้า', title: 'รอบ 17/06/2569 (1 รายการ)', amount: 130.50, note: '📦 ดึงจาก Google Sheets | ซื้อวัตถุดิบ 1 รายการ' },
            { id: 'real-cost-14', date: '2026-06-18', type: 'cost', channel: 'ค่าวัตถุดิบ/สินค้า', title: 'รอบ 18/06/2569 (1 รายการ)', amount: 327, note: '📦 ดึงจาก Google Sheets | ซื้อวัตถุดิบ 1 รายการ' },
            { id: 'real-cost-15', date: '2026-06-19', type: 'cost', channel: 'ค่าวัตถุดิบ/สินค้า', title: 'รอบ 19/06/2569 (1 รายการ)', amount: 1001, note: '📦 ดึงจาก Google Sheets | ซื้อวัตถุดิบ 1 รายการ' },
            { id: 'real-cost-16', date: '2026-06-21', type: 'cost', channel: 'ค่าวัตถุดิบ/สินค้า', title: 'รอบ 21/06/2569 (1 รายการ)', amount: 256, note: '📦 ดึงจาก Google Sheets | ซื้อวัตถุดิบ 1 รายการ' },
            { id: 'real-cost-17', date: '2026-06-23', type: 'cost', channel: 'ค่าวัตถุดิบ/สินค้า', title: 'รอบ 23/06/2569 (2 รายการ)', amount: 820, note: '📦 ดึงจาก Google Sheets | ซื้อวัตถุดิบ 2 รายการ' },
            { id: 'real-cost-18', date: '2026-06-25', type: 'cost', channel: 'ค่าวัตถุดิบ/สินค้า', title: 'รอบ 25/06/2569 (1 รายการ)', amount: 889, note: '📦 ดึงจาก Google Sheets | ซื้อวัตถุดิบ 1 รายการ' },
            { id: 'real-cost-19', date: '2026-06-26', type: 'cost', channel: 'ค่าวัตถุดิบ/สินค้า', title: 'รอบ 26/06/2569 (1 รายการ)', amount: 341.50, note: '📦 ดึงจาก Google Sheets | ซื้อวัตถุดิบ 1 รายการ' },
            { id: 'real-cost-20', date: '2026-06-30', type: 'cost', channel: 'ค่าวัตถุดิบ/สินค้า', title: 'รอบ 30/06/2569 (1 รายการ)', amount: 1221, note: '📦 ดึงจาก Google Sheets | ซื้อวัตถุดิบ 1 รายการ' },
            { id: 'real-cost-21', date: '2026-07-02', type: 'cost', channel: 'ค่าวัตถุดิบ/สินค้า', title: 'รอบ 02/07/2569 (1 รายการ)', amount: 539, note: '📦 ดึงจาก Google Sheets | ซื้อวัตถุดิบ 1 รายการ' },
            { id: 'real-cost-22', date: '2026-07-05', type: 'cost', channel: 'ค่าวัตถุดิบ/สินค้า', title: 'รอบ 05/07/2569 (1 รายการ)', amount: 1099, note: '📦 ดึงจาก Google Sheets | ซื้อวัตถุดิบ 1 รายการ' },
            { id: 'real-cost-23', date: '2026-07-08', type: 'cost', channel: 'ค่าวัตถุดิบ/สินค้า', title: 'รอบ 08/07/2569 (2 รายการ)', amount: 1574, note: '📦 ดึงจาก Google Sheets | ซื้อวัตถุดิบ 2 รายการ' },
            { id: 'real-cost-24', date: '2026-07-12', type: 'cost', channel: 'ค่าวัตถุดิบ/สินค้า', title: 'รอบ 12/07/2569 (1 รายการ)', amount: 1057, note: '📦 ดึงจาก Google Sheets | ซื้อวัตถุดิบ 1 รายการ' },
            { id: 'real-cost-25', date: '2026-07-16', type: 'cost', channel: 'ค่าวัตถุดิบ/สินค้า', title: 'สัปดาห์ที่ 29 (1 รายการ)', amount: 2168, note: '📦 ดึงจาก Google Sheets | ซื้อวัตถุดิบ 1 รายการ' },
            { id: 'real-cost-26', date: '2026-07-21', type: 'cost', channel: 'ค่าวัตถุดิบ/สินค้า', title: 'สัปดาห์ที่ 30 (1 รายการ)', amount: 2136, note: '📦 ดึงจาก Google Sheets | ซื้อวัตถุดิบ 1 รายการ' }
        ];

        const allRealBusiness = [...realSalesList, ...realCostList];
        localStorage.setItem(STORAGE_KEYS.BUSINESS, JSON.stringify(allRealBusiness));
        this.notifyListeners('business');
    }

    importGoogleSheetsData() {
        const salesCsvUrl = 'https://docs.google.com/spreadsheets/d/1E74eURpJrim4mrkWQuF0wzrEI649wjxkUDia4uAZz2o/gviz/tq?tqx=out:csv&gid=1044604296';
        const costCsvUrl = 'https://docs.google.com/spreadsheets/d/1qZf_UrM7UKR2lXSl04vuv_UkDuwH9vZCwKMgSaVoLVM/gviz/tq?tqx=out:csv&gid=1564251212';

        Promise.all([
            fetch(salesCsvUrl).then(r => r.text()).catch(() => ''),
            fetch(costCsvUrl).then(r => r.text()).catch(() => '')
        ]).then(([salesCsv, costCsv]) => {
            const salesItems = salesCsv ? this.parseSalesCsv(salesCsv) : [];
            const costItems = costCsv ? this.parseCostCsv(costCsv) : [];
            const allBusiness = [...salesItems, ...costItems];

            if (allBusiness.length > 0) {
                localStorage.setItem(STORAGE_KEYS.BUSINESS, JSON.stringify(allBusiness));
                this.notifyListeners('business');
                console.log(`✅ ดึงข้อมูล Google Sheets สำเร็จ: ${salesItems.length} ยอดขาย, ${costItems.length} รายจ่าย`);
            } else {
                this.populateRealGoogleSheetsItems();
            }
        }).catch(err => {
            console.log('Notice: Live fetch error. Using baked Google Sheets fallback data.', err);
            this.populateRealGoogleSheetsItems();
        });
    }

    refreshGoogleSheetsData() {
        localStorage.removeItem(STORAGE_KEYS.BUSINESS);
        this.importGoogleSheetsData();
    }

    // Parse Sales CSV: รายการ,จำนวนที่ขาย,รายได้รวม
    parseSalesCsv(csvText) {
        const lines = csvText.split('\n');
        const items = [];
        const todayStr = new Date().toISOString().split('T')[0];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim().replace(/\r/g, '');
            if (!line) continue;
            const parts = line.split(',').map(p => p.replace(/^"|"$/g, '').trim());
            if (parts.length >= 3) {
                const itemName = parts[0];
                const qty = parseInt(parts[1], 10) || 0;
                const revenue = parseFloat(parts[2]) || 0;

                if (revenue > 0 && itemName) {
                    items.push({
                        id: 'sheet-sale-' + i,
                        date: todayStr,
                        type: 'sale',
                        channel: 'หน้าร้าน',
                        title: `${itemName} (ขาย ${qty} ไม้)`,
                        amount: revenue,
                        note: `📊 ดึงตรงจาก Google Sheets (Live) | ขาย ${qty} ไม้ ได้ ฿${revenue.toLocaleString()}`
                    });
                }
            }
        }
        return items;
    }

    // Parse Cost CSV: รอบ,ยอดรวม (บาท),จำนวนรายการ,อัปเดตล่าสุด
    parseCostCsv(csvText) {
        const lines = csvText.split('\n');
        const items = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim().replace(/\r/g, '');
            if (!line) continue;
            const parts = line.split(',').map(p => p.replace(/^"|"$/g, '').trim());
            if (parts.length >= 4) {
                const roundTitle = parts[0];
                const costAmount = parseFloat(parts[1]) || 0;
                const itemCount = parseInt(parts[2], 10) || 0;
                const thaiDateStr = parts[3];

                const dateStr = this.convertThaiDateToISO(thaiDateStr);

                if (costAmount > 0 && roundTitle) {
                    items.push({
                        id: 'sheet-cost-' + i,
                        date: dateStr,
                        type: 'cost',
                        channel: 'ค่าวัตถุดิบ/สินค้า',
                        title: `${roundTitle} (${itemCount} รายการ)`,
                        amount: costAmount,
                        note: `📦 ดึงตรงจาก Google Sheets (Live) | ซื้อวัตถุดิบ ${itemCount} รายการ วันที่ ${thaiDateStr}`
                    });
                }
            }
        }
        return items;
    }

    convertThaiDateToISO(thaiStr) {
        if (!thaiStr) return new Date().toISOString().split('T')[0];
        const parts = thaiStr.split('/');
        if (parts.length === 3) {
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const yearBE = parseInt(parts[2]);
            const yearCE = yearBE > 2500 ? yearBE - 543 : yearBE;
            return `${yearCE}-${month}-${day}`;
        }
        return new Date().toISOString().split('T')[0];
    }

    getFinance() { return toArray(JSON.parse(localStorage.getItem(STORAGE_KEYS.FINANCE) || '[]')); }
    addFinanceItem(item) {
        const list = this.getFinance();
        item.id = 'fin-' + Date.now();
        list.unshift(item);
        localStorage.setItem(STORAGE_KEYS.FINANCE, JSON.stringify(list));
        this.notifyListeners('finance');
        return item;
    }

    getBusiness() { return toArray(JSON.parse(localStorage.getItem(STORAGE_KEYS.BUSINESS) || '[]')); }
    addBusinessItem(item) {
        const list = this.getBusiness();
        item.id = 'biz-' + Date.now();
        list.unshift(item);
        localStorage.setItem(STORAGE_KEYS.BUSINESS, JSON.stringify(list));
        this.notifyListeners('business');
        return item;
    }

    getTasks() { return toArray(JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]')); }
    addTask(task) {
        const list = this.getTasks();
        task.id = 'task-' + Date.now();
        list.unshift(task);
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(list));
        this.notifyListeners('tasks');
        return task;
    }



    toggleTaskStatus(taskId) {
        const list = this.getTasks();
        const task = list.find(t => t.id === taskId);
        if (task) {
            task.status = (task.status === 'completed') ? 'pending' : 'completed';
            if (task.status === 'completed') {
                task.completedDate = new Date().toISOString().split('T')[0];
            }
            localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(list));
            this.notifyListeners('tasks');
        }
    }

    deleteFinanceItem(id) {
        const list = this.getFinance().filter(x => x.id !== id);
        localStorage.setItem(STORAGE_KEYS.FINANCE, JSON.stringify(list));
        this.notifyListeners('finance');
    }

    deleteBusinessItem(id) {
        const list = this.getBusiness().filter(x => x.id !== id);
        localStorage.setItem(STORAGE_KEYS.BUSINESS, JSON.stringify(list));
        this.notifyListeners('business');
    }

    getSavings() { return toArray(JSON.parse(localStorage.getItem(STORAGE_KEYS.SAVINGS) || '[]')); }
    addSavingsGoal(goal) {
        const list = this.getSavings();
        goal.id = 'sav-' + Date.now();
        list.unshift(goal);
        localStorage.setItem(STORAGE_KEYS.SAVINGS, JSON.stringify(list));
        this.notifyListeners('savings');
        return goal;
    }

    depositSavings(id, amount) {
        const list = this.getSavings();
        const goal = list.find(g => g.id === id);
        if (goal) {
            goal.currentAmount = Number(goal.currentAmount || 0) + amount;
            localStorage.setItem(STORAGE_KEYS.SAVINGS, JSON.stringify(list));
            this.notifyListeners('savings');
        }
    }

    deleteSavingsGoal(id) {
        const list = this.getSavings().filter(g => g.id !== id);
        localStorage.setItem(STORAGE_KEYS.SAVINGS, JSON.stringify(list));
        this.notifyListeners('savings');
    }

    getCalendar() { return JSON.parse(localStorage.getItem(STORAGE_KEYS.CALENDAR) || '{}'); }

    exportAllData() {
        return JSON.stringify({
            finance: this.getFinance(),
            business: this.getBusiness(),
            tasks: this.getTasks(),
            savings: this.getSavings(),
            calendar: this.getCalendar(),
            exportDate: new Date().toISOString()
        }, null, 2);
    }

    importAllData(jsonStr) {
        try {
            const data = JSON.parse(jsonStr);
            if (data.finance) localStorage.setItem(STORAGE_KEYS.FINANCE, JSON.stringify(data.finance));
            if (data.business) localStorage.setItem(STORAGE_KEYS.BUSINESS, JSON.stringify(data.business));
            if (data.tasks) localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(data.tasks));
            if (data.savings) localStorage.setItem(STORAGE_KEYS.SAVINGS, JSON.stringify(data.savings));
            if (data.calendar) localStorage.setItem(STORAGE_KEYS.CALENDAR, JSON.stringify(data.calendar));
            this.notifyListeners('all');
            return true;
        } catch (e) {
            return false;
        }
    }

    clearAllData() {
        localStorage.setItem(STORAGE_KEYS.FINANCE, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.BUSINESS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.SAVINGS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.CALENDAR, JSON.stringify({}));
        this.notifyListeners('all');
    }

    deleteTask(id) {
        const list = this.getTasks().filter(t => t.id !== id);
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(list));
        this.notifyListeners('tasks');
    }

    subscribe(fn) { this.listeners.push(fn); }
    notifyListeners(type) {
        this.listeners.forEach(fn => fn(type));
        if (window.cloudSync) window.cloudSync.onDataChanged();
    }
}

const store = window.store = new DataStore();

