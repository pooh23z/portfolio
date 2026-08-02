/* ==========================================================================
   Life & Business Hub - High-Contrast Donut & Line Chart System
   ========================================================================== */

class ChartRenderController {
    constructor() {
        this.overviewChart = null;
        this.categoryChart = null;
        this.shopChannelChart = null;
    }

    init() {
        // Initialized on tab switches
    }

    initMainOverviewChart() {
        const canvas = document.getElementById('mainOverviewChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (this.overviewChart) this.overviewChart.destroy();

        const financeList = store.getFinance();
        const businessList = store.getBusiness();

        // --- Build 4 REAL weekly buckets for the current month, using each
        // record's actual `date` field (no synthetic ratios / fake ramp) ---
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth(); // 0-indexed
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Week boundaries by day-of-month: 1-7, 8-14, 15-21, 22-end
        const weekRanges = [
            [1, 7],
            [8, 14],
            [15, 21],
            [22, daysInMonth]
        ];

        function bucketIndexForDate(dateStr) {
            if (!dateStr) return -1;
            const d = new Date(dateStr);
            if (isNaN(d)) return -1;
            if (d.getFullYear() !== year || d.getMonth() !== month) return -1;
            const day = d.getDate();
            for (let i = 0; i < weekRanges.length; i++) {
                if (day >= weekRanges[i][0] && day <= weekRanges[i][1]) return i;
            }
            return -1;
        }

        const incomeByWeek = [0, 0, 0, 0];
        const expenseByWeek = [0, 0, 0, 0];
        const salesByWeek = [0, 0, 0, 0];

        financeList.forEach(x => {
            const idx = bucketIndexForDate(x.date);
            if (idx === -1) return;
            if (x.type === 'income') incomeByWeek[idx] += Number(x.amount) || 0;
            else if (x.type === 'expense') expenseByWeek[idx] += Number(x.amount) || 0;
        });

        businessList.forEach(x => {
            const idx = bucketIndexForDate(x.date);
            if (idx === -1) return;
            if (x.type === 'sale') salesByWeek[idx] += Number(x.amount) || 0;
        });

        // Label the bucket containing today as "สัปดาห์ปัจจุบัน"
        const todayBucket = bucketIndexForDate(now.toISOString().split('T')[0]);
        const weekLabels = weekRanges.map((r, i) =>
            (i === todayBucket) ? 'สัปดาห์ปัจจุบัน' : `สัปดาห์ที่ ${i + 1} (${r[0]}-${r[1]})`
        );

        this.overviewChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: weekLabels,
                datasets: [
                    {
                        label: 'รายรับส่วนตัว (บาท)',
                        data: incomeByWeek,
                        backgroundColor: '#22c55e',
                        borderRadius: 6,
                        maxBarThickness: 28
                    },
                    {
                        label: 'รายจ่ายส่วนตัว (บาท)',
                        data: expenseByWeek,
                        backgroundColor: '#ef4444',
                        borderRadius: 6,
                        maxBarThickness: 28
                    },
                    {
                        label: 'ยอดขายร้านค้า (บาท)',
                        data: salesByWeek,
                        backgroundColor: '#06b6d4',
                        borderRadius: 6,
                        maxBarThickness: 28
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        titleColor: '#fff',
                        bodyColor: '#38bdf8',
                        borderColor: 'rgba(56, 189, 248, 0.3)',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#94a3b8', font: { family: 'Prompt' } }
                    },
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#94a3b8', font: { family: 'Prompt' } }
                    }
                }
            }
        });
    }

    initFinanceCategoryChart() {
        const canvas = document.getElementById('financeCategoryChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (this.categoryChart) this.categoryChart.destroy();

        const financeList = store.getFinance().filter(x => x.type === 'expense');

        // Aggregation by category
        const catMap = {};
        financeList.forEach(item => {
            const cat = item.category || 'อื่นๆ';
            catMap[cat] = (catMap[cat] || 0) + Number(item.amount);
        });

        const labels = Object.keys(catMap);
        const dataValues = Object.values(catMap);

        // Curated Ultra High-Contrast Modern Palette for Dark Theme
        const bgColors = [
            '#fb7185', // Rose
            '#38bdf8', // Cyan
            '#fbbf24', // Amber
            '#a855f7', // Purple
            '#34d399', // Emerald
            '#f472b6', // Pink
            '#60a5fa'  // Blue
        ];

        this.categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels.length > 0 ? labels : ['ไม่มีข้อมูล'],
                datasets: [{
                    data: dataValues.length > 0 ? dataValues : [1],
                    backgroundColor: labels.length > 0 ? bgColors.slice(0, labels.length) : ['#334155'],
                    borderWidth: 2,
                    borderColor: '#0f172a'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: '#f8fafc', font: { family: 'Prompt', size: 12 }, padding: 14 }
                    }
                },
                cutout: '70%'
            }
        });
    }

    initShopChannelChart(customItems = null) {
        const canvas = document.getElementById('shopChannelChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (this.shopChannelChart) this.shopChannelChart.destroy();

        const businessList = (customItems || store.getBusiness()).filter(x => x.type === 'sale');

        // Aggregate by Product Title (clean item name)
        const itemMap = {};
        businessList.forEach(item => {
            let title = (item.title || 'หน้าร้าน').split(' (')[0].replace('ยอดขาย: ', '').trim();
            itemMap[title] = (itemMap[title] || 0) + Number(item.amount);
        });

        // Sort items by highest sales revenue
        const sortedItems = Object.keys(itemMap)
            .map(key => ({ name: key, total: itemMap[key] }))
            .sort((a, b) => b.total - a.total);

        // Take Top 5 best sellers and group remaining into 'อื่นๆ'
        let labels = [];
        let dataValues = [];

        if (sortedItems.length > 5) {
            const top5 = sortedItems.slice(0, 5);
            const otherSum = sortedItems.slice(5).reduce((s, x) => s + x.total, 0);
            labels = top5.map(x => x.name);
            dataValues = top5.map(x => x.total);
            if (otherSum > 0) {
                labels.push('อื่นๆ');
                dataValues.push(otherSum);
            }
        } else {
            labels = sortedItems.map(x => x.name);
            dataValues = sortedItems.map(x => x.total);
        }

        const bgColors = [
            '#fb7185', // Rose (หมูสามชั้น)
            '#fbbf24', // Amber (มันฝรั่ง)
            '#34d399', // Emerald (เห็ดเข็มทอง)
            '#38bdf8', // Cyan (ปลาดอลลี่)
            '#a855f7', // Purple (เต้าหู้ชีส)
            '#64748b'  // Slate (อื่นๆ)
        ];

        this.shopChannelChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels.length > 0 ? labels : ['หน้าร้าน'],
                datasets: [{
                    data: dataValues.length > 0 ? dataValues : [1],
                    backgroundColor: labels.length > 0 ? bgColors.slice(0, labels.length) : ['#34d399'],
                    borderWidth: 2,
                    borderColor: '#0f172a'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#cbd5e1', font: { family: 'Prompt', size: 11 }, padding: 10 }
                    }
                }
            }
        });
    }
}

const chartRenderController = window.chartRenderController = new ChartRenderController();

