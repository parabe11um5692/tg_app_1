// ============================================================
// ЗАГРУЗЧИК ДАННЫХ О МАТЧАХ (с бекенда через API)
// ============================================================

let matchData = null;
let userId = null;
let isLoading = false;

/**
 * Получить ID пользователя из Telegram
 */
function getUserId() {
    if (userId) return userId;
    try {
        const tg = window.Telegram?.WebApp;
        const user = tg?.initDataUnsafe?.user;
        userId = user?.id || 0;
        return userId;
    } catch (e) {
        console.warn('Ошибка получения user_id:', e);
        return 0;
    }
}

/**
 * Загружает данные о матчах через API
 * @returns {Promise<Object>} Данные о матчах
 */
async function loadMatchesData() {
    // Если данные уже загружены, возвращаем их из кеша
    if (matchData) {
        return matchData;
    }

    // Предотвращаем множественные одновременные загрузки
    if (isLoading) {
        await new Promise(resolve => {
            const checkInterval = setInterval(() => {
                if (!isLoading) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        });
        return matchData;
    }

    isLoading = true;
    console.log('📥 Загрузка данных о матчах...');

    try {
        const uid = getUserId();
        
        // Пытаемся загрузить через API
        const data = await fetchMatchesFromAPI(uid);
        
        if (data) {
            // Трансформируем данные в нужный формат
            matchData = transformMatchesData(data);
            
            // Сохраняем в localStorage для офлайн-доступа
            try {
                localStorage.setItem('uzarrai_match_data', JSON.stringify(matchData));
                localStorage.setItem('uzarrai_match_data_timestamp', Date.now().toString());
            } catch (e) {
                console.warn('Не удалось сохранить данные в localStorage:', e);
            }
            
            console.log('✅ Данные загружены через API');
            isLoading = false;
            return matchData;
        }

        // Если API не ответил, пробуем загрузить из localStorage
        console.warn('⚠️ API не ответил, пробуем кеш...');
        const cached = loadFromCache();
        if (cached) {
            console.log('✅ Данные загружены из кеша');
            matchData = cached;
            isLoading = false;
            return matchData;
        }

        // Если ничего не работает, используем дефолтные данные
        console.warn('⚠️ Используем дефолтные данные');
        matchData = getDefaultMatchData();
        isLoading = false;
        return matchData;

    } catch (error) {
        console.error('❌ Ошибка загрузки данных:', error);
        
        // Пробуем загрузить из кеша
        const cached = loadFromCache();
        if (cached) {
            console.log('✅ Данные загружены из кеша (после ошибки)');
            matchData = cached;
            isLoading = false;
            return matchData;
        }
        
        // Используем дефолтные данные
        matchData = getDefaultMatchData();
        isLoading = false;
        return matchData;
    }
}

/**
 * Загружает данные из API
 */
async function fetchMatchesFromAPI(userId) {
    try {
        // Используем глобальный объект API (из api.js)
        if (typeof API !== 'undefined' && API.getAllMatches) {
            const response = await API.getAllMatches(userId);
            if (response && response.matches) {
                return response;
            }
        }
        
        // Если API не доступен, пробуем прямой запрос
        const API_BASE_URL = 'http://localhost:8000';
        const url = `${API_BASE_URL}/api/matches/all?user_id=${userId}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
        
    } catch (error) {
        console.error('Ошибка запроса к API:', error);
        return null;
    }
}

/**
 * Загружает данные из localStorage
 */
function loadFromCache() {
    try {
        const cached = localStorage.getItem('uzarrai_match_data');
        if (cached) {
            const data = JSON.parse(cached);
            const timestamp = localStorage.getItem('uzarrai_match_data_timestamp');
            
            // Проверяем, не устарел ли кеш (24 часа)
            if (timestamp) {
                const age = Date.now() - parseInt(timestamp);
                if (age > 24 * 60 * 60 * 1000) {
                    console.warn('⚠️ Кеш устарел (старше 24 часов)');
                    return null;
                }
            }
            
            return data;
        }
    } catch (e) {
        console.warn('Не удалось загрузить данные из localStorage:', e);
    }
    return null;
}

/**
 * Трансформирует данные из API в формат для фронтенда
 */
function transformMatchesData(apiData) {
    const matches = apiData.matches || [];
    
    if (matches.length === 0) {
        return getDefaultMatchData();
    }
    
    // Группируем матчи по лигам
    const matchesByLeague = {
        'all': matches
    };
    
    matches.forEach(match => {
        const league = match.league || 'other';
        if (!matchesByLeague[league]) {
            matchesByLeague[league] = [];
        }
        matchesByLeague[league].push(match);
    });
    
    // Создаём матчи дня (первые 3 с самым высоким рейтингом)
    const sortedMatches = [...matches].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    const matchDayData = sortedMatches.slice(0, 3).map(match => ({
        home: match.home_team,
        away: match.away_team,
        flagHome: match.flag_home || '🏳️',
        flagAway: match.flag_away || '🏳️',
        starsHome: match.stars_home || '★★★★☆',
        starsAway: match.stars_away || '★★★★☆',
        tournament: match.tournament || match.league || '',
        favorite: match.favorite || match.home_team,
        percent: match.percent || '50%',
        p1: match.p1 || '45%',
        px: match.px || '30%',
        p2: match.p2 || '25%',
        time: match.date || 'Дата не указана',
        matchId: match.id,
        rating: match.rating || 0,
        hasAnalysis: match.has_analysis || false
    }));
    
    // Топ-сигналы (матчи с рейтингом >= 70 и с анализом)
    const topSignalsData = matches
        .filter(m => (m.rating || 0) >= 70 && m.analysis)
        .slice(0, 5)
        .map(m => ({
            tournament: m.tournament || m.league || '',
            home: m.home_team,
            away: m.away_team,
            time: m.date || 'Дата не указана',
            percent: m.rating ? `${m.rating}%` : '50%',
            badge: 'AI',
            matchId: m.id,
            rating: m.rating || 0
        }));
    
    // AI-матчи (все с анализом)
    const aiMatches = matches
        .filter(m => m.analysis)
        .map(m => ({
            home: m.home_team,
            away: m.away_team,
            tournament: m.tournament || m.league || '',
            time: m.date || 'Дата не указана',
            badge: 'AI',
            matchId: m.id,
            rating: m.rating || 0
        }));
    
    // Если нет AI-матчей, добавляем дефолтные
    if (aiMatches.length === 0) {
        const defaultData = getDefaultMatchData();
        return defaultData;
    }
    
    return {
        matchDayData,
        matchesData: matchesByLeague,
        topSignalsData,
        aiMatches,
        user: apiData.user || null
    };
}

/**
 * Дефолтные данные на случай, если API не отвечает
 */
function getDefaultMatchData() {
    return {
        matchDayData: [
            {
                home: 'Франция',
                away: 'Марокко',
                flagHome: '🇫🇷',
                flagAway: '🇲🇦',
                starsHome: '★★★★★',
                starsAway: '★★★★☆',
                tournament: 'ЧЕМПИОНАТ МИРА 2026 · 1/4 ФИНАЛА',
                favorite: 'Франция',
                percent: '60%',
                p1: '60%',
                px: '25%',
                p2: '15%',
                time: 'Завтра, 23:00 МСК · через 24 ч',
                matchId: 4,
                rating: 88,
                hasAnalysis: true
            },
            {
                home: 'Ливерпуль',
                away: 'Реал Мадрид',
                flagHome: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
                flagAway: '🇪🇸',
                starsHome: '★★★★★',
                starsAway: '★★★★★',
                tournament: 'ЛИГА ЧЕМПИОНОВ · ФИНАЛ',
                favorite: 'Ливерпуль',
                percent: '52%',
                p1: '52%',
                px: '28%',
                p2: '20%',
                time: 'Завтра, 22:00 МСК · через 23 ч',
                matchId: 5,
                rating: 85,
                hasAnalysis: true
            },
            {
                home: 'Бавария',
                away: 'ПСЖ',
                flagHome: '🇩🇪',
                flagAway: '🇫🇷',
                starsHome: '★★★★☆',
                starsAway: '★★★★☆',
                tournament: 'ЛИГА ЧЕМПИОНОВ · 1/2 ФИНАЛА',
                favorite: 'Бавария',
                percent: '55%',
                p1: '55%',
                px: '25%',
                p2: '20%',
                time: 'Послезавтра, 22:00 МСК · через 47 ч',
                matchId: 6,
                rating: 82,
                hasAnalysis: true
            }
        ],
        matchesData: {
            'all': [
                { id: 1, home: 'Атлетик Клуб д\'Ескалдес', away: 'Морнар', time: '17:00 МСК', tournament: 'Лига Конференций', league: 'conference', rating: 78 },
                { id: 2, home: 'Алашкерт', away: 'Елимай Семей', time: '19:00 МСК', tournament: 'Лига Конференций', league: 'conference', rating: 72 },
                { id: 3, home: 'ФК Лиепаджа', away: 'Деҫис', time: '19:00 МСК', tournament: 'Лига Конференций', league: 'conference', rating: 65 },
                { id: 4, home: 'Ливерпуль', away: 'Реал Мадрид', time: '22:00 МСК', tournament: 'Лига Чемпионов', league: 'champions', rating: 88 },
                { id: 5, home: 'Бавария', away: 'ПСЖ', time: '22:00 МСК', tournament: 'Лига Чемпионов', league: 'champions', rating: 82 }
            ],
            'conference': [
                { id: 1, home: 'Атлетик Клуб д\'Ескалдес', away: 'Морнар', time: '17:00 МСК', tournament: 'Лига Конференций', league: 'conference', rating: 78 },
                { id: 2, home: 'Алашкерт', away: 'Елимай Семей', time: '19:00 МСК', tournament: 'Лига Конференций', league: 'conference', rating: 72 },
                { id: 3, home: 'ФК Лиепаджа', away: 'Деҫис', time: '19:00 МСК', tournament: 'Лига Конференций', league: 'conference', rating: 65 }
            ],
            'champions': [
                { id: 4, home: 'Ливерпуль', away: 'Реал Мадрид', time: '22:00 МСК', tournament: 'Лига Чемпионов', league: 'champions', rating: 88 },
                { id: 5, home: 'Бавария', away: 'ПСЖ', time: '22:00 МСК', tournament: 'Лига Чемпионов', league: 'champions', rating: 82 }
            ]
        },
        topSignalsData: [
            {
                tournament: 'Чемпионат мира 2026',
                home: 'Франция',
                away: 'Марокко',
                time: '23:00 МСК',
                percent: '70%',
                badge: 'AI',
                matchId: 4,
                rating: 88
            },
            {
                tournament: 'Лига Чемпионов · 1/2',
                home: 'Ливерпуль',
                away: 'Реал Мадрид',
                time: '22:00 МСК',
                percent: '52%',
                badge: 'AI',
                matchId: 5,
                rating: 85
            },
            {
                tournament: 'Бундес-Лига · Тур 34',
                home: 'Бавария',
                away: 'ПСЖ',
                time: '22:00 МСК',
                percent: '55%',
                badge: 'AI',
                matchId: 6,
                rating: 82
            }
        ],
        aiMatches: [
            { home: 'Атлетик Клуб д\'Ескалдес', away: 'Морнар', tournament: 'Лига Конференций', time: '17:00 МСК', badge: 'AI', matchId: 1, rating: 78 },
            { home: 'Алашкерт', away: 'Елимай Семей', tournament: 'Лига Конференций', time: '19:00 МСК', badge: 'AI', matchId: 2, rating: 72 },
            { home: 'ФК Лиепаджа', away: 'Деҫис', tournament: 'Лига Конференций', time: '19:00 МСК', badge: 'AI', matchId: 3, rating: 65 },
            { home: 'Бавария', away: 'ПСЖ', tournament: 'Лига Чемпионов', time: '22:00 МСК', badge: 'AI', matchId: 6, rating: 82 }
        ],
        user: null
    };
}

/**
 * Получить данные о матчах дня
 */
function getMatchDayData() {
    return matchData?.matchDayData || getDefaultMatchData().matchDayData;
}

/**
 * Получить данные о всех матчах по лигам
 */
function getMatchesData() {
    return matchData?.matchesData || getDefaultMatchData().matchesData;
}

/**
 * Получить топ-сигналы
 */
function getTopSignalsData() {
    return matchData?.topSignalsData || getDefaultMatchData().topSignalsData;
}

/**
 * Получить AI-матчи
 */
function getAIMatches() {
    return matchData?.aiMatches || getDefaultMatchData().aiMatches;
}

/**
 * Получить данные пользователя
 */
function getUserData() {
    return matchData?.user || null;
}

/**
 * Проверить, загружены ли данные
 */
function isDataLoaded() {
    return matchData !== null;
}

/**
 * Принудительно обновить данные
 */
async function refreshMatchesData() {
    // Очищаем кеш
    matchData = null;
    try {
        localStorage.removeItem('uzarrai_match_data');
        localStorage.removeItem('uzarrai_match_data_timestamp');
    } catch (e) {}
    
    // Загружаем заново
    return await loadMatchesData();
}

// ============================================================
// ЭКСПОРТ (для использования в других файлах)
// ============================================================

// Для браузера (глобальные переменные)
window.matchData = matchData;
window.getMatchDayData = getMatchDayData;
window.getMatchesData = getMatchesData;
window.getTopSignalsData = getTopSignalsData;
window.getAIMatches = getAIMatches;
window.getUserData = getUserData;
window.loadMatchesData = loadMatchesData;
window.refreshMatchesData = refreshMatchesData;
window.isDataLoaded = isDataLoaded;
window.getUserId = getUserId;

// Для Node.js (если используется)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadMatchesData,
        refreshMatchesData,
        getMatchDayData,
        getMatchesData,
        getTopSignalsData,
        getAIMatches,
        getUserData,
        isDataLoaded,
        getUserId
    };
}

// ============================================================
// ЛОГ ДЛЯ ОТЛАДКИ
// ============================================================
console.log('📦 Загрузчик матчей инициализирован');
console.log(`👤 Текущий user_id: ${getUserId()}`);
console.log(`💾 Кеш: ${localStorage.getItem('uzarrai_match_data') ? 'есть' : 'нет'}`);