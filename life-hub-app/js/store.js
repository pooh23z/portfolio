/* ==========================================================================
   Life & Business Hub - Standalone Demo DataStore (Pure Local Mock Data)
   ========================================================================== */

const STORAGE_KEYS = {
    FINANCE: 'lifehub_demo_standalone_finance_v2',
    BUSINESS: 'lifehub_demo_standalone_business_v2',
    TASKS: 'lifehub_demo_standalone_tasks_v2',
    INTEGRATIONS: 'lifehub_demo_standalone_integrations_v2',
    SAVINGS: 'lifehub_demo_standalone_savings_v2',
    CALENDAR: 'lifehub_demo_standalone_calendar_v2'
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
        const todayStr = new Date().toISOString().split('T')[0];

        // 💵 Personal Finance Mock Data
        if (!localStorage.getItem(STORAGE_KEYS.FINANCE)) {
            const demoFinance = [
                { id: 'fin-demo-1', date: todayStr, type: 'income', category: 'ธุรกิจส่วนตัว', title: 'รายได้จากงานฟรีแลนซ์ (Demo)', amount: 15000, note: '💵 รายรับตัวอย่างสำหรับพอร์ตโฟลิโอ' },
                { id: 'fin-demo-2', date: todayStr, type: 'expense', category: '🍔 อาหาร & เครื่องดื่ม', title: 'ค่าอาหารและกาแฟ (Demo)', amount: 450, note: '🍔 รายจ่ายตัวอย่าง' },
                { id: 'fin-demo-3', date: todayStr, type: 'expense', category: '💡 บิล & ค่าสาธารณูปโภค', title: 'ค่าบริการคลาวด์เซิร์ฟเวอร์ (Demo)', amount: 1200, note: '💡 รายจ่ายซอฟต์แวร์' }
            ];
            localStorage.setItem(STORAGE_KEYS.FINANCE, JSON.stringify(demoFinance));
        }

        // 📋 To-Do Tasks Mock Data
        if (!localStorage.getItem(STORAGE_KEYS.TASKS)) {
            const demoTasks = [
                { id: 'task-demo-1', title: '🚀 ตรวจสอบหน้าจอแสดงผล Portfolio Dashboard', dueDate: todayStr, priority: 'urgent', status: 'pending' },
                { id: 'task-demo-2', title: '📝 อัปเดตข้อมูลสรุปรายได้ประจำเดือนในระบบ', dueDate: todayStr, priority: 'normal', status: 'pending' }
            ];
            localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(demoTasks));
        }

        // 🎯 Savings Goals Mock Data
        if (!localStorage.getItem(STORAGE_KEYS.SAVINGS)) {
            const demoSavings = [
                { id: 'savings-demo-1', title: '💻 ออมเงินซื้ออุปกรณ์พัฒนาระบบใหม่', target: 50000, current: 25000, date: '2026-12-31' }
            ];
            localStorage.setItem(STORAGE_KEYS.SAVINGS, JSON.stringify(demoSavings));
        }

        // 📅 Calendar Days Mock Data
        if (!localStorage.getItem(STORAGE_KEYS.CALENDAR)) {
            const initialCal = {};
            initialCal[todayStr] = { status: 'free', title: '🟢 วันว่าง (Free Day)' };
            localStorage.setItem(STORAGE_KEYS.CALENDAR, JSON.stringify(initialCal));
        }

        // 🏪 Business Shop Sales & Cost Mock Data
        if (!localStorage.getItem(STORAGE_KEYS.BUSINESS)) {
            this.populateRealGoogleSheetsItems();
        }
    }

    // 🎯 SAMPLE DEMO DATA FOR TEMPLATE SHOWCASE
    populateRealGoogleSheetsItems() {
        const todayStr = new Date().toISOString().split('T')[0];

        const realSalesList = [
            { id: 'demo-sale-1', date: todayStr, type: 'sale', channel: 'หน้าร้าน', title: 'สินค้าโชว์พอร์ต A (ขาย 100 ชิ้น)', amount: 5000, note: '📊 ยอดขายตัวอย่าง สินค้า A' },
            { id: 'demo-sale-2', date: todayStr, type: 'sale', channel: 'หน้าร้าน', title: 'สินค้าโชว์พอร์ต B (ขาย 80 ชิ้น)', amount: 4000, note: '📊 ยอดขายตัวอย่าง สินค้า B' },
            { id: 'demo-sale-3', date: todayStr, type: 'sale', channel: 'ออนไลน์', title: 'สินค้าโชว์พอร์ต C (ขาย 50 ชิ้น)', amount: 3500, note: '📊 ยอดขายออนไลน์ตัวอย่าง' }
        ];

        const realCostList = [
            { id: 'demo-cost-1', date: todayStr, type: 'cost', channel: 'ค่าวัตถุดิบ/สินค้า', title: 'ค่าวัตถุดิบและพัสดุร้านค้า (รอบที่ 1)', amount: 2500, note: '📦 ต้นทุนวัตถุดิบรอบที่ 1' },
            { id: 'demo-cost-2', date: todayStr, type: 'cost', channel: 'ค่าวัตถุดิบ/สินค้า', title: 'ค่าโฆษณาและบริการการตลาด (รอบที่ 2)', amount: 1000, note: '📦 ต้นทุนโฆษณา' }
        ];

        const allRealBusiness = [...realSalesList, ...realCostList];
        localStorage.setItem(STORAGE_KEYS.BUSINESS, JSON.stringify(allRealBusiness));
        this.notifyListeners('business');
    }

    importGoogleSheetsData() {
        this.populateRealGoogleSheetsItems();
    }

    refreshGoogleSheetsData() {
        localStorage.removeItem(STORAGE_KEYS.BUSINESS);
        this.populateRealGoogleSheetsItems();
    }

    // Subscription System
    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notifyListeners(type) {
        this.listeners.forEach(listener => listener(type));
    }

    // --- Finance Getters & Setters ---
    getFinance() {
        try {
            return toArray(JSON.parse(localStorage.getItem(STORAGE_KEYS.FINANCE) || '[]'));
        } catch (e) {
            return [];
        }
    }

    addFinance(item) {
        const list = this.getFinance();
        const newItem = {
            id: 'fin-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            date: item.date || new Date().toISOString().split('T')[0],
            type: item.type || 'expense',
            category: item.category || 'อื่นๆ',
            title: item.title || 'ไม่มีชื่อรายการ',
            amount: Number(item.amount || 0),
            slip: item.slip || null,
            note: item.note || ''
        };
        list.unshift(newItem);
        localStorage.setItem(STORAGE_KEYS.FINANCE, JSON.stringify(list));
        this.notifyListeners('finance');
        return newItem;
    }

    deleteFinance(id) {
        let list = this.getFinance();
        list = list.filter(x => x.id !== id);
        localStorage.setItem(STORAGE_KEYS.FINANCE, JSON.stringify(list));
        this.notifyListeners('finance');
    }

    // --- Business / Shop Getters & Setters ---
    getBusiness() {
        try {
            return toArray(JSON.parse(localStorage.getItem(STORAGE_KEYS.BUSINESS) || '[]'));
        } catch (e) {
            return [];
        }
    }

    addBusiness(item) {
        const list = this.getBusiness();
        const newItem = {
            id: 'biz-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            date: item.date || new Date().toISOString().split('T')[0],
            type: item.type || 'sale',
            channel: item.channel || 'หน้าร้าน',
            title: item.title || 'ไม่มีชื่อรายการ',
            amount: Number(item.amount || 0),
            slip: item.slip || null,
            note: item.note || ''
        };
        list.unshift(newItem);
        localStorage.setItem(STORAGE_KEYS.BUSINESS, JSON.stringify(list));
        this.notifyListeners('business');
        return newItem;
    }

    deleteBusiness(id) {
        let list = this.getBusiness();
        list = list.filter(x => x.id !== id);
        localStorage.setItem(STORAGE_KEYS.BUSINESS, JSON.stringify(list));
        this.notifyListeners('business');
    }

    // --- Tasks Getters & Setters ---
    getTasks() {
        try {
            return toArray(JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]'));
        } catch (e) {
            return [];
        }
    }

    addTask(item) {
        const list = this.getTasks();
        const newItem = {
            id: 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            title: item.title || 'ไม่มีชื่อแก้งาน',
            dueDate: item.dueDate || new Date().toISOString().split('T')[0],
            priority: item.priority || 'normal',
            status: item.status || 'pending',
            category: item.category || 'general'
        };
        list.unshift(newItem);
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(list));
        this.notifyListeners('tasks');
        return newItem;
    }

    toggleTaskStatus(id) {
        const list = this.getTasks();
        const task = list.find(x => x.id === id);
        if (task) {
            task.status = task.status === 'completed' ? 'pending' : 'completed';
            localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(list));
            this.notifyListeners('tasks');
        }
    }

    deleteTask(id) {
        let list = this.getTasks();
        list = list.filter(x => x.id !== id);
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(list));
        this.notifyListeners('tasks');
    }

    // --- Savings Goals Getters & Setters ---
    getSavings() {
        try {
            return toArray(JSON.parse(localStorage.getItem(STORAGE_KEYS.SAVINGS) || '[]'));
        } catch (e) {
            return [];
        }
    }

    addSavings(item) {
        const list = this.getSavings();
        const newItem = {
            id: 'savings-' + Date.now(),
            title: item.title,
            target: Number(item.target || 0),
            current: Number(item.current || 0),
            date: item.date || ''
        };
        list.unshift(newItem);
        localStorage.setItem(STORAGE_KEYS.SAVINGS, JSON.stringify(list));
        this.notifyListeners('savings');
        return newItem;
    }

    deleteSavings(id) {
        let list = this.getSavings();
        list = list.filter(x => x.id !== id);
        localStorage.setItem(STORAGE_KEYS.SAVINGS, JSON.stringify(list));
        this.notifyListeners('savings');
    }

    // --- Calendar Getters & Setters ---
    getCalendar() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.CALENDAR) || '{}');
        } catch (e) {
            return {};
        }
    }

    setDayStatus(dateStr, status, title = '') {
        const cal = this.getCalendar();
        cal[dateStr] = { status, title };
        localStorage.setItem(STORAGE_KEYS.CALENDAR, JSON.stringify(cal));
        this.notifyListeners('calendar');
    }

    // --- Data Export & Import ---
    exportAllData() {
        const data = {
            version: '2.0-demo',
            timestamp: Date.now(),
            finance: this.getFinance(),
            business: this.getBusiness(),
            tasks: this.getTasks(),
            savings: this.getSavings(),
            calendar: this.getCalendar()
        };
        return JSON.stringify(data, null, 2);
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
            console.error('Import failed', e);
            return false;
        }
    }

    clearAllData() {
        localStorage.removeItem(STORAGE_KEYS.FINANCE);
        localStorage.removeItem(STORAGE_KEYS.BUSINESS);
        localStorage.removeItem(STORAGE_KEYS.TASKS);
        localStorage.removeItem(STORAGE_KEYS.SAVINGS);
        localStorage.removeItem(STORAGE_KEYS.CALENDAR);
        this.initDefaultData();
        this.notifyListeners('all');
    }
}

window.store = new DataStore();
