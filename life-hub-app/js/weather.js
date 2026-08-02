/* ==========================================================================
   Life & Business Hub - Dynamic Travel Location Tracker & Live GPS Clock
   ========================================================================== */

const THAI_PROVINCE_MAP = {
    // Nonthaburi & Metropolitan
    'Bang Bua Thong': 'บางบัวทอง',
    'Bangbuathong': 'บางบัวทอง',
    'Bang Yai': 'บางใหญ่',
    'Bang Kruai': 'บางกรวย',
    'Pak Kret': 'ปากเกร็ด',
    'Pakkret': 'ปากเกร็ด',
    'Muang Nonthaburi': 'เมืองนนทบุรี',
    'Mueang Nonthaburi': 'เมืองนนทบุรี',
    'Sai Noi': 'ไทรน้อย',
    'Nonthaburi': 'นนทบุรี',

    // Bangkok Districts
    'Bang Khen': 'บางเขน',
    'Chatuchak': 'จตุจักร',
    'Don Mueang': 'ดอนเมือง',
    'Don Muang': 'ดอนเมือง',
    'Bang Sue': 'บางซื่อ',
    'Phaya Thai': 'พญาไท',
    'Ratchathewi': 'ราชเทวี',
    'Pathum Wan': 'ปทุมวัน',
    'Bang Rak': 'บางรัก',
    'Sathon': 'สาทร',
    'Sathorn': 'สาทร',
    'Watthana': 'วัฒนา',
    'Khlong Toei': 'คลองเตย',
    'Klong Toey': 'คลองเตย',
    'Huai Khwang': 'ห้วยขวาง',
    'Din Daeng': 'ดินแดง',
    'Lat Phrao': 'ลาดพร้าว',
    'Ladprao': 'ลาดพร้าว',
    'Bang Kapi': 'บางกะปิ',
    'Bueng Kum': 'บึงกุ่ม',
    'Min Buri': 'มีนบุรี',
    'Nong Chok': 'หนองจอก',
    'Lat Krabang': 'ลาดกระบัง',
    'Prawet': 'ประเวศ',
    'Bang Na': 'บางนา',
    'Phra Khanong': 'พระโขนง',
    'Suan Luang': 'สวนหลวง',
    'Taling Chan': 'ตลิ่งชัน',
    'Bang Phlat': 'บางพลัด',
    'Bangkok Noi': 'บางกอกน้อย',
    'Bangkok Yai': 'บางกอกใหญ่',
    'Thon Buri': 'ธนบุรี',
    'Khlong San': 'คลองสาน',
    'Phra Nakhon': 'พระนคร',
    'Dusit': 'ดุสิต',
    'Rat Burana': 'ราษฎร์บูรณะ',
    'Thung Khru': 'ทุ่งครุ',
    'Bang Khun Thian': 'บางขุนเทียน',
    'Bang Bon': 'บางบอน',
    'Chom Thong': 'จอมทอง',
    'Phasi Charoen': 'ภาษีเจริญ',
    'Bang Khae': 'บางแค',
    'Nong Khaem': 'หนองแขม',
    'Sai Mai': 'สายไหม',
    'Bangkok': 'กรุงเทพมหานคร',

    // Provinces
    'Chachoengsao': 'ฉะเชิงเทรา',
    'Pathum Thani': 'ปทุมธานี',
    'Samut Prakan': 'สมุทรปราการ',
    'Samut Sakhon': 'สมุทรสาคร',
    'Samut Songkhram': 'สมุทรสงคราม',
    'Chon Buri': 'ชลบุรี',
    'Chonburi': 'ชลบุรี',
    'Rayong': 'ระยอง',
    'Chanthaburi': 'จันทบุรี',
    'Trat': 'ตราด',
    'Chiang Mai': 'เชียงใหม่',
    'Chiang Rai': 'เชียงราย',
    'Phuket': 'ภูเก็ต',
    'Songkhla': 'สงขลา',
    'Hat Yai': 'หาดใหญ่',
    'Nakhon Ratchasima': 'นครราชสีมา (โคราช)',
    'Khon Kaen': 'ขอนแก่น',
    'Udon Thani': 'อุดรธานี',
    'Ubon Ratchathani': 'อุบลราชธานี',
    'Phra Nakhon Si Ayutthaya': 'พระนครศรีอยุธยา',
    'Ayutthaya': 'อยุธยา',
    'Nakhon Pathom': 'นครปฐม',
    'Saraburi': 'สระบุรี',
    'Lop Buri': 'ลพบุรี',
    'Kanchanaburi': 'กาญจนบุรี',
    'Ratchaburi': 'ราชบุรี',
    'Phetchaburi': 'เพชรบุรี',
    'Prachuap Khiri Khan': 'ประจวบคีรีขันธ์',
    'Surat Thani': 'สุราษฎร์ธานี',
    'Krabi': 'กระบี่',
    'Phangnga': 'พังงา'
};

class WeatherController {
    constructor() {
        this.currentTemp = null;
        this.weatherCode = null;
        this.isRaining = false;
        this.cityName = 'กำลังระบุพิกัดตำแหน่งที่คุณเดินทาง...';
        this.lat = null;
        this.lon = null;
        this.watchId = null;
        this.lastFetchedLat = null;
        this.lastFetchedLon = null;
        this.clockInterval = null;
    }

    init() {
        const defaultInfo = { title: '🌤️ ท้องฟ้าแจ่มใส', desc: 'วันนี้อากาศสดใส เหมาะแก่การเดินทางทำธุระและเปิดร้านค้าค่ะ', isRain: false, icon: '☀️' };
        this.cityName = 'กรุงเทพมหานคร';
        this.renderWeatherCard(defaultInfo, 29);

        this.fetchLiveWeather(13.7563, 100.5018, 'กรุงเทพมหานคร');
        this.startRealtimeLocationTracking();
        this.startLiveGPSClock();
    }

    startLiveGPSClock() {
        if (this.clockInterval) clearInterval(this.clockInterval);
        this.updateClockUI();
        this.clockInterval = setInterval(() => {
            this.updateClockUI();
        }, 1000);
    }

    updateClockUI() {
        const clockElem = document.getElementById('live-gps-clock');
        if (clockElem) {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            clockElem.textContent = `🕒 ${hours}:${minutes}:${seconds} น.`;
        }
    }

    translateLocationToThai(locationStr) {
        if (!locationStr) return 'ตำแหน่งปัจจุบัน';

        let result = locationStr;
        Object.keys(THAI_PROVINCE_MAP).forEach(enName => {
            const regex = new RegExp(`\\b${enName}\\b`, 'gi');
            if (regex.test(result)) {
                result = result.replace(regex, THAI_PROVINCE_MAP[enName]);
            }
        });

        result = result.replace(/\s*\(Thailand\)/gi, '').replace(/\s*\(ไทย\)/gi, '');
        return result.trim();
    }

    requestBrowserLocationPermission() {
        if ('geolocation' in navigator && navigator.geolocation && typeof navigator.geolocation.getCurrentPosition === 'function') {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    this.handleGPSLocationChange(pos);
                    if (window.appController) window.appController.showToast('📡 ได้รับอนุญาตพิกัดตำแหน่งแม่นยำแล้ว!');
                },
                (err) => {
                    alert('เบราว์เซอร์ยังไม่ได้กด "อนุญาต (Allow)" พิกัดตำแหน่งครับ กรุณากดไอคอนแม่กุญแจ 🔒 ที่แถบด้านซ้ายของ URL เบราว์เซอร์ แล้วเปลี่ยน Location เป็น Allow ครับ');
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        }
    }

    startRealtimeLocationTracking() {
        if ('geolocation' in navigator && navigator.geolocation && typeof navigator.geolocation.getCurrentPosition === 'function') {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    this.handleGPSLocationChange(pos);
                },
                (err) => this.handleGPSError(err),
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );

            if (typeof navigator.geolocation.watchPosition === 'function') {
                this.watchId = navigator.geolocation.watchPosition(
                    (pos) => {
                        this.handleGPSLocationChange(pos);
                    },
                    (err) => console.log('WatchPosition notice:', err),
                    { enableHighAccuracy: true, maximumAge: 30000, timeout: 20000 }
                );
            }
        } else {
            this.fetchIPBasedLocation();
        }
    }


    handleGPSLocationChange(pos) {
        const newLat = pos.coords.latitude;
        const newLon = pos.coords.longitude;

        if (!this.lastFetchedLat || this.hasMovedSignificantly(this.lastFetchedLat, this.lastFetchedLon, newLat, newLon)) {
            this.lastFetchedLat = newLat;
            this.lastFetchedLon = newLon;
            this.reverseGeocodeAndFetchWeather(newLat, newLon);
        }
    }

    hasMovedSignificantly(lat1, lon1, lat2, lon2) {
        const delta = Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lon1 - lon2, 2));
        return delta > 0.02;
    }

    handleGPSError(err) {
        console.log('GPS tracking notice, falling back to IP Geolocation:', err.message);
        this.fetchIPBasedLocation();
    }

    fetchIPBasedLocation() {
        fetch('https://get.geojs.io/v1/ip/geo.json')
            .then(res => res.json())
            .then(data => {
                if (data && data.latitude && data.longitude) {
                    this.lat = parseFloat(data.latitude);
                    this.lon = parseFloat(data.longitude);
                    this.reverseGeocodeAndFetchWeather(this.lat, this.lon);
                } else {
                    this.fetchFallbackBangkok();
                }
            })
            .catch(() => this.fetchFallbackBangkok());
    }

    fetchFallbackBangkok() {
        this.lat = 13.7563;
        this.lon = 100.5018;
        this.fetchLiveWeather(this.lat, this.lon, 'กรุงเทพมหานคร');
    }

    reverseGeocodeAndFetchWeather(lat, lon) {
        const reverseUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=th`;

        fetch(reverseUrl)
            .then(res => res.json())
            .then(geoData => {
                let locationName = '';
                if (geoData) {
                    let rawLocality = geoData.locality || geoData.city || '';
                    let rawProvince = geoData.principalSubdivision || '';

                    rawLocality = rawLocality.replace(/เทศบาลนคร|เทศบาลเมือง|เทศบาลตำบล|อำเภอ|เขต/g, '').trim();
                    rawProvince = rawProvince.replace(/จังหวัด/g, '').trim();

                    if (rawLocality && rawProvince && rawLocality !== rawProvince) {
                        locationName = `${rawLocality}, ${rawProvince}`;
                    } else if (rawProvince) {
                        locationName = rawProvince;
                    } else if (rawLocality) {
                        locationName = rawLocality;
                    } else {
                        locationName = `พิกัดปัจจุบัน (${lat.toFixed(2)}, ${lon.toFixed(2)})`;
                    }
                }
                const translatedName = this.translateLocationToThai(locationName);
                this.fetchLiveWeather(lat, lon, translatedName);
            })
            .catch(() => {
                this.fetchLiveWeather(lat, lon, `พิกัดปัจจุบัน (${lat.toFixed(2)}, ${lon.toFixed(2)})`);
            });
    }

    fetchLiveWeather(lat, lon, locationName) {
        this.cityName = this.translateLocationToThai(locationName || this.cityName);
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=precipitation_probability,rain&timezone=auto`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data && data.current_weather) {
                    const temp = Math.round(data.current_weather.temperature);
                    const code = data.current_weather.weathercode;
                    this.currentTemp = temp;
                    this.weatherCode = code;

                    const weatherInfo = this.interpretWeatherCode(code);
                    this.isRaining = weatherInfo.isRain;

                    this.renderWeatherCard(weatherInfo, temp);
                }
            })
            .catch(err => console.error('Failed to fetch weather:', err));
    }

    interpretWeatherCode(code) {
        if (code === 0) return { title: '🌤️ ท้องฟ้าแจ่มใส', desc: 'วันนี้อากาศสดใส ไม่มีแนวโน้มฝนตกค่ะ', isRain: false, icon: '☀️' };
        if (code >= 1 && code <= 3) return { title: '⛅ มีเมฆบางส่วน', desc: 'ท้องฟ้ามีเมฆสลับแดด อากาศกำลังดีค่ะ', isRain: false, icon: '⛅' };
        if (code >= 51 && code <= 55) return { title: '🌧️ ฝนตกปรอยๆ', desc: 'มีฝนตกปรอยๆ ในพื้นที่ พกร่มติดตัวไว้นะคะ', isRain: true, icon: '🌧️' };
        if (code >= 61 && code <= 65) return { title: '🌧️ ฝนตกหนัก', desc: 'ตอนนี้มีฝนตกในพื้นที่ ระวังเปียกและวางแผนการเดินทางด้วยนะคะ', isRain: true, icon: '🌧️' };
        if (code >= 80 && code <= 82) return { title: '🌦️ ฝนตกเป็นช่วงๆ', desc: 'ตกๆ หยุดๆ โอกาสฝนตกสูงในพื้นที่ค่ะ', isRain: true, icon: '🌦️' };
        if (code >= 95) return { title: '⛈️ พายุฝนฟ้าคะนอง', desc: 'ระวังพายุฝนฟ้าคะนองและลมกระโชกแรงค่ะ', isRain: true, icon: '⛈️' };

        return { title: '🌤️ อากาศปกติ', desc: 'ตรวจสอบสภาพอากาศแบบเรียลไทม์', isRain: false, icon: '🌤️' };
    }

    renderWeatherCardSkeleton() {
        const container = document.getElementById('weather-widget-container');
        if (container) {
            container.innerHTML = `
                <div class="weather-card glass-card">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 1.8rem;">📍</span>
                        <div>
                            <span class="weather-title">กำลังเปิดระบบ GPS ติดตามพิกัดการเดินทางของคุณ...</span>
                            <span id="live-gps-clock" style="margin-left: 10px; background: rgba(56, 189, 248, 0.15); color: var(--accent-cyan); border: 1px solid rgba(56, 189, 248, 0.3); font-size: 0.78rem; padding: 3px 10px; border-radius: 12px; font-weight: 700; font-family: 'Inter', monospace;">🕒 --:--:-- น.</span>
                            <p class="weather-desc">ระบบจะเปลี่ยนตำแหน่งและสภาพอากาศให้อัตโนมัติทุกครั้งที่คุณเดินทางเปลี่ยนสถานที่</p>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    changeLocationManual() {
        const input = prompt('พิมพ์ชื่อเมือง/เขต/อำเภอ หรือจังหวัดที่คุณอยู่ (เช่น บางบัวทอง, นนทบุรี, ปากเกร็ด, กรุงเทพมหานคร, ชลบุรี):', this.cityName);
        if (input && input.trim()) {
            const locName = input.trim();
            const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locName)}&count=1&language=th&format=json`;
            fetch(geocodeUrl)
                .then(res => res.json())
                .then(data => {
                    if (data && data.results && data.results[0]) {
                        const { latitude, longitude, name, admin1 } = data.results[0];
                        const displayName = admin1 && name !== admin1 ? `${name}, ${admin1.replace('จังหวัด', '')}` : name;
                        this.fetchLiveWeather(latitude, longitude, displayName);
                        if (window.appController) window.appController.showToast(`📍 เปลี่ยนสถานที่ไปยัง ${displayName} เรียบร้อยแล้ว!`);
                    } else {
                        this.fetchLiveWeather(this.lat || 13.7563, this.lon || 100.5018, locName);
                    }
                })
                .catch(() => {
                    this.fetchLiveWeather(this.lat || 13.7563, this.lon || 100.5018, locName);
                });
        }
    }

    renderWeatherCard(info, temp) {
        const container = document.getElementById('weather-widget-container');
        if (!container) return;

        container.innerHTML = `
            <div class="weather-card glass-card ${info.isRain ? 'rain-alert-glow' : ''}">
                <div class="weather-left">
                    <div class="weather-icon-badge">${info.icon}</div>
                    <div class="weather-info-box">
                        <div class="weather-city-line">
                            <span class="weather-city-name">📍 <b>${this.cityName}</b></span>
                            <span class="weather-temp">${temp}°C</span>
                            <span id="live-gps-clock" class="live-clock-badge">🕒 --:--:-- น.</span>
                        </div>
                        <h4 class="weather-title">${info.title}</h4>
                        <p class="weather-desc">${info.desc}</p>
                        <div class="weather-action-row">
                            <button class="weather-btn" onclick="weatherController.requestBrowserLocationPermission()">📡 รีเฟรชพิกัด</button>
                            <button class="weather-btn" onclick="weatherController.changeLocationManual()">✏️ เลือกสถานที่เอง</button>
                        </div>
                    </div>
                </div>
                <div class="weather-right">
                    <span class="weather-status-chip ${info.isRain ? 'chip-rain' : 'chip-clear'}">
                        ${info.isRain ? '🌧️ ตอนนี้ฝนตก / โอกาสฝนสูง' : '☀️ ตอนนี้ฝนไม่ตก'}
                    </span>
                </div>
            </div>
        `;

        this.updateClockUI();
    }
}

const weatherController = window.weatherController = new WeatherController();

