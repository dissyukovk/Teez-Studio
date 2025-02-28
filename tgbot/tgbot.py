import telebot
import gspread
import schedule
import time
import threading
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime
import requests

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

# Функция отправки ежедневной статистики с повторной попыткой
def send_daily_stats():
    today = datetime.now().strftime('%d.%m.%Y')
    stats_message = get_stats(today)

    max_retries = 3  # Количество попыток отправки
    for attempt in range(max_retries):
        try:
            bot.send_message(CHAT_ID, stats_message, parse_mode="Markdown")
            print(f"Статистика отправлена успешно с попытки {attempt + 1}")
            break
        except Exception as e:
            print(f"Ошибка при отправке статистики: {str(e)}. Попытка {attempt + 1} из {max_retries}.")
            if attempt == max_retries - 1:
                print("Не удалось отправить статистику после нескольких попыток.")

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

# Функция для получения данных сотрудников с листа TVD
def get_tvd_data(date_str):
    try:
        tvd_sheet = client.open_by_key(SHEET_ID).worksheet('TVD')
        data = tvd_sheet.get_all_values()
        headers = data[0]
        rows = data[1:]

        response = [f"*Данные товародвижения за {date_str}:*\n"]
        for row in rows:
            if row[0] == date_str:
                stats = list(map(int, row[2:]))
                if all(value == 0 for value in stats):
                    continue

                response.append(
                    f"👤 {row[1]}:\n"
                    f"  - Принято: *{row[2]}*\n"
                    f"  - Принято без заявок: *{row[3]}*\n"
                    f"  - Отправлено: *{row[4]}*\n"
                    f"  - Брак: *{row[5]}*\n"
                    f"  - Удалено из заявок: *{row[6]}*\n"
                    f"  - Добавлено в заявки: *{row[7]}*\n"
                )

        if len(response) == 1:
            return f"❌ Данные за {date_str} отсутствуют или сотрудники не имели операций."

        return "\n".join(response)
    except Exception as e:
        return f"❌ Произошла ошибка при обработке данных: {str(e)}"

# Обработчик команды /tvd
@bot.message_handler(commands=['tvd'])
def send_tvd_data(message):
    try:
        command = message.text.split()
        if len(command) != 2:
            bot.reply_to(message, "Пожалуйста, укажите дату в формате: /tvd dd.mm.yyyy")
            return

        date_str = command[1]
        try:
            datetime.strptime(date_str, '%d.%m.%Y')  # Проверка формата даты
        except ValueError:
            bot.reply_to(message, "Неверный формат даты. Используйте: dd.mm.yyyy")
            return

        tvd_message = get_tvd_data(date_str)
        bot.reply_to(message, tvd_message, parse_mode="Markdown")
    except Exception as e:
        bot.reply_to(message, f"❌ Произошла ошибка: {str(e)}")

# Обработчик команды /chatid
@bot.message_handler(commands=['chatid'])
def send_chatid(message):
    bot.reply_to(message, f"ID чата: {message.chat.id}")

# Функция для запуска планировщика задач в отдельном потоке
def scheduler_thread():
    schedule.every().day.at("20:30").do(send_daily_stats)
    while True:
        schedule.run_pending()
        time.sleep(1)

# Основная функция для запуска бота с увеличенными таймаутами и обработкой ошибок
def run_bot():
    while True:
        try:
            bot.polling(none_stop=True, timeout=60, long_polling_timeout=60)
        except requests.exceptions.ReadTimeout:
            print("Таймаут подключения. Перезапуск...")
        except Exception as e:
            print(f"Произошла ошибка: {str(e)}. Перезапуск...")

if __name__ == "__main__":
    scheduler = threading.Thread(target=scheduler_thread)
    scheduler.daemon = True
    scheduler.start()

    run_bot()
