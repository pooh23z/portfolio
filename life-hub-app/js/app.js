/* ==========================================================================
   Life & Business Hub - Main App Controller (Export & Import Sync Support)
   ========================================================================== */

function formatMoney(amount) {
    return Number(amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

const CATEGORY_OPTIONS = {
    'finance-expense': [
        '🏠 ค่าที่พัก & ค่าห้อง',
        '🚗 ค่าเดินทาง & ค่ารถ',
        '🍔 อาหาร & เครื่องดื่ม',
        '💡 บิล & ค่าสาธารณูปโภค',
        '🛍️ ช้อปปิ้ง & ของใช้',
        '💊 สุขภาพ & รักษาพยาบาล',
        '🎬 ความบันเทิง & พักผ่อน',
        '🎓 การศึกษา & อุปกรณ์การเรียน',
        '💳 หนึ้สิน & ผ่อนค่างวด',
        '🎁 สังคม & ทำบุญ/ของขวัญ',
        '📦 อื่นๆ'
    ],
    'finance-income': ['เงินเดือน/รายได้หลัก', 'ธุรกิจส่วนตัว', 'ปันผล/การลงทุน', 'รายได้เสริม/งานนอก', 'อื่นๆ'],
    'shop-sale': ['หน้าร้าน'],
    'shop-cost': ['ค่าวัตถุดิบ/สินค้า', 'การตลาด/ค่าโฆษณา', 'ค่าเช่า/ค่าสาธารณูปโภค', 'ค่าแรง/พนักงาน', 'อุปกรณ์/พัสดุ', 'อื่นๆ']
};

class AppController {
    constructor() {
        this.currentTab = 'dashboard';
        this.toastTimeout = null;
        this.currentSlipBase64 = null;
        this.themeMode = localStorage.getItem('lifehub_theme_mode') || 'dark';
    }

    init() {
        this.applyThemeMode(this.themeMode);
        this.setLiveDate();
        this.bindNavigation();
        this.bindModalEvents();
        this.bindSlipUploadEvents();
        this.bindBackupEvents();
        this.bindConnectEvents();
        this.bindNotificationPermissionBtn();
        this.bindThemeSwitcherBtn();

        // Initialize sub-controllers
        financeController.init();
        businessController.init();
        tasksController.init();
        calendarController.init();
        integrationsController.init();
        aiAssistantController.init();
        weatherController.init();
        chartRenderController.init();
    }

    bindThemeSwitcherBtn() {
        const btnToggle = document.getElementById('btn-toggle-theme');
        if (btnToggle) {
            btnToggle.addEventListener('click', () => {
                const order = ['dark', 'light', 'wave'];
                const nextIndex = (order.indexOf(this.themeMode) + 1) % order.length;
                this.themeMode = order[nextIndex];
                localStorage.setItem('lifehub_theme_mode', this.themeMode);
                this.applyThemeMode(this.themeMode);
                const toastMap = {
                    dark: '🌙 เปลี่ยนเป็นโหมดกลางคืนแล้ว',
                    light: '☀️ เปลี่ยนเป็นโหมดกลางวันแล้ว',
                    wave: '🌊 เปลี่ยนเป็นธีม Wave (ทะเลยามเช้า) แล้ว'
                };
                this.showToast(toastMap[this.themeMode]);
            });
        }
    }

    applyThemeMode(mode) {
        const iconElem = document.getElementById('theme-btn-icon');
        const textElem = document.getElementById('theme-btn-text');

        document.body.classList.remove('light-theme', 'dark-theme', 'wave-theme');

        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        const colorMap = { dark: '#0b0f19', light: '#faf6f0', wave: '#eef8f7' };

        if (mode === 'light') {
            document.body.classList.add('light-theme');
            if (iconElem) iconElem.textContent = '🌊';
            if (textElem) textElem.textContent = 'ธีม Wave';
        } else if (mode === 'wave') {
            document.body.classList.add('wave-theme');
            if (iconElem) iconElem.textContent = '🌙';
            if (textElem) textElem.textContent = 'โหมดกลางคืน';
        } else {
            document.body.classList.add('dark-theme');
            if (iconElem) iconElem.textContent = '☀️';
            if (textElem) textElem.textContent = 'โหมดกลางวัน';
        }

        if (metaThemeColor) metaThemeColor.setAttribute('content', colorMap[mode]);
    }

    bindNotificationPermissionBtn() {
        const btnNotif = document.getElementById('btn-enable-notifications');
        if (btnNotif) {
            btnNotif.addEventListener('click', () => {
                if ('Notification' in window) {
                    Notification.requestPermission().then(permission => {
                        if (permission === 'granted') {
                            this.showToast('🔔 เปิดการแจ้งเตือนเตือนความจำมือถือสำเร็จแล้ว!');
                            new Notification('🔔 เปิดการแจ้งเตือนสำเร็จ!', {
                                body: 'ระบบจะส่งเสียงเตือนและแจ้งเตือนเข้ามือถือของคุณเมื่อใกล้ถึงวันนัดประชุมหรือกำหนดส่งงาน'
                            });
                        } else {
                            alert('กรุณากด อนุญาต (Allow) การแจ้งเตือนในตั้งค่าเบราว์เซอร์ของมือถือเพื่อรับเสียงเตือนครับ');
                        }
                    });
                } else {
                    alert('เบราว์เซอร์ของอุปกรณ์นี้รองรับ Web Push Notification เรียบร้อยแล้ว');
                }
            });
        }
    }

    setLiveDate() {
        const liveDateElem = document.getElementById('live-date');
        if (liveDateElem) {
            const now = new Date();
            const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
            const formattedDate = `${now.getDate()} ${thaiMonths[now.getMonth()]} ${now.getFullYear() + 543}`;
            liveDateElem.textContent = formattedDate;
        }

        const dateInput = document.getElementById('entry-date');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
    }

    bindNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const targetTab = item.getAttribute('data-tab');
                this.switchTab(targetTab);
            });
        });

        const mobileItems = document.querySelectorAll('.mobile-nav-item[data-tab]');
        mobileItems.forEach(item => {
            item.addEventListener('click', () => {
                const targetTab = item.getAttribute('data-tab');
                this.switchTab(targetTab);
            });
        });

        const fabBtn = document.getElementById('btn-mobile-fab');
        if (fabBtn) {
            fabBtn.addEventListener('click', () => this.openModal('finance-expense'));
        }

        const gotoButtons = document.querySelectorAll('[data-goto-tab]');
        gotoButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.getAttribute('data-goto-tab');
                this.switchTab(target);
            });
        });
    }

    switchTab(tabName) {
        this.currentTab = tabName;

        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        const activeNav = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
        if (activeNav) activeNav.classList.add('active');

        document.querySelectorAll('.mobile-nav-item[data-tab]').forEach(b => b.classList.remove('active'));
        const activeMobileNav = document.querySelector(`.mobile-nav-item[data-tab="${tabName}"]`);
        if (activeMobileNav) activeMobileNav.classList.add('active');

        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        const activeContent = document.getElementById(`tab-${tabName}`);
        if (activeContent) activeContent.classList.add('active');

        const titles = {
            dashboard: 'ภาพรวมชีวิตและธุรกิจ (Dashboard)',
            calendar: 'ปฏิทินเช็กวันว่าง-ไม่ว่าง (Free/Busy Calendar)',
            finance: 'รายรับ-รายจ่ายส่วนตัว (Personal Finance)',
            business: 'ยอดขายและรายได้ร้านค้า (Shop Revenue)',
            tasks: 'งานค้างและรายการที่ต้องทำ (Tasks & To-Do)',
            integrations: 'MS Teams & LINE Synchronization Hub'
        };

        const titleElem = document.getElementById('page-title');
        if (titleElem) titleElem.textContent = titles[tabName] || 'LifeHub';

        if (tabName === 'dashboard') {
            chartRenderController.initMainOverviewChart();
        } else if (tabName === 'calendar') {
            calendarController.render();
        }
    }

    bindModalEvents() {
        const modal = document.getElementById('modal-entry');
        const btnQuickAdd = document.getElementById('btn-quick-add');
        const btnClose = document.getElementById('btn-close-modal');
        const btnCancel = document.getElementById('btn-cancel-modal');
        const typeBtns = document.querySelectorAll('.entry-type-selector .type-btn');
        const form = document.getElementById('form-entry');

        if (btnQuickAdd) btnQuickAdd.addEventListener('click', () => this.openModal('finance-expense'));
        if (btnClose) btnClose.addEventListener('click', () => this.closeModal());
        if (btnCancel) btnCancel.addEventListener('click', () => this.closeModal());

        typeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                typeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const type = btn.getAttribute('data-type');
                this.setModalEntryType(type);
            });
        });

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmit();
            });
        }

        const btnCloseSlipViewer = document.getElementById('btn-close-slip-viewer');
        if (btnCloseSlipViewer) {
            btnCloseSlipViewer.addEventListener('click', () => {
                const viewer = document.getElementById('modal-slip-viewer');
                if (viewer) viewer.classList.remove('active');
            });
        }
    }

    bindSlipUploadEvents() {
        const slipInput = document.getElementById('entry-slip');
        const btnRemoveSlip = document.getElementById('btn-remove-slip');

        if (slipInput) {
            slipInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (event) => {
                    this.compressImage(event.target.result, 600, 0.7, (compressedBase64) => {
                        this.currentSlipBase64 = compressedBase64;
                        this.showSlipPreview(compressedBase64);
                    });
                };
                reader.readAsDataURL(file);
            });
        }

        if (btnRemoveSlip) {
            btnRemoveSlip.addEventListener('click', () => {
                this.currentSlipBase64 = null;
                const container = document.getElementById('slip-preview-container');
                if (container) container.style.display = 'none';
                if (slipInput) slipInput.value = '';
            });
        }
    }

    compressImage(base64Str, maxWidth = 600, quality = 0.7, callback) {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            callback(canvas.toDataURL('image/jpeg', quality));
        };
    }

    showSlipPreview(base64) {
        const container = document.getElementById('slip-preview-container');
        const img = document.getElementById('slip-preview-img');
        if (container && img) {
            img.src = base64;
            container.style.display = 'flex';
        }
    }

    openModal(defaultType = 'finance-expense') {
        const modal = document.getElementById('modal-entry');
        if (modal) {
            this.setModalEntryType(defaultType);
            modal.classList.add('active');
        }
    }

    closeModal() {
        const modal = document.getElementById('modal-entry');
        if (modal) modal.classList.remove('active');
        this.currentSlipBase64 = null;
        const container = document.getElementById('slip-preview-container');
        if (container) container.style.display = 'none';
    }

    setModalEntryType(type) {
        document.getElementById('entry-mode').value = type;

        document.querySelectorAll('.entry-type-selector .type-btn').forEach(b => {
            b.classList.toggle('active', b.getAttribute('data-type') === type);
        });

        const rowAmount = document.getElementById('row-amount');
        const rowSlipUpload = document.getElementById('row-slip-upload');
        const rowTaskOptions = document.getElementById('row-task-options');
        const catSelect = document.getElementById('entry-category');
        const titleInput = document.getElementById('entry-title');

        if (type === 'task') {
            rowAmount.style.display = 'none';
            if (rowSlipUpload) rowSlipUpload.style.display = 'none';
            rowTaskOptions.style.display = 'flex';
            titleInput.placeholder = 'เช่น สรุปรายงานประจำสัปดาห์, ซื้อของเข้าบ้าน...';
        } else {
            rowAmount.style.display = 'flex';
            if (rowSlipUpload) {
                rowSlipUpload.style.display = (type === 'finance-expense' || type === 'shop-cost') ? 'block' : 'none';
            }
            rowTaskOptions.style.display = 'none';
            titleInput.placeholder = 'เช่น ค่าอาหารกลางวัน, ค่าสินค้า, ชำระค่าน้ำ...';

            const options = CATEGORY_OPTIONS[type] || ['ทั่วไป'];
            catSelect.innerHTML = options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
        }
    }

    handleFormSubmit() {
        const type = document.getElementById('entry-mode').value;
        const title = document.getElementById('entry-title').value;
        const amount = document.getElementById('entry-amount').value;
        const category = document.getElementById('entry-category').value;
        const date = document.getElementById('entry-date').value;
        const note = document.getElementById('entry-note').value;
        const priority = document.getElementById('entry-priority').value;
        const dueDate = document.getElementById('entry-due-date').value;

        if (type === 'finance-expense' || type === 'finance-income') {
            store.addFinanceItem({
                date,
                type: type === 'finance-income' ? 'income' : 'expense',
                category,
                title,
                amount: Number(amount || 0),
                note,
                slipUrl: this.currentSlipBase64
            });
            financeController.render();
            this.showToast(this.currentSlipBase64 ? '🧾 บันทึกรายการพร้อมสลิปสำเร็จ!' : '✅ บันทึกรายการเงินส่วนตัวสำเร็จ!');
        } else if (type === 'shop-sale' || type === 'shop-cost') {
            store.addBusinessItem({
                date,
                type: type === 'shop-sale' ? 'sale' : 'cost',
                channel: category,
                title,
                amount: Number(amount || 0),
                note,
                slipUrl: this.currentSlipBase64
            });
            businessController.render();
            this.showToast('✅ บันทึกรายการร้านค้าสำเร็จ!');
        } else if (type === 'task') {
            store.addTask({
                title,
                priority,
                dueDate: dueDate || date,
                status: 'pending',
                source: 'user',
                note
            });
            tasksController.renderTasks();
            if (calendarController) calendarController.render();
            this.showToast('✅ บันทึกงานค้างใหม่สำเร็จ!');
        }

        this.closeModal();
        document.getElementById('form-entry').reset();
        this.setLiveDate();
    }

    viewSlip(base64) {
        const viewer = document.getElementById('modal-slip-viewer');
        const img = document.getElementById('full-slip-image');
        if (viewer && img) {
            img.src = base64;
            viewer.classList.add('active');
        }
    }

    bindBackupEvents() {
        const btnExport = document.getElementById('btn-export-data');
        if (btnExport) {
            btnExport.addEventListener('click', () => {
                const dataStr = store.exportAllData();
                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `lifehub-backup-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                this.showToast('📥 ส่งออกไฟล์ข้อมูลสำเร็จ! นำไฟล์นี้ไปเปิดกด นำเข้าข้อมูล บนมือถือได้ทันที');
            });
        }

        const inputImport = document.getElementById('input-import-file');
        if (inputImport) {
            inputImport.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (evt) => {
                    const success = store.importAllData(evt.target.result);
                    if (success) {
                        financeController.render();
                        businessController.render();
                        tasksController.renderTasks();
                        calendarController.render();
                        integrationsController.renderFeeds();
                        chartRenderController.initMainOverviewChart();
                        this.showToast('📤 นำเข้าข้อมูลสำเร็จ! ข้อมูลคอมและมือถือตรงกัน 100% แล้ว');
                    } else {
                        alert('รูปแบบไฟล์ไม่ถูกต้อง กรุณาเลือกไฟล์สำรองข้อมูล .json จากแอปนี้เท่านั้นครับ');
                    }
                };
                reader.readAsText(file);
            });
        }

        const btnClear = document.getElementById('btn-clear-data');
        if (btnClear) {
            btnClear.addEventListener('click', () => {
                if (confirm('คุณต้องการล้างข้อมูลทั้งหมด และเริ่มต้นหน้าแอปแบบว่าง 0 รายการใช่หรือไม่?')) {
                    store.clearAllData();
                    financeController.render();
                    businessController.render();
                    tasksController.renderTasks();
                    calendarController.render();
                    integrationsController.renderFeeds();
                    chartRenderController.initMainOverviewChart();
                    this.showToast('✨ ล้างข้อมูลเรียบร้อยแล้ว เริ่มต้นใช้งานหน้าใหม่!');
                }
            });
        }
    }

    bindConnectEvents() {
        const btnMS365 = document.getElementById('btn-connect-ms365');
        if (btnMS365) {
            btnMS365.addEventListener('click', () => {
                this.showToast('🔑 เตรียมเชื่อมต่อ Microsoft Graph OAuth...');
                setTimeout(() => {
                    alert('คำแนะนำ: ระบบจะดึงข้อความจาก MS Teams และ Outlook Email โดยอัตโนมัติผ่าน Microsoft 365 Account ของคุณ');
                }, 400);
            });
        }
    }

    showToast(message) {
        const toast = document.getElementById('toast');
        if (!toast) return;

        toast.textContent = message;
        toast.classList.add('show');

        if (this.toastTimeout) clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.appController = new AppController();
    window.appController.init();
});
