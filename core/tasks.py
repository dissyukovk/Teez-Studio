import os
from celery import shared_task
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from datetime import datetime
from django.db.models import Sum, F  # Импорт Sum
from core.models import ProductOperation, STRequest, STRequestProduct  # Импорт моделей
import logging
logger = logging.getLogger(__name__)

# ID Google Таблицы
SPREADSHEET_ID = '11K7jqTTmo_dmtqAGU3DKaBo8i8yPNKz8Ml4Wba7weRI'
SHEET_NAME = 'MAIN'

# Настройки доступа к Google Sheets API
SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # Путь к текущему файлу (tasks.py)
CREDENTIALS_FILE = os.path.join(BASE_DIR, 'credentials.json')  # Абсолютный путь к credentials.json


@shared_task
def export_daily_stats():
    logger.info("Запуск задачи export_daily_stats")
    today = datetime.now().date()

    try:
        # Собираем статистику по операциям
        accepted = ProductOperation.objects.filter(
            operation_type=3, date__date=today).count()
        shipped = ProductOperation.objects.filter(
            operation_type=4, date__date=today).count()
        defective = ProductOperation.objects.filter(
            operation_type=25, date__date=today).count()

        accepted_without_request = ProductOperation.objects.filter(
            operation_type=3, date__date=today
        ).exclude(product__strequestproduct__isnull=False).count()

        # Подсчёт количества товаров в заявках через JOIN
        photo_count = STRequestProduct.objects.filter(
            request__status_id__in=[5, 6, 7, 8, 9],
            request__photo_date__date=today
        ).count()

        retouch_count = STRequestProduct.objects.filter(
            request__status_id__in=[8, 9],
            request__retouch_date__date=today
        ).count()

        # Формируем данные для записи
        data = [
            today.strftime('%d.%m.%Y'),
            accepted,
            shipped,
            defective,
            accepted_without_request,
            photo_count,
            retouch_count,
        ]

        logger.debug(f"Данные для записи: {data}")

        # Авторизация в Google Sheets
        creds = Credentials.from_service_account_file(CREDENTIALS_FILE, scopes=SCOPES)
        service = build('sheets', 'v4', credentials=creds)

        logger.debug(f"Авторизация в Google API успешна")

        # Получаем существующие данные из таблицы
        sheet_data = service.spreadsheets().values().get(
            spreadsheetId=SPREADSHEET_ID,
            range=f'{SHEET_NAME}!A:G'  # Диапазон столбцов, куда записываются данные
        ).execute()

        rows = sheet_data.get('values', [])

        # Проверяем, есть ли строка с текущей датой
        row_index = next(
            (i for i, row in enumerate(rows) if row and row[0] == today.strftime('%d.%m.%Y')),
            None
        )

        if row_index is not None:
            # Обновляем строку
            range_name = f'{SHEET_NAME}!A{row_index + 1}:G{row_index + 1}'
            body = {'values': [data]}
            service.spreadsheets().values().update(
                spreadsheetId=SPREADSHEET_ID,
                range=range_name,
                valueInputOption='RAW',
                body=body
            ).execute()
            logger.info(f"Строка с датой {today.strftime('%d.%m.%Y')} обновлена.")
        else:
            # Добавляем новую строку
            range_name = f'{SHEET_NAME}!A1'
            body = {'values': [data]}
            service.spreadsheets().values().append(
                spreadsheetId=SPREADSHEET_ID,
                range=range_name,
                valueInputOption='RAW',
                insertDataOption='INSERT_ROWS',
                body=body
            ).execute()
            logger.info(f"Добавлена новая строка с датой {today.strftime('%d.%m.%Y')}.")

        print("Экспорт данных выполнен!")
    except Exception as e:
        logger.error(f"Ошибка при экспорте данных: {e}")
        raise e

