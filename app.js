// ============================================================
// TELEGRAM WEB APP
// ============================================================
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

const user = tg.initDataUnsafe?.user || { id: 0, first_name: 'Гость' };
document.getElementById('userName').textContent = user.first_name;

// ============================================================
// ОНБОРДИНГ
// ============================================================
let currentSlide = 0;
const totalSlides = 4;

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
    document.getElementById('screen-onboarding').classList.add('hidden');
    document.getElementById('screen-main').classList.remove('hidden');
    renderMain();
}

document.querySelectorAll('.dot').forEach((dot) => {
    dot.addEventListener('click', () => goToSlide(parseInt(dot.dataset.index)));
});

document.getElementById('onboardingNext').addEventListener('click', nextSlide);
document.getElementById('onboardingSkip').addEventListener('click', finishOnboarding);

// ============================================================
// ОСНОВНОЕ ПРИЛОЖЕНИЕ
// ============================================================
const state = {
    leagues: [],
    matches: [],
    analyticsUsed: 0,
    freeLimit: 3,
    currentLeague: null
};

// ============================================================
// API (мок-данные для демонстрации)
// ============================================================
async function fetchLeagues() {
    return {
        leagues: [
            { name: 'АПЛ', emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', count: 5 },
            { name: 'Ла-Лига', emoji: '🇪🇸', count: 4 },
            { name: 'Бундес-Лига', emoji: '🇩🇪', count: 4 },
            { name: 'Серия А', emoji: '🇮🇹', count: 4 },
            { name: 'Лига 1', emoji: '🇫🇷', count: 3 }
        ],
        analytics_used: 0,
        free_limit: 3
    };
}

async function fetchMatches(league) {
    const allMatches = {
        'АПЛ': [
            { id: 1, home_team: 'Ливерпуль', away_team: 'Манчестер Сити', date: '2026-06-26', rating: 4.8 },
            { id: 2, home_team: 'Арсенал', away_team: 'Челси', date: '2026-06-26', rating: 4.6 }
        ],
        'Ла-Лига': [
            { id: 3, home_team: 'Реал Мадрид', away_team: 'Барселона', date: '2026-06-27', rating: 4.9 },
            { id: 4, home_team: 'Атлетико', away_team: 'Севилья', date: '2026-06-27', rating: 4.3 }
        ],
        'Бундес-Лига': [
            { id: 5, home_team: 'Бавария', away_team: 'Боруссия Дортмунд', date: '2026-06-28', rating: 4.7 }
        ],
        'Серия А': [
            { id: 6, home_team: 'Интер', away_team: 'Милан', date: '2026-06-28', rating: 4.5 }
        ],
        'Лига 1': [
            { id: 7, home_team: 'ПСЖ', away_team: 'Марсель', date: '2026-06-29', rating: 4.4 }
        ]
    };
    return { matches: allMatches[league] || [] };
}

async function fetchAnalysis(matchId) {
    const analyses = {
        1: {
            home_team: 'Ливерпуль',
            away_team: 'Манчестер Сити',
            league: 'АПЛ',
            date: '2026-06-26',
            rating: 4.8,
            analysis: '🔴 Ливерпуль vs Манчестер Сити 🔵\n\n📊 Ключевые факты:\n• Ливерпуль непобедим дома в 10 матчах\n• Сити забивает первым в 70% матчей\n• Средняя результативность: 3.2 гола за матч\n\n📈 Прогноз: Обе команды забьют\n⭐ Ключевые игроки: Салах, Холанд',
            prediction: 'Обе забьют (1.85)',
            remaining: 1
        },
        3: {
            home_team: 'Реал Мадрид',
            away_team: 'Барселона',
            league: 'Ла-Лига',
            date: '2026-06-27',
            rating: 4.9,
            analysis: '🔴⚪ Реал Мадрид vs Барселона 🔵🔴\n\n📊 Ключевые факты:\n• Эль-Класико — главное дерби Испании\n• Реал выиграл 3 из 5 последних встреч\n• Барселона забивает в среднем 2.1 гола за матч\n\n📈 Прогноз: Тотал больше 2.5 голов\n⭐ Ключевые игроки: Винисиус, Левандовски',
            prediction: 'Тотал больше 2.5 (1.80)',
            remaining: 1
        }
    };
    
    const data = analyses[matchId];
    if (data) return data;
    
    return {
        home_team: 'Команда 1',
        away_team: 'Команда 2',
        league: 'Лига',
        date: '2026-06-30',
        rating: 4.0,
        analysis: '📊 Анализ матча в разработке...',
        prediction: 'Ожидайте прогноз',
        remaining: 1
    };
}

// ============================================================
// ОТРИСОВКА
// ============================================================
async function renderMain() {
    document.getElementById('screen-main').classList.remove('hidden');
    document.getElementById('screen-matches').classList.add('hidden');
    document.getElementById('screen-analysis').classList.add('hidden');
    
    const data = await fetchLeagues();
    state.analyticsUsed = data.analytics_used || 0;
    state.freeLimit = data.free_limit || 3;
    state.leagues = data.leagues || [];
    
    const used = state.analyticsUsed;
    const total = state.freeLimit;
    document.getElementById('progressFill').style.width = Math.min((used / total) * 100, 100) + '%';
    document.getElementById('statsText').textContent = `${used} / ${total}`;
    
    const grid = document.getElementById('leagueGrid');
    if (state.leagues.length === 0) {
        grid.innerHTML = '<div class="loading">Нет доступных лиг</div>';
        return;
    }
    
    grid.innerHTML = state.leagues.map(league => `
        <div class="league-card" onclick="selectLeague('${league.name}')">
            <span class="emoji">${league.emoji || '🏆'}</span>
            <div class="name">${league.name}</div>
            <div class="count">${league.count || 0} матчей</div>
        </div>
    `).join('');
}

async function selectLeague(leagueName) {
    state.currentLeague = leagueName;
    document.getElementById('screen-main').classList.add('hidden');
    document.getElementById('screen-matches').classList.remove('hidden');
    document.getElementById('screen-analysis').classList.add('hidden');
    
    document.getElementById('matchesTitle').textContent = `📋 ${leagueName}`;
    
    const list = document.getElementById('matchesList');
    list.innerHTML = '<div class="loading">Загрузка матчей<span class="loading-dots"></span></div>';
    
    const data = await fetchMatches(leagueName);
    state.matches = data.matches || [];
    
    if (state.matches.length === 0) {
        list.innerHTML = '<div class="loading">Нет матчей в этой лиге</div>';
        return;
    }
    
    list.innerHTML = state.matches.map(match => `
        <div class="match-card" onclick="selectMatch(${match.id})">
            <div class="match-teams">
                <span>${match.home_team}</span>
                <span class="match-vs">vs</span>
                <span>${match.away_team}</span>
            </div>
            <div class="match-info">
                <span>📅 ${match.date || 'Дата неизвестна'}</span>
                <span>⭐ ${match.rating || '—'}</span>
            </div>
        </div>
    `).join('');
}

async function selectMatch(matchId) {
    document.getElementById('screen-main').classList.add('hidden');
    document.getElementById('screen-matches').classList.add('hidden');
    document.getElementById('screen-analysis').classList.remove('hidden');
    
    const content = document.getElementById('analysisContent');
    content.innerHTML = '<div class="loading">Анализируем матч<span class="loading-dots"></span></div>';
    
    const data = await fetchAnalysis(matchId);
    const stars = '⭐'.repeat(Math.floor(data.rating || 0)) + '☆'.repeat(5 - Math.floor(data.rating || 0));
    
    content.innerHTML = `
        <div class="analysis-card">
            <div class="analysis-title">⚽ ${data.home_team} vs ${data.away_team}</div>
            <div class="analysis-meta">${data.league} · ${data.date} · ${stars}</div>
            <div class="analysis-text">${(data.analysis || '').replace(/\n/g, '<br>')}</div>
            <div class="analysis-prediction">📈 ${data.prediction}</div>
            ${data.remaining !== undefined ? `
                <div style="margin-top:12px;text-align:center;font-size:14px;color:#6a6a7a;">
                    🎁 Осталось бесплатных: ${data.remaining}
                </div>
            ` : ''}
        </div>
        <button class="btn-back" onclick="selectLeague('${state.currentLeague}')">← Назад к матчам</button>
    `;
}

// ============================================================
// НАВИГАЦИЯ
// ============================================================
document.getElementById('backToLeagues').addEventListener('click', renderMain);
document.getElementById('backToMatches').addEventListener('click', () => {
    if (state.currentLeague) selectLeague(state.currentLeague);
    else renderMain();
});

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const screen = item.dataset.screen;
        if (screen === 'main') renderMain();
        else if (screen === 'tariffs') showTariffs();
        else if (screen === 'profile') showProfile();
    });
});

// ============================================================
// ТАРИФЫ И ПРОФИЛЬ
// ============================================================
function showTariffs() {
    document.getElementById('leagueGrid').innerHTML = `
        <div style="grid-column:1/-1;">
            <div class="analysis-card">
                <div style="text-align:center;font-size:28px;margin-bottom:8px;">💎</div>
                <div style="text-align:center;font-size:20px;font-weight:700;color:#ffffff;">Премиум-доступ</div>
                <div style="text-align:center;color:#6a6a7a;margin-bottom:16px;">Неограниченные ИИ-анализы</div>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
                    <div style="background:#1a1a2e;border-radius:8px;padding:12px;text-align:center;">
                        <div style="font-weight:700;color:#ffffff;">1 мес</div>
                        <div style="color:#667eea;font-weight:700;">499 ₽</div>
                    </div>
                    <div style="background:#1a1a2e;border-radius:8px;padding:12px;text-align:center;border:2px solid #667eea;">
                        <div style="font-weight:700;color:#ffffff;">3 мес</div>
                        <div style="color:#667eea;font-weight:700;">999 ₽</div>
                        <div style="font-size:10px;color:#667eea;">🔥 Выгодно!</div>
                    </div>
                    <div style="background:#1a1a2e;border-radius:8px;padding:12px;text-align:center;">
                        <div style="font-weight:700;color:#ffffff;">12 мес</div>
                        <div style="color:#667eea;font-weight:700;">2999 ₽</div>
                    </div>
                </div>
                <button onclick="tg.openTelegramLink('https://t.me/poland5692')" style="width:100%;margin-top:12px;padding:14px;background:linear-gradient(135deg,#667eea,#764ba2);color:white;border:none;border-radius:12px;font-size:16px;font-weight:600;cursor:pointer;">
                    💳 Оформить подписку
                </button>
            </div>
            <button class="btn-back" onclick="renderMain()">← Назад</button>
        </div>
    `;
}

function showProfile() {
    document.getElementById('leagueGrid').innerHTML = `
        <div style="grid-column:1/-1;">
            <div class="analysis-card">
                <div style="text-align:center;font-size:48px;margin-bottom:8px;">👤</div>
                <div style="text-align:center;font-size:20px;font-weight:700;color:#ffffff;">${user.first_name}</div>
                <div style="text-align:center;color:#6a6a7a;font-size:14px;">ID: ${user.id}</div>
                <div style="margin-top:16px;padding:12px;background:#1a1a2e;border-radius:8px;">
                    <div style="display:flex;justify-content:space-between;color:#b0b0b8;">
                        <span>🎁 Использовано:</span>
                        <span><b style="color:#ffffff;">${state.analyticsUsed} / ${state.freeLimit}</b></span>
                    </div>
                    <div style="display:flex;justify-content:space-between;margin-top:8px;color:#b0b0b8;">
                        <span>💎 Подписка:</span>
                        <span><b style="color:${state.analyticsUsed >= state.freeLimit ? '#ff6b6b' : '#51cf66'};">${state.analyticsUsed >= state.freeLimit ? '🔴 Неактивна' : '🟢 Активна'}</b></span>
                    </div>
                </div>
                <button onclick="tg.close()" style="width:100%;margin-top:12px;padding:12px;background:#ff6b6b;color:white;border:none;border-radius:12px;font-size:16px;cursor:pointer;">
                    🚪 Закрыть
                </button>
            </div>
            <button class="btn-back" onclick="renderMain()">← Назад</button>
        </div>
    `;
}

// ============================================================
// ЗАПУСК
// ============================================================
document.getElementById('screen-onboarding').classList.remove('hidden');
document.getElementById('screen-main').classList.add('hidden');