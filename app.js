// ============================================================
// 1. ИНИЦИАЛИЗАЦИЯ TELEGRAM WEB APP
// ============================================================
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

const user = tg.initDataUnsafe?.user || { id: 0, first_name: 'Гость' };
document.getElementById('userName').textContent = user.first_name;

// ============================================================
// 2. СОСТОЯНИЕ ПРИЛОЖЕНИЯ
// ============================================================
const state = {
    leagues: [],
    matches: [],
    currentMatch: null,
    analyticsUsed: 0,
    freeLimit: 3,
    currentScreen: 'main',
    currentLeague: null
};

// ============================================================
// 3. API ЗАПРОСЫ
// ============================================================
const API_BASE = 'https://твой-сервер.com/api';

async function fetchLeagues() {
    try {
        const response = await fetch(`${API_BASE}/leagues?user_id=${user.id}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching leagues:', error);
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
}

async function fetchMatches(league) {
    try {
        const response = await fetch(`${API_BASE}/matches?league=${encodeURIComponent(league)}&user_id=${user.id}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching matches:', error);
        return {
            matches: [
                { id: 1, home_team: 'Ливерпуль', away_team: 'Манчестер Сити', date: '2026-06-26', rating: 4.8 },
                { id: 2, home_team: 'Арсенал', away_team: 'Челси', date: '2026-06-26', rating: 4.6 }
            ]
        };
    }
}

async function fetchAnalysis(matchId) {
    try {
        const response = await fetch(`${API_BASE}/analysis?match_id=${matchId}&user_id=${user.id}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching analysis:', error);
        return {
            analysis: '📊 Анализ матча в разработке...',
            prediction: 'Обе забьют (1.85)',
            rating: 4.8,
            remaining: 1
        };
    }
}

// ============================================================
// 4. ОТРИСОВКА ЭКРАНОВ
// ============================================================

async function renderMain() {
    showScreen('main');
    
    const data = await fetchLeagues();
    state.analyticsUsed = data.analytics_used || 0;
    state.freeLimit = data.free_limit || 3;
    state.leagues = data.leagues || [];
    
    const used = state.analyticsUsed;
    const total = state.freeLimit;
    const percent = (used / total) * 100;
    document.getElementById('progressFill').style.width = Math.min(percent, 100) + '%';
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
    showScreen('matches');
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
    showScreen('analysis');
    
    const content = document.getElementById('analysisContent');
    content.innerHTML = '<div class="loading">Анализируем матч<span class="loading-dots"></span></div>';
    
    const data = await fetchAnalysis(matchId);
    state.currentMatch = data;
    
    const stars = '⭐'.repeat(Math.floor(data.rating || 0)) + '☆'.repeat(5 - Math.floor(data.rating || 0));
    
    content.innerHTML = `
        <div class="analysis-card">
            <div class="analysis-title">⚽ ${data.home_team || 'Команда 1'} vs ${data.away_team || 'Команда 2'}</div>
            <div class="analysis-meta">
                ${data.league || 'Лига'} · ${data.date || 'Дата неизвестна'} · ${stars}
            </div>
            <div class="analysis-text">${(data.analysis || 'Анализ в разработке...').replace(/\n/g, '<br>')}</div>
            <div class="analysis-prediction">
                📈 ${data.prediction || 'Прогноз отсутствует'}
            </div>
            ${data.remaining !== undefined ? `
                <div style="margin-top:12px;text-align:center;font-size:14px;color:var(--tg-theme-hint-color,#888);">
                    🎁 Осталось бесплатных: ${data.remaining}
                </div>
            ` : ''}
        </div>
        <button onclick="selectLeague('${state.currentLeague}')" style="width:100%;padding:12px;background:var(--tg-theme-secondary-bg-color,#f5f5f5);border:none;border-radius:12px;font-size:16px;cursor:pointer;">
            ← Назад к матчам
        </button>
    `;
}

// ============================================================
// 5. НАВИГАЦИЯ
// ============================================================
function showScreen(screen) {
    document.querySelectorAll('#screen-main, #screen-matches, #screen-analysis').forEach(el => {
        el.classList.add('hidden');
    });
    document.getElementById(`screen-${screen}`).classList.remove('hidden');
    state.currentScreen = screen;
}

document.getElementById('backToLeagues').addEventListener('click', () => renderMain());
document.getElementById('backToMatches').addEventListener('click', () => {
    if (state.currentLeague) {
        selectLeague(state.currentLeague);
    } else {
        renderMain();
    }
});

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const screen = item.dataset.screen;
        if (screen === 'main') {
            renderMain();
        } else if (screen === 'tariffs') {
            showTariffs();
        } else if (screen === 'profile') {
            showProfile();
        }
    });
});

// ============================================================
// 6. ТАРИФЫ И ПРОФИЛЬ
// ============================================================
function showTariffs() {
    showScreen('main');
    const grid = document.getElementById('leagueGrid');
    grid.innerHTML = `
        <div style="grid-column:1/-1;">
            <div class="analysis-card">
                <div style="text-align:center;font-size:28px;margin-bottom:8px;">💎</div>
                <div style="text-align:center;font-size:20px;font-weight:700;">Премиум-доступ</div>
                <div style="text-align:center;color:var(--tg-theme-hint-color,#888);margin-bottom:16px;">
                    Неограниченные ИИ-анализы
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
                    <div style="background:var(--tg-theme-bg-color,#fff);border-radius:8px;padding:12px;text-align:center;">
                        <div style="font-weight:700;">1 мес</div>
                        <div style="color:var(--tg-theme-link-color,#2481cc);font-weight:700;">499 ₽</div>
                    </div>
                    <div style="background:var(--tg-theme-bg-color,#fff);border-radius:8px;padding:12px;text-align:center;border:2px solid #667eea;">
                        <div style="font-weight:700;">3 мес</div>
                        <div style="color:var(--tg-theme-link-color,#2481cc);font-weight:700;">999 ₽</div>
                        <div style="font-size:10px;color:#667eea;">🔥 Выгодно!</div>
                    </div>
                    <div style="background:var(--tg-theme-bg-color,#fff);border-radius:8px;padding:12px;text-align:center;">
                        <div style="font-weight:700;">12 мес</div>
                        <div style="color:var(--tg-theme-link-color,#2481cc);font-weight:700;">2999 ₽</div>
                    </div>
                </div>
                <button onclick="tg.openTelegramLink('https://t.me/poland5692')" style="width:100%;margin-top:12px;padding:14px;background:linear-gradient(135deg,#667eea,#764ba2);color:white;border:none;border-radius:12px;font-size:16px;font-weight:600;cursor:pointer;">
                    💳 Оформить подписку
                </button>
            </div>
            <button onclick="renderMain()" style="width:100%;padding:12px;background:var(--tg-theme-secondary-bg-color,#f5f5f5);border:none;border-radius:12px;font-size:16px;cursor:pointer;">
                ← Назад
            </button>
        </div>
    `;
}

function showProfile() {
    showScreen('main');
    const grid = document.getElementById('leagueGrid');
    grid.innerHTML = `
        <div style="grid-column:1/-1;">
            <div class="analysis-card">
                <div style="text-align:center;font-size:48px;margin-bottom:8px;">👤</div>
                <div style="text-align:center;font-size:20px;font-weight:700;">${user.first_name}</div>
                <div style="text-align:center;color:var(--tg-theme-hint-color,#888);font-size:14px;">
                    ID: ${user.id}
                </div>
                <div style="margin-top:16px;padding:12px;background:var(--tg-theme-bg-color,#fff);border-radius:8px;">
                    <div style="display:flex;justify-content:space-between;">
                        <span>🎁 Использовано анализов:</span>
                        <span><b>${state.analyticsUsed} / ${state.freeLimit}</b></span>
                    </div>
                    <div style="display:flex;justify-content:space-between;margin-top:8px;">
                        <span>💎 Подписка:</span>
                        <span><b>${state.analyticsUsed >= state.freeLimit ? '🔴 Неактивна' : '🟢 Активна'}</b></span>
                    </div>
                </div>
                <button onclick="tg.close()" style="width:100%;margin-top:12px;padding:12px;background:#ff6b6b;color:white;border:none;border-radius:12px;font-size:16px;cursor:pointer;">
                    🚪 Закрыть приложение
                </button>
            </div>
            <button onclick="renderMain()" style="width:100%;padding:12px;background:var(--tg-theme-secondary-bg-color,#f5f5f5);border:none;border-radius:12px;font-size:16px;cursor:pointer;">
                ← Назад
            </button>
        </div>
    `;
}

// ============================================================
// 7. ЗАПУСК
// ============================================================
renderMain();
tg.ready();