from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import json
import fastapi
import os
from datetime import datetime

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

@app.get("/api/leagues")
async def get_leagues(user_id: int = Query(...)):
    data = load_matches()
    users = load_users()
    uid = str(user_id)
    
    # Собираем лиги
    leagues_dict = {}
    for match in data['matches']:
        league = match.get('league', 'Без лиги')
        if league not in leagues_dict:
            leagues_dict[league] = {
                'name': league,
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
        'free_limit': free_limit
    }

@app.get("/api/matches")
async def get_matches(league: str = Query(...), user_id: int = Query(...)):
    data = load_matches()
    matches = [m for m in data['matches'] if m.get('league') == league]
    return {'matches': matches}

@app.get("/api/analysis")
async def get_analysis(match_id: int = Query(...), user_id: int = Query(...)):
    data = load_matches()
    users = load_users()
    uid = str(user_id)
    
    match = next((m for m in data['matches'] if m['id'] == match_id), None)
    if not match:
        return {'error': 'Матч не найден'}
    
    used = users.get(uid, {}).get('used_analytics', 0)
    free_limit = 3
    remaining = free_limit - used
    
    # Если лимит исчерпан — показываем только базовую инфу
    if used >= free_limit:
        return {
            'home_team': match['home_team'],
            'away_team': match['away_team'],
            'league': match.get('league'),
            'date': match.get('date'),
            'rating': match.get('rating', 0),
            'analysis': '🔒 Бесплатные анализы закончились! Оформи подписку для доступа.',
            'prediction': '💎 Требуется подписка',
            'remaining': 0
        }
    
    # Увеличиваем счетчик
    users[uid] = users.get(uid, {'used_analytics': 0})
    users[uid]['used_analytics'] = users[uid]['used_analytics'] + 1
    with open(USERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(users, f, ensure_ascii=False, indent=2)
    
    return {
        'home_team': match['home_team'],
        'away_team': match['away_team'],
        'league': match.get('league'),
        'date': match.get('date'),
        'rating': match.get('rating', 0),
        'analysis': match.get('analysis', 'Анализ в разработке'),
        'prediction': match.get('prediction', 'Нет прогноза'),
        'remaining': free_limit - (used + 1)
    }

def get_emoji(league):
    emojis = {
        'АПЛ': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
        'Ла-Лига': '🇪🇸',
        'Бундес-Лига': '🇩🇪',
        'Серия А': '🇮🇹',
        'Лига 1': '🇫🇷',
        'Лига Чемпионов': '🏆'
    }
    return emojis.get(league, '🏆')