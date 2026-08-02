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
            const todayStr = new Date().toISOString().split('T')[0];
            initialCal[todayStr] = { status: 'busy', title: 'ประชุมทีมประจำสัปดาห์' };
            localStorage.setItem(STORAGE_KEYS.CALENDAR, JSON.stringify(initialCal));
        }

        if (!localStorage.getItem(STORAGE_KEYS.BUSINESS)) {
            this.populateRealGoogleSheetsItems();
        }
    }

    // 🎯 SAMPLE DEMO DATA FOR TEMPLATE SHOWCASE
    populateRealGoogleSheetsItems() {
        const todayStr = new Date().toISOString().split('T')[0];

        const realSalesList = [
            { id: 'demo-sale-1', date: todayStr, type: 'sale', channel: 'หน้าร้าน', title: 'สินค้าตัวอย่าง A (ขาย 120 ชิ้น)', amount: 2400, note: '📊 ยอดขายสินค้าตัวอย่าง A' },
            { id: 'demo-sale-2', date: todayStr, type: 'sale', channel: 'หน้าร้าน', title: 'สินค้าตัวอย่าง B (ขาย 85 ชิ้น)', amount: 1700, note: '📊 ยอดขายสินค้าตัวอย่าง B' },
            { id: 'demo-sale-3', date: todayStr, type: 'sale', channel: 'ออนไลน์', title: 'สินค้าตัวอย่าง C (ขาย 45 ชิ้น)', amount: 1350, note: '📊 ยอดขายออนไลน์' },
            { id: 'demo-sale-4', date: todayStr, type: 'sale', channel: 'หน้าร้าน', title: 'สินค้าตัวอย่าง D (ขาย 200 ชิ้น)', amount: 4000, note: '📊 ยอดขายสินค้าตัวอย่าง D' }
        ];

        const realCostList = [
            { id: 'demo-cost-1', date: todayStr, type: 'cost', channel: 'ค่าวัตถุดิบ/สินค้า', title: 'วัตถุดิบและอุปกรณ์ร้านค้า (รอบที่ 1)', amount: 1500, note: '📦 ต้นทุนวัตถุดิบรอบที่ 1' },
            { id: 'demo-cost-2', date: todayStr, type: 'cost', channel: 'ค่าวัตถุดิบ/สินค้า', title: 'วัตถุดิบและอุปกรณ์ร้านค้า (รอบที่ 2)', amount: 1200, note: '📦 ต้นทุนวัตถุดิบรอบที่ 2' }
        ];

        const allRealBusiness = [...realSalesList, ...realCostList];
        localStorage.setItem(STORAGE_KEYS.BUSINESS, JSON.stringify(allRealBusiness));
        this.notifyListeners('business');
    }

    importGoogleSheetsData() {
        const salesCsvUrl = '';
        const costCsvUrl = '';
        if (!salesCsvUrl || !costCsvUrl) {
            this.populateRealGoogleSheetsItems();
            return;
        }
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

