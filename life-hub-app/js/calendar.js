/* ==========================================================================
   Life & Business Hub - Interactive Free/Busy Calendar Grid Controller
   ========================================================================== */

class CalendarController {
    constructor() {
        this.currentDate = new Date();
        this.selectedDateStr = new Date().toISOString().split('T')[0];
    }

    init() {
        this.render();
        this.bindEvents();

        store.subscribe(type => {
            if (type === 'calendar' || type === 'tasks' || type === 'all') {
                this.render();
            }
        });
    }

    bindEvents() {
        const btnPrev = document.getElementById('btn-prev-month');
        const btnNext = document.getElementById('btn-next-month');
        const btnMarkFree = document.getElementById('btn-mark-free');
        const btnMarkBusy = document.getElementById('btn-mark-busy');

        if (btnPrev) {
            btnPrev.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                this.render();
            });
        }

        if (btnNext) {
            btnNext.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                this.render();
            });
        }

        if (btnMarkFree) {
            btnMarkFree.addEventListener('click', () => {
                this.setDayStatus(this.selectedDateStr, 'free');
            });
        }

        if (btnMarkBusy) {
            btnMarkBusy.addEventListener('click', () => {
                this.setDayStatus(this.selectedDateStr, 'busy');
            });
        }
    }

    setDayStatus(dateStr, status) {
        const calendarData = store.getCalendar();
        if (!calendarData[dateStr]) calendarData[dateStr] = {};

        calendarData[dateStr].status = status;
        localStorage.setItem(STORAGE_KEYS.CALENDAR, JSON.stringify(calendarData));
        store.notifyListeners('calendar');

        this.render();
        if (window.appController) {
            const statusLabel = status === 'free' ? '🟢 วันว่าง' : '🔴 วันไม่ว่าง';
            window.appController.showToast(`✅ บันทึกสถานะ ${statusLabel} สำหรับวันที่ ${dateStr} เรียบร้อยแล้ว!`);
        }
    }

    // Optional note/reason for the day (e.g. "ถ่ายงาน", "นัดหมอ") — never required,
    // can be added or edited any time regardless of free/busy status.
    saveDayNote(dateStr) {
        const input = document.getElementById('day-note-input');
        if (!input) return;

        const note = input.value.trim();
        const calendarData = store.getCalendar();
        if (!calendarData[dateStr]) calendarData[dateStr] = {};

        if (note) {
            calendarData[dateStr].title = note;
        } else {
            delete calendarData[dateStr].title;
        }

        localStorage.setItem(STORAGE_KEYS.CALENDAR, JSON.stringify(calendarData));
        store.notifyListeners('calendar');

        this.render();
        if (window.appController) {
            window.appController.showToast(note ? `📌 บันทึกหมายเหตุสำหรับวันที่ ${dateStr} เรียบร้อยแล้ว!` : `🗑️ ลบหมายเหตุของวันที่ ${dateStr} แล้ว`);
        }
    }

    render() {
        this.renderCalendarGrid();
        this.renderDayDetails(this.selectedDateStr);
        this.updateDashboardStatus();
    }

    renderCalendarGrid() {
        const container = document.getElementById('calendar-days-container');
        const titleElem = document.getElementById('calendar-month-year-title');
        if (!container) return;

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        const thaiMonths = [
            'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
            'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
        ];

        if (titleElem) titleElem.textContent = `${thaiMonths[month]} ${year + 543}`;

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const todayStr = new Date().toISOString().split('T')[0];
        const calendarData = store.getCalendar();
        const tasksList = store.getTasks();

        let html = '';

        // Empty cells before start of month
        for (let i = 0; i < firstDay; i++) {
            html += `<div class="calendar-day empty"></div>`;
        }

        // Render Days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === this.selectedDateStr;

            const dayData = calendarData[dateStr] || {};
            const dayStatus = dayData.status;

            // Count tasks due on this date
            const dayTasks = tasksList.filter(t => t.dueDate === dateStr && t.status !== 'completed');

            let statusPill = '';
            if (dayStatus === 'free') {
                statusPill = `<span class="day-status-pill status-free">🟢 ว่าง</span>`;
            } else if (dayStatus === 'busy') {
                statusPill = `<span class="day-status-pill status-busy">🔴 ไม่ว่าง</span>`;
            }

            let taskPill = dayTasks.length > 0 ? `<span class="day-task-count">📝 ${dayTasks.length} งาน</span>` : '';

            const dayTitleAttr = (dayStatus === 'busy' && dayData.title) ? ` title="${escapeHTML(dayData.title)}"` : '';

            html += `
                <div class="calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" onclick="calendarController.selectDate('${dateStr}')"${dayTitleAttr}>
                    <span class="day-number">${day}</span>
                    <div class="day-indicators">
                        ${statusPill}
                        ${taskPill}
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    selectDate(dateStr) {
        this.selectedDateStr = dateStr;
        this.renderCalendarGrid();
        this.renderDayDetails(dateStr);
    }

    renderDayDetails(dateStr) {
        const titleElem = document.getElementById('selected-date-title');
        const contentElem = document.getElementById('selected-day-content');
        if (!contentElem) return;

        if (titleElem) titleElem.textContent = `📅 รายละเอียดวันที่: ${dateStr}`;

        const calendarData = store.getCalendar();
        const dayData = calendarData[dateStr] || {};

        const tasksList = store.getTasks().filter(t => t.dueDate === dateStr);

        const statusLabel = dayData.status === 'free' ?
            `<span class="badge-tag" style="background: rgba(52,211,153,0.2); color: var(--accent-emerald);">🟢 วันว่าง (Free Day)</span>` :
            (dayData.status === 'busy' ? `<span class="badge-tag" style="background: rgba(239,68,68,0.2); color: var(--accent-rose);">🔴 ไม่ว่าง (Busy)</span>` : `<span class="badge-tag" style="background: rgba(255,255,255,0.1); color: var(--text-muted);">⚪ ยังไม่ได้ระบุ</span>`);

        let tasksHtml = '';
        if (tasksList.length > 0) {
            tasksHtml = `
                <h4 class="mt-16" style="font-size: 0.95rem; color: var(--text-primary); margin-bottom: 8px;">รายการงานค้างในวันนี้:</h4>
                <div class="recent-list">
                    ${tasksList.map(t => `
                        <div class="recent-item">
                            <div class="recent-info">
                                <span class="recent-title">${escapeHTML(t.title)}</span>
                                <span class="recent-meta">ความสำคัญ: ${t.priority === 'high' ? '⚠️ ด่วนมาก' : 'ปกติ'}</span>
                            </div>
                            <span class="badge-tag ${t.status === 'completed' ? 'badge-success-sm' : ''}">${t.status === 'completed' ? '✓ เสร็จแล้ว' : 'ยังไม่เสร็จ'}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            tasksHtml = `<p class="text-muted mt-12" style="font-size: 0.85rem;">ไม่มีนัดหมายหรืองานค้างในวันนี้</p>`;
        }

        contentElem.innerHTML = `
            <div class="day-detail-summary">
                <div style="margin-bottom: 12px;">
                    <span style="font-size: 0.85rem; color: var(--text-secondary);">สถานะวันว่าง:</span> ${statusLabel}
                </div>
                <div class="form-group mt-12">
                    <label for="day-note-input">📌 หมายเหตุ (ไม่บังคับ) — เช่น ถ่ายงาน, นัดหมอ, ธุระส่วนตัว</label>
                    <textarea id="day-note-input" class="form-textarea" rows="2" placeholder="ใส่หมายเหตุถ้าอยากบันทึกไว้...">${dayData.title ? escapeHTML(dayData.title) : ''}</textarea>
                    <button class="btn-secondary mt-12" style="font-size: 0.82rem;" onclick="calendarController.saveDayNote('${dateStr}')">💾 บันทึกหมายเหตุ</button>
                </div>
                ${tasksHtml}
                <button class="btn-secondary mt-16 width-100" style="border-color: rgba(239,68,68,0.3); color: var(--accent-rose); font-size: 0.82rem;" onclick="calendarController.clearDayStatus('${dateStr}')">
                    🗑️ ลบ/ล้างสถานะและนัดหมายของวันนี้
                </button>
            </div>
        `;
    }

    clearDayStatus(dateStr) {
        const calendarData = store.getCalendar();
        if (calendarData[dateStr]) {
            delete calendarData[dateStr];
            localStorage.setItem(STORAGE_KEYS.CALENDAR, JSON.stringify(calendarData));
            store.notifyListeners('calendar');
        }

        this.render();
        if (window.appController) {
            window.appController.showToast(`🗑️ ลบสถานะและนัดหมายวันที่ ${dateStr} เรียบร้อยแล้ว!`);
        }
    }

    updateDashboardStatus() {
        const todayStr = new Date().toISOString().split('T')[0];
        const calendarData = store.getCalendar();
        const todayData = calendarData[todayStr] || {};

        const statusElem = document.getElementById('dash-today-status');
        const eventsElem = document.getElementById('dash-today-events');

        const tasksCount = store.getTasks().filter(t => t.dueDate === todayStr && t.status !== 'completed').length;

        if (statusElem) {
            if (todayData.status === 'busy') {
                statusElem.textContent = '🔴 วันไม่ว่าง';
                statusElem.style.color = 'var(--accent-rose)';
            } else if (todayData.status === 'free') {
                statusElem.textContent = '🟢 วันว่าง';
                statusElem.style.color = 'var(--accent-emerald)';
            } else {
                statusElem.textContent = '🟢 วันว่าง';
                statusElem.style.color = 'var(--accent-emerald)';
            }
        }

        if (eventsElem) {
            eventsElem.textContent = `${tasksCount} นัดหมายวันนี้`;
        }
    }
}

const calendarController = window.calendarController = new CalendarController();

