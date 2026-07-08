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
// ОНБОРДИНГ
// ============================================================
let currentSlide = 0;
const totalSlides = 4;
const hasSeenOnboarding = sessionStorage.getItem('uzarrai_onboarding_seen');

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
    renderMatches();
}

function skipOnboarding() { finishOnboarding(); }

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
    leagueFilter: 'all',
    timeFilter: 'all',
    currentTournament: 'world',
    currentTariffContext: 'match'
};

// ============================================================
// ДАННЫЕ
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

// Данные для вкладки AI (разобранные матчи)
const aiMatches = [
    { home: 'Франция', away: 'Марокко', tournament: 'Чемпионат мира 2026', time: '23:00 МСК', badge: '70% AI' },
    { home: 'Карабаг', away: 'Морнар', tournament: 'Лига Европы', time: '19:00 МСК', badge: 'AI' },
    { home: 'Алашкерт', away: 'Елимай Семей', tournament: 'Лига Конференций', time: '19:00 МСК', badge: 'AI' },
    { home: 'ФК Лиепаджа', away: 'Деҫис', tournament: 'Лига Конференций', time: '19:00 МСК', badge: 'AI' },
    { home: 'Дила', away: 'Виртус', tournament: 'Лига Конференций', time: '19:00 МСК', badge: 'AI' },
    { home: 'Хегелманн Литауен', away: 'Паиде', tournament: 'Лига Конференций', time: '19:00 МСК', badge: 'AI' }
];

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
    // Фильтр по времени (заглушка)
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
// ОТРИСОВКА ВКЛАДКИ AI
// ============================================================
function renderAIMatches() {
    const container = document.getElementById('aiMatchesList');
    if (!container) return;
    
    if (aiMatches.length === 0) {
        container.innerHTML = '<div class="loading">Нет разобранных матчей</div>';
        return;
    }
    
    let html = '';
    aiMatches.forEach(match => {
        html += `
            <div class="ai-match-card" onclick="openTariffsForAI()">
                <div class="left">
                    <div class="tournament">${match.tournament}</div>
                    <div class="teams">${match.home} vs ${match.away}</div>
                </div>
                <div class="right">
                    <div class="time">${match.time}</div>
                    <div class="badge">${match.badge}</div>
                </div>
            </div>
        `;
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
// ТУРНИРЫ (СЛАЙДЕР)
// ============================================================
document.querySelectorAll('.tournament-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tournament-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentTournament = btn.dataset.tournament;
        // Здесь можно фильтровать матчи по турниру
        renderMatches();
    });
});

// ============================================================
// ОТКРЫТИЕ ТАРИФОВ
// ============================================================
function openTariffsForMatch(matchId) {
    state.currentTariffContext = 'match';
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
// ТАРИФЫ (СЛАЙДЕР)
// ============================================================
function renderTariffsSlider(containerId, title) {
    const container = document.getElementById(containerId);
    container.innerHTML = `
        <div style="margin-bottom:16px;font-size:18px;font-weight:700;color:#ffffff;">${title}</div>
        <div style="font-size:14px;color:#6a6a7a;margin-bottom:16px;">AI-прогнозы по всем матчам дня без лимитов и блокировки</div>
        <div class="tariffs-slider">
            <!-- Pro -->
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
                </ul>
                <button class="tariff-btn pro" onclick="tg.openTelegramLink('https://t.me/poland5692')">
                    💳 Оформить Pro
                </button>
            </div>
            
            <!-- MAX -->
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
});

// Для AI тоже нужна кнопка профиля
const profileBtnAI = document.getElementById('profileBtnAI');
if (profileBtnAI) {
    profileBtnAI.addEventListener('click', () => {
        document.getElementById('screen-matches').classList.add('hidden');
        document.getElementById('screen-ai').classList.add('hidden');
        document.getElementById('screen-profile').classList.remove('hidden');
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
    const current = status.textContent.trim();
    if (current === 'тёмная') {
        status.textContent = 'светлая';
        document.body.style.background = '#ffffff';
        document.body.style.color = '#000000';
        document.querySelectorAll('.match-item, .match-day-card, .ai-match-card, .tariff-card-slide, .profile-plan, .stats-card')
            .forEach(el => {
                if (el) {
                    el.style.background = '#f5f5f5';
                    el.style.borderColor = '#e0e0e0';
                }
            });
    } else {
        status.textContent = 'тёмная';
        document.body.style.background = '#0a0a0f';
        document.body.style.color = '#ffffff';
        document.querySelectorAll('.match-item, .match-day-card, .ai-match-card, .tariff-card-slide, .profile-plan, .stats-card')
            .forEach(el => {
                if (el) {
                    el.style.background = '#14141f';
                    el.style.borderColor = '#1e1e32';
                }
            });
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
// ЗАПУСК
// ============================================================
// Если онбординг уже видели — матчи загружены
// Иначе они загрузятся после окончания онбординга