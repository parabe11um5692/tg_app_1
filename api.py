from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import json
import os
from datetime import datetime
from typing import Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FILE = "matches_data.json"
USERS_FILE = "users_data.json"

def load_matches():
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def load_users():
    if not os.path.exists(USERS_FILE):
        return {}
    with open(USERS_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_users(users):
    with open(USERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(users, f, ensure_ascii=False, indent=2)

def get_emoji(league):
    emojis = {
        'АПЛ': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
        'Ла-Лига': '🇪🇸',
        'Бундес-Лига': '🇩🇪',
        'Серия А': '🇮🇹',
        'Лига 1': '🇫🇷',
        'Лига Чемпионов': '🏆',
        'conference': '🏅',
        'champions': '⭐',
        'europa': '🏆',
        'world': '🌍',
        'seriea': '🇮🇹'
    }
    return emojis.get(league, '🏆')

# ============================================================
# 1. ПОЛУЧИТЬ ВСЕ МАТЧИ
# ============================================================
@app.get("/api/matches/all")
async def get_all_matches(user_id: int = Query(...)):
    """Получить все матчи с информацией о пользователе"""
    data = load_matches()
    users = load_users()
    uid = str(user_id)
    
    # Добавляем информацию о пользователе
    used = users.get(uid, {}).get('used_analytics', 0)
    free_limit = 3
    
    # Добавляем флаг "есть анализ" для каждого матча
    matches = data.get('matches', [])
    for match in matches:
        match['has_analysis'] = bool(match.get('analysis'))
        match['user_remaining'] = free_limit - used
    
    return {
        'matches': matches,
        'user': {
            'id': user_id,
            'analytics_used': used,
            'free_limit': free_limit,
            'remaining': free_limit - used
        }
    }

# ============================================================
# 2. ПОЛУЧИТЬ МАТЧИ ДНЯ (ТОП-3)
# ============================================================
@app.get("/api/matches/day")
async def get_matches_day(user_id: int = Query(...)):
    """Получить топ-3 матча дня (с самым высоким рейтингом)"""
    data = load_matches()
    users = load_users()
    uid = str(user_id)
    
    matches = data.get('matches', [])
    
    # Сортируем по рейтингу (если есть) и берём топ-3
    sorted_matches = sorted(
        [m for m in matches if m.get('rating', 0) > 0],
        key=lambda x: x.get('rating', 0),
        reverse=True
    )[:3]
    
    used = users.get(uid, {}).get('used_analytics', 0)
    free_limit = 3
    
    # Добавляем информацию для фронтенда
    for match in sorted_matches:
        match['has_analysis'] = bool(match.get('analysis'))
        match['user_remaining'] = free_limit - used
    
    return {
        'matches': sorted_matches,
        'user': {
            'id': user_id,
            'analytics_used': used,
            'free_limit': free_limit,
            'remaining': free_limit - used
        }
    }

# ============================================================
# 3. ПОЛУЧИТЬ ТОП-СИГНАЛЫ
# ============================================================
@app.get("/api/matches/top-signals")
async def get_top_signals(user_id: int = Query(...), limit: int = 5):
    """Получить топ-сигналы (матчи с рейтингом > 70%)"""
    data = load_matches()
    matches = data.get('matches', [])
    
    # Фильтруем матчи с рейтингом > 70 и с анализом
    signals = [
        m for m in matches 
        if m.get('rating', 0) >= 70 and m.get('analysis')
    ]
    
    # Сортируем по рейтингу и берём топ-N
    sorted_signals = sorted(
        signals,
        key=lambda x: x.get('rating', 0),
        reverse=True
    )[:limit]
    
    return {
        'signals': sorted_signals,
        'total': len(signals)
    }

# ============================================================
# 4. ПОЛУЧИТЬ МАТЧИ ПО ЛИГЕ
# ============================================================
@app.get("/api/matches")
async def get_matches(league: str = Query(...), user_id: int = Query(...)):
    """Получить матчи по лиге"""
    data = load_matches()
    matches = [m for m in data.get('matches', []) if m.get('league') == league]
    
    return {
        'matches': matches,
        'count': len(matches)
    }

# ============================================================
# 5. ПОЛУЧИТЬ СПИСОК ЛИГ
# ============================================================
@app.get("/api/leagues")
async def get_leagues(user_id: int = Query(...)):
    """Получить список всех лиг с количеством матчей"""
    data = load_matches()
    users = load_users()
    uid = str(user_id)
    
    # Собираем лиги
    leagues_dict = {}
    for match in data.get('matches', []):
        league = match.get('league', 'Без лиги')
        league_name = match.get('tournament', league)
        if league not in leagues_dict:
            leagues_dict[league] = {
                'id': league,
                'name': league_name,
                'emoji': get_emoji(league),
                'count': 0
            }
        leagues_dict[league]['count'] += 1
    
    # Прогресс пользователя
    used = users.get(uid, {}).get('used_analytics', 0)
    free_limit = 3
    
    return {
        'leagues': list(leagues_dict.values()),
        'analytics_used': used,
        'free_limit': free_limit,
        'remaining': free_limit - used
    }

# ============================================================
# 6. ПОЛУЧИТЬ АНАЛИЗ МАТЧА
# ============================================================
@app.get("/api/analysis")
async def get_analysis(match_id: int = Query(...), user_id: int = Query(...)):
    """Получить AI-анализ конкретного матча"""
    data = load_matches()
    users = load_users()
    uid = str(user_id)
    
    match = next((m for m in data.get('matches', []) if m['id'] == match_id), None)
    if not match:
        return {'error': 'Матч не найден'}
    
    used = users.get(uid, {}).get('used_analytics', 0)
    free_limit = 3
    remaining = free_limit - used
    
    # Проверяем, есть ли анализ
    if not match.get('analysis'):
        return {
            'home_team': match.get('home_team', ''),
            'away_team': match.get('away_team', ''),
            'league': match.get('league', ''),
            'date': match.get('date', ''),
            'rating': match.get('rating', 0),
            'analysis': '❌ Анализ для этого матча пока не готов',
            'prediction': 'Нет прогноза',
            'remaining': remaining,
            'has_analysis': False
        }
    
    # Если лимит исчерпан — показываем только базовую инфу
    if used >= free_limit:
        return {
            'home_team': match.get('home_team', ''),
            'away_team': match.get('away_team', ''),
            'league': match.get('league', ''),
            'date': match.get('date', ''),
            'rating': match.get('rating', 0),
            'analysis': '🔒 Бесплатные анализы закончились! Оформи подписку для доступа.',
            'prediction': '💎 Требуется подписка',
            'remaining': 0,
            'has_analysis': True
        }
    
    # Увеличиваем счетчик использованных анализов
    if uid not in users:
        users[uid] = {'used_analytics': 0}
    users[uid]['used_analytics'] = users[uid]['used_analytics'] + 1
    save_users(users)
    
    # Возвращаем полный анализ
    return {
        'home_team': match.get('home_team', ''),
        'away_team': match.get('away_team', ''),
        'league': match.get('league', ''),
        'date': match.get('date', ''),
        'rating': match.get('rating', 0),
        'analysis': match.get('analysis', 'Анализ в разработке'),
        'prediction': match.get('prediction', 'Нет прогноза'),
        'remaining': free_limit - (used + 1),
        'has_analysis': True
    }

# ============================================================
# 7. СТАТИСТИКА ПОЛЬЗОВАТЕЛЯ
# ============================================================
@app.get("/api/user/stats")
async def get_user_stats(user_id: int = Query(...)):
    """Получить статистику использования пользователя"""
    users = load_users()
    uid = str(user_id)
    
    user_data = users.get(uid, {})
    used = user_data.get('used_analytics', 0)
    free_limit = 3
    
    return {
        'user_id': user_id,
        'analytics_used': used,
        'free_limit': free_limit,
        'remaining': free_limit - used,
        'is_premium': user_data.get('is_premium', False)
    }

# ============================================================
# ЗАПУСК (для разработки)
# ============================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)