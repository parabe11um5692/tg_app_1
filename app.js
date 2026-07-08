// ============================================================
// TELEGRAM WEB APP
// ============================================================
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

const user = tg.initDataUnsafe?.user || { id: 0, first_name: 'Гость' };
document.getElementById('userName').textContent = user.first_name;

// ============================================================
// СОСТОЯНИЕ
// ============================================================
const state = {
    leagueFilter: 'all',
    timeFilter: 'all',
    currentMatchId: null
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
// АНАЛИЗЫ (РАЗБОРЫ)
// ============================================================
const analysisData = {
    1: {
        home: 'Атлетик Клуб д\'Ескалдес',
        away: 'Морнар',
        tournament: 'Лига Конференций',
        rating: 4.2,
        analysis: '⚽ <b>Атлетик Клуб д\'Ескалдес vs Морнар</b>\n\n📊 <b>Ключевые факты:</b>\n• Атлетик выиграл 4 из 5 последних домашних матчей\n• Морнар пропускает в среднем 1.8 гола за матч\n• Обе команды забивают в 70% матчей\n\n📈 <b>Прогноз:</b> Победа Атлетика с форой -1.5\n⭐ <b>Ключевые игроки:</b> Кастильо, Йованович',
        prediction: 'Победа Атлетика (1.65)'
    },
    4: {
        home: 'Ливерпуль',
        away: 'Реал Мадрид',
        tournament: 'Лига Чемпионов',
        rating: 4.9,
        analysis: '🔥 <b>ФИНАЛ ЛИГИ ЧЕМПИОНОВ!</b>\n\n📊 <b>Ключевые факты:</b>\n• Ливерпуль непобедим дома в 10 матчах\n• Реал Мадрид выиграл 4 из 5 последних финалов\n• Салах и Нуньес в отличной форме\n• Винисиус — главная угроза для Ливерпуля\n\n📈 <b>Прогноз:</b> Тотал больше 2.5, обе забьют\n⭐ <b>Ключевые игроки:</b> Салах, Винисиус, Беллингем',
        prediction: 'Тотал больше 2.5 (1.75)'
    },
    6: {
        home: 'Манчестер Сити',
        away: 'Челси',
        tournament: 'АПЛ',
        rating: 4.6,
        analysis: '🔵 <b>Манчестер Сити vs Челси</b>\n\n📊 <b>Ключевые факты:</b>\n• Сити выиграл 6 из 7 последних матчей\n• Челси пропускает в каждом выездном матче\n• Холанд забивает в 9 из 10 матчей\n\n📈 <b>Прогноз:</b> Победа Сити\n⭐ <b>Ключевые игроки:</b> Холанд, Фоден, Палмер',
        prediction: 'Победа Сити (1.50)'
    }
};

// ============================================================
// ФИЛЬТРАЦИЯ
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
    
    // timeFilter пока не реализован — оставляем все
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
    
    // Группировка по датам
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
                <div class="match-item" onclick="openAnalysis(${match.id})">
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
// ОТКРЫТИЕ АНАЛИЗА
// ============================================================
function openAnalysis(matchId) {
    state.currentMatchId = matchId;
    const data = analysisData[matchId];
    if (!data) {
        // Если нет данных — показываем заглушку с тарифами
        showTariffsOnly();
        return;
    }
    
    document.getElementById('screen-matches').classList.add('hidden');
    document.getElementById('screen-analysis').classList.remove('hidden');
    
    const content = document.getElementById('analysisContent');
    const stars = '⭐'.repeat(Math.floor(data.rating || 0)) + '☆'.repeat(5 - Math.floor(data.rating || 0));
    
    content.innerHTML = `
        <div class="analysis-card">
            <div class="analysis-title">⚽ ${data.home} vs ${data.away}</div>
            <div class="analysis-meta">${data.tournament} · ${stars}</div>
            <div class="analysis-text">${(data.analysis || '').replace(/\n/g, '<br>')}</div>
            <div class="analysis-prediction">📈 ${data.prediction}</div>
        </div>
        ${renderTariffs()}
        <button class="btn-back" onclick="backToMatches()" style="width:100%;padding:12px;background:#14141f;border:1px solid #1e1e32;border-radius:12px;font-size:16px;cursor:pointer;color:#ffffff;">
            ← Назад к матчам
        </button>
    `;
}

// ============================================================
// ТАРИФЫ
// ============================================================
function renderTariffs() {
    return `
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
                    <li>Подходит для спокойного роста банка</li>
                    <li>Приоритетные ставки дня</li>
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

function showTariffsOnly() {
    document.getElementById('screen-matches').classList.add('hidden');
    document.getElementById('screen-analysis').classList.remove('hidden');
    
    const content = document.getElementById('analysisContent');
    content.innerHTML = `
        <div style="text-align:center;padding:20px 0;color:#6a6a7a;">
            <div style="font-size:48px;margin-bottom:12px;">🧠</div>
            <div style="font-size:18px;font-weight:700;color:#ffffff;">Анализ матча</div>
            <div style="font-size:14px;">Разбор доступен по подписке</div>
        </div>
        ${renderTariffs()}
        <button class="btn-back" onclick="backToMatches()" style="width:100%;padding:12px;background:#14141f;border:1px solid #1e1e32;border-radius:12px;font-size:16px;cursor:pointer;color:#ffffff;">
            ← Назад к матчам
        </button>
    `;
}

// ============================================================
// НАЗАД
// ============================================================
function backToMatches() {
    document.getElementById('screen-matches').classList.remove('hidden');
    document.getElementById('screen-analysis').classList.add('hidden');
}

document.getElementById('backToMatches').addEventListener('click', backToMatches);

// ============================================================
// НИЖНЯЯ НАВИГАЦИЯ
// ============================================================
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        const tab = item.dataset.tab;
        if (tab === 'matches') {
            backToMatches();
        } else if (tab === 'analysis') {
            // Показываем все разборы
            showAllAnalysis();
        } else if (tab === 'express') {
            showExpress();
        }
    });
});

// ============================================================
// ВСЕ РАЗБОРЫ
// ============================================================
function showAllAnalysis() {
    document.getElementById('screen-matches').classList.add('hidden');
    document.getElementById('screen-analysis').classList.remove('hidden');
    
    const content = document.getElementById('analysisContent');
    const allKeys = Object.keys(analysisData);
    
    if (allKeys.length === 0) {
        content.innerHTML = '<div class="loading">Нет доступных разборов</div>';
        return;
    }
    
    let html = '<div style="margin-bottom:12px;font-size:18px;font-weight:700;">🧠 Все разборы</div>';
    
    allKeys.forEach(key => {
        const data = analysisData[key];
        html += `
            <div class="match-item" onclick="openAnalysis(${key})">
                <div class="tournament">${data.tournament}</div>
                <div class="teams">
                    <span>${data.home}</span>
                    <span style="color:#6a6a7a;">vs</span>
                    <span>${data.away}</span>
                </div>
                <div style="margin-top:4px;display:flex;gap:8px;">
                    <span class="ai-badge">⭐ ${data.rating}</span>
                    <span class="ai-badge">🧠 AI</span>
                </div>
            </div>
        `;
    });
    
    html += `<button class="btn-back" onclick="backToMatches()" style="width:100%;padding:12px;background:#14141f;border:1px solid #1e1e32;border-radius:12px;font-size:16px;cursor:pointer;color:#ffffff;">← Назад</button>`;
    content.innerHTML = html;
}

// ============================================================
// ЭКСПРЕСС
// ============================================================
function showExpress() {
    document.getElementById('screen-matches').classList.add('hidden');
    document.getElementById('screen-analysis').classList.remove('hidden');
    
    const content = document.getElementById('analysisContent');
    content.innerHTML = `
        <div class="analysis-card" style="text-align:center;">
            <div style="font-size:48px;margin-bottom:12px;">⚡</div>
            <div style="font-size:20px;font-weight:700;margin-bottom:8px;">Экспресс дня</div>
            <div style="color:#6a6a7a;margin-bottom:16px;">3 события с коэффициентом 4.85</div>
            <div style="text-align:left;padding:12px;background:#0a0a0f;border-radius:8px;margin-bottom:12px;">
                <div style="display:flex;justify-content:space-between;padding:4px 0;">
                    <span>⚽ Ливерпуль vs Реал Мадрид</span>
                    <span style="color:#4ade80;">1.85</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;">
                    <span>⚽ Манчестер Сити vs Челси</span>
                    <span style="color:#4ade80;">1.75</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;">
                    <span>⚽ Атлетик vs Морнар</span>
                    <span style="color:#4ade80;">1.55</span>
                </div>
            </div>
            <div style="font-size:24px;font-weight:700;margin-bottom:12px;">Общий: 4.85</div>
            <button onclick="tg.openTelegramLink('https://t.me/poland5692')" style="width:100%;padding:12px;background:linear-gradient(135deg,#667eea,#764ba2);color:white;border:none;border-radius:12px;font-size:16px;font-weight:600;cursor:pointer;">
                📥 Собрать экспресс
            </button>
        </div>
        <button class="btn-back" onclick="backToMatches()" style="width:100%;padding:12px;background:#14141f;border:1px solid #1e1e32;border-radius:12px;font-size:16px;cursor:pointer;color:#ffffff;">← Назад</button>
    `;
}

// ============================================================
// ЗАПУСК
// ============================================================
renderMatches();