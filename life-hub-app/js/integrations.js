/* ==========================================================================
   Life & Business Hub - Real Integrations Engine
   Gmail OAuth2 (Real) | LINE Notify | Manual Entry
   ========================================================================== */

class IntegrationsController {
    constructor() {
        this.teamsFeed = []; // reuse for manual entries
        this.emailFeed = [];
        this.lineToken = localStorage.getItem('lifehub_line_token_v2') || 'Ywwgmegc6oIN/LL06KxSMtKAzCm4cYAiHE6oZu/h9X5kdM85X86YPr7sGXvETbeRhxK2SH30esKgyIll/pJo9Mq0KGJd3Aj602Md+c5WYC6C1cef2jlqIWcHbu42alfFfaXCcztK08XFzwOxVr64uwdB04t89/1O/w1cDnyilFU=';
        this.lineBotToken = localStorage.getItem('lifehub_line_bot_token_v2') || 'S6eepwLv+PVnpZlRCzSg2KzNZ8Glk5d+sLKQmpHDGNWftOEw5bT37RLuCVheHQijhxK2SH30esKgyIIl/pJo9Mq0KGJd3Aj602Md+c5WYC5oYRrLPmeecuNkq/VlJqQUDDqF77/NzUEnvk5mSIJeOQdB04t89/1O/w1cDnyilFU=';

        // Google OAuth2 — Client ID ฝังไว้แล้ว
        this.googleClientId = '201776370544-bueejjeng55noft7ugcit2kct5e3letv.apps.googleusercontent.com';
        this.googleAccessToken = null;
    }

    init() {
        this.loadLocalFeeds();
        this.renderFeeds();
        this.bindEvents();
    }

    loadLocalFeeds() {
        this.teamsFeed = [];
        this.emailFeed = [];
        this.saveLocalFeeds();
    }

    saveLocalFeeds() {
        localStorage.setItem(STORAGE_KEYS.INTEGRATIONS, JSON.stringify({
            teamsFeed: this.teamsFeed,
            emailFeed: this.emailFeed
        }));
    }

    bindEvents() {
        // Sync Gmail button (banner)
        const btnSync = document.getElementById('btn-trigger-sync');
        if (btnSync) {
            btnSync.addEventListener('click', () => this.syncGmailReal());
        }

        // LINE Notify Token save
        const btnSaveLine = document.getElementById('btn-save-line-token');
        if (btnSaveLine) {
            btnSaveLine.addEventListener('click', () => {
                const tokenInput = document.getElementById('line-token-input');
                if (tokenInput) {
                    this.lineToken = tokenInput.value.trim();
                    localStorage.setItem('lifehub_line_token_v2', this.lineToken);
                    if (window.appController) window.appController.showToast('💚 บันทึก LINE Notify Token เรียบร้อยแล้ว!');
                }
            });
        }

        // LINE Notify test send
        const btnTestLine = document.getElementById('btn-test-send-line');
        if (btnTestLine) {
            btnTestLine.addEventListener('click', () => this.sendSummaryToLineNotify());
        }

        // Dashboard & Tab LINE send buttons (Shop vs Personal)
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
        const btnConnectGmailGuide = document.getElementById('btn-connect-gmail-guide');
        const btnSyncGmailNow = document.getElementById('btn-sync-gmail-now');

        if (btnConnectGmail) {
            btnConnectGmail.addEventListener('click', () => this.syncGmailReal());
        }
        if (btnConnectGmailGuide) {
            btnConnectGmailGuide.addEventListener('click', () => this.syncGmailReal());
        }
        if (btnSyncGmailNow) {
            btnSyncGmailNow.addEventListener('click', () => this.syncGmailReal());
        }
    }

    // =========================================================================
    // 📧 GMAIL — Real OAuth2 Integration (Google Identity Services)
    // =========================================================================
    syncGmailReal() {
        if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
            if (window.appController) window.appController.showToast('⚠️ Google SDK ยังโหลดไม่เสร็จ กรุณารอสักครู่แล้วลองอีกครั้ง');
            return;
        }

        if (this.googleAccessToken) {
            // Token ยังใช้ได้ ดึงเลย
            this.fetchGmailMessages();
            return;
        }

        if (window.appController) window.appController.showToast('🔑 กำลังเปิดหน้าล็อกอิน Google...');

        const tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: this.googleClientId,
            scope: 'https://www.googleapis.com/auth/gmail.readonly',
            callback: (tokenResponse) => {
                if (tokenResponse.error) {
                    if (window.appController) window.appController.showToast('❌ ล็อกอิน Google ไม่สำเร็จ: ' + tokenResponse.error);
                    return;
                }
                this.googleAccessToken = tokenResponse.access_token;
                this.fetchGmailMessages();
            }
        });
        tokenClient.requestAccessToken();
    }

    fetchGmailMessages() {
        if (!this.googleAccessToken) return;

        if (window.appController) window.appController.showToast('📧 กำลังดึงอีเมลจาก Gmail...');

        fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10', {
            headers: { 'Authorization': 'Bearer ' + this.googleAccessToken }
        })
        .then(res => {
            if (res.status === 401) {
                this.googleAccessToken = null;
                if (window.appController) window.appController.showToast('🔑 Token หมดอายุ กรุณาล็อกอินใหม่');
                return null;
            }
            if (!res.ok) throw new Error('Gmail API Error: ' + res.status);
            return res.json();
        })
        .then(data => {
            if (!data) return;
            if (!data.messages || data.messages.length === 0) {
                if (window.appController) window.appController.showToast('📭 ไม่พบอีเมลใหม่ใน Gmail');
                return;
            }

            const fetchPromises = data.messages.slice(0, 8).map(msg =>
                fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`, {
                    headers: { 'Authorization': 'Bearer ' + this.googleAccessToken }
                }).then(r => r.json())
            );

            return Promise.all(fetchPromises);
        })
        .then(messages => {
            if (!messages) return;

            const newEmails = messages.map(msg => {
                const headers = msg.payload && msg.payload.headers ? msg.payload.headers : [];
                const subject = (headers.find(h => h.name === 'Subject') || {}).value || '(ไม่มีหัวข้อ)';
                const from = (headers.find(h => h.name === 'From') || {}).value || 'ไม่ทราบผู้ส่ง';
                const date = (headers.find(h => h.name === 'Date') || {}).value || '';

                let timeStr = '';
                try {
                    const d = new Date(date);
                    timeStr = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) + ' ' +
                              d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
                } catch (e) {
                    timeStr = 'ไม่ทราบเวลา';
                }

                return {
                    id: 'gmail-' + msg.id,
                    sender: from.replace(/<[^>]+>/g, '').trim(),
                    time: timeStr,
                    subject: subject,
                    preview: from.replace(/<[^>]+>/g, '').trim(),
                    unread: (msg.labelIds || []).includes('UNREAD')
                };
            });

            this.emailFeed = newEmails;
            this.saveLocalFeeds();
            this.renderFeeds();

            if (window.appController) window.appController.showToast(`✅ ดึงอีเมลจาก Gmail สำเร็จ ${newEmails.length} ฉบับ!`);
        })
        .catch(err => {
            console.error('Gmail fetch error:', err);
            if (window.appController) window.appController.showToast('❌ ดึง Gmail ไม่สำเร็จ: ' + err.message);
        });
    }

    buildExecutiveSummaryText() {
        const business = store.getBusiness();
        const sales = business.filter(x => x.type === 'sale');
        const costs = business.filter(x => x.type === 'cost');

        const totalSales = sales.reduce((sum, x) => sum + Number(x.amount), 0);
        const totalCosts = costs.reduce((sum, x) => sum + Number(x.amount), 0);
        const netProfit = totalSales - totalCosts;

        // Top 5 Sales Items from real Google Sheet
        const topSales = [...sales].sort((a, b) => b.amount - a.amount).slice(0, 5);
        const topSalesStr = topSales.map(item => `   • ${item.title}: ฿${formatMoney(item.amount)}`).join('\n');

        const formattedDate = new Date().toLocaleDateString('th-TH', {
            year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
        });

        return `📊 [รายงานยอดขายร้านค้าจริง (Google Sheets)]\n📅 ${formattedDate}\n\n` +
            `🛍️ 【สรุปยอดขาย & กำไร】\n` +
            `• ยอดขายสินค้ารวม (${sales.length} รายการ): ฿${formatMoney(totalSales)}\n` +
            `• ต้นทุนวัตถุดิบรวม (${costs.length} รอบ): ฿${formatMoney(totalCosts)}\n` +
            `• 📈 กำไรสุทธิ: ฿${formatMoney(netProfit)}\n\n` +
            `🔥 【สินค้าขายดี 5 อันดับแรก】\n${topSalesStr || '   • ไม่มีข้อมูล'}\n\n` +
            `✅ ดึงข้อมูลตรงจาก Google Sheets ของคุณ 100%`;
    }

    // =========================================================================
    // 💚 LINE Notify — Real HTTP POST
    // =========================================================================
    sendSummaryToLineNotify() {
        const summaryText = this.buildExecutiveSummaryText();

        if (this.lineToken) {
            if (window.appController) window.appController.showToast('💚 กำลังส่งรายงานสรุปเข้า LINE Notify...');
            fetch('https://notify-api.line.me/api/notify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Bearer ${this.lineToken}`
                },
                body: new URLSearchParams({ message: '\n' + summaryText })
            })
            .then(response => {
                if (response.ok) {
                    if (window.appController) window.appController.showToast('✅ ส่งรายงานสรุปเข้า LINE Notify สำเร็จแล้ว!');
                } else {
                    if (window.appController) window.appController.showToast('❌ ส่ง LINE Notify ไม่สำเร็จ');
                }
            })
            .catch(error => {
                console.error('LINE Notify Error:', error);
                if (window.appController) window.appController.showToast('⚠️ คัดลอกรายงานสรุปเข้าคลิปบอร์ดเรียบร้อย!');
                navigator.clipboard.writeText(summaryText).then(() => {
                    alert('คัดลอกรายงานสรุปเข้าคลิปบอร์ดแล้ว\nวางใน LINE ได้เลย!');
                }).catch(() => { alert(summaryText); });
            });
        } else {
            alert(`รายงานสรุปประจำวันของคุณ:\n\n${summaryText}`);
        }
    }

    // =========================================================================
    // 🛍️ REPORT 1: ยิงเฉพาะยอดขาย & ต้นทุนร้านค้า (Google Sheets)
    // =========================================================================
    buildShopSummaryText() {
        const business = store.getBusiness();
        const sales = business.filter(x => x.type === 'sale');
        const costs = business.filter(x => x.type === 'cost');

        const totalSales = sales.reduce((sum, x) => sum + Number(x.amount), 0);
        const totalCosts = costs.reduce((sum, x) => sum + Number(x.amount), 0);
        const netProfit = totalSales - totalCosts;

        const topSales = [...sales].sort((a, b) => b.amount - a.amount).slice(0, 5);
        const topSalesStr = topSales.map(item => `   • ${item.title}: ฿${formatMoney(item.amount)}`).join('\n');

        const formattedDate = new Date().toLocaleDateString('th-TH', {
            year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
        });

        return `📊 [รายงานยอดขายร้านค้า (Google Sheets)]\n📅 ${formattedDate}\n\n` +
            `🛍️ 【สรุปยอดขาย & กำไร】\n` +
            `• ยอดขายสินค้ารวม (${sales.length} รายการ): ฿${formatMoney(totalSales)}\n` +
            `• ต้นทุนวัตถุดิบรวม (${costs.length} รอบ): ฿${formatMoney(totalCosts)}\n` +
            `• 📈 กำไรสุทธิ: ฿${formatMoney(netProfit)}\n\n` +
            `🔥 【สินค้าขายดี 5 อันดับแรก】\n${topSalesStr || '   • ไม่มีข้อมูล'}\n\n` +
            `✅ ดึงข้อมูลตรงจาก Google Sheets ของคุณ 100%`;
    }

    sendShopReportToLine() {
        const summaryText = this.buildShopSummaryText();
        this.postToLineBot(summaryText, '🛍️ ส่งรายงานยอดขายร้านค้าเข้า LINE เรียบร้อยแล้ว!');
    }

    // =========================================================================
    // 👤 REPORT 2: ยิงเฉพาะข้อมูลส่วนตัว & ตารางนัดหมายวันนี้
    // =========================================================================
    buildPersonalSummaryText() {
        const todayStr = new Date().toISOString().split('T')[0];

        const finance = store.getFinance();
        const personalIncome = finance.filter(x => x.type === 'income').reduce((sum, x) => sum + Number(x.amount), 0);
        const personalExpense = finance.filter(x => x.type === 'expense').reduce((sum, x) => sum + Number(x.amount), 0);
        const personalBalance = personalIncome - personalExpense;

        const calendarData = store.getCalendar();
        const dayInfo = calendarData[todayStr] || {};
        const todayTasks = store.getTasks().filter(x => x.dueDate === todayStr && x.status !== 'completed');
        const allPendingTasks = store.getTasks().filter(x => x.status !== 'completed');

        let scheduleStatusStr = '';
        if (dayInfo.status === 'busy') {
            const reasonStr = dayInfo.title ? ` (📌 ธุระ: ${dayInfo.title})` : '';
            scheduleStatusStr = `🔴 วันนี้วันไม่ว่าง${reasonStr}`;
        } else if (dayInfo.status === 'free') {
            scheduleStatusStr = '🟢 วันนี้เป็นวันว่าง (Free Day)';
        } else {
            scheduleStatusStr = todayTasks.length > 0 ? '📌 วันนี้มีนัดหมาย/งานค้าง' : '✨ วันนี้เป็นวันว่าง (ไม่มีนัดหมาย)';
        }

        // List upcoming busy days & reasons in calendar — cap at 3 nearest days so
        // the LINE message doesn't run long when many days are marked busy
        const allBusyDates = Object.keys(calendarData)
            .filter(dateKey => calendarData[dateKey] && calendarData[dateKey].status === 'busy')
            .sort();
        const upcomingBusyDates = allBusyDates.filter(dateKey => dateKey >= todayStr);
        const displayBusyDates = (upcomingBusyDates.length > 0 ? upcomingBusyDates : allBusyDates).slice(0, 3);
        const remainingBusyCount = allBusyDates.length - displayBusyDates.length;

        const busyDaysList = displayBusyDates.map(dateKey => {
            const title = calendarData[dateKey].title || 'ติดภารกิจ/ไม่ว่าง';
            return `   • วันที่ ${dateKey}: ${title}`;
        });
        if (remainingBusyCount > 0) {
            busyDaysList.push(`   • และอีก ${remainingBusyCount} วัน`);
        }

        let tasksDetailStr = '';
        if (todayTasks.length > 0) {
            tasksDetailStr = todayTasks.map(t => `   • ${t.title}`).join('\n');
        } else {
            tasksDetailStr = '   • ไม่มีงานด่วนวันนี้';
        }

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
            `• รายการวันที่ลงไม่ว่างไว้ (${allBusyDates.length} วัน):\n${busyDaysList.length > 0 ? busyDaysList.join('\n') : '   • ไม่มีวันที่บันทึกว่าไม่ว่าง'}\n\n` +
            `📋 【นัดหมาย/งานวันนี้ (${todayTasks.length} รายการ)】\n${tasksDetailStr}\n\n` +
            `📋 งานค้างทั้งหมดในระบบ: ${allPendingTasks.length} รายการ`;
    }

    sendPersonalReportToLine() {
        const summaryText = this.buildPersonalSummaryText();
        this.postToLineBot(summaryText, '👤 ส่งรายงานข้อมูลส่วนตัว & นัดหมายเข้า LINE เรียบร้อยแล้ว!');
    }

    // Common LINE Bot Post Request
    postToLineBot(textMessage, successMsg) {
        if (!this.lineBotToken) {
            alert('กรุณาใส่ Channel Access Token (LINE Official Account) ก่อนครับ');
            return;
        }

        if (window.appController) window.appController.showToast('🤖 กำลังส่งข้อความเข้า LINE Official Account...');

        // Call Vercel Serverless Function /api/send-line (Bypasses CORS 100%)
        fetch('/api/send-line', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: textMessage, token: this.lineBotToken })
        })
        .then(res => {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        })
        .then(data => {
            if (data.success) {
                if (window.appController) window.appController.showToast('✅ ' + successMsg);
                alert('✅ ' + successMsg + '\n\nข้อความเด้งเข้า LINE เรียบร้อยแล้ว!');
            } else {
                throw new Error(data.error || 'Server error');
            }
        })
        .catch(err => {
            console.error('Vercel API fallback to direct LINE fetch:', err);
            // Direct LINE fetch attempt
            fetch('https://api.line.me/v2/bot/message/broadcast', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.lineBotToken}`
                },
                body: JSON.stringify({ messages: [{ type: 'text', text: textMessage }] })
            })
            .then(res => res.json())
            .then(data => {
                if (data.message) throw new Error(data.message);
                if (window.appController) window.appController.showToast('✅ ' + successMsg);
            })
            .catch(directErr => {
                if (window.appController) window.appController.showToast('📋 คัดลอกรายงานสรุปเข้าคลิปบอร์ดแล้ว!');
                navigator.clipboard.writeText(textMessage).then(() => {
                    alert('📋 คัดลอกข้อความสรุปเข้าคลิปบอร์ดแล้ว! สามารถวางส่งในแชท LINE ได้ทันที');
                }).catch(() => { alert(textMessage); });
            });
        });
    }

    // =========================================================================
    // ✏️ Manual Entry — เพิ่มงานด้วยตนเอง
    // =========================================================================
    addManualWorkItem(source) {
        const sourceName = source === 'teams' ? 'งานค้าง' : 'Email';
        const title = prompt(`✏️ เพิ่ม${sourceName}ด้วยตนเอง\n\nกรุณาระบุหัวข้องาน:`, '');
        if (!title || !title.trim()) return;
        const sender = prompt(`ระบุผู้สั่งงาน (เช่น ชื่ออาจารย์ หรือหัวหน้า):`, 'ไม่ระบุ');

        const nowStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        const feedItem = {
            id: source + '-manual-' + Date.now(),
            sender: (sender || 'ไม่ระบุ') + ' (เพิ่มเอง)',
            time: nowStr,
            subject: title.trim(),
            preview: `เพิ่มเข้าระบบด้วยตนเอง`,
            unread: true
        };

        if (source === 'teams') {
            this.teamsFeed.unshift(feedItem);
        } else {
            this.emailFeed.unshift(feedItem);
        }

        this.saveLocalFeeds();
        this.renderFeeds();

        store.addTask({
            title: title.trim(),
            priority: 'high',
            dueDate: new Date().toISOString().split('T')[0],
            status: 'pending',
            source: source,
            note: `บันทึกด้วยตนเอง: ${sender || 'ไม่ระบุ'}`
        });

        if (window.tasksController) window.tasksController.renderTasks();
        if (window.appController) {
            window.appController.showToast(`✅ เพิ่มงานเข้าระบบสำเร็จ!`);
        }
    }

    // =========================================================================
    // 🖼️ Render Feed Cards
    // =========================================================================
    renderFeeds() {
        const teamsContainer = document.getElementById('teams-feed-list');
        const emailsContainer = document.getElementById('emails-feed-list');
        const dashContainer = document.getElementById('dashboard-recent-teams-emails');

        const teamsPill = document.getElementById('teams-count-pill');
        const emailPill = document.getElementById('email-count-pill');
        const teamsBadge = document.getElementById('teams-badge-count');

        if (teamsPill) teamsPill.textContent = `${this.teamsFeed.length} รายการ`;
        if (emailPill) emailPill.textContent = `${this.emailFeed.length} ฉบับ`;
        if (teamsBadge) teamsBadge.textContent = this.emailFeed.filter(x => x.unread).length;

        // Manual entries feed
        if (teamsContainer) {
            if (this.teamsFeed.length === 0) {
                teamsContainer.innerHTML = `
                    <div style="padding: 24px 20px; text-align: center; color: #64748b; background: rgba(255,255,255,0.02); border-radius: 10px; border: 1px dashed rgba(255,255,255,0.06);">
                        <div style="font-size: 1.5rem; margin-bottom: 6px;">✏️</div>
                        <div style="font-size: 0.88rem; color: #94a3b8;">ยังไม่มีงานที่เพิ่มด้วยตนเอง</div>
                        <button onclick="integrationsController.addManualWorkItem('teams')" style="margin-top: 10px; background: rgba(99,102,241,0.12); color: #818cf8; border: 1px solid rgba(99,102,241,0.25); padding: 7px 14px; border-radius: 8px; font-size: 0.82rem; font-weight: 600; cursor: pointer;">+ เพิ่มงานด้วยตนเอง</button>
                    </div>
                `;
            } else {
                teamsContainer.innerHTML = this.teamsFeed.map(item => `
                    <div class="feed-card">
                        <div class="feed-header">
                            <span class="feed-sender">${escapeHTML(item.sender)}</span>
                            <span class="feed-time">${item.time}</span>
                        </div>
                        <div class="feed-subject">${escapeHTML(item.subject)}</div>
                        <div class="feed-preview">${escapeHTML(item.preview)}</div>
                        <div class="feed-actions">
                            <button class="btn-convert-task" onclick="integrationsController.convertToTask('${item.id}', 'teams')">➕ แปลงเป็นงานค้าง</button>
                        </div>
                    </div>
                `).join('');
            }
        }

        // Gmail email feed
        if (emailsContainer) {
            if (this.emailFeed.length === 0) {
                emailsContainer.innerHTML = `
                    <div style="padding: 24px 20px; text-align: center; color: #64748b; background: rgba(255,255,255,0.02); border-radius: 10px; border: 1px dashed rgba(255,255,255,0.06);">
                        <div style="font-size: 1.5rem; margin-bottom: 6px;">📩</div>
                        <div style="font-size: 0.88rem; color: #94a3b8;">ยังไม่มีอีเมล — กดปุ่มล็อกอิน Gmail ด้านบนเพื่อดึงอีเมลจริง</div>
                    </div>
                `;
            } else {
                emailsContainer.innerHTML = this.emailFeed.map(item => `
                    <div class="feed-card">
                        <div class="feed-header">
                            <span class="feed-sender">${escapeHTML(item.sender)}</span>
                            <span class="feed-time">${item.time}</span>
                        </div>
                        <div class="feed-subject">${escapeHTML(item.subject)}</div>
                        <div class="feed-preview">${escapeHTML(item.preview)}</div>
                        <div class="feed-actions">
                            <button class="btn-convert-task" onclick="integrationsController.convertToTask('${item.id}', 'email')">➕ แปลงเป็นงานค้าง</button>
                        </div>
                    </div>
                `).join('');
            }
        }

        // Dashboard combined feed
        if (dashContainer) {
            const combined = [...this.emailFeed, ...this.teamsFeed].slice(0, 4);
            if (combined.length === 0) {
                dashContainer.innerHTML = `<div style="text-align: center; color: #475569; padding: 16px; font-size: 0.82rem;">ยังไม่มีข้อความ — เชื่อมต่อ Gmail หรือเพิ่มงานด้วยตนเอง</div>`;
            } else {
                dashContainer.innerHTML = combined.map(item => `
                    <div class="recent-item">
                        <div class="recent-info">
                            <span class="recent-title">${escapeHTML(item.subject)}</span>
                            <span class="recent-meta">${item.sender} • ${item.time}</span>
                        </div>
                        <button class="btn-convert-task" onclick="integrationsController.convertToTask('${item.id}', 'email')">➕ รับเป็นงาน</button>
                    </div>
                `).join('');
            }
        }
    }

    convertToTask(id, type) {
        const item = (type === 'teams' ? this.teamsFeed : this.emailFeed).find(x => x.id === id);
        if (!item) return;

        store.addTask({
            title: item.subject,
            priority: 'high',
            dueDate: new Date().toISOString().split('T')[0],
            status: 'pending',
            source: type === 'teams' ? 'manual' : 'email',
            note: `ดึงมาจาก ${type === 'teams' ? 'งานที่เพิ่มเอง' : 'Gmail'}: ${item.sender}`
        });

        if (window.tasksController) window.tasksController.renderTasks();
        if (window.appController) {
            window.appController.showToast('✅ แปลงเป็นงานค้างสำเร็จแล้ว!');
            window.appController.switchTab('tasks');
        }
    }
}

const integrationsController = window.integrationsController = new IntegrationsController();
