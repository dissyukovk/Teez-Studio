import telebot
import gspread
import schedule
import time
import threading
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime

# Настройки бота и Google Sheets
TELEGRAM_TOKEN = '7628160084:AAE8iY7EU35ifUD9gatgT3nCxxqjvggyvfc'
SHEET_ID = '11K7jqTTmo_dmtqAGU3DKaBo8i8yPNKz8Ml4Wba7weRI'
CHAT_ID = '-1002282721205'  # Укажите ID чата, куда бот будет отправлять сообщение
bot = telebot.TeleBot(TELEGRAM_TOKEN)

# Настройка доступа к Google Sheets
scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
credentials = ServiceAccountCredentials.from_json_keyfile_name("credentials.json", scope)
client = gspread.authorize(credentials)
sheet = client.open_by_key(SHEET_ID).sheet1

# Функция для получения статистики
def get_stats(date_str):
    try:
        data = sheet.get_all_values()
        headers = data[0]
        rows = data[1:]

        # Ищем строку с нужной датой
        stats_row = None
        for row in rows:
            if row[0] == date_str:
                stats_row = row
                break

        if not stats_row:
            return "⚠️ Данные недоступны ⚠️"

        # Формируем сообщение
        response = (
            f"📊 *Показатели фотостудии за {date_str}:*\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\n"
            f"📦 Принято товаров: *{stats_row[1]}*\n"
            f"🚚 Отправлено товаров: *{stats_row[2]}*\n"
            f"❌ Брак: *{stats_row[3]}*\n"
            f"🗿 Принято без заявок: *{stats_row[4]}*\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\n"
            f"📸 Сфотографировано: *{stats_row[5]}*\n"
            f"🎨 Отретушировано: *{stats_row[6]}*\n"
            f"━━━━━━━━━━━━━━━━━━━━━━"
        )
        return response
    except Exception as e:
        return f"❌ Произошла ошибка: {str(e)}"

# Функция отправки ежедневной статистики
def send_daily_stats():
    today = datetime.now().strftime('%d.%m.%Y')
    stats_message = get_stats(today)
    bot.send_message(CHAT_ID, stats_message, parse_mode="Markdown")

# Обработчик команды /stats
@bot.message_handler(commands=['stats'])
def send_stats(message):
    try:
        command = message.text.split()
        if len(command) != 2:
            bot.reply_to(message, "Пожалуйста, укажите дату в формате: stats dd.mm.yyyy")
            return

        date_str = command[1]
        try:
            datetime.strptime(date_str, '%d.%m.%Y')  # Проверка формата даты
        except ValueError:
            bot.reply_to(message, "Неверный формат даты. Используйте: dd.mm.yyyy")
            return

        stats_message = get_stats(date_str)
        bot.reply_to(message, stats_message, parse_mode="Markdown")
    except Exception as e:
        bot.reply_to(message, f"❌ Произошла ошибка: {str(e)}")

# Функция для запуска планировщика задач в отдельном потоке
def scheduler_thread():
    schedule.every().day.at("20:20").do(send_daily_stats)
    while True:
        schedule.run_pending()
        time.sleep(1)

# Основная функция для запуска бота
def run_bot():
    bot.polling(none_stop=True)

if __name__ == "__main__":
    # Запускаем планировщик задач в отдельном потоке
    scheduler = threading.Thread(target=scheduler_thread)
    scheduler.daemon = True  # Чтобы поток завершился при завершении основного скрипта
    scheduler.start()

    # Запускаем бота
    run_bot()
