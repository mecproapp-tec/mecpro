export function getBaseUrl(): string {
  // 🔥 CORREÇÃO #36: Usar múltiplas fontes de URL
  const url = process.env.PUBLIC_URL || process.env.APP_URL || process.env.FRONTEND_URL;
  
  // 🔥 CORREÇÃO #35: Fallback para localhost em desenvolvimento
  if (!url) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('URL pública não definida. Configure PUBLIC_URL, APP_URL ou FRONTEND_URL no .env');
    }
    // Em desenvolvimento, usar localhost
    console.warn('⚠️ URL pública não definida. Usando fallback: http://localhost:5173');
    return 'http://localhost:5173';
  }

  // 🔥 CORREÇÃO #35: Validar URL (formato básico)
  const urlPattern = /^https?:\/\/[^\s]+$/;
  if (!urlPattern.test(url)) {
    throw new Error(`URL inválida: ${url}. Deve começar com http:// ou https://`);
  }

  return url.replace(/\/$/, ''); // remove barra final
}