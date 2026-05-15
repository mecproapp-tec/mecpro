"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBaseUrl = getBaseUrl;
function getBaseUrl() {
    const url = process.env.PUBLIC_URL || process.env.APP_URL || process.env.FRONTEND_URL;
    if (!url) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('URL pública não definida. Configure PUBLIC_URL, APP_URL ou FRONTEND_URL no .env');
        }
        console.warn('⚠️ URL pública não definida. Usando fallback: http://localhost:5173');
        return 'http://localhost:5173';
    }
    const urlPattern = /^https?:\/\/[^\s]+$/;
    if (!urlPattern.test(url)) {
        throw new Error(`URL inválida: ${url}. Deve começar com http:// ou https://`);
    }
    return url.replace(/\/$/, '');
}
//# sourceMappingURL=get-base-url.js.map