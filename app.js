// ============================================================
// TELEGRAM WEB APP
// ============================================================
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

const user = tg.initDataUnsafe?.user || { id: 0, first_name: 'Гость', username: 'guest' };
document.getElementById('profileName').textContent = user.first_name || 'Артём';
document.getElementById('profileTag').textContent = '@' + (user.username || 'poland5692');

// ============================================================
// ОНБОРДИНГ
// ============================================================
let currentSlide = 0;
const totalSlides = 4;
const hasSeenOnboarding = sessionStorage.getItem('uzarrai_onboarding_seen');

function goToSlide(index) {
    const slides = document.querySelectorAll('.onboarding-slide');
    const dots = document.querySelectorAll('.dot');
    
    slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === index);
    });
    
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
    
    currentSlide = index;
    const nextBtn = document.getElementById('onboardingNext');
    nextBtn.textContent = index === totalSlides - 1 ? '🚀 Начать' : 'Дальше →';
}

function nextSlide() {
    if (currentSlide < totalSlides - 1) {
        goToSlide(currentSlide + 1);
    } else {
        finishOnboarding();
    }
}

function finishOnboarding() {
    sessionStorage.setItem('uzarrai_onboarding_seen', 'true');
    document.getElementById('screen-onboarding').classList.add('hidden');
    document.getElementById('screen-matches').classList.remove('hidden');
    renderMatches();
}

function skipOnboarding() {
    finishOnboarding();
}

document.addEventListener('DOMContentLoaded', () => {
    if (hasSeenOnboarding) {
        document.getElementById('screen-onboarding').classList.add('hidden');
        document.getElementById('screen-matches').classList.remove('hidden');
        renderMatches();
        return;
    }
    document.getElementById('screen-onboarding').classList.remove('hidden');
    document.getElementById('screen-matches').classList.add('hidden');
});

document.querySelectorAll('.dot').forEach((dot) => {
    dot.addEventListener('click', () => {
        goToSlide(parseInt(dot.dataset.index));
    });
});

document.getElementById('onboardingNext').addEventListener('click', nextSlide);
document.getElementById('onboardingSkip').addEventListener('click', skipOnboarding);

let touchStartX = 0;
let touchEndX = 0;
document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
});
document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
        if (diff > 0 && currentSlide < totalSlides - 1) {
            nextSlide();
        } else if (diff < 0 && currentSlide > 0) {
            goToSlide(currentSlide - 1);
        }
    }
});

// ============================================================
// СОСТОЯНИЕ
// ============================================================
const state = {
    leagueFilter: 'all',
    timeFilter: 'all',
    currentMatchId: null,
    currentTariffContext: 'match' // 'match', 'express', 'analysis'
};

// ============================================================
// ДАННЫЕ (МОК)
// ============================================================
const matchesData = {
    '2026-07-08': [
        { id: 1, home: 'Атлетик Клуб д\'Ескалдес', away: 'Морнар', time: '17:00 МСК', tournament: 'Лига Конференций', league: 'conference' },
        { id: 2, home: 'Алашкерт', away: 'Елимай Семей', time: '19:00 МСК', tournament: 'Лига Конференций', league: 'conference' },
        { id: 3, home: 'ФК Лиепаджа', away: 'Деҫис', time: '19:00 МСК', tournament: 'Лига Конференций', league: 'conference' },
        { id: 4, home: 'Ливерпуль', away: 'Реал Мадрид', time: '22:00 МСК', tournament: 'Лига Чемпионов', league: 'champions' },
        { id: 5, home: 'Бавария', away: 'ПСЖ', time: '22:00 МСК', tournament: 'Лига Чемпионов', league: 'champions' }
    ],
    '2026-07-09': [
        { id: 6, home: 'Манчестер Сити', away: 'Челси', time: '19:00 МСК', tournament: 'АПЛ', league: 'apl' },
        { id: 7, home: 'Арсенал', away: 'Тоттенхэм', time: '22:00 МСК', tournament: 'АПЛ', league: 'apl' },
        { id: 8, home: 'Барселона', away: 'Реал Бетис', time: '21:00 МСК', tournament: 'Ла Лига', league: 'laliga' },
        { id: 9, home: 'Милан', away: 'Интер', time: '20:00 МСК', tournament: 'Серия А', league: 'seriea' },
        { id: 10, home: 'Боруссия Дортмунд', away: 'Лейпциг', time: '18:00 МСК', tournament: 'Бундес-Лига', league: 'bundesliga' }
    ],
    '2026-07-10': [
        { id: 11, home: 'Ювентус', away: 'Наполи', time: '19:00 МСК', tournament: 'Серия А', league: 'seriea' },
        { id: 12, home: 'Аякс', away: 'Рома', time: '21:00 МСК', tournament: 'Лига Европы', league: 'europa' }
    ]
};

// ============================================================
// ФИЛЬТРАЦИЯ МАТЧЕЙ
// ============================================================
function getFilteredMatches() {
    const allMatches = [];
    Object.keys(matchesData).forEach(date => {
        matchesData[date].forEach(match => {
            allMatches.push({ ...match, date });
        });
    });
    
    let filtered = allMatches;
    if (state.leagueFilter !== 'all') {
        filtered = filtered.filter(m => m.league === state.leagueFilter);
    }
    // timeFilter пока не реализован
    return filtered;
}

// ============================================================
// ОТРИСОВКА МАТЧЕЙ
// ============================================================
function renderMatches() {
    const container = document.getElementById('matchesList');
    const filtered = getFilteredMatches();
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="loading">Нет матчей по выбранным фильтрам</div>';
        return;
    }
    
    const grouped = {};
    filtered.forEach(match => {
        if (!grouped[match.date]) grouped[match.date] = [];
        grouped[match.date].push(match);
    });
    
    let html = '';
    Object.keys(grouped).sort().forEach(date => {
        const formattedDate = date.replace(/-/g, '.');
        html += `<div class="match-day-group">`;
        html += `<div class="match-day-date">${formattedDate}</div>`;
        grouped[date].forEach(match => {
            html += `
                <div class="match-item" onclick="openTariffsForMatch(${match.id})">
                    <div class="tournament">${match.tournament}</div>
                    <div class="teams">
                        <span>${match.home}</span>
                        <span style="color:#6a6a7a;">vs</span>
                        <span>${match.away}</span>
                    </div>
                    <div class="time">⏰ ${match.time}</div>
                    <span class="ai-badge">🧠 AI</span>
                </div>
            `;
        });
        html += `</div>`;
    });
    
    container.innerHTML = html;
}

// ============================================================
// ФИЛЬТРЫ
// ============================================================
document.querySelectorAll('#leagueFilters .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('#leagueFilters .filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.leagueFilter = btn.dataset.filter;
        renderMatches();
    });
});

document.querySelectorAll('#timeFilters .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('#timeFilters .filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.timeFilter = btn.dataset.filter;
        renderMatches();
    });
});

// ============================================================
// ТАРИФЫ
// ============================================================
function renderTariffs(containerId = 'tariffsContent') {
    const container = document.getElementById(containerId);
    container.innerHTML = `
        <div style="margin-bottom:16px;font-size:18px;font-weight:700;color:#ffffff;">
            ${state.currentTariffContext === 'express' ? '⚡ Экспресс-доступ' : '🔓 Открой прогноз'}
        </div>
        <div class="tariffs-section">
            <div class="tariff-card">
                <div class="tariff-name">Pro</div>
                <div class="tariff-price">5 990 ₽<span class="period">/мес</span></div>
                <ul class="tariff-features">
                    <li>5–7 прогнозов в день</li>
                    <li>Основные матчи топ-лиг</li>
                    <li>Одиночные ставки с рабочими коэффициентами</li>
                    <li>Краткая аналитика матчей</li>
                    <li>Оптимальные варианты из линии букмекеров</li>
                    <li>Стабильная игровая стратегия</li>
                </ul>
                <button class="tariff-btn pro" onclick="tg.openTelegramLink('https://t.me/poland5692')">
                    💳 Оформить Pro
                </button>
            </div>
            
            <div class="tariff-card popular">
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
            
            <div class="tariff-note">
                ⚡ Автопродление. Отмена в любой момент.<br>
                Прогнозы — аналитика, не гарантия результата.
            </div>
        </div>
    `;
}

// ============================================================
// ОТКРЫТИЕ ТАРИФОВ ДЛЯ МАТЧА / ЭКСПРЕССА
// ============================================================
function openTariffsForMatch(matchId) {
    state.currentMatchId = matchId;
    state.currentTariffContext = 'match';
    document.getElementById('screen-matches').classList.add('hidden');
    document.getElementById('screen-tariffs').classList.remove('hidden');
    renderTariffs('tariffsContent');
}

function openTariffsForExpress() {
    state.currentTariffContext = 'express';
    document.getElementById('screen-matches').classList.add('hidden');
    document.getElementById('screen-tariffs').classList.remove('hidden');
    renderTariffs('tariffsContent');
}

function openTariffsFromProfile() {
    state.currentTariffContext = 'profile';
    document.getElementById('screen-profile').classList.add('hidden');
    document.getElementById('screen-tariffs').classList.remove('hidden');
    renderTariffs('tariffsContent');
}

function backFromTariffs() {
    document.getElementById('screen-tariffs').classList.add('hidden');
    if (state.currentTariffContext === 'profile') {
        document.getElementById('screen-profile').classList.remove('hidden');
    } else {
        document.getElementById('screen-matches').classList.remove('hidden');
    }
}

document.getElementById('backFromTariffs').addEventListener('click', backFromTariffs);

// ============================================================
// ЛИЧНЫЙ КАБИНЕТ
// ============================================================
document.getElementById('profileBtn').addEventListener('click', () => {
    document.getElementById('screen-matches').classList.add('hidden');
    document.getElementById('screen-profile').classList.remove('hidden');
});

document.getElementById('backFromProfile').addEventListener('click', () => {
    document.getElementById('screen-profile').classList.add('hidden');
    document.getElementById('screen-matches').classList.remove('hidden');
});

// Меню в профиле
function showGlossary() {
    tg.showAlert('📖 Глоссарий:\n\nИТБ — индивидуальный тотал больше\nФора — преимущество в голах\nТай-брейк — дополнительное время\n...');
}

function showTour() {
    tg.showAlert('🎯 Тур по приложению:\n\n1. Выбери матч\n2. Оформи подписку\n3. Получи AI-прогноз');
}

function toggleTheme() {
    const status = document.getElementById('themeStatus');
    const current = status.textContent.trim();
    if (current === 'тёмная') {
        status.textContent = 'светлая';
        document.body.style.background = '#ffffff';
        document.body.style.color = '#000000';
        // Можно добавить и другие изменения
    } else {
        status.textContent = 'тёмная';
        document.body.style.background = '#0a0a0f';
        document.body.style.color = '#ffffff';
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
            // Возврат к списку матчей
            document.getElementById('screen-tariffs').classList.add('hidden');
            document.getElementById('screen-profile').classList.add('hidden');
            document.getElementById('screen-matches').classList.remove('hidden');
        } else if (tab === 'analysis') {
            // Вкладка "Разборы" — показываем тарифы
            state.currentTariffContext = 'analysis';
            document.getElementById('screen-matches').classList.add('hidden');
            document.getElementById('screen-profile').classList.add('hidden');
            document.getElementById('screen-tariffs').classList.remove('hidden');
            renderTariffs('tariffsContent');
            // Меняем заголовок
            document.querySelector('#tariffsContent > div:first-child').textContent = '🧠 Все разборы доступны по подписке';
        } else if (tab === 'express') {
            // Вкладка "Экспресс" — тарифы
            openTariffsForExpress();
        }
    });
});

// ============================================================
// ЗАПУСК
// ============================================================
// Если онбординг уже видели — матчи загружены, иначе они загрузятся после окончания онбординга
// Но renderMatches вызывается в finishOnboarding и при прямом входе