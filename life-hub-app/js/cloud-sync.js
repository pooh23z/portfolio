/* ==========================================================================
   Life & Business Hub - Cloud Sync Engine (Firebase Realtime Database)
   ========================================================================== */

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBSkklb88s7Mf5NX3EGSNbcsuElTLl-w4k",
  authDomain: "lifehub-7420d.firebaseapp.com",
  databaseURL: "https://lifehub-7420d-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "lifehub-7420d",
  storageBucket: "lifehub-7420d.firebasestorage.app",
  messagingSenderId: "127099886380",
  appId: "1:127099886380:web:021f969918d238fd80aa89",
  measurementId: "G-YMRSLZV7FF"
};

class CloudSyncEngine {
    constructor() {
        // Get existing room code or generate a unique random room code for fresh installations
        let savedRoomCode = localStorage.getItem('lifehub_sync_room_code');
        if (!savedRoomCode) {
            savedRoomCode = this.generateRoomCode();
            localStorage.setItem('lifehub_sync_room_code', savedRoomCode);
        }
        this.roomCode = savedRoomCode;
        this.firebaseConfig = DEFAULT_FIREBASE_CONFIG;
        this.db = null;
        this.roomRef = null;
        this.isSyncing = false;
        this.connected = false;
        this._pendingPush = false;
        this._debounceTimer = null;
        // Unique ID for this browser tab/session — used to recognize and ignore
        // the echo of our own writes coming back through the realtime listener
        // (this was the cause of the "sync complete" toast reappearing over and
        // over and never going away).
        this.clientId = 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

        this.init();
    }

    init() {
        this.loadSavedConfig();
        this.bindUIEvents();
    }

    loadSavedConfig() {
        const savedConfig = localStorage.getItem('lifehub_firebase_config');
        if (savedConfig) {
            try {
                this.firebaseConfig = JSON.parse(savedConfig);
            } catch (e) {
                console.warn('Invalid saved firebase config', e);
            }
        }
        this.initFirebase();
    }

    initFirebase() {
        if (!this.firebaseConfig || typeof firebase === 'undefined') return;

        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(this.firebaseConfig);
            }
            this.db = firebase.database();
            this.connected = true;
            this.updateBadgeUI();

            // Auto connect to room code (default POOH2026) for instant Mac <-> Mobile sync
            if (this.roomCode) {
                this.listenToRoom(this.roomCode);
            }

            // If a local change happened before Firebase finished connecting,
            // it was queued instead of silently dropped — push it now.
            if (this._pendingPush) {
                this._pendingPush = false;
                this.pushDataToCloud();
            }
        } catch (e) {
            console.error('Firebase init error:', e);
            this.connected = false;
            this.updateBadgeUI();
        }
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
        if (!this.db) {
            alert('กรุณาใส่ Firebase Config ก่อนสร้างห้องครับ');
            return;
        }

        const code = this.generateRoomCode();
        this.roomCode = code;
        localStorage.setItem('lifehub_sync_room_code', code);

        const dataStr = store.exportAllData();
        const dataObj = JSON.parse(dataStr);
        dataObj.updatedAt = Date.now();
        dataObj.updatedBy = this.clientId;

        this.db.ref('rooms/' + code).set(dataObj).then(() => {
            this.listenToRoom(code);
            this.updateModalUI();
            if (window.appController) {
                window.appController.showToast(`🏠 สร้างห้อง Sync รหัส ${code} สำเร็จแล้ว!`);
            }
        }).catch(err => {
            alert('เกิดข้อผิดพลาดในการสร้างห้อง: ' + err.message);
        });
    }

    joinRoom(code) {
        if (!this.db) {
            alert('กรุณาใส่ Firebase Config ก่อนเข้าร่วมห้องครับ');
            return;
        }

        const cleanCode = code.toUpperCase().trim();
        if (cleanCode.length !== 6) {
            alert('กรุณาใส่รหัสห้อง 6 หลักให้ถูกต้อง');
            return;
        }

        this.db.ref('rooms/' + cleanCode).once('value').then(snapshot => {
            if (snapshot.exists()) {
                this.roomCode = cleanCode;
                localStorage.setItem('lifehub_sync_room_code', cleanCode);

                const data = snapshot.val();
                store.importAllData(JSON.stringify(data));

                this.listenToRoom(cleanCode);
                this.updateModalUI();

                if (window.appController) {
                    window.appController.showToast(`🔗 เข้าร่วมห้อง Sync รหัส ${cleanCode} สำเร็จ!`);
                }
            } else {
                alert('ไม่พบห้อง Sync รหัสนี้ กรุณาตรวจสอบรหัสบนอุปกรณ์อีกเครื่อง');
            }
        }).catch(err => {
            alert('เกิดข้อผิดพลาดในการเข้าร่วมห้อง: ' + err.message);
        });
    }

    listenToRoom(code) {
        if (!this.db) return;

        if (this.roomRef) {
            this.roomRef.off();
        }

        this.roomRef = this.db.ref('rooms/' + code);
        this.roomRef.on('value', snapshot => {
            if (this.isSyncing) return; // Prevent loop

            if (snapshot.exists()) {
                const remoteData = snapshot.val();
                if (!remoteData) return;

                // This is our own write bouncing back through the realtime listener,
                // not a genuine update from another device — ignore it silently.
                if (remoteData.updatedBy === this.clientId) return;

                const remoteUpdated = Number(remoteData.updatedAt || 0);
                const localUpdated = Number(localStorage.getItem('lifehub_last_sync_time') || 0);

                // If remote has data and (remote is newer OR local is uninitialized), import remote
                if (remoteUpdated >= localUpdated || localUpdated === 0) {
                    this.isSyncing = true;
                    store.importAllData(JSON.stringify(remoteData));
                    localStorage.setItem('lifehub_last_sync_time', remoteUpdated || Date.now());
                    this.isSyncing = false;

                    this.updateBadgeUI('synced');
                    if (window.appController) {
                        window.appController.showToast('📲 ซิงก์ข้อมูลคลาวด์เรียบร้อยแล้ว!');
                    }
                }
            } else {
                // Room doesn't exist on Cloud yet -> Upload local data immediately to seed the cloud room
                this.pushDataToCloud();
            }
        });

        this.updateBadgeUI('connected');
    }

    forceSyncCloud() {
        if (!this.db || !this.roomCode) {
            this.initFirebase();
        }
        if (this.db && this.roomCode) {
            this.db.ref('rooms/' + this.roomCode).once('value').then(snapshot => {
                if (snapshot.exists()) {
                    const remoteData = snapshot.val();
                    store.importAllData(JSON.stringify(remoteData));
                    if (window.appController) {
                        window.appController.showToast('✅ ซิงก์ดึงข้อมูลล่าสุดจากคลาวด์เรียบร้อยแล้ว!');
                    }
                } else {
                    this.pushDataToCloud();
                    if (window.appController) {
                        window.appController.showToast('☁️ อัปโหลดข้อมูลขึ้นคลาวด์เรียบร้อยแล้ว!');
                    }
                }
            }).catch(err => {
                console.error('Force sync error:', err);
                this.pushDataToCloud();
            });
        }
    }

    pushDataToCloud() {
        if (!this.db || !this.roomCode) {
            // Not connected yet — remember to push as soon as we are, instead
            // of silently dropping this change (this was the root cause of
            // fresh local edits getting overwritten by stale cloud data after
            // a page refresh).
            this._pendingPush = true;
            return;
        }

        const dataStr = store.exportAllData();
        const dataObj = JSON.parse(dataStr);
        const now = Date.now();
        dataObj.updatedAt = now;
        dataObj.updatedBy = this.clientId;

        this.isSyncing = true;

        this.db.ref('rooms/' + this.roomCode).set(dataObj).then(() => {
            // Only mark as "synced" now that the cloud write is CONFIRMED —
            // marking it earlier meant a failed/delayed write could look
            // "already synced" and let a refresh pull back the old cloud
            // copy over the newer local one.
            localStorage.setItem('lifehub_last_sync_time', now);
            this.isSyncing = false;
            this.updateBadgeUI('synced');
        }).catch(err => {
            this.isSyncing = false;
            console.error('Cloud Sync push failed', err);
            this._pendingPush = true;
        });
    }

    onDataChanged() {
        // Coalesce rapid-fire changes (e.g. typing an amount, then saving,
        // then the UI re-rendering) into a single upload instead of firing a
        // full-dataset push on every tiny change — this is what made syncing
        // feel slow/"ไม่ทัน" as the data grew. We also flip the badge to
        // "syncing" immediately so the user gets visual feedback to wait a
        // moment before refreshing or switching devices.
        this.updateBadgeUI('syncing');
        clearTimeout(this._debounceTimer);
        this._debounceTimer = setTimeout(() => {
            this.pushDataToCloud();
        }, 600);
    }

    disconnectRoom() {
        if (this.roomRef) this.roomRef.off();
        this.roomCode = '';
        localStorage.removeItem('lifehub_sync_room_code');
        this.updateBadgeUI('disconnected');
        this.updateModalUI();
    }

    saveFirebaseConfig(rawConfigText) {
        try {
            let jsonText = rawConfigText.trim();

            if (jsonText.startsWith('const') || jsonText.startsWith('var') || jsonText.startsWith('let')) {
                jsonText = jsonText.substring(jsonText.indexOf('{'), jsonText.lastIndexOf('}') + 1);
            }

            jsonText = jsonText
                .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
                .replace(/'/g, '"');

            const parsed = JSON.parse(jsonText);

            if (!parsed.apiKey || !parsed.databaseURL) {
                alert('Firebase Config ต้องมี apiKey และ databaseURL ครับ');
                return false;
            }

            this.firebaseConfig = parsed;
            localStorage.setItem('lifehub_firebase_config', JSON.stringify(parsed));
            this.initFirebase();
            this.updateModalUI();
            return true;
        } catch (e) {
            alert('รูปแบบ Firebase Config ไม่ถูกต้อง กรุณา copy จาก Firebase Console มาวาง');
            return false;
        }
    }

    updateBadgeUI(state) {
        const badge = document.getElementById('cloud-sync-status-badge');
        if (!badge) return;

        if (!this.connected) {
            badge.className = 'cloud-sync-badge offline';
            badge.innerHTML = '<span class="sync-dot sync-offline"></span> Offline';
        } else if (state === 'syncing') {
            badge.className = 'cloud-sync-badge online';
            badge.innerHTML = '<span class="sync-dot sync-online"></span> 🔄 กำลังบันทึกขึ้นคลาวด์...';
        } else if (this.roomCode) {
            badge.className = 'cloud-sync-badge online';
            badge.innerHTML = `<span class="sync-dot sync-online"></span> Syncing (${this.roomCode})`;
        } else {
            badge.className = 'cloud-sync-badge ready';
            badge.innerHTML = '<span class="sync-dot sync-ready"></span> Ready';
        }
    }

    updateModalUI() {
        const statusContainer = document.getElementById('sync-modal-status');
        const configSection = document.getElementById('firebase-config-section');
        const roomSection = document.getElementById('room-section');

        if (this.firebaseConfig && this.connected) {
            if (configSection) configSection.style.display = 'none';
            if (roomSection) roomSection.style.display = 'block';

            if (statusContainer) {
                if (this.roomCode) {
                    statusContainer.innerHTML = `
                        <div class="sync-status-connected">
                            <div class="sync-room-display">
                                <span class="sync-room-label">รหัสห้อง Sync ของคุณ</span>
                                <span class="sync-room-code">${this.roomCode}</span>
                                <button onclick="navigator.clipboard.writeText('${this.roomCode}'); alert('คัดลอกรหัสห้องแล้ว!');" class="btn-copy-code">📋 คัดลอกรหัส</button>
                            </div>
                            <p class="sync-status-text">🟢 ข้อมูลลิงก์กับอุปกรณ์อื่นแบบเรียลไทม์แล้ว</p>
                            <button id="btn-disconnect-room" class="btn-text-danger" style="margin-top: 10px;">❌ ออกจากห้องนี้</button>
                        </div>
                    `;
                    const btnDisc = document.getElementById('btn-disconnect-room');
                    if (btnDisc) btnDisc.addEventListener('click', () => this.disconnectRoom());
                } else {
                    statusContainer.innerHTML = `
                        <div class="sync-status-disconnected">
                            <p class="sync-guide-text">พร้อมใช้งาน Cloud Sync — สร้างห้องบนเครื่องนี้ หรือใส่รหัส 6 ตัวเพื่อเข้าร่วม</p>
                        </div>
                    `;
                }
            }
        } else {
            if (configSection) configSection.style.display = 'block';
            if (roomSection) roomSection.style.display = 'none';
        }
    }

    bindUIEvents() {
        const btnOpenSync = document.getElementById('btn-open-cloud-sync');
        const btnCloseSyncModal = document.getElementById('btn-close-sync-modal');
        const modalSync = document.getElementById('modal-cloud-sync');
        const btnSaveConfig = document.getElementById('btn-save-firebase-config');
        const btnCreateRoom = document.getElementById('btn-create-room');
        const btnJoinRoom = document.getElementById('btn-join-room');

        if (btnOpenSync) {
            btnOpenSync.addEventListener('click', () => {
                this.updateModalUI();
                if (modalSync) modalSync.classList.add('active');
            });
        }

        if (btnCloseSyncModal) {
            btnCloseSyncModal.addEventListener('click', () => {
                if (modalSync) modalSync.classList.remove('active');
            });
        }

        if (btnSaveConfig) {
            btnSaveConfig.addEventListener('click', () => {
                const configInput = document.getElementById('firebase-config-input');
                if (configInput && configInput.value.trim()) {
                    if (this.saveFirebaseConfig(configInput.value)) {
                        if (window.appController) window.appController.showToast('🔑 บันทึก Firebase Config สำเร็จ!');
                    }
                }
            });
        }

        if (btnCreateRoom) {
            btnCreateRoom.addEventListener('click', () => this.createRoom());
        }

        if (btnJoinRoom) {
            btnJoinRoom.addEventListener('click', () => {
                const joinInput = document.getElementById('join-room-code');
                if (joinInput && joinInput.value.trim()) {
                    this.joinRoom(joinInput.value.trim());
                }
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.cloudSync = new CloudSyncEngine();
});
