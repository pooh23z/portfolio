/* ==========================================================================
   Life & Business Hub - Tasks Controller (Ultra-Bright High-Contrast UI)
   ========================================================================== */

class TasksController {
    constructor() {
        this.currentFilter = 'all';
    }

    init() {
        this.renderTasks();
        this.bindEvents();

        store.subscribe(type => {
            if (type === 'tasks' || type === 'all') {
                this.renderTasks();
            }
        });
    }

    bindEvents() {
        const btnAddTask = document.getElementById('btn-add-task');
        if (btnAddTask) {
            btnAddTask.addEventListener('click', () => {
                if (window.appController) {
                    window.appController.openModal('task');
                }
            });
        }

        const filterBtns = document.querySelectorAll('[data-task-filter]');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.getAttribute('data-task-filter');
                this.renderTasks();
            });
        });
    }

    renderTasks() {
        const wrapper = document.getElementById('tasks-list-wrapper');
        const dashContainer = document.getElementById('dashboard-recent-tasks');
        const taskBadge = document.getElementById('task-badge-count');

        if (!wrapper) return;

        let allTasks = store.getTasks();

        // Update badge count with pending items
        const pendingCount = allTasks.filter(t => t.status !== 'completed').length;
        if (taskBadge) taskBadge.textContent = pendingCount;

        // Apply filter
        let filteredTasks = [...allTasks];
        if (this.currentFilter === 'pending') {
            filteredTasks = filteredTasks.filter(t => t.status !== 'completed');
        } else if (this.currentFilter === 'urgent') {
            filteredTasks = filteredTasks.filter(t => t.priority === 'high' && t.status !== 'completed');
        } else if (this.currentFilter === 'teams') {
            filteredTasks = filteredTasks.filter(t => t.source === 'teams' || t.source === 'email');
        } else if (this.currentFilter === 'completed') {
            filteredTasks = filteredTasks.filter(t => t.status === 'completed');
        }

        if (filteredTasks.length === 0) {
            wrapper.innerHTML = `
                <div class="glass-card text-center" style="padding: 36px; color: var(--text-secondary);">
                    <p style="font-size: 1rem; margin-bottom: 8px; color: #94a3b8;">📭 ยังไม่มีรายการงานค้างในหมวดนี้</p>
                    <p style="font-size: 0.85rem; color: #64748b;">กดปุ่ม "+ เพิ่มงานค้างใหม่" ด้านบนเพื่อเริ่มบันทึกงานของคุณ</p>
                </div>
            `;
        } else {
            wrapper.innerHTML = filteredTasks.map(task => {
                const isDone = task.status === 'completed';
                const priorityClass = task.priority === 'high' ? 'priority-high' : (task.priority === 'medium' ? 'priority-medium' : 'priority-low');
                const priorityLabel = task.priority === 'high' ? '⚠️ ด่วนมาก' : (task.priority === 'medium' ? 'ปานกลาง' : 'ทั่วไป');

                const checkboxStyle = isDone ? 'background: #34d399; border-color: #34d399;' : 'background: transparent; border: 2px solid rgba(255,255,255,0.4);';
                const checkmark = isDone ? '✓' : '';
                const titleStyle = isDone ? 'font-size: 1.15rem; font-weight: 700; color: #94a3b8 !important; margin-bottom: 6px; text-decoration: line-through !important;' : 'font-size: 1.15rem; font-weight: 700; color: #ffffff !important; margin-bottom: 6px;';
                const statusBadge = isDone
                    ? `<span class="badge-tag" style="background: rgba(52,211,153,0.25); color: #ffffff; border: 1px solid rgba(52,211,153,0.6); font-weight: 700;">✅ ส่งเรียบร้อยแล้ว (${task.completedDate || 'วันนี้'})</span>`
                    : `<span class="badge-tag" style="background: rgba(251,191,36,0.2); color: #fbbf24; border: 1px solid rgba(251,191,36,0.5); font-weight: 700;">⏳ รอดำเนินการ</span>`;

                return `
                    <div class="task-card-bright" style="display: flex; align-items: center; justify-content: space-between; padding: 18px 24px; background: rgba(30, 41, 59, 0.95); border: 1px solid rgba(52, 211, 153, 0.4); border-radius: 14px; margin-bottom: 14px;">
                        <div style="display: flex; align-items: center; gap: 16px;">
                            <div class="checkbox-custom" onclick="tasksController.toggleComplete('${task.id}')" style="${checkboxStyle} cursor: pointer;">
                                ${checkmark}
                            </div>
                            <div>
                                <div style="${titleStyle}">
                                    ${escapeHTML(task.title)}
                                </div>
                                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                                    <span class="badge-tag ${priorityClass}">${priorityLabel}</span>
                                    ${statusBadge}
                                    ${task.source === 'teams' ? '<span class="badge-tag tag-teams" style="background: #7c3aed; color: #ffffff; font-weight: 700;">MS Teams</span>' : ''}
                                    ${task.source === 'email' ? '<span class="badge-tag tag-teams" style="background: #d97706; color: #ffffff; font-weight: 700;">Outlook</span>' : ''}
                                    <span style="font-size: 0.8rem; color: #cbd5e1;">กำหนด: ${task.dueDate || 'ไม่ระบุ'}</span>
                                </div>
                                ${task.note ? `<div style="font-size: 0.84rem; color: #e2e8f0; margin-top: 6px; font-weight: 500;">📝 ${escapeHTML(task.note)}</div>` : ''}
                            </div>
                        </div>
                        <button class="btn-text-danger" onclick="tasksController.deleteTask('${task.id}')" style="font-size: 0.85rem; padding: 6px 12px; background: rgba(239,68,68,0.15); border-radius: 8px; color: #fca5a5;">🗑️ ลบ</button>
                    </div>
                `;
            }).join('');
        }

        // Render Dashboard Recent Pending Tasks
        if (dashContainer) {
            const pendingTasks = allTasks.filter(t => t.status !== 'completed').slice(0, 4);
            if (pendingTasks.length === 0) {
                dashContainer.innerHTML = `<p style="font-size: 0.85rem; color: var(--accent-emerald); padding: 8px;">🎉 ไม่มีงานค้างวันนี้ พักผ่อนได้เต็มที่ค่ะ!</p>`;
            } else {
                dashContainer.innerHTML = pendingTasks.map(t => `
                    <div class="recent-item">
                        <div class="recent-info">
                            <span class="recent-title">${escapeHTML(t.title)}</span>
                            <span class="recent-meta">กำหนด: ${t.dueDate}</span>
                        </div>
                        <button class="btn-convert-task" onclick="tasksController.toggleComplete('${t.id}')">✓ เสร็จงาน</button>
                    </div>
                `).join('');
            }
        }
    }

    toggleComplete(taskId) {
        store.toggleTaskStatus(taskId);
        if (window.appController) {
            window.appController.showToast('✅ อัปเดตสถานะงานเรียบร้อยแล้ว!');
        }
    }

    deleteTask(taskId) {
        store.deleteTask(taskId);
        if (window.appController) window.appController.showToast('🗑️ ลบรายการเรียบร้อยแล้ว');
    }
}

const tasksController = window.tasksController = new TasksController();

