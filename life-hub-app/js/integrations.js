/* ==========================================================================
   Life & Business Hub - Standalone Demo Integrations Engine (100% Offline / Mock)
   ========================================================================== */

class IntegrationsController {
    constructor() {
        this.teamsFeed = [];
        this.emailFeed = [];
        this.lineToken = '';
        this.lineBotToken = '';
    }

    init() {
        this.loadLocalFeeds();
        this.renderFeeds();
        this.bindEvents();
    }

    loadLocalFeeds() {
        const saved = localStorage.getItem(STORAGE_KEYS.INTEGRATIONS);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.teamsFeed = data.teamsFeed || [];
                this.emailFeed = data.emailFeed || [];
            } catch (e) {
                this.emailFeed = this.getMockEmails();
            }
        } else {
            this.emailFeed = this.getMockEmails();
            this.saveLocalFeeds();
        }
    }

    getMockEmails() {
        return [
            {
                id: 'email-1',
                sender: 'Google Cloud Platform <no-reply@google.com>',
                subject: '🚀 [Demo Mail] รายงานสรุปการรันแอปพลิเคชันรายสัปดาห์',
                snippet: 'สวัสดีครับ ระบบของคุณทำงานได้อย่างราบรื่น 100% ไม่พบข้อผิดพลาด...',
                date: 'วันนี้ 10:30 น.'
            },
            {
                id: 'email-2',
                sender: 'Stripe Billing <invoices@stripe.com>',
                subject: '💵 [Demo Mail] ใบแจ้งหนี้และสรุปยอดรับชำระเงิน',
                snippet: 'ได้รับการชำระเงินเรียบร้อยแล้ว จำนวน $150.00 USD รายการชำระเงินเสร็จสมบูรณ์',
                date: 'เมื่อวาน 16:45 น.'
            },
            {
                id: 'email-3',
                sender: 'GitHub Notifications <notifications@github.com>',
                subject: '✨ [Demo Mail] Build Succeeded for life-hub-demo',
                snippet: 'Your production deployment for life-hub-demo has completed successfully on main branch.',
                date: '2 วันที่แล้ว'
            }
        ];
    }

    saveLocalFeeds() {
        localStorage.setItem(STORAGE_KEYS.INTEGRATIONS, JSON.stringify({
            teamsFeed: this.teamsFeed,
            emailFeed: this.emailFeed
        }));
    }

    bindEvents() {
        // Sync Gmail button
        const btnSync = document.getElementById('btn-trigger-sync');
        if (btnSync) {
            btnSync.addEventListener('click', () => this.syncGmailReal());
        }

        // LINE Notify Token save
        const btnSaveLine = document.getElementById('btn-save-line-token');
        if (btnSaveLine) {
            btnSaveLine.addEventListener('click', () => {
                if (window.appController) window.appController.showToast('💚 [Demo] บันทึก LINE Notify Token เรียบร้อยแล้ว!');
            });
        }

        // LINE Notify test send
        const btnTestLine = document.getElementById('btn-test-send-line');
        if (btnTestLine) {
            btnTestLine.addEventListener('click', () => this.sendSummaryToLineNotify());
        }

        // Dashboard & Tab LINE send buttons
        const btnDashShop = document.getElementById('btn-dash-send-line-shop');
        const btnDashPersonal = document.getElementById('btn-dash-send-line-personal');
        const btnTestShop = document.getElementById('btn-test-send-line-shop');
        const btnTestPersonal = document.getElementById('btn-test-send-line-personal');

        if (btnDashShop) btnDashShop.addEventListener('click', () => this.sendShopReportToLine());
        if (btnDashPersonal) btnDashPersonal.addEventListener('click', () => this.sendPersonalReportToLine());
        if (btnTestShop) btnTestShop.addEventListener('click', () => this.sendShopReportToLine());
        if (btnTestPersonal) btnTestPersonal.addEventListener('click', () => this.sendPersonalReportToLine());

        // Gmail connect buttons
        const btnConnectGmail = document.getElementById('btn-connect-gmail');
        const btnSyncGmailNow = document.getElementById('btn-sync-gmail-now');

        if (btnConnectGmail) btnConnectGmail.addEventListener('click', () => this.syncGmailReal());
        if (btnSyncGmailNow) btnSyncGmailNow.addEventListener('click', () => this.syncGmailReal());
    }

    syncGmailReal() {
        if (window.appController) window.appController.showToast('📧 [Demo Mode] ดึงกล่องข้อความ Gmail ล่าสุดสำเร็จ!');
        this.emailFeed = this.getMockEmails();
        this.saveLocalFeeds();
        this.renderFeeds();
    }

    sendSummaryToLineNotify() {
        if (window.appController) window.appController.showToast('💚 [Demo Mode] จำลองการยิงข้อความสรุปเข้า LINE Notify สำเร็จ!');
        alert('✨ [Demo Mode] จำลองการยิงข้อความสรุปเข้า LINE Notify สำเร็จแล้ว!\n\n(ระบบเดโม่แบบสแตนด์อโลน ไม่ต้องเชื่อมต่อ API)');
    }

    sendShopReportToLine() {
        const text = '📊 [รายงานยอดขายร้านค้า - Demo]\n🛍️ ยอดขายรวม: ฿9,450.00\n📦 ต้นทุนรวม: ฿2,700.00\n📈 กำไรสุทธิ: ฿6,750.00';
        if (window.appController) window.appController.showToast('🛍️ [Demo Mode] ยิงรายงานร้านค้าเข้า LINE เรียบร้อย!');
        navigator.clipboard.writeText(text).then(() => {
            alert('🛍️ [Demo Mode] จำลองการยิงรายงานร้านค้าเข้า LINE สำเร็จ!\n\nพร้อมคัดลอกรายงานเข้าคลิปบอร์ดแล้ว:\n\n' + text);
        }).catch(() => {
            alert('🛍️ [Demo Mode] จำลองการยิงรายงานร้านค้าเข้า LINE สำเร็จ!\n\n' + text);
        });
    }

    sendPersonalReportToLine() {
        const text = '👤 [รายงานส่วนตัว - Demo]\n💵 คงเหลือส่วนตัว: ฿15,200.00\n📅 วันนี้เป็นวันว่าง (Free Day)\n📋 งานค้าง: 2 รายการ';
        if (window.appController) window.appController.showToast('👤 [Demo Mode] ยิงรายงานส่วนตัวเข้า LINE เรียบร้อย!');
        navigator.clipboard.writeText(text).then(() => {
            alert('👤 [Demo Mode] จำลองการยิงรายงานส่วนตัวเข้า LINE สำเร็จ!\n\nพร้อมคัดลอกรายงานเข้าคลิปบอร์ดแล้ว:\n\n' + text);
        }).catch(() => {
            alert('👤 [Demo Mode] จำลองการยิงรายงานส่วนตัวเข้า LINE สำเร็จ!\n\n' + text);
        });
    }

    renderFeeds() {
        const emailListEl = document.getElementById('email-feed-list');
        if (emailListEl) {
            if (this.emailFeed.length === 0) {
                emailListEl.innerHTML = '<div class="empty-state">ไม่มีข้อความอีเมล</div>';
            } else {
                emailListEl.innerHTML = this.emailFeed.map(item => `
                    <div class="feed-item glass-card">
                        <div class="feed-item-header">
                            <span class="feed-sender">✉️ ${item.sender}</span>
                            <span class="feed-date">${item.date}</span>
                        </div>
                        <div class="feed-subject">${item.subject}</div>
                        <div class="feed-snippet">${item.snippet}</div>
                    </div>
                `).join('');
            }
        }
    }
}

window.IntegrationsController = IntegrationsController;
