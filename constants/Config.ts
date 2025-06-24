// API Configuration
// Bu dosyayı kendi API sunucunuzun URL'i ile güncelleyin

// Gerçek API sunucunuzun URL'ini buraya yazın:
export const API_BASE_URL: string = "https://adaav-wetmap-api.glynet.com/api";

// Alternatif URL'ler (test için):
// export const API_BASE_URL: string = "http://31.220.73.21:5000/api/";
// export const API_BASE_URL: string = "https://api.cyprush2.com/api/";

// Eğer API sunucunuz yoksa, offline mod için boş bırakın:
// export const API_BASE_URL: string = "";

// Eğer local development yapıyorsanız:
// export const API_BASE_URL: string = "http://localhost:3000/api/";

// API Timeout ayarları
export const API_TIMEOUT: number = 30000; // 30 saniye

// Retry ayarları
export const API_RETRY_ATTEMPTS: number = 3;
export const API_RETRY_DELAY: number = 1000; // 1 saniye

// Cache ayarları
export const CACHE_DURATION: number = 5 * 60 * 1000; // 5 dakika

// Debug modu
export const DEBUG_MODE: boolean = __DEV__;

// App versiyonu
export const APP_VERSION: string = "1.0.0";

// Build numarası
export const BUILD_NUMBER: string = "1";
