import asyncio
import logging
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import Command
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton, BotCommand, WebAppInfo
from aiogram.client.default import DefaultBotProperties

# -------------------------------------------------------------
# 1. КОНФИГУРАЦИЯ
# -------------------------------------------------------------
BOT_TOKEN = "8950871603:AAGUz6OfqM66hU9KQsuKh759OW6I9Fp3BJQ"
WEB_APP_URL = "https://parabe11um5692.github.io/tg_app_1/" 

logging.basicConfig(level=logging.INFO)

# -------------------------------------------------------------
# 2. БОТ
# -------------------------------------------------------------
bot = Bot(
    token=BOT_TOKEN,
    default=DefaultBotProperties(parse_mode="HTML")
)
dp = Dispatcher()

# -------------------------------------------------------------
# 3. ОБРАБОТЧИКИ
# -------------------------------------------------------------
@dp.message(Command("start"))
async def cmd_start(message: Message):
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(
                text="🚀 Открыть приложение",
                web_app=WebAppInfo(url=WEB_APP_URL)
            )]
        ]
    )
    
    await message.answer(
        "⚽ <b>UsserAI Football</b>\n\n"
        "Нажми на кнопку ниже, чтобы открыть приложение\n"
        "и начать анализировать футбольные матчи с ИИ.",
        reply_markup=keyboard
    )

@dp.message(Command("help"))
async def cmd_help(message: Message):
    await message.answer(
        "⚽ Открой приложение через кнопку ниже.\n"
        "Если кнопка не появилась, нажми /start."
    )

# -------------------------------------------------------------
# 4. ЗАПУСК
# -------------------------------------------------------------
async def main():
    print("\n" + "="*50)
    print("⚽ UsserAI BOT (Mini App)")
    print("="*50)
    
    me = await bot.me()
    print(f"✅ Бот: @{me.username}")
    
    commands = [
        BotCommand(command="/start", description="🏠 Открыть приложение"),
        BotCommand(command="/help", description="❓ Помощь"),
    ]
    await bot.set_my_commands(commands)
    print("✅ Меню установлено")
    
    print("\n🤖 Бот готов! Нажми /start")
    print("="*50 + "\n")
    
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())