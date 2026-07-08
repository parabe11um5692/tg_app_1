// ============================================================
// TELEGRAM WEB APP
// ============================================================
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

const user = tg.initDataUnsafe?.user || { id: 0, first_name: 'Артём', username: 'poland5692' };
document.getElementById('profileName').textContent = user.first_name || 'Артём';
document.getElementById('profileTag').textContent = '@' + (user.username || 'poland5692');

// ============================================================
// ЗАГРУЗКА ДАННЫХ
// ============================================================
let matchDayData = [];
let matchesData = {};
let topSignalsData = [];
let aiMatches = [];
let userData = null;

async function initializeApp() {
    try {
        console.log('🚀 Инициализация приложения...');
        
        // Проверяем доступность API
        const apiAvailable = await checkAPIAvailability();
        console.log(`📡 API доступно: ${apiAvailable ? '✅' : '❌'}`);
        
        // Загружаем данные
        await loadMatchesData();
        
        // Получаем данные из загрузчика
        matchDayData = getMatchDayData();
        matchesData = getMatchesData();
        topSignalsData = getTopSignalsData();
        aiMatches = getAIMatches();
        userData = getUserData();
        
        console.log('✅ Данные о матчах загружены:', {
            matchDay: matchDayData.length,
            leagues: Object.keys(matchesData).length,
            signals: topSignalsData.length,
            ai: aiMatches.length,
            user: userData ? 'есть' : 'нет'
        });
        
        // Обновляем информацию о пользователе в профиле
        updateUserProfile();
        
        // Запускаем приложение
        startApp();
    } catch (error) {
        console.error('❌ Ошибка загрузки данных:', error);
        // Всё равно запускаем приложение с дефолтными данными
        matchDayData = getMatchDayData();
        matchesData = getMatchesData();
        topSignalsData = getTopSignalsData();
        aiMatches = getAIMatches();
        startApp();
    }
}

/**
 * Проверка доступности API
 */
async function checkAPIAvailability() {
    try {
        if (typeof API !== 'undefined' && API.healthCheck) {
            return await API.healthCheck();
        }
        // Пробуем прямой запрос
        const response = await fetch('http://localhost:8000/docs');
        return response.ok;
    } catch (e) {
        return false;
    }
}

/**
 * Обновление профиля пользователя
 */
function updateUserProfile() {
    if (userData) {
        const remaining = userData.remaining || 0;
        const used = userData.analytics_used || 0;
        const freeLimit = userData.free_limit || 3;
        
        document.getElementById('profilePlan').textContent = 
            remaining > 0 ? `Бесплатный доступ (${remaining} из ${freeLimit})` : '🔒 Премиум-доступ';
    }
}

// ============================================================
// ЗАПУСК ПРИЛОЖЕНИЯ
// ============================================================
function startApp() {
    // ОНБОРДИНГ
    const hasSeenOnboarding = sessionStorage.getItem('uzarrai_onboarding_seen');
    
    if (hasSeenOnboarding) {
        document.getElementById('screen-onboarding').classList.add('hidden');
        document.getElementById('screen-matches').classList.remove('hidden');
        renderMatchDayScroll();
        renderMatches();
        renderAIMatches();
    } else {
        document.getElementById('screen-onboarding').classList.remove('hidden');
        document.getElementById('screen-matches').classList.add('hidden');
    }
}

// ============================================================
// ОНБОРДИНГ
// ============================================================
let currentSlide = 0;
const totalSlides = 4;

function goToSlide(index) {
    const slides = document.querySelectorAll('.onboarding-slide');
    const dots = document.querySelectorAll('.dot');
    slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
    dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
    currentSlide = index;
    const nextBtn = document.getElementById('onboardingNext');
    nextBtn.textContent = index === totalSlides - 1 ? '🚀 Начать' : 'Дальше →';
}

function nextSlide() {
    if (currentSlide < totalSlides - 1) { goToSlide(currentSlide + 1); }
    else { finishOnboarding(); }
}

function finishOnboarding() {
    sessionStorage.setItem('uzarrai_onboarding_seen', 'true');
    document.getElementById('screen-onboarding').classList.add('hidden');
    document.getElementById('screen-matches').classList.remove('hidden');
    renderMatchDayScroll();
    renderMatches();
    renderAIMatches();
}

function skipOnboarding() { finishOnboarding(); }

document.querySelectorAll('.dot').forEach((dot) => {
    dot.addEventListener('click', () => goToSlide(parseInt(dot.dataset.index)));
});
document.getElementById('onboardingNext').addEventListener('click', nextSlide);
document.getElementById('onboardingSkip').addEventListener('click', skipOnboarding);

// Свайп
let touchStartX = 0, touchEndX = 0;
document.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; });
document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
        if (diff > 0 && currentSlide < totalSlides - 1) { nextSlide(); }
        else if (diff < 0 && currentSlide > 0) { goToSlide(currentSlide - 1); }
    }
});

// ============================================================
// СОСТОЯНИЕ
// ============================================================
const state = {
    currentLeague: 'all',
    currentTariffContext: 'match',
    currentMatchId: null,
    isLoading: false
};

// ============================================================
// МАТЧ ДНЯ (ГОРИЗОНТАЛЬНЫЙ СКРОЛЛ)
// ============================================================
function renderMatchDayScroll() {
    const track = document.getElementById('matchDayTrack');
    if (!track) return;
    
    if (!matchDayData || matchDayData.length === 0) {
        track.innerHTML = '<div style="color:#666;padding:20px;text-align:center;">Нет матчей дня</div>';
        return;
    }
    
    track.innerHTML = matchDayData.map((match, index) => {
        return `
            <div class="match-day-card-wrapper" data-index="${index}">
                <div class="match-day-card" onclick="openMatchAnalysis(${match.matchId})">
                    <div class="match-day-tournament">${match.tournament}</div>
                    <div class="match-day-teams">
                        <div class="match-day-team">
                            <span class="team-flag">${match.flagHome}</span>
                            <span class="team-name">${match.home}</span>
                            <span class="team-stars">${match.starsHome}</span>
                        </div>
                        <span class="match-day-vs">VS</span>
                        <div class="match-day-team">
                            <span class="team-flag">${match.flagAway}</span>
                            <span class="team-name">${match.away}</span>
                            <span class="team-stars">${match.starsAway}</span>
                        </div>
                    </div>
                    <div class="match-day-favorite">
                        <span>Фаворит — <b>${match.favorite}</b></span>
                        <span class="favorite-percent">${match.percent}</span>
                    </div>
                    <div class="match-day-probability">
                        <div class="prob-item">
                            <span class="prob-label">П1</span>
                            <span class="prob-value">${match.p1}</span>
                        </div>
                        <div class="prob-item">
                            <span class="prob-label">X</span>
                            <span class="prob-value">${match.px}</span>
                        </div>
                        <div class="prob-item">
                            <span class="prob-label">П2</span>
                            <span class="prob-value">${match.p2}</span>
                        </div>
                    </div>
                    <div class="match-day-time">⏰ ${match.time}</div>
                    <button class="match-day-btn">📊 Открыть прогноз →</button>
                </div>
            </div>
        `;
    }).join('');
    
    const scrollContainer = document.querySelector('.match-day-scroll-track');
    if (scrollContainer) {
        scrollContainer.addEventListener('scroll', updateMatchDayLabel);
        setTimeout(updateMatchDayLabel, 100);
    }
}

function updateMatchDayLabel() {
    const track = document.getElementById('matchDayTrack');
    const label = document.getElementById('matchDayLabel');
    if (!track || !label) return;
    
    const scrollContainer = document.querySelector('.match-day-scroll-track');
    if (!scrollContainer) return;
    
    const scrollLeft = scrollContainer.scrollLeft;
    const containerWidth = scrollContainer.offsetWidth;
    const cardWidth = scrollContainer.querySelector('.match-day-card-wrapper')?.offsetWidth || 0;
    const gap = 12;
    const cardFullWidth = cardWidth + gap;
    
    const centerPosition = scrollLeft + containerWidth / 2;
    const activeIndex = Math.round(centerPosition / cardFullWidth);
    
    if (activeIndex === 0) {
        label.textContent = '📅 Ближайшие матчи';
    } else {
        label.textContent = '🔥 Матч дня';
    }
}

// ============================================================
// ОТРИСОВКА МАТЧЕЙ (ГЛАВНАЯ)
// ============================================================
function renderMatches() {
    const container = document.getElementById('matchesList');
    const matches = matchesData[state.currentLeague] || matchesData['all'] || [];
    
    if (!matches || matches.length === 0) {
        container.innerHTML = '<div class="loading">Нет матчей в выбранной лиге</div>';
        return;
    }
    
    let html = '';
    matches.forEach(match => {
        const hasAnalysis = match.analysis || match.has_analysis;
        html += `
            <div class="match-item" onclick="openMatchAnalysis(${match.id})">
                <div class="tournament">${match.tournament || match.league || 'Матч'}</div>
                <div class="teams">
                    <span>${match.home_team || match.home}</span>
                    <span style="color:#666;">vs</span>
                    <span>${match.away_team || match.away}</span>
                </div>
                <div class="time">⏰ ${match.date || match.time || 'Дата не указана'}</div>
                <span class="ai-badge">🧠 AI${hasAnalysis ? '' : ' (скоро)'}</span>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ============================================================
// ТОП-СИГНАЛЫ
// ============================================================
function renderTopSignals() {
    const container = document.getElementById('topSignals');
    if (!container) return;
    
    if (!topSignalsData || topSignalsData.length === 0) {
        container.innerHTML = '<div style="color:#666;padding:20px;text-align:center;">Нет сигналов</div>';
        return;
    }
    
    container.innerHTML = topSignalsData.map((signal) => `
        <div class="top-signal-card" onclick="openMatchAnalysis(${signal.matchId})">
            <div class="signal-left">
                <div class="tournament">${signal.tournament}</div>
                <div class="teams">${signal.home} vs ${signal.away}</div>
                <div class="time">⏰ ${signal.time}</div>
            </div>
            <div class="signal-right">
                <span class="badge">${signal.badge}</span>
                <span class="percent">${signal.percent}</span>
            </div>
        </div>
    `).join('');
}

// ============================================================
// ОТРИСОВКА ВКЛАДКИ AI
// ============================================================
function renderAIMatches() {
    renderTopSignals();
    
    const container = document.getElementById('aiMatchesList');
    if (!container) return;
    
    if (!aiMatches || aiMatches.length === 0) {
        container.innerHTML = '<div class="loading">Нет разобранных матчей</div>';
        return;
    }
    
    let html = '';
    aiMatches.forEach(match => {
        html += `
            <div class="match-item" onclick="openMatchAnalysis(${match.matchId})">
                <div class="tournament">${match.tournament}</div>
                <div class="teams">
                    <span>${match.home}</span>
                    <span style="color:#666;">vs</span>
                    <span>${match.away}</span>
                </div>
                <div class="time">⏰ ${match.time}</div>
                <span class="ai-badge">🧠 ${match.badge}</span>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ============================================================
// ОТКРЫТИЕ АНАЛИЗА МАТЧА (С ИСПОЛЬЗОВАНИЕМ API)
// ============================================================
async function openMatchAnalysis(matchId) {
    if (state.isLoading) return;
    state.isLoading = true;
    state.currentMatchId = matchId;
    
    try {
        // Показываем индикатор загрузки
        tg.showAlert('⏳ Загрузка анализа...');
        
        // Получаем анализ через API
        let analysisData = null;
        
        if (typeof API !== 'undefined' && API.getAnalysis) {
            analysisData = await API.getAnalysis(matchId);
        } else {
            // Fallback: пробуем прямой запрос
            const userId = getUserId();
            const response = await fetch(`http://localhost:8000/api/analysis?match_id=${matchId}&user_id=${userId}`);
            if (response.ok) {
                analysisData = await response.json();
            }
        }
        
        if (analysisData && !analysisData.error) {
            // Показываем анализ
            showAnalysisModal(analysisData);
        } else if (analysisData?.error) {
            tg.showAlert(`❌ ${analysisData.error}`);
        } else {
            // Если анализ не загрузился, показываем тарифы
            openTariffsForMatch(matchId);
        }
        
    } catch (error) {
        console.error('Ошибка загрузки анализа:', error);
        // При ошибке показываем тарифы
        openTariffsForMatch(matchId);
    } finally {
        state.isLoading = false;
    }
}

/**
 * Показать модальное окно с анализом
 */
function showAnalysisModal(data) {
    const hasAnalysis = data.has_analysis !== false && data.analysis;
    const isFree = data.remaining !== undefined && data.remaining >= 0;
    
    let message = `📊 ${data.home_team} vs ${data.away_team}\n\n`;
    message += `🏆 Лига: ${data.league || 'Не указана'}\n`;
    message += `📅 ${data.date || 'Дата не указана'}\n`;
    message += `⭐ Рейтинг: ${data.rating || 0}%\n\n`;
    
    if (hasAnalysis && isFree) {
        message += `📝 Анализ:\n${data.analysis}\n\n`;
        message += `🎯 Прогноз: ${data.prediction || 'Нет данных'}\n\n`;
        message += `📊 Осталось бесплатных: ${data.remaining}`;
    } else if (!isFree) {
        message += `🔒 Бесплатные анализы закончились!\n`;
        message += `💎 Оформи подписку для доступа ко всем прогнозам.`;
    } else {
        message += `❌ Анализ для этого матча пока не готов.`;
    }
    
    tg.showAlert(message);
    
    // Если нет анализа или закончились бесплатные, показываем тарифы
    if (!hasAnalysis || !isFree) {
        setTimeout(() => {
            openTariffsForMatch(state.currentMatchId);
        }, 500);
    }
}

// ============================================================
// ВЫБОР ЛИГИ (ГЛАВНАЯ)
// ============================================================
document.querySelectorAll('.league-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.league-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentLeague = btn.dataset.league;
        renderMatches();
    });
});

// ============================================================
// ФИЛЬТРЫ AI
// ============================================================
document.querySelectorAll('#aiLeagueFilters .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('#aiLeagueFilters .filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        // Здесь можно добавить фильтрацию AI матчей
    });
});

document.querySelectorAll('#aiTimeFilters .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('#aiTimeFilters .filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        // Здесь можно добавить фильтрацию по времени
    });
});

// ============================================================
// ОТКРЫТИЕ ТАРИФОВ
// ============================================================
function openTariffsForMatch(matchId) {
    state.currentTariffContext = 'match';
    state.currentMatchId = matchId;
    
    document.getElementById('screen-matches').classList.add('hidden');
    document.getElementById('screen-ai').classList.add('hidden');
    document.getElementById('screen-tariffs').classList.remove('hidden');
    renderTariffsSlider('tariffsContent', '🔓 Открой прогноз');
}

function openTariffsForAI() {
    state.currentTariffContext = 'ai';
    document.getElementById('screen-matches').classList.add('hidden');
    document.getElementById('screen-ai').classList.add('hidden');
    document.getElementById('screen-tariffs').classList.remove('hidden');
    renderTariffsSlider('tariffsContent', '🧠 AI-разбор доступен по подписке');
}

function openTariffsForExpress() {
    state.currentTariffContext = 'express';
    document.getElementById('screen-matches').classList.add('hidden');
    document.getElementById('screen-ai').classList.add('hidden');
    document.getElementById('screen-tariffs').classList.remove('hidden');
    renderTariffsSlider('tariffsContent', '⚡ Экспресс-доступ');
}

function openTariffsFromProfile() {
    state.currentTariffContext = 'profile';
    document.getElementById('screen-profile').classList.add('hidden');
    document.getElementById('screen-tariffs').classList.remove('hidden');
    renderTariffsSlider('tariffsContent', '💎 Выбери тариф');
}

function backFromTariffs() {
    document.getElementById('screen-tariffs').classList.add('hidden');
    if (state.currentTariffContext === 'profile') {
        document.getElementById('screen-profile').classList.remove('hidden');
    } else if (state.currentTariffContext === 'ai') {
        document.getElementById('screen-ai').classList.remove('hidden');
    } else {
        document.getElementById('screen-matches').classList.remove('hidden');
    }
}

document.getElementById('backFromTariffs').addEventListener('click', backFromTariffs);

// ============================================================
// ТАРИФЫ
// ============================================================
function renderTariffsSlider(containerId, title) {
    const container = document.getElementById(containerId);
    container.innerHTML = `
        <div style="margin-bottom:16px;font-size:18px;font-weight:700;color:#fff;">${title}</div>
        <div style="font-size:14px;color:#666;margin-bottom:16px;">AI-прогнозы по всем матчам дня без лимитов и блокировки</div>
        <div class="tariffs-slider">
            <div class="tariff-card-slide">
                <div class="tariff-name">Pro</div>
                <div class="tariff-price">5 990 ₽<span class="period">/мес</span></div>
                <ul class="tariff-features">
                    <li>5–7 прогнозов в день</li>
                    <li>Основные матчи топ-лиг</li>
                    <li>Одиночные ставки с рабочими коэффициентами</li>
                    <li>Краткая аналитика матчей</li>
                    <li>Оптимальные варианты из линии букмекеров</li>
                    <li>Стабильная игровая стратегия</li>
                    <li>Подходит для спокойного роста банка</li>
                    <li>Приоритетные ставки дня</li>
                </ul>
                <button class="tariff-btn pro" onclick="tg.openTelegramLink('https://t.me/poland5692')">
                    💳 Оформить Pro
                </button>
            </div>
            <div class="tariff-card-slide popular">
                <div class="tariff-name">MAX</div>
                <div class="tariff-price">14 990 ₽<span class="period">/мес</span></div>
                <ul class="tariff-features">
                    <li>Всё, что в Pro</li>
                    <li>Быстрые уведомления о лучших коэффициентах</li>
                    <li>Доступ к самым сильным сигналам</li>
                    <li>Приоритетная поддержка 24/7</li>
                    <li>Эксклюзивные матчи и турниры</li>
                </ul>
                <button class="tariff-btn max" onclick="tg.openTelegramLink('https://t.me/poland5692')">
                    💎 Оформить MAX
                </button>
            </div>
        </div>
        <div class="tariff-note">
            ⚡ Автопродление. Отмена в любой момент.<br>
            Прогнозы — аналитика, не гарантия результата.
        </div>
    `;
}

// ============================================================
// ЛИЧНЫЙ КАБИНЕТ
// ============================================================
document.getElementById('profileBtn').addEventListener('click', () => {
    document.getElementById('screen-matches').classList.add('hidden');
    document.getElementById('screen-ai').classList.add('hidden');
    document.getElementById('screen-profile').classList.remove('hidden');
    // Обновляем данные профиля при открытии
    updateUserProfile();
});

const profileBtnAI = document.getElementById('profileBtnAI');
if (profileBtnAI) {
    profileBtnAI.addEventListener('click', () => {
        document.getElementById('screen-matches').classList.add('hidden');
        document.getElementById('screen-ai').classList.add('hidden');
        document.getElementById('screen-profile').classList.remove('hidden');
        updateUserProfile();
    });
}

document.getElementById('backFromProfile').addEventListener('click', () => {
    document.getElementById('screen-profile').classList.add('hidden');
    document.getElementById('screen-matches').classList.remove('hidden');
});

// ============================================================
// МЕНЮ В ПРОФИЛЕ
// ============================================================
function showGlossary() {
    tg.showAlert('📖 Глоссарий:\n\nИТБ — индивидуальный тотал больше\nФора — преимущество в голах\nТай-брейк — дополнительное время\nxG — ожидаемые голы\nВинлайн — победа в основное время');
}

function showTour() {
    tg.showAlert('🎯 Тур по приложению:\n\n1️⃣ Выбери матч на главной\n2️⃣ Оформи подписку Pro или MAX\n3️⃣ Получи AI-прогноз с разбором');
}

function toggleTheme() {
    const status = document.getElementById('themeStatus');
    const body = document.body;
    const current = status.textContent.trim();
    
    if (current === 'тёмная') {
        status.textContent = 'светлая';
        body.classList.add('light-theme');
        body.style.background = '';
        body.style.color = '';
    } else {
        status.textContent = 'тёмная';
        body.classList.remove('light-theme');
        body.style.background = '';
        body.style.color = '';
    }
}

function showSupport() {
    tg.openTelegramLink('https://t.me/poland5692');
}

// ============================================================
// НИЖНЯЯ НАВИГАЦИЯ
// ============================================================
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        const tab = item.dataset.tab;
        if (tab === 'matches') {
            document.getElementById('screen-tariffs').classList.add('hidden');
            document.getElementById('screen-profile').classList.add('hidden');
            document.getElementById('screen-ai').classList.add('hidden');
            document.getElementById('screen-matches').classList.remove('hidden');
        } else if (tab === 'ai') {
            document.getElementById('screen-tariffs').classList.add('hidden');
            document.getElementById('screen-profile').classList.add('hidden');
            document.getElementById('screen-matches').classList.add('hidden');
            document.getElementById('screen-ai').classList.remove('hidden');
            renderAIMatches();
        } else if (tab === 'express') {
            openTariffsForExpress();
        }
    });
});

// ============================================================
// АНИМАЦИЯ ИКОНКИ ПРИ СКРОЛЛЕ
// ============================================================
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header-mini');
    if (!header) return;
    
    const scrollY = window.scrollY;
    
    if (scrollY > 50) {
        header.style.boxShadow = '0 2px 30px rgba(255, 107, 0, 0.15)';
        header.style.borderBottom = '1px solid rgba(255, 107, 0, 0.1)';
    } else {
        header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.7)';
        header.style.borderBottom = '1px solid rgba(255, 255, 255, 0.03)';
    }
});

// ============================================================
// ПОЛУЧИТЬ ID ПОЛЬЗОВАТЕЛЯ (глобально)
// ============================================================
function getUserId() {
    try {
        const tg = window.Telegram?.WebApp;
        const user = tg?.initDataUnsafe?.user;
        return user?.id || 0;
    } catch (e) {
        return 0;
    }
}

// Делаем функцию глобальной
window.getUserId = getUserId;
window.openMatchAnalysis = openMatchAnalysis;

// ============================================================
// ЗАПУСК
// ============================================================
console.log('🚀 UzarrAI приложение загружается...');

// Инициализируем приложение
initializeApp();