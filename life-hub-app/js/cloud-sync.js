/* ==========================================================================
   Life & Business Hub - Standalone Demo Cloud Sync Engine (Local Mock Sync)
   ========================================================================== */

class CloudSyncEngine {
    constructor() {
        let savedRoomCode = localStorage.getItem('lifehub_sync_room_code') || 'DEMO-88';
        this.roomCode = savedRoomCode;
        this.connected = true;
        this.clientId = 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        this.init();
    }

    init() {
        this.bindUIEvents();
        this.updateBadgeUI('synced');
    }

    bindUIEvents() {
        const btnSyncModal = document.getElementById('btn-sync-modal');
        const modalSync = document.getElementById('modal-cloud-sync');
        const btnCloseSync = document.getElementById('btn-close-sync-modal');

        if (btnSyncModal && modalSync) {
            btnSyncModal.addEventListener('click', () => {
                this.updateModalUI();
                modalSync.classList.add('active');
            });
        }

        if (btnCloseSync && modalSync) {
            btnCloseSync.addEventListener('click', () => {
                modalSync.classList.remove('active');
            });
        }

        const btnCreate = document.getElementById('btn-create-room');
        const btnJoin = document.getElementById('btn-join-room');
        const btnForceSync = document.getElementById('btn-force-sync');

        if (btnCreate) btnCreate.addEventListener('click', () => this.createRoom());
        if (btnJoin) {
            btnJoin.addEventListener('click', () => {
                const input = document.getElementById('join-room-input');
                if (input && input.value) this.joinRoom(input.value);
            });
        }
        if (btnForceSync) btnForceSync.addEventListener('click', () => this.forceSyncCloud());
    }

    generateRoomCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    createRoom() {
        const code = this.generateRoomCode();
        this.roomCode = code;
        localStorage.setItem('lifehub_sync_room_code', code);
        this.updateModalUI();
        if (window.appController) {
            window.appController.showToast(`🏠 [Demo] สร้างห้อง Sync รหัส ${code} เรียบร้อยแล้ว!`);
        }
    }

    joinRoom(code) {
        const cleanCode = code.toUpperCase().trim();
        if (cleanCode.length < 4) {
            alert('กรุณาระบุรหัสห้องจำลองที่ต้องการเชื่อมต่อ');
            return;
        }
        this.roomCode = cleanCode;
        localStorage.setItem('lifehub_sync_room_code', cleanCode);
        this.updateModalUI();
        if (window.appController) {
            window.appController.showToast(`🔗 [Demo] เชื่อมต่อห้อง Sync รหัส ${cleanCode} สำเร็จ!`);
        }
    }

    forceSyncCloud() {
        this.updateBadgeUI('syncing');
        setTimeout(() => {
            this.updateBadgeUI('synced');
            if (window.appController) {
                window.appController.showToast('📲 [Demo] จำลองการซิงก์ข้อมูลคลาวด์สำเร็จ!');
            }
        }, 500);
    }

    pushDataToCloud() {
        // Instant local mock push simulation
        this.updateBadgeUI('synced');
    }

    updateBadgeUI(state = 'synced') {
        const badge = document.getElementById('cloud-status-badge');
        const badgeText = document.getElementById('cloud-status-text');
        if (!badge) return;

        if (state === 'syncing') {
            badge.className = 'status-badge syncing';
            if (badgeText) badgeText.textContent = 'กำลังซิงก์...';
        } else {
            badge.className = 'status-badge online';
            if (badgeText) badgeText.textContent = `ห้อง: ${this.roomCode || 'DEMO-88'}`;
        }
    }

    updateModalUI() {
        const currentCodeEl = document.getElementById('current-room-code');
        if (currentCodeEl) {
            currentCodeEl.textContent = this.roomCode || 'DEMO-88';
        }
    }
}

window.CloudSyncEngine = CloudSyncEngine;
