// ============================================================
// API КЛИЕНТ ДЛЯ FASTAPI
// ============================================================

// Конфигурация API
const API_CONFIG = {
    // Для локальной разработки
    baseURL: 'http://localhost:8000',
    // Для продакшена (раскомментировать при деплое)
    // baseURL: 'https://your-api-domain.com',
    timeout: 10000
};

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

/**
 * Получить ID пользователя из Telegram
 */
function getUserId() {
    try {
        const tg = window.Telegram?.WebApp;
        const user = tg?.initDataUnsafe?.user;
        return user?.id || 0;
    } catch (e) {
        console.warn('Ошибка получения user_id:', e);
        return 0;
    }
}

/**
 * Базовый запрос к API
 */
async function apiRequest(endpoint, params = {}) {
    const url = new URL(`${API_CONFIG.baseURL}${endpoint}`);
    
    // Добавляем параметры
    Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
            url.searchParams.append(key, params[key]);
        }
    });
    
    // Добавляем user_id автоматически, если не передан
    if (!params.user_id) {
        url.searchParams.append('user_id', getUserId());
    }
    
    try {
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Ошибка запроса к ${endpoint}:`, error);
        throw error;
    }
}

// ============================================================
// API МЕТОДЫ
// ============================================================

const API = {
    /**
     * Получить все матчи с информацией о пользователе
     * @param {number} userId - ID пользователя (опционально)
     * @returns {Promise<Object>} { matches, user }
     */
    async getAllMatches(userId) {
        return apiRequest('/api/matches/all', { user_id: userId });
    },

    /**
     * Получить топ-3 матча дня
     * @param {number} userId - ID пользователя (опционально)
     * @returns {Promise<Object>} { matches, user }
     */
    async getMatchesDay(userId) {
        return apiRequest('/api/matches/day', { user_id: userId });
    },

    /**
     * Получить матчи по лиге
     * @param {string} league - ID лиги
     * @param {number} userId - ID пользователя (опционально)
     * @returns {Promise<Object>} { matches, count }
     */
    async getMatchesByLeague(league, userId) {
        return apiRequest('/api/matches', { 
            league: league,
            user_id: userId 
        });
    },

    /**
     * Получить топ-сигналы (рейтинг > 70%)
     * @param {number} limit - Максимальное количество сигналов
     * @param {number} userId - ID пользователя (опционально)
     * @returns {Promise<Object>} { signals, total }
     */
    async getTopSignals(limit = 5, userId) {
        return apiRequest('/api/matches/top-signals', { 
            limit: limit,
            user_id: userId 
        });
    },

    /**
     * Получить список всех лиг
     * @param {number} userId - ID пользователя (опционально)
     * @returns {Promise<Object>} { leagues, analytics_used, free_limit, remaining }
     */
    async getLeagues(userId) {
        return apiRequest('/api/leagues', { user_id: userId });
    },

    /**
     * Получить AI-анализ конкретного матча
     * @param {number} matchId - ID матча
     * @param {number} userId - ID пользователя (опционально)
     * @returns {Promise<Object>} Анализ матча
     */
    async getAnalysis(matchId, userId) {
        return apiRequest('/api/analysis', { 
            match_id: matchId,
            user_id: userId 
        });
    },

    /**
     * Получить статистику пользователя
     * @param {number} userId - ID пользователя (опционально)
     * @returns {Promise<Object>} { user_id, analytics_used, free_limit, remaining, is_premium }
     */
    async getUserStats(userId) {
        return apiRequest('/api/user/stats', { user_id: userId });
    },

    /**
     * Проверить доступность API
     * @returns {Promise<boolean>}
     */
    async healthCheck() {
        try {
            const response = await fetch(`${API_CONFIG.baseURL}/docs`);
            return response.ok;
        } catch (e) {
            return false;
        }
    }
};

// ============================================================
// ЭКСПОРТ (для использования в других файлах)
// ============================================================

// Для браузера (глобальная переменная)
window.API = API;
window.getUserId = getUserId;

// Для Node.js (если используется)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        API,
        getUserId,
        API_CONFIG
    };
}

// ============================================================
// ЛОГ ДЛЯ ОТЛАДКИ
// ============================================================
console.log('📡 API клиент инициализирован');
console.log(`🔗 Базовый URL: ${API_CONFIG.baseURL}`);
console.log(`👤 Текущий user_id: ${getUserId()}`);