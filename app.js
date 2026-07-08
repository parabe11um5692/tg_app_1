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
    initMatchDaySlider();
    renderTournamentSections();
}

function skipOnboarding() { finishOnboarding(); }

document.addEventListener('DOMContentLoaded', () => {
    if (hasSeenOnboarding) {
        document.getElementById('screen-onboarding').classList.add('hidden');
        document.getElementById('screen-matches').classList.remove('hidden');
        initMatchDaySlider();
        renderTournamentSections();
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
    currentTariffContext: 'match'
};

// ============================================================
// МАТЧ ДНЯ (СЛАЙДЕР)
// ============================================================
const matchDayData = [
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
        matchId: 4
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
        matchId: 5
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
        matchId: 6
    }
];

let sliderIndex = 0;

function initMatchDaySlider() {
    const track = document.getElementById('matchDayTrack');
    if (!track) return;
    
    track.innerHTML = matchDayData.map((match, index) => `
        <div class="match-day-card" onclick="openTariffsForMatch(${match.matchId})">
            <div class="match-day-badge">🔥 МАТЧ ДНЯ</div>
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
    `).join('');
    
    updateSlider();
    
    // Кнопки
    document.getElementById('sliderPrev').addEventListener('click', () => {
        if (sliderIndex > 0) { sliderIndex--; updateSlider(); }
    });
    document.getElementById('sliderNext').addEventListener('click', () => {
        if (sliderIndex < matchDayData.length - 1) { sliderIndex++; updateSlider(); }
    });
    
    // Точки
    const dotsContainer = document.getElementById('sliderDots');
    dotsContainer.innerHTML = matchDayData.map((_, i) => `
        <span class="slider-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>
    `).join('');
    dotsContainer.querySelectorAll('.slider-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            sliderIndex = parseInt(dot.dataset.index);
            updateSlider();
        });
    });
}

function updateSlider() {
    const track = document.getElementById('matchDayTrack');
    track.style.transform = `translateX(-${sliderIndex * 100}%)`;
    
    document.querySelectorAll('.slider-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === sliderIndex);
    });
}

// ============================================================
// ТУРНИРНЫЕ СЕКЦИИ
// ============================================================
const tournamentSectionsData = [
    {
        title: '🏆 Чемпионат мира',
        matches: [
            { home: 'Франция', away: 'Марокко', time: '23:00', matchId: 4 },
            { home: 'Бразилия', away: 'Аргентина', time: '22:00', matchId: 7 }
        ]
    },
    {
        title: '🏆 Лига Европы',
        matches: [
            { home: 'Карабаг', away: 'Морнар', time: '19:00', matchId: 8 },
            { home: 'Аякс', away: 'Рома', time: '21:00', matchId: 9 }
        ]
    },
    {
        title: '🏆 Лига Кубка',
        matches: [
            { home: 'Алашкерт', away: 'Елимай Семей', time: '19:00', matchId: 2 },
            { home: 'ФК Лиепаджа', away: 'Деҫис', time: '19:00', matchId: 3 }
        ]
    }
];

function renderTournamentSections() {
    const container = document.getElementById('tournamentSections');
    if (!container) return;
    
    container.innerHTML = tournamentSectionsData.map(section => `
        <div class="tournament-section">
            <div class="tournament-section-title">${section.title}</div>
            <div class="tournament-section-sub">Матчи · AI</div>
            <div class="tournament-section-matches">
                ${section.matches.map(match => `
                    <div class="tournament-match" onclick="openTariffsForMatch(${match.matchId})">
                        <span class="teams">${match.home} vs ${match.away}</span>
                        <span class="time">${match.time}</span>
                        <span class="badge">🧠 AI</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// ============================================================
// ТАРИФЫ (СЛАЙДЕР)
// ============================================================
function openTariffsForMatch(matchId) {
    state.currentTariffContext = 'match';
    document.getElementById('screen-matches').classList.add('hidden');
    document.getElementById('screen-tariffs').classList.remove('hidden');
    renderTariffsSlider('tariffsContent', '🔓 Открой прогноз');
}

function openTariffsForExpress() {
    state.currentTariffContext = 'express';
    document.getElementById('screen-matches').classList.add('hidden');
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
                    <li>Подходит для спокойного роста банка</li>
                    <li>Приоритетные ставки дня</li>
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
    document.getElementById('screen-profile').classList.remove('hidden');
});

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
        document.querySelectorAll('.match-item, .match-day-card, .tournament-section, .tariff-card-slide, .profile-plan')
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
        document.querySelectorAll('.match-item, .match-day-card, .tournament-section, .tariff-card-slide, .profile-plan')
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
            document.getElementById('screen-matches').classList.remove('hidden');
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