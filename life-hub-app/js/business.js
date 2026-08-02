/* ==========================================================================
   Life & Business Hub - Shop / Business Revenue Controller (พร้อมตัวกรองเลือกดูรายวัน)
   ========================================================================== */

class BusinessController {
    constructor() {
        this.searchQuery = '';
        this.dateFilter = 'all'; // 'all', 'today', 'yesterday', '7days', 'this-month', 'custom'
        this.startDate = '';
        this.endDate = '';
    }

    init() {
        this.render();
        this.bindEvents();

        store.subscribe(type => {
            if (type === 'business' || type === 'all') {
                this.render();
            }
        });
    }

    bindEvents() {
        const btnAddSale = document.getElementById('btn-add-shop-sale');
        const btnAddCost = document.getElementById('btn-add-shop-cost');
        const searchInput = document.getElementById('search-business');
        const btnRefreshSheets = document.getElementById('btn-refresh-google-sheets');

        if (btnAddSale) btnAddSale.addEventListener('click', () => appController.openModal('shop-sale'));
        if (btnAddCost) btnAddCost.addEventListener('click', () => appController.openModal('shop-cost'));

        if (btnRefreshSheets) {
            btnRefreshSheets.addEventListener('click', () => {
                store.refreshGoogleSheetsData();
                if (window.appController) window.appController.showToast('🔄 ดึงข้อมูลจาก Google Sheets เรียบร้อยแล้ว!');
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase().trim();
                this.renderTable();
            });
        }

        const dateBtns = document.querySelectorAll('[data-shop-date]');
        dateBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                dateBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.dateFilter = btn.getAttribute('data-shop-date');
                this.render();
            });
        });

        const startDateInput = document.getElementById('shop-date-start');
        const endDateInput = document.getElementById('shop-date-end');

        if (startDateInput) {
            startDateInput.addEventListener('change', (e) => {
                this.startDate = e.target.value;
                this.dateFilter = 'custom';
                dateBtns.forEach(b => b.classList.remove('active'));
                this.render();
            });
        }

        if (endDateInput) {
            endDateInput.addEventListener('change', (e) => {
                this.endDate = e.target.value;
                this.dateFilter = 'custom';
                dateBtns.forEach(b => b.classList.remove('active'));
                this.render();
            });
        }
    }

    getFilteredBusinessItems() {
        let items = store.getBusiness();
        const todayStr = new Date().toISOString().split('T')[0];
        const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        if (this.dateFilter === 'today') {
            items = items.filter(x => x.date === todayStr);
        } else if (this.dateFilter === 'yesterday') {
            items = items.filter(x => x.date === yesterdayStr);
        } else if (this.dateFilter === '7days') {
            const sevenDaysAgoStr = new Date(Date.now() - (86400000 * 7)).toISOString().split('T')[0];
            items = items.filter(x => x.date >= sevenDaysAgoStr);
        } else if (this.dateFilter === 'this-month') {
            const currentMonthPrefix = todayStr.substring(0, 7); // e.g. "2026-08"
            items = items.filter(x => x.date && x.date.startsWith(currentMonthPrefix));
        } else if (this.dateFilter === 'custom') {
            if (this.startDate) {
                items = items.filter(x => x.date >= this.startDate);
            }
            if (this.endDate) {
                items = items.filter(x => x.date <= this.endDate);
            }
        }

        return items;
    }

    render() {
        this.renderMetrics();
        this.renderTable();
        chartRenderController.initShopChannelChart(this.getFilteredBusinessItems());
    }

    renderMetrics() {
        const filteredList = this.getFilteredBusinessItems();

        const totalSales = filteredList.filter(x => x.type === 'sale').reduce((sum, x) => sum + Number(x.amount), 0);
        const totalCosts = filteredList.filter(x => x.type === 'cost').reduce((sum, x) => sum + Number(x.amount), 0);
        const netProfit = totalSales - totalCosts;

        const margin = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : 0;

        const salesElem = document.getElementById('shop-total-sales');
        const costElem = document.getElementById('shop-total-cost');
        const profitElem = document.getElementById('shop-net-profit');
        const marginElem = document.getElementById('shop-margin-percent');

        if (salesElem) salesElem.textContent = `฿${formatMoney(totalSales)}`;
        if (costElem) costElem.textContent = `฿${formatMoney(totalCosts)}`;
        if (profitElem) profitElem.textContent = `฿${formatMoney(netProfit)}`;
        if (marginElem) marginElem.textContent = `${margin}%`;

        // Update Dashboard Summary Card
        const dashProfit = document.getElementById('dash-shop-profit');
        const dashSales = document.getElementById('dash-shop-sales');
        const dashMargin = document.getElementById('dash-shop-margin');

        if (dashProfit) dashProfit.textContent = `฿${formatMoney(netProfit)}`;
        if (dashSales) dashSales.textContent = `ยอดขาย: ฿${formatMoney(totalSales)}`;
        if (dashMargin) dashMargin.textContent = `Margin ${margin}%`;
    }

    renderTable() {
        const tbody = document.getElementById('business-table-body');
        if (!tbody) return;

        let items = this.getFilteredBusinessItems();

        if (this.searchQuery) {
            items = items.filter(x => 
                (x.title && x.title.toLowerCase().includes(this.searchQuery)) ||
                (x.channel && x.channel.toLowerCase().includes(this.searchQuery)) ||
                (x.note && x.note.toLowerCase().includes(this.searchQuery))
            );
        }

        if (items.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted" style="padding: 24px;">
                        ไม่มีรายการยอดขาย/ต้นทุนในวันที่เลือก
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = items.map(item => {
                const isSale = item.type === 'sale';
                const badge = isSale ?
                    `<span class="badge-tag" style="background: rgba(52,211,153,0.15); color: var(--accent-emerald);">🏪 ยอดขาย</span>` :
                    `<span class="badge-tag" style="background: rgba(239,68,68,0.15); color: var(--accent-rose);">📦 ต้นทุน/ค่าใช้จ่าย</span>`;

                const slipBtn = item.slipUrl ? 
                    `<br><button class="btn-view-slip" onclick="appController.viewSlip('${item.slipUrl}')">🧾 ดูสลิปค่าใช้จ่าย</button>` : '';

                return `
                    <tr>
                        <td>${item.date}</td>
                        <td>${badge}</td>
                        <td>${escapeHTML(item.channel || 'หน้าร้าน')}</td>
                        <td>
                            <b>${escapeHTML(item.title)}</b>
                            ${item.note ? `<br><small class="text-muted">${escapeHTML(item.note)}</small>` : ''}
                            ${slipBtn}
                        </td>
                        <td class="${isSale ? 'text-emerald' : 'text-danger'}" style="font-weight: 700;">
                            ${isSale ? '+' : '-'}฿${formatMoney(item.amount)}
                        </td>
                        <td>
                            <button class="btn-text-danger" onclick="businessController.deleteItem('${item.id}')">🗑️ ลบ</button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }

    deleteItem(id) {
        if (confirm('คุณต้องการลบรายการร้านค้านี้ใช่หรือไม่?')) {
            store.deleteBusinessItem(id);
            if (window.appController) window.appController.showToast('🗑️ ลบรายการร้านค้าสำเร็จ');
        }
    }
}

const businessController = window.businessController = new BusinessController();

