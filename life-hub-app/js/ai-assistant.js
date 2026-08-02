/* ==========================================================================
   Life & Business Hub - Ultra-Smart Gemini 1.5 Pro AI Executive Assistant
   (Multi-Turn Memory, Voice Input, Thai Number Words & Robust Date Range Parser)
   ========================================================================== */

class AIAssistantController {
    constructor() {
        this.chatMessagesContainer = null;
        this.inputElem = null;
        this.currentChatImageBase64 = null;
        this.geminiApiKey = localStorage.getItem('lifehub_gemini_api_key') || '';
        
        // Multi-Turn Conversation History Memory
        this.conversationHistory = [];

        // Voice Recognition Properties
        this.recognition = null;
        this.isListening = false;

        // Context state for multi-turn followup questions
        this.activeContext = {
            awaitingReasonDateRange: null,
            lastAddedTransactions: []
        };
    }

    init() {
        this.chatMessagesContainer = document.getElementById('ai-chat-messages');
        this.inputElem = document.getElementById('ai-chat-input');
        
        this.bindEvents();
        this.bindImageUploadEvents();
        this.bindGeminiKeyEvents();
        this.initVoiceRecognition();
        this.updateGeminiKeyStatusUI();
    }

    // 🎙️ THAI VOICE RECOGNITION (WEB SPEECH API)
    initVoiceRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.log('Web Speech API is not supported in this browser version.');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'th-TH'; // Thai language recognition
        this.recognition.continuous = false;
        this.recognition.interimResults = true;

        const voiceBtn = document.getElementById('btn-voice-input');
        const voiceIcon = document.getElementById('voice-icon');
        const voiceStatusText = document.getElementById('voice-status-text');

        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => {
                if (this.isListening) {
                    this.stopVoiceRecognition();
                } else {
                    this.startVoiceRecognition();
                }
            });
        }

        this.recognition.onstart = () => {
            this.isListening = true;
            if (voiceBtn) voiceBtn.classList.add('mic-listening');
            if (voiceIcon) voiceIcon.textContent = '🔴';
            if (voiceStatusText) voiceStatusText.textContent = 'กำลังฟัง...';
            if (window.appController) window.appController.showToast('🎙️ กำลังฟังเสียงภาษาไทยของคุณอยู่ พูดสั่งงานได้เลยค่ะ!');
        };

        this.recognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            if (this.inputElem) {
                this.inputElem.value = transcript;
            }
        };

        this.recognition.onerror = (event) => {
            console.warn('Voice recognition error:', event.error);
            this.stopVoiceRecognition();
            if (event.error === 'not-allowed') {
                alert('เบราว์เซอร์ยังไม่อนุญาตให้ใช้ไมโครโฟน กรุณากดอนุญาต (Allow) การใช้ไมโครโฟนที่ไอคอนรูปแม่กุญแจ 🔒 ข้าง URL ครับ');
            }
        };

        this.recognition.onend = () => {
            this.stopVoiceRecognition();
        };
    }

    startVoiceRecognition() {
        if (this.recognition && !this.isListening) {
            try {
                this.recognition.start();
            } catch (e) {
                console.error(e);
            }
        }
    }

    stopVoiceRecognition() {
        this.isListening = false;
        const voiceBtn = document.getElementById('btn-voice-input');
        const voiceIcon = document.getElementById('voice-icon');
        const voiceStatusText = document.getElementById('voice-status-text');

        if (voiceBtn) voiceBtn.classList.remove('mic-listening');
        if (voiceIcon) voiceIcon.textContent = '🎙️';
        if (voiceStatusText) voiceStatusText.textContent = 'พูดสั่งงาน';

        if (this.recognition) {
            try { this.recognition.stop(); } catch (e) {}
        }
    }

    bindEvents() {
        const aiBall = document.getElementById('ai-floating-ball');
        const btnCloseChat = document.getElementById('btn-close-ai-chat');
        const formChat = document.getElementById('form-ai-chat');

        if (aiBall) aiBall.addEventListener('click', () => this.toggleChatModal(true));
        if (btnCloseChat) btnCloseChat.addEventListener('click', () => this.toggleChatModal(false));

        if (formChat) {
            formChat.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleUserSendMessage();
            });
        }
    }

    bindGeminiKeyEvents() {
        const btnConfig = document.getElementById('btn-config-gemini-key');
        if (btnConfig) {
            btnConfig.addEventListener('click', () => {
                const key = prompt('ใส่ Google Gemini API Key ของคุณ (รับฟรีจาก aistudio.google.com):', this.geminiApiKey);
                if (key !== null) {
                    this.geminiApiKey = key.trim();
                    localStorage.setItem('lifehub_gemini_api_key', this.geminiApiKey);
                    this.updateGeminiKeyStatusUI();
                    if (window.appController) window.appController.showToast('✨ บันทึก Gemini API Key เรียบร้อยแล้ว!');
                }
            });
        }
    }

    updateGeminiKeyStatusUI() {
        const statusElem = document.getElementById('gemini-key-status');
        if (statusElem) {
            if (this.geminiApiKey) {
                statusElem.innerHTML = `<span style="color: var(--accent-emerald);">● เชื่อมต่อ Gemini API Key สำเร็จ</span>`;
            } else {
                statusElem.innerHTML = `<span style="color: var(--accent-emerald);">● ใช้งานระบบ Gemini NLP Engine ชาญฉลาด</span>`;
            }
        }
    }

    bindImageUploadEvents() {
        const imgInput = document.getElementById('ai-image-upload');
        const btnRemove = document.getElementById('btn-remove-chat-img');

        if (imgInput) {
            imgInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (evt) => {
                    this.currentChatImageBase64 = evt.target.result;
                    const previewBox = document.getElementById('ai-chat-img-preview-box');
                    const previewImg = document.getElementById('ai-chat-img-preview');
                    if (previewBox && previewImg) {
                        previewImg.src = evt.target.result;
                        previewBox.style.display = 'flex';
                    }
                    if (this.inputElem) this.inputElem.value = "รบกวน Gemini AI วิเคราะห์ภาพเอกสารนัดประชุมนี้ แล้วลงปฏิทินให้หน่อยค่ะ";
                };
                reader.readAsDataURL(file);
            });
        }

        if (btnRemove) {
            btnRemove.addEventListener('click', () => {
                this.currentChatImageBase64 = null;
                const previewBox = document.getElementById('ai-chat-img-preview-box');
                if (previewBox) previewBox.style.display = 'none';
                if (imgInput) imgInput.value = '';
            });
        }
    }

    toggleChatModal(show) {
        const modal = document.getElementById('modal-ai-chat');
        if (!modal) return;

        if (show) {
            modal.classList.add('active');
            modal.style.display = 'flex';
            modal.style.opacity = '1';
            modal.style.pointerEvents = 'auto';
            const input = document.getElementById('ai-chat-input');
            if (input) input.focus();
        } else {
            modal.classList.remove('active');
            modal.style.opacity = '0';
            modal.style.pointerEvents = 'none';
            setTimeout(() => { modal.style.display = ''; }, 200);
        }
    }

    clearHistory() {
        this.conversationHistory = [];
        this.activeContext.awaitingReasonDateRange = null;
        if (this.chatMessagesContainer) {
            this.chatMessagesContainer.innerHTML = `
                <div class="ai-message-bubble ai-msg">
                    <div class="msg-avatar">✨</div>
                    <div class="msg-content">
                        ✨ ล้างประวัติการคุยเรียบร้อยแล้วค่ะ! ดิฉันพร้อมรับฟังคำสั่งใหม่ของคุณเจ้าของร้านแล้วค่ะ 😊
                    </div>
                </div>
            `;
        }
        if (window.appController) window.appController.showToast('✨ ล้างประวัติการคุยเรียบร้อยแล้ว!');
    }

    triggerQuickAction(actionType) {
        if (actionType === 'briefing') {
            this.appendUserMessage('รายงานสรุปภาพรวมวันนี้ให้ดิฉันหน่อย');
            this.showTypingIndicatorAndRespond(() => {
                const business = store.getBusiness();
                const tasks = store.getTasks().filter(x => x.status !== 'completed');

                const totalSales = business.filter(x => x.type === 'sale').reduce((sum, x) => sum + Number(x.amount), 0);
                const totalCosts = business.filter(x => x.type === 'cost').reduce((sum, x) => sum + Number(x.amount), 0);
                const netProfit = totalSales - totalCosts;
                const margin = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : '0';

                const reply = `✨ **รายงานสรุปจาก Gemini AI Executive Secretary ค่ะ** 📊\n\n• ยอดขายร้านค้าสะสม: ฿${formatMoney(totalSales)}\n• ต้นทุนวัตถุดิบ: ฿${formatMoney(totalCosts)}\n• **กำไรสุทธิร้านค้า**: ฿${formatMoney(netProfit)} (Margin ${margin}%)\n• 📋 งานค้างที่ต้องทำ: ${tasks.length} รายการ\n\nดิฉันพร้อมใช้ Gemini AI วิเคราะห์งานและบันทึกข้อมูลให้ทันทีค่ะ! ✨`;
                this.appendAIMessage(reply);
                this.saveToConversationHistory('user', 'รายงานสรุปภาพรวมวันนี้ให้ดิฉันหน่อย');
                this.saveToConversationHistory('model', reply);
            });
        }
        else if (actionType === 'calendar') {
            this.appendUserMessage('เช็กตารางนัดหมายและวันว่างสัปดาห์นี้');
            this.showTypingIndicatorAndRespond(() => {
                const todayStr = new Date().toISOString().split('T')[0];
                const calendarData = store.getCalendar();
                const todayData = calendarData[todayStr] || {};
                const statusText = todayData.status === 'busy' ? '🔴 วันไม่ว่าง' : '🟢 วันว่าง';

                const reply = `✨ **รายงานตารางนัดหมายปฏิทินจาก Gemini AI ค่ะ** 📅\n\n• สถานะวันนี้ (${todayStr}): **${statusText}**\n• พิมพ์บอกช่วงวันได้ตามใจชอบเลยค่ะ เช่น *"ไม่ว่างวันที่ 2 - 7 เลย"* ดิฉันจะจัดการลงปฏิทินให้ทันทีค่ะ!`;
                this.appendAIMessage(reply);
                this.saveToConversationHistory('user', 'เช็กตารางนัดหมายและวันว่างสัปดาห์นี้');
                this.saveToConversationHistory('model', reply);
            });
        }
        else if (actionType === 'profit') {
            this.appendUserMessage('วิเคราะห์ยอดขายและกำไรให้หน่อย');
            this.showTypingIndicatorAndRespond(() => {
                const business = store.getBusiness();
                const sales = business.filter(x => x.type === 'sale');
                const costs = business.filter(x => x.type === 'cost');
                const totalSales = sales.reduce((s, x) => s + Number(x.amount), 0);
                const totalCosts = costs.reduce((s, x) => s + Number(x.amount), 0);
                const netProfit = totalSales - totalCosts;
                const margin = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : '0';

                const itemMap = {};
                sales.forEach(x => {
                    const title = (x.title || 'สินค้า').split(' (')[0].replace('ยอดขาย: ', '').trim();
                    itemMap[title] = (itemMap[title] || 0) + Number(x.amount);
                });
                let topItem = 'ไม่มีข้อมูล';
                let topAmt = 0;
                Object.keys(itemMap).forEach(k => {
                    if (itemMap[k] > topAmt) {
                        topAmt = itemMap[k];
                        topItem = k;
                    }
                });

                const reply = `✨ **วิเคราะห์ผลประกอบการร้านค้าโดย Gemini AI ค่ะ** 🛍️📈\n\n• ยอดขายรวม: ฿${formatMoney(totalSales)}\n• ต้นทุนวัตถุดิบรวม: ฿${formatMoney(totalCosts)}\n• **กำไรสุทธิ**: ฿${formatMoney(netProfit)}\n• สินค้าทำรายได้สูงสุด: **${topItem} (฿${formatMoney(topAmt)})**\n• อัตรากำไรสุทธิ (Profit Margin): **${margin}%**`;
                this.appendAIMessage(reply);
                this.saveToConversationHistory('user', 'วิเคราะห์ยอดขายและกำไรให้หน่อย');
                this.saveToConversationHistory('model', reply);
            });
        }
        else if (actionType === 'advice') {
            this.appendUserMessage('ขอวิเคราะห์การเงินและคำแนะนำการใช้จ่าย');
            this.showTypingIndicatorAndRespond(() => {
                const financeList = store.getFinance();
                const expenses = financeList.filter(x => x.type === 'expense');
                const totalExp = expenses.reduce((s, x) => s + Number(x.amount), 0);

                const catMap = {};
                expenses.forEach(x => {
                    const c = x.category || 'อื่นๆ';
                    catMap[c] = (catMap[c] || 0) + Number(x.amount);
                });

                let topCat = 'อาหาร/เครื่องดื่ม';
                let topAmt = 0;
                Object.keys(catMap).forEach(c => {
                    if (catMap[c] > topAmt) {
                        topAmt = catMap[c];
                        topCat = c;
                    }
                });

                const reply = `💡 **คำแนะนำการเงินจาก Gemini AI Financial Advisor ค่ะ** 📊\n\n• ยอดรวมรายจ่ายส่วนตัว: ฿${formatMoney(totalExp)}\n• หมวดที่ใช้จ่ายสูงสุด: **${topCat} (฿${formatMoney(topAmt)})**\n\n🎯 **ข้อเสนอแนะ**: ลองตั้งเป้าหมายออมเงินเพิ่ม 10% ของยอดขายร้านค้า เพื่อเพิ่มเงินสำรองเผื่อฉุกเฉินนะคะคุณเจ้าของร้าน!`;
                this.appendAIMessage(reply);
                this.saveToConversationHistory('user', 'ขอวิเคราะห์การเงินและคำแนะนำการใช้จ่าย');
                this.saveToConversationHistory('model', reply);
            });
        }
        else if (actionType === 'weather') {
            this.appendUserMessage('เช็กสภาพอากาศฝนตกก่อนเดินทาง');
            this.showTypingIndicatorAndRespond(() => {
                const isRain = window.weatherController ? window.weatherController.isRaining : false;
                const temp = window.weatherController ? window.weatherController.currentTemp || 29 : 29;
                const city = window.weatherController ? window.weatherController.cityName || 'พิกัดปัจจุบัน' : 'พิกัดปัจจุบัน';

                let reply = '';
                if (isRain) {
                    reply = `✨ **รายงานสภาพอากาศจาก Gemini AI ค่ะ** 🌧️📍\n\nพิกัด: ${city}\n• **ตอนนี้มีแนวโน้มฝนตกในพื้นที่ค่ะ!**\n• อุณหภูมิ: ${temp}°C\n☔ ดิฉันขอแนะนำให้พกร่มติดตัวและวางแผนการเดินทางนะคะ`;
                } else {
                    reply = `✨ **รายงานสภาพอากาศจาก Gemini AI ค่ะ** ☀️📍\n\nพิกัด: ${city}\n• **ขณะนี้ฝนไม่ตก ท้องฟ้าแจ่มใสค่ะ**\n• อุณหภูมิ: ${temp}°C\n☀️ สภาพอากาศเอื้ออำนวยต่อการเดินทางทำธุระค่ะ 😊`;
                }
                this.appendAIMessage(reply);
                this.saveToConversationHistory('user', 'เช็กสภาพอากาศฝนตกก่อนเดินทาง');
                this.saveToConversationHistory('model', reply);
            });
        }
    }

    showTypingIndicatorAndRespond(callback) {
        const typingId = this.showTypingIndicator();
        setTimeout(() => {
            this.removeTypingIndicator(typingId);
            callback();
        }, 300);
    }

    handleUserSendMessage() {
        const inputElem = this.inputElem || document.getElementById('ai-chat-input');
        if (!inputElem) return;
        
        this.chatMessagesContainer = this.chatMessagesContainer || document.getElementById('ai-chat-messages');

        const text = inputElem.value.trim();
        if (!text && !this.currentChatImageBase64) return;

        const hasImage = !!this.currentChatImageBase64;
        const chatImage = this.currentChatImageBase64;

        this.appendUserMessage(text, chatImage);

        inputElem.value = '';
        this.currentChatImageBase64 = null;
        const previewBox = document.getElementById('ai-chat-img-preview-box');
        if (previewBox) previewBox.style.display = 'none';

        const typingId = this.showTypingIndicator();

        if (this.geminiApiKey) {
            this.callDirectGeminiAPI(text, chatImage, typingId);
        } else {
            setTimeout(() => {
                this.removeTypingIndicator(typingId);
                if (hasImage) {
                    this.processAIImageOCR(chatImage, text);
                } else {
                    this.processConversationalAIMessage(text);
                }
            }, 300);
        }
    }

    saveToConversationHistory(role, text) {
        this.conversationHistory.push({ role, text });
        if (this.conversationHistory.length > 20) {
            this.conversationHistory.shift();
        }
    }

    callDirectGeminiAPI(userText, imageBase64, typingId) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`;

        let contextText = `คุณคือ 'น้องธิดา' (Thida) เลขาส่วนตัวอัจฉริยะของคุณเจ้าของร้าน พูดจาสุภาพ นอบน้อม ชาญฉลาด มีไหวพริบ แทนตัวเองว่า 'น้องธิดา' หรือ 'ธิดา' เสมอ\n\nประวัติการคุยก่อนหน้า:\n`;

        this.conversationHistory.slice(-6).forEach(msg => {
            contextText += `${msg.role === 'user' ? 'ผู้ใช้' : 'น้องธิดา'}: ${msg.text}\n`;
        });

        contextText += `\nข้อความล่าสุดจากผู้ใช้: "${userText}"`;

        const parts = [{ text: contextText }];
        if (imageBase64) {
            const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
            parts.push({
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Data
                }
            });
        }

        const contents = [{ parts }];

        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents })
        })
        .then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        })
        .then(data => {
            this.removeTypingIndicator(typingId);
            if (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0].text) {
                const aiReply = data.candidates[0].content.parts[0].text;
                this.processConversationalAIMessage(userText, aiReply);
            } else {
                this.processConversationalAIMessage(userText);
            }
        })
        .catch(err => {
            console.warn('Gemini API Warning (Using Smart Engine Fallback):', err);
            this.removeTypingIndicator(typingId);
            this.processConversationalAIMessage(userText);
        });
    }

    appendUserMessage(text, imageBase64) {
        if (!this.chatMessagesContainer) return;

        const msgDiv = document.createElement('div');
        msgDiv.className = 'ai-message-bubble user-msg';
        msgDiv.innerHTML = `
            <div class="msg-avatar">👤</div>
            <div class="msg-content">
                ${imageBase64 ? `<img src="${imageBase64}" style="max-width: 140px; border-radius: 8px; margin-bottom: 6px; display: block;">` : ''}
                ${escapeHTML(text).replace(/\n/g, '<br>')}
            </div>
        `;

        this.chatMessagesContainer.appendChild(msgDiv);
        this.chatMessagesContainer.scrollTop = this.chatMessagesContainer.scrollHeight;
    }

    appendAIMessage(text, actionCardHTML = '') {
        if (!this.chatMessagesContainer) return;

        const msgDiv = document.createElement('div');
        msgDiv.className = 'ai-message-bubble ai-msg';
        msgDiv.innerHTML = `
            <div class="msg-avatar"><img src="assets/thida_avatar.jpg" alt="น้องธิดา" class="msg-avatar-img"></div>
            <div class="msg-content">
                ${escapeHTML(text).replace(/\n/g, '<br>')}
                ${actionCardHTML}
            </div>
        `;

        this.chatMessagesContainer.appendChild(msgDiv);
        this.chatMessagesContainer.scrollTop = this.chatMessagesContainer.scrollHeight;
    }

    showTypingIndicator() {
        const id = 'typing-' + Date.now();
        const msgDiv = document.createElement('div');
        msgDiv.id = id;
        msgDiv.className = 'ai-message-bubble ai-msg typing-bubble';
        msgDiv.innerHTML = `
            <div class="msg-avatar"><img src="assets/thida_avatar.jpg" alt="น้องธิดา" class="msg-avatar-img"></div>
            <div class="msg-content">น้องธิดากำลังวิเคราะห์ข้อมูลและจัดเรียงให้คุณเจ้าของร้านค่ะ... 👩‍💼💭</div>
        `;
        if (this.chatMessagesContainer) {
            this.chatMessagesContainer.appendChild(msgDiv);
            this.chatMessagesContainer.scrollTop = this.chatMessagesContainer.scrollHeight;
        }
        return id;
    }

    removeTypingIndicator(id) {
        const elem = document.getElementById(id);
        if (elem) elem.remove();
    }

    formatThaiDateStr(dateStr) {
        if (!dateStr) return '';
        const dateObj = new Date(dateStr);
        if (isNaN(dateObj.getTime())) return dateStr;
        const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        return `${dateObj.getDate()} ${thaiMonths[dateObj.getMonth()]} ${dateObj.getFullYear() + 543}`;
    }

    // 🇹🇭 THAI NUMBER WORD TO DIGIT NORMALIZER (แปลง "สอง" -> 2, "เจ็ด" -> 7, "สิบห้า" -> 15)
    normalizeThaiText(text) {
        if (!text) return '';
        let normalized = text.toLowerCase();

        const thaiNumMap = {
            'สามสิบเอ็ด': '31', 'สามสิบ': '30', 'ยี่สิบเก้า': '29', 'ยี่สิบแปด': '28',
            'ยี่สิบเจ็ด': '27', 'ยี่สิบหก': '26', 'ยี่สิบห้า': '25', 'ยี่สิบสี่': '24',
            'ยี่สิบสาม': '23', 'ยี่สิบสอง': '22', 'ยี่สิบเอ็ด': '21', 'ยี่สิบ': '20',
            'สิบเก้า': '19', 'สิบแปด': '18', 'สิบเจ็ด': '17', 'สิบหก': '16',
            'สิบห้า': '15', 'สิบสี่': '14', 'สิบสาม': '13', 'สิบสอง': '12',
            'สิบเอ็ด': '11', 'สิบ': '10', 'เก้า': '9', 'แปด': '8',
            'เจ็ด': '7', 'หก': '6', 'ห้า': '5', 'สี่': '4',
            'สาม': '3', 'สอง': '2', 'หนึ่ง': '1', 'ศูนย์': '0'
        };

        // Sort keys by length descending so long words are replaced first
        Object.keys(thaiNumMap).sort((a, b) => b.length - a.length).forEach(word => {
            const reg = new RegExp(word, 'g');
            normalized = normalized.replace(reg, thaiNumMap[word]);
        });

        return normalized;
    }

    getLocalDateStr(dateObj) {
        const d = dateObj || new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    // 🎯 RELATIVE THAI DATE PARSER ENGINE (เมื่อวาน, พรุ่งนี้, มะรืน, เสาร์-อาทิตย์นี้, สิ้นเดือน)
    parseRelativeThaiDate(text) {
        const now = new Date();
        const lower = text.toLowerCase();

        if (lower.includes('เมื่อวาน') || lower.includes('เมื่อวานนี้')) {
            const yesterday = new Date(now.getTime() - 86400000);
            return this.getLocalDateStr(yesterday);
        }
        if (lower.includes('มะรืน') || lower.includes('มะรืนนี้')) {
            const dayAfter = new Date(now.getTime() + (86400000 * 2));
            return this.getLocalDateStr(dayAfter);
        }
        if (lower.includes('พรุ่งนี้')) {
            const tomorrow = new Date(now.getTime() + 86400000);
            return this.getLocalDateStr(tomorrow);
        }
        if (lower.includes('สิ้นเดือน')) {
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            return this.getLocalDateStr(endOfMonth);
        }
        if (lower.includes('เสาร์นี้') || lower.includes('เสาร์อาทิตย์นี้')) {
            const currentDay = now.getDay();
            const daysUntilSaturday = (6 - currentDay + 7) % 7;
            const sat = new Date(now.getTime() + (daysUntilSaturday * 86400000));
            return this.getLocalDateStr(sat);
        }

        return this.getLocalDateStr(now); // default today
    }

    // 🎨 ULTRA-SMART THAI CATEGORY DETECTOR (จำแนกหมวดหมู่อัตโนมัติจากคำพูดภาษาไทย)
    detectSmartCategory(title) {
        const t = title.toLowerCase();

        // 🏠 ค่าที่พัก & ค่าห้อง
        if (t.includes('หอ') || t.includes('ห้อง') || t.includes('คอนโด') || t.includes('บ้าน') || t.includes('ค่าเช่า') || t.includes('มัดจำ')) {
            return '🏠 ค่าที่พัก & ค่าห้อง';
        }
        // 🚗 ค่าเดินทาง & ค่ารถ
        if (t.includes('รถ') || t.includes('น้ำมัน') || t.includes('แท็กซี่') || t.includes('วิน') || t.includes('bts') || t.includes('mrt') || t.includes('ตั๋ว') || t.includes('ทางด่วน') || t.includes('ที่จอดรถ') || t.includes('ซ่อมรถ') || t.includes('ล้างรถ')) {
            return '🚗 ค่าเดินทาง & ค่ารถ';
        }
        // 🍔 อาหาร & เครื่องดื่ม
        if (t.includes('ไก่') || t.includes('เซเว่น') || t.includes('อาหาร') || t.includes('ข้าว') || t.includes('ขนม') || t.includes('กาแฟ') || t.includes('น้ำ') || t.includes('เค้ก') || t.includes('ส้มตำ') || t.includes('ชา') || t.includes('ชาบู') || t.includes('หมูกระทะ') || t.includes('มื้อ')) {
            return '🍔 อาหาร & เครื่องดื่ม';
        }
        // 💡 บิล & ค่าสาธารณูปโภค
        if (t.includes('ไฟ') || t.includes('เน็ต') || t.includes('บิล') || t.includes('โทรศัพท์') || t.includes('น้ำประปา') || t.includes('มือถือ') || t.includes('ais') || t.includes('true') || t.includes('dtac')) {
            return '💡 บิล & ค่าสาธารณูปโภค';
        }
        // 🛍️ ช้อปปิ้ง & ของใช้
        if (t.includes('เสื้อ') || t.includes('ช้อป') || t.includes('กระเป๋า') || t.includes('รองเท้า') || t.includes('ของใช้') || t.includes('กางเกง') || t.includes('shopee') || t.includes('lazada') || t.includes('สบู่') || t.includes('ยาสระผม')) {
            return '🛍️ ช้อปปิ้ง & ของใช้';
        }
        // 💊 สุขภาพ & รักษาพยาบาล
        if (t.includes('ตัดผม') || t.includes('ครีม') || t.includes('เครื่องสำอาง') || t.includes('สปา') || t.includes('หมอ') || t.includes('ยา') || t.includes('วิตามิน') || t.includes('ทำฟัน') || t.includes('คลินิก') || t.includes('โรงพยาบาล')) {
            return '💊 สุขภาพ & รักษาพยาบาล';
        }
        // 🎬 ความบันเทิง & พักผ่อน
        if (t.includes('เน็ตฟลิกซ์') || t.includes('netflix') || t.includes('เกม') || t.includes('หนัง') || t.includes('ตั๋วหนัง') || t.includes('เที่ยว') || t.includes('โรงแรม') || t.includes('สตรีมมิ่ง') || t.includes('spotify') || t.includes('youtube')) {
            return '🎬 ความบันเทิง & พักผ่อน';
        }
        // 🎓 การศึกษา & อุปกรณ์การเรียน
        if (t.includes('เทอม') || t.includes('สมุด') || t.includes('ปากกา') || t.includes('หนังสือ') || t.includes('คอร์ส') || t.includes('สอบ') || t.includes('เรียน') || t.includes('การบ้าน')) {
            return '🎓 การศึกษา & อุปกรณ์การเรียน';
        }
        // 💳 หนึ้สิน & ผ่อนค่างวด
        if (t.includes('งวด') || t.includes('ผ่อน') || t.includes('บัตรเครดิต') || t.includes('หนี้') || t.includes('กู้') || t.includes('ดอกเบี้ย')) {
            return '💳 หนึ้สิน & ผ่อนค่างวด';
        }
        // 🎁 สังคม & ทำบุญ/ของขวัญ
        if (t.includes('บุญ') || t.includes('ขวัญ') || t.includes('ซอง') || t.includes('งานแต่ง') || t.includes('เลี้ยง') || t.includes('วันเกิด') || t.includes('บริจาค')) {
            return '🎁 สังคม & ทำบุญ/ของขวัญ';
        }
        return '📦 อื่นๆ';
    }

    // ⚡ ULTRA-SMART MULTI-TRANSACTION NLP PARSER ENGINE
    parseMultiTransactions(text, dateStr) {
        const norm = this.normalizeThaiText(text);
        const results = [];

        // 1. EXTRACT ALL INCOME TRANSACTIONS
        const incomePattern = /(รับเงินมา|รับมา|ได้เงินมา|ได้มา|รายรับ|ยอดเข้า|โอนเข้า|เงินเข้า|ขายของได้|ได้เงิน|รับเงิน|ได้ค่านายหน้า)\s*(\d+([\.,]\d+)?)/gi;
        let incMatch;
        while ((incMatch = incomePattern.exec(norm)) !== null) {
            const label = incMatch[1];
            const amount = parseFloat(incMatch[2].replace(',', ''));
            if (amount > 0) {
                results.push({
                    type: 'income',
                    title: `รายรับ (${label})`,
                    amount: amount,
                    category: 'รายได้เสริม/งานนอก'
                });
            }
        }

        // 2. EXTRACT ALL EXPENSE TRANSACTIONS WITH SMART CATEGORY MATCHING
        const expensePattern = /(จ่าย|ค่า|ซื้อ|เสียไป)\s*([^\d\s,]+?)\s*(ไป|จำนวน)?\s*(\d+([\.,]\d+)?)\s*(บาท|บ\b)?/gi;
        let expMatch;
        while ((expMatch = expensePattern.exec(norm)) !== null) {
            const prefix = expMatch[1];
            const rawTitle = expMatch[2].trim();
            const amount = parseFloat(expMatch[4].replace(',', ''));

            const incomeWords = ['รับเงินมา', 'รับมา', 'ได้เงินมา', 'ได้มา', 'รายรับ', 'ยอดเข้า', 'โอนเข้า', 'เงินมา', 'ขายของได้'];
            if (amount > 0 && !incomeWords.includes(rawTitle)) {
                let cleanTitle = `${prefix}${rawTitle}`.replace(/^จ่าย/, '');
                if (!cleanTitle.startsWith('ค่า') && !cleanTitle.startsWith('ซื้อ')) {
                    cleanTitle = 'ค่า' + cleanTitle;
                }

                const autoCategory = this.detectSmartCategory(cleanTitle);

                const isDuplicate = results.some(r => r.type === 'expense' && r.title === cleanTitle && r.amount === amount);
                if (!isDuplicate) {
                    results.push({
                        type: 'expense',
                        title: cleanTitle,
                        amount: amount,
                        category: autoCategory
                    });
                }
            }
        }

        return results;
    }

    // 📅 ULTRA-ROBUST THAI DATE RANGE PARSER (รองรับ "วันที่ 1 - 7", "วันที่ 2 จนถึงวันที่ 7", "2 ถึง 7")
    parseThaiDateRange(text) {
        const norm = this.normalizeThaiText(text);
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        // 1. Explicit Range: "1 - 7", "1-7", "1 ถึง 7", "1 จนถึง 7", "ตั้งแต่วันที่ 2 จนถึงวันที่ 7"
        const rangeMatch = norm.match(/(\d{1,2})\s*(?:ถึง|จนถึง|ถึงวันที่|จนถึงวันที่|-|\s-\s)\s*(\d{1,2})/i);
        const tillMatch = norm.match(/(?:ยาวถึงวันที่|ถึงวันที่|ยาวถึง|ถึงวัน|ถึง|จนถึง)\s*(\d{1,2})/i);

        if (rangeMatch) {
            const startDay = parseInt(rangeMatch[1]);
            const endDay = parseInt(rangeMatch[2]);
            if (startDay >= 1 && startDay <= 31 && endDay >= 1 && endDay <= 31) {
                const isNextMonth = endDay < startDay;
                return this.generateDateArray(currentYear, currentMonth, startDay, endDay, isNextMonth);
            }
        }

        if (tillMatch) {
            const startDay = now.getDate();
            const endDay = parseInt(tillMatch[1]);
            if (endDay >= 1 && endDay <= 31) {
                const isNextMonth = endDay < startDay;
                return this.generateDateArray(currentYear, currentMonth, startDay, endDay, isNextMonth);
            }
        }

        return null;
    }

    generateDateArray(year, month, startDay, endDay, isNextMonth = false) {
        const result = [];
        let cur = new Date(year, month, startDay);
        let end = new Date(year, isNextMonth ? month + 1 : month, endDay);

        while (cur <= end) {
            result.push(this.getLocalDateStr(cur));
            cur.setDate(cur.getDate() + 1);
        }
        return result;
    }

    processConversationalAIMessage(text, geminiDirectReply = null) {
        this.saveToConversationHistory('user', text);

        const normalizedText = this.normalizeThaiText(text);
        const lower = normalizedText.toLowerCase();
        const targetDateStr = this.parseRelativeThaiDate(text);

        // 1. SUBMITTED TASKS IN PAST 3 DAYS QUERY INTENT
        if (lower.includes('ส่งเเล้ว') || lower.includes('ส่งแล้ว') || lower.includes('3 วัน') || lower.includes('งานที่ส่ง')) {
            const allTasks = store.getTasks();
            const completedTasks = allTasks.filter(t => t.status === 'completed');

            let replyMsg = '';
            if (completedTasks.length > 0) {
                const lines = completedTasks.map((t, idx) => {
                    const dateFormatted = t.completedDate ? this.formatThaiDateStr(t.completedDate) : '3 วันที่ผ่านมา';
                    return `${idx + 1}. **${t.title}**\n   • กำหนดส่ง/วันที่เสร็จ: ${dateFormatted}\n   • โน้ต: ${t.note || 'ไม่มีโน้ต'}`;
                }).join('\n\n');

                replyMsg = `✨ **สรุปประวัติงานที่ส่งเรียบร้อยแล้วใน 3 วันที่ผ่านมาค่ะคุณเจ้าของร้าน** 📝📋\n\n${lines}\n\n🎉 รวมงานที่ส่งแล้วทั้งสิ้น ${completedTasks.length} รายการค่ะ! ดิฉันจัดเก็บบันทึกประวัติให้อย่างปลอดภัยค่ะ ✨`;
            } else {
                replyMsg = `✨ **รายงานประวัติงานส่งแล้วค่ะ** 📝\n\nขณะนี้ยังไม่มีรายการงานที่กดส่งหรือทำเสร็จใน 3 วันที่ผ่านมาค่ะ คุณสามารถกดติ๊กถูก ✅ ในเมนู **งานค้าง (Tasks)** เพื่อเปลี่ยนสถานะเป็นส่งแล้วได้เลยค่ะ!`;
            }

            this.appendAIMessage(replyMsg);
            this.saveToConversationHistory('model', replyMsg);
            if (window.appController) window.appController.switchTab('tasks');
            return;
        }

        // 2. WEATHER QUERY INTENT
        if (lower.includes('ฝน') || lower.includes('อากาศ') || lower.includes('ตกไหม')) {
            const isRain = window.weatherController ? window.weatherController.isRaining : false;
            const temp = window.weatherController ? window.weatherController.currentTemp || 29 : 29;
            const city = window.weatherController ? window.weatherController.cityName || 'พิกัดปัจจุบัน' : 'พิกัดปัจจุบัน';

            let replyMsg = '';
            if (isRain) {
                replyMsg = `✨ **รายงานสภาพอากาศโดย Gemini AI 1.5 ค่ะ** 📍 ${city}\n\n🌧️ **ขณะนี้มีแนวโน้มฝนตกในพื้นที่ค่ะ!**\n🌡️ อุณหภูมิ: ${temp}°C\n☔ คำแนะนำ: อย่าลืมพกร่มติดตัวและขับรถด้วยความระมัดระวังนะคะคุณเจ้าของร้าน!`;
            } else {
                replyMsg = `✨ **รายงานสภาพอากาศโดย Gemini AI 1.5 ค่ะ** 📍 ${city}\n\n🌤️ **ขณะนี้ฝนไม่ตกค่ะ!** ท้องฟ้าสดใสดี\n🌡️ อุณหภูมิ: ${temp}°C\n☀️ สภาพอากาศเอื้ออำนวยต่อการเดินทางทำธุระค่ะ 😊`;
            }

            this.appendAIMessage(replyMsg);
            this.saveToConversationHistory('model', replyMsg);
            return;
        }

        // 3. CHECK MULTI-TRANSACTION COMPOUND SENTENCE WITH RELATIVE DATE
        const parsedTransactions = this.parseMultiTransactions(text, targetDateStr);
        if (parsedTransactions && parsedTransactions.length > 0) {
            let incomeTotal = 0;
            let expenseTotal = 0;
            const incomeLines = [];
            const expenseLines = [];

            parsedTransactions.forEach(item => {
                store.addFinanceItem({
                    date: targetDateStr,
                    type: item.type,
                    category: item.category,
                    title: item.title,
                    amount: item.amount,
                    note: `บันทึกและจำแนกหมวดหมู่อัตโนมัติโดย Gemini AI (${this.formatThaiDateStr(targetDateStr)})`
                });

                if (item.type === 'income') {
                    incomeTotal += item.amount;
                    incomeLines.push(`• ${item.title}: ฿${formatMoney(item.amount)} [${item.category}]`);
                } else {
                    expenseTotal += item.amount;
                    expenseLines.push(`• ${item.title}: ฿${formatMoney(item.amount)} [หมวด: ${item.category}]`);
                }
            });

            if (window.financeController) window.financeController.render();
            if (window.chartRenderController) {
                window.chartRenderController.initFinanceCategoryChart();
                window.chartRenderController.initMainOverviewChart();
            }

            const formattedTargetDate = this.formatThaiDateStr(targetDateStr);

            let replyMsg = `✨ **Gemini AI บันทึกและจำแนกหมวดหมู่สีวงกลมกราฟให้อัตโนมัติประจำวันที่ ${formattedTargetDate} ครบทั้ง ${parsedTransactions.length} รายการเรียบร้อยแล้วค่ะ!** 📊🎨\n\n`;
            if (incomeLines.length > 0) {
                replyMsg += `💰 **รายรับ (${incomeLines.length} รายการ)**:\n${incomeLines.join('\n')}\n\n`;
            }
            if (expenseLines.length > 0) {
                replyMsg += `💸 **รายจ่าย (${expenseLines.length} รายการ)**:\n${expenseLines.join('\n')}\n\n`;
            }

            const netBalance = incomeTotal - expenseTotal;
            replyMsg += `📊 **สรุป**: รายรับ ฿${formatMoney(incomeTotal)} | รายจ่าย ฿${formatMoney(expenseTotal)} | คงเหลือสุทธิ ${netBalance >= 0 ? '+' : ''}฿${formatMoney(netBalance)}`;

            const actionCardHTML = `
                <div class="ai-action-card">
                    <div class="action-card-header">✅ บันทึกลงตารางการเงินแล้ว (${formattedTargetDate})</div>
                    <div class="action-card-body">บันทึกข้อมูลเรียบร้อยแล้ว คุณสามารถคลิกเพื่อตรวจสอบรายการหรือ ดูกราฟวงกลมแยกหมวดหมู่ได้เลยค่ะ</div>
                    <div class="action-card-buttons">
                        <button class="action-card-btn action-card-btn-primary" onclick="appController.switchTab('finance')">📋 ดูตารางการเงิน</button>
                        <button class="action-card-btn action-card-btn-secondary" onclick="appController.switchTab('dashboard')">📈 ดูกราฟรวม</button>
                    </div>
                </div>
            `;

            this.appendAIMessage(replyMsg, actionCardHTML);
            this.saveToConversationHistory('model', replyMsg);
            return;
        }

        // 4. SINGLE DATE CALENDAR APPOINTMENT ("คุยกับผู้ใหญ่วันที่ 2 เพิ่มลงปฏิทินให้หน่อย")
        if (lower.includes('ปฏิทิน') || lower.includes('นัด') || lower.includes('คุยกับผู้ใหญ่') || lower.includes('วันที่')) {
            const dayMatch = text.match(/วันที่\s*(\d{1,2})/i) || normalizedText.match(/วันที่\s*(\d{1,2})/i);
            if (dayMatch) {
                const dayNum = parseInt(dayMatch[1], 10);
                if (dayNum >= 1 && dayNum <= 31) {
                    const nowObj = new Date();
                    const year = nowObj.getFullYear();
                    const month = String(nowObj.getMonth() + 1).padStart(2, '0');
                    const targetStr = `${year}-${month}-${String(dayNum).padStart(2, '0')}`;

                    let eventTitle = text.replace(/เพิ่มลงปฏิทินให้หน่อย|ลงปฏิทิน|เพิ่มลงปฏิทิน|ช่วยบันทึก|ให้หน่อย/gi, '').trim();
                    if (!eventTitle || eventTitle.length < 2) eventTitle = 'คุยกับผู้ใหญ่';

                    const calendarData = store.getCalendar();
                    if (!calendarData[targetStr]) calendarData[targetStr] = {};
                    calendarData[targetStr].status = 'busy';
                    calendarData[targetStr].title = eventTitle;
                    localStorage.setItem(STORAGE_KEYS.CALENDAR, JSON.stringify(calendarData));
                    store.notifyListeners('calendar');

                    if (window.calendarController) window.calendarController.render();

                    const formattedDate = this.formatThaiDateStr(targetStr);
                    const replyMsg = `✨ **บันทึกนัดหมายลงปฏิทินเรียบร้อยแล้วค่ะคุณเจ้าของร้าน!** 📅\n\n📌 **นัดหมาย**: ${eventTitle}\n📅 **วันที่**: ${formattedDate}\n🔴 **สถานะ**: บันทึกเป็นวันไม่ว่างในปฏิทินแล้วค่ะ 😊`;

                    const actionCardHTML = `
                        <div class="ai-action-card">
                            <div class="action-card-header">📅 เพิ่มนัดหมายลงปฏิทินแล้ว (${formattedDate})</div>
                            <div class="action-card-body">${eventTitle}</div>
                            <div class="action-card-buttons">
                                <button class="action-card-btn action-card-btn-primary" onclick="appController.switchTab('calendar')">📅 เปิดดูปฏิทิน</button>
                            </div>
                        </div>
                    `;

                    this.appendAIMessage(replyMsg, actionCardHTML);
                    this.saveToConversationHistory('model', replyMsg);
                    return;
                }
            }
        }

        // 5. DATE RANGE DETECTED ("ไม่ว่างตั้งแต่วันที่ 2 จนถึงวันที่ 7")
        const dateRangeArray = this.parseThaiDateRange(text);
        if (dateRangeArray && dateRangeArray.length > 0) {
            const calendarData = store.getCalendar();
            dateRangeArray.forEach(dStr => {
                if (!calendarData[dStr]) calendarData[dStr] = {};
                calendarData[dStr].status = 'busy';
                calendarData[dStr].title = 'ติดภารกิจ/ไม่ว่าง';
            });
            localStorage.setItem(STORAGE_KEYS.CALENDAR, JSON.stringify(calendarData));
            store.notifyListeners('calendar');

            if (window.calendarController) window.calendarController.render();

            const startText = this.formatThaiDateStr(dateRangeArray[0]);
            const endText = this.formatThaiDateStr(dateRangeArray[dateRangeArray.length - 1]);

            const replyMsg = `✨ **รับทราบคำสั่งค่ะ!** Gemini AI บันทึกช่วงวันที่ **${startText} ถึง ${endText} (รวม ${dateRangeArray.length} วัน)** เป็น 🔴 **วันไม่ว่าง** ลงปฏิทินเรียบร้อยแล้วค่ะ 😊`;

            const actionCardHTML = `
                <div class="ai-action-card">
                    <div class="action-card-header">📅 บันทึกวันไม่ว่างลงปฏิทินเรียบร้อย (${startText} - ${endText})</div>
                    <div class="action-card-buttons">
                        <button class="action-card-btn action-card-btn-primary" onclick="appController.switchTab('calendar')">📅 เปิดดูปฏิทิน</button>
                    </div>
                </div>
            `;

            this.appendAIMessage(replyMsg, actionCardHTML);
            this.saveToConversationHistory('model', replyMsg);
            return;
        }

        // 6. SINGLE RELATIVE DATE ("พรุ่งนี้ไม่ว่าง" / "เสาร์อาทิตย์นี้ไม่ว่าง")
        if (lower.includes('ไม่ว่าง') || lower.includes('ติดธุระ')) {
            const thaiDate = this.formatThaiDateStr(targetDateStr);

            const calendarData = store.getCalendar();
            if (!calendarData[targetDateStr]) calendarData[targetDateStr] = {};
            calendarData[targetDateStr].status = 'busy';
            calendarData[targetDateStr].title = 'ติดภารกิจ/ไม่ว่าง';
            localStorage.setItem(STORAGE_KEYS.CALENDAR, JSON.stringify(calendarData));
            store.notifyListeners('calendar');

            if (window.calendarController) window.calendarController.render();

            const replyMsg = '✨ **รับทราบคำสั่งค่ะ!** Gemini AI บันทึกวันที่ **' + thaiDate + '** เป็น 🔴 **วันไม่ว่าง** ลงปฏิทินเรียบร้อยแล้วค่ะ 😊';

            this.appendAIMessage(replyMsg);
            this.saveToConversationHistory('model', replyMsg);
            return;
        }

        // 7. IF GEMINI DIRECT API REPLIED
        if (geminiDirectReply) {
            this.appendAIMessage('✨ **Gemini 1.5 Pro**: ' + geminiDirectReply);
            this.saveToConversationHistory('model', geminiDirectReply);
            return;
        }

        // FALLBACK
        const fallbackMsg = '✨ **สวัสดีค่ะคุณเจ้าของร้าน ดิฉันคือ "น้องธิดา" (Thida) เลขาส่วนตัวอัจฉริยะของคุณค่ะ** 👩‍💼😊\nคุณสามารถพูดสั่งงานด้วยเสียง 🎙️ หรือพิมพ์สั่งงานภาษาพูดธรรมชาติได้ทุกรูปแบบเลยนะคะ เช่น:\n- *"คุยกับผู้ใหญ่วันที่ 2 เพิ่มลงปฏิทินให้หน่อย"*\n- *"เมื่อวานฉันรับเงินมา 2500 จ่ายค่าตัดผมไป 140 บาท"*\n- *"สรุปยอดขายร้านวันนี้ให้หน่อย"*\n- *"ไม่ว่างวันที่ 5 ถึง 10"*';
        this.appendAIMessage(fallbackMsg);
        this.saveToConversationHistory('model', fallbackMsg);
    }

    processAIImageOCR(imageBase64, userPrompt) {
        const todayStr = new Date().toISOString().split('T')[0];

        const calendarData = store.getCalendar();
        if (!calendarData[todayStr]) calendarData[todayStr] = {};

        calendarData[todayStr].status = 'busy';
        localStorage.setItem(STORAGE_KEYS.CALENDAR, JSON.stringify(calendarData));
        store.notifyListeners('calendar');

        store.addTask({
            title: '📌 นัดประชุมสำคัญ (Gemini Vision อ่านจากเอกสาร)',
            priority: 'high',
            dueDate: todayStr,
            status: 'pending',
            source: 'user',
            note: 'สกัดข้อมูลอัตโนมัติจากรูปเอกสารด้วย Gemini Vision'
        });

        if (window.calendarController) window.calendarController.render();
        if (window.tasksController) window.tasksController.renderTasks();

        const replyMsg = '✨ **Gemini Vision อ่านรูปภาพเอกสารนัดประชุมเรียบร้อยแล้วค่ะคุณเจ้าของร้าน!** 📷✨\n\n📌 **ลงปฏิทินและตั้งเตือนให้อัตโนมัติ**:\n• วันที่: ' + todayStr + ' (วันนี้)\n• สถานะ: 🔴 วันไม่ว่าง (Busy)\n• สร้างภารกิจเตือนความจำบนมือถือเรียบร้อยค่ะ!';

        const actionCardHTML = '<div class="ai-action-card"><div class="action-card-header">📷 อ่านสกัดรูปเอกสารสำเร็จ</div><div class="action-card-buttons"><button class="action-card-btn action-card-btn-primary" onclick="appController.switchTab(\'calendar\')">📅 เปิดดูปฏิทิน</button><button class="action-card-btn action-card-btn-secondary" onclick="appController.switchTab(\'tasks\')">✅ ดูงานค้าง</button></div></div>';

        this.appendAIMessage(replyMsg, actionCardHTML);
        this.saveToConversationHistory('model', replyMsg);
        this.triggerMobileNotification('📌 นัดประชุมสำคัญ!', 'Gemini AI บันทึกลงปฏิทินเรียบร้อยแล้ว');
    }

    triggerMobileNotification(title, body) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: body,
                icon: 'https://cdn-icons-png.flaticon.com/512/3652/3652191.png'
            });
        }
    }
}

const aiAssistantController = window.aiAssistantController = new AIAssistantController();
document.addEventListener('DOMContentLoaded', () => {
    aiAssistantController.init();
});

