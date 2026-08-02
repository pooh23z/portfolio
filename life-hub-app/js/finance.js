/* ==========================================================================
   Life & Business Hub - Finance & Savings Goals Controller (พร้อมสลิป)
   ========================================================================== */

class FinanceController {
    constructor() {
        this.currentFilter = 'all';
        this.searchQuery = '';
    }

    init() {
        this.render();
        this.bindEvents();

        store.subscribe(type => {
            if (type === 'finance' || type === 'savings' || type === 'all') {
                this.render();
            }
        });
    }

    bindEvents() {
        const btnAddIncome = document.getElementById('btn-add-income');
        const btnAddExpense = document.getElementById('btn-add-expense');
        const btnOpenSavings = document.getElementById('btn-open-savings-modal');
        const btnAddSavingsInline = document.getElementById('btn-add-savings-goal-inline');
        const searchInput = document.getElementById('search-finance');

        if (btnAddIncome) btnAddIncome.addEventListener('click', () => appController.openModal('finance-income'));
        if (btnAddExpense) btnAddExpense.addEventListener('click', () => appController.openModal('finance-expense'));
        if (btnOpenSavings) btnOpenSavings.addEventListener('click', () => this.openSavingsModal());
        if (btnAddSavingsInline) btnAddSavingsInline.addEventListener('click', () => this.openSavingsModal());

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase().trim();
                this.renderTable();
            });
        }

        const filterBtns = document.querySelectorAll('[data-finance-filter]');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.getAttribute('data-finance-filter');
                this.renderTable();
            });
        });

        // Savings Goal Form Events
        const btnCloseSavings = document.getElementById('btn-close-savings-modal');
        const btnCancelSavings = document.getElementById('btn-cancel-savings-modal');
        const formSavings = document.getElementById('form-savings-goal');

        if (btnCloseSavings) btnCloseSavings.addEventListener('click', () => this.closeSavingsModal());
        if (btnCancelSavings) btnCancelSavings.addEventListener('click', () => this.closeSavingsModal());

        if (formSavings) {
            formSavings.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSavingsGoalSubmit();
            });
        }
    }

    openSavingsModal() {
        const modal = document.getElementById('modal-savings-goal');
        if (modal) modal.classList.add('active');
    }

    closeSavingsModal() {
        const modal = document.getElementById('modal-savings-goal');
        if (modal) modal.classList.remove('active');
    }

    handleSavingsGoalSubmit() {
        const title = document.getElementById('savings-title').value;
        const target = Number(document.getElementById('savings-target').value);
        const current = Number(document.getElementById('savings-current').value || 0);
        const targetDate = document.getElementById('savings-date').value;

        if (title && target > 0) {
            store.addSavingsGoal({
                title,
                targetAmount: target,
                currentAmount: current,
                targetDate
            });
            this.closeSavingsModal();
            document.getElementById('form-savings-goal').reset();
            this.renderSavingsGoals();
            if (window.appController) window.appController.showToast('🎯 สร้างเป้าหมายการออมเงินใหม่สำเร็จ!');
        }
    }

    render() {
        this.renderStats();
        this.renderTable();
        this.renderSavingsGoals();
        chartRenderController.initFinanceCategoryChart();
    }

    renderStats() {
        const financeList = store.getFinance();

        const totalIncome = financeList.filter(x => x.type === 'income').reduce((sum, x) => sum + Number(x.amount), 0);
        const totalExpense = financeList.filter(x => x.type === 'expense').reduce((sum, x) => sum + Number(x.amount), 0);
        const netBalance = totalIncome - totalExpense;

        const incElem = document.getElementById('fin-total-income');
        const expElem = document.getElementById('fin-total-expense');
        const balElem = document.getElementById('fin-net-balance');

        if (incElem) incElem.textContent = `฿${formatMoney(totalIncome)}`;
        if (expElem) expElem.textContent = `฿${formatMoney(totalExpense)}`;
        if (balElem) balElem.textContent = `฿${formatMoney(netBalance)}`;

        // Also update Dashboard Cards
        const dashBal = document.getElementById('dash-net-balance');
        const dashInc = document.getElementById('dash-month-income');
        const dashExp = document.getElementById('dash-month-expense');

        if (dashBal) dashBal.textContent = `฿${formatMoney(netBalance)}`;
        if (dashInc) dashInc.textContent = `+฿${formatMoney(totalIncome)} รายรับรวม`;
        if (dashExp) dashExp.textContent = `-฿${formatMoney(totalExpense)} รายจ่ายรวม`;
    }

    renderSavingsGoals() {
        const container = document.getElementById('savings-goals-container');
        const dashSavingsVal = document.getElementById('dash-total-savings');
        const dashSavingsProg = document.getElementById('dash-savings-progress');

        if (!container) return;

        const goals = store.getSavings();
        const totalSaved = goals.reduce((sum, g) => sum + Number(g.currentAmount || 0), 0);

        if (dashSavingsVal) dashSavingsVal.textContent = `฿${formatMoney(totalSaved)}`;
        if (dashSavingsProg) dashSavingsProg.textContent = `🎯 ${goals.length} เป้าหมายกำลังสะสม`;

        if (goals.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <p>ยังไม่มีเป้าหมายการออมเงิน กดปุ่มด้านบนเพื่อสร้างเป้าหมายแรกของคุณได้เลย!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = goals.map(goal => {
            const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
            return `
                <div class="savings-card">
                    <div class="savings-card-header">
                        <span class="savings-card-title">🎯 ${escapeHTML(goal.title)}</span>
                        <button class="btn-text-danger" onclick="financeController.deleteSavingsGoal('${goal.id}')" title="ลบเป้าหมาย" style="font-size: 0.75rem;">🗑️</button>
                    </div>
                    <div class="savings-amount-text">
                        ฿${formatMoney(goal.currentAmount)} <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 400;">/ ฿${formatMoney(goal.targetAmount)}</span>
                    </div>
                    <div class="savings-progress-bar">
                        <div class="savings-progress-fill" style="width: ${percent}%;"></div>
                    </div>
                    <div class="savings-card-footer">
                        <span>ความคืบหน้า ${percent}%</span>
                        <button class="btn-deposit-savings" onclick="financeController.depositSavings('${goal.id}')">+ ออมเพิ่ม</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    depositSavings(id) {
        const amountStr = prompt('ใส่จำนวนเงินที่ต้องการออมเพิ่ม (บาท):', '500');
        if (amountStr) {
            const amount = Number(amountStr);
            if (amount > 0) {
                store.depositSavings(id, amount);
                this.renderSavingsGoals();
                if (window.appController) window.appController.showToast(`🎉 ออมเงินสำเร็จ +฿${formatMoney(amount)}!`);
            }
        }
    }

    deleteSavingsGoal(id) {
        if (confirm('คุณต้องการลบเป้าหมายการออมนี้ใช่หรือไม่?')) {
            store.deleteSavingsGoal(id);
            this.renderSavingsGoals();
        }
    }

    renderTable() {
        const tbody = document.getElementById('finance-table-body');
        const dashRecent = document.getElementById('dashboard-recent-finance');
        if (!tbody) return;

        let items = store.getFinance();

        // Apply type filter
        if (this.currentFilter === 'income') {
            items = items.filter(x => x.type === 'income');
        } else if (this.currentFilter === 'expense') {
            items = items.filter(x => x.type === 'expense');
        }

        // Apply search query
        if (this.searchQuery) {
            items = items.filter(x => 
                (x.title && x.title.toLowerCase().includes(this.searchQuery)) ||
                (x.category && x.category.toLowerCase().includes(this.searchQuery)) ||
                (x.note && x.note.toLowerCase().includes(this.searchQuery))
            );
        }

        if (items.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted" style="padding: 24px;">
                        ไม่มีรายการทางการเงินที่ตรงตามเงื่อนไข
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = items.map(item => {
                const isIncome = item.type === 'income';
                const typeBadge = isIncome ? 
                    `<span class="badge-tag" style="background: rgba(52,211,153,0.15); color: var(--accent-emerald);">💰 รายรับ</span>` :
                    `<span class="badge-tag" style="background: rgba(239,68,68,0.15); color: var(--accent-rose);">💸 รายจ่าย</span>`;

                const slipBtn = item.slipUrl ? 
                    `<br><button class="btn-view-slip" onclick="appController.viewSlip('${item.slipUrl}')">🧾 ดูสลิปโอนเงิน</button>` : '';

                return `
                    <tr>
                        <td>${item.date}</td>
                        <td>${typeBadge}</td>
                        <td>${escapeHTML(item.category || 'ทั่วไป')}</td>
                        <td>
                            <b>${escapeHTML(item.title)}</b>
                            ${item.note ? `<br><small class="text-muted">${escapeHTML(item.note)}</small>` : ''}
                            ${slipBtn}
                        </td>
                        <td class="${isIncome ? 'text-success' : 'text-danger'}" style="font-weight: 700;">
                            ${isIncome ? '+' : '-'}฿${formatMoney(item.amount)}
                        </td>
                        <td>
                            <button class="btn-text-danger" onclick="financeController.deleteItem('${item.id}')">🗑️ ลบ</button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        // Also render Dashboard Recent Finance Items with Slip Button
        if (dashRecent) {
            const recent = store.getFinance().slice(0, 5);
            if (recent.length === 0) {
                dashRecent.innerHTML = `<p class="empty-state">ยังไม่มีรายการบันทึก</p>`;
            } else {
                dashRecent.innerHTML = recent.map(x => {
                    const isIncome = x.type === 'income';
                    const slipBtn = x.slipUrl ? `<br><button class="btn-view-slip" onclick="appController.viewSlip('${x.slipUrl}')">🧾 ดูสลิป</button>` : '';

                    return `
                        <div class="recent-item">
                            <div class="recent-info">
                                <span class="recent-title">${escapeHTML(x.title)}</span>
                                <span class="recent-meta">${x.date} • ${x.category || 'ทั่วไป'} ${slipBtn}</span>
                            </div>
                            <span class="recent-amount ${isIncome ? 'text-success' : 'text-danger'}">
                                ${isIncome ? '+' : '-'}฿${formatMoney(x.amount)}
                            </span>
                        </div>
                    `;
                }).join('');
            }
        }
    }

    deleteItem(id) {
        if (confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) {
            store.deleteFinanceItem(id);
            if (window.appController) window.appController.showToast('🗑️ ลบรายการสำเร็จ');
        }
    }
}

const financeController = window.financeController = new FinanceController();

