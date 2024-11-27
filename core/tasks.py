import os
from celery import shared_task
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from datetime import datetime, timedelta
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
    yesterday = today - timedelta(days=1)

    try:
        def get_stats_for_date(date):
            """Получение статистики за указанную дату"""
            accepted = ProductOperation.objects.filter(
                operation_type=3, date__date=date).count()
            shipped = ProductOperation.objects.filter(
                operation_type=4, date__date=date).count()
            defective = ProductOperation.objects.filter(
                operation_type=25, date__date=date).count()
            accepted_without_request = ProductOperation.objects.filter(
                operation_type=3, date__date=date
            ).exclude(product__strequestproduct__isnull=False).count()
            photo_count = STRequestProduct.objects.filter(
                request__status_id__in=[5, 6, 7, 8, 9],
                request__photo_date__date=date
            ).count()
            retouch_count = STRequestProduct.objects.filter(
                request__status_id__in=[8, 9],
                request__retouch_date__date=date
            ).count()
            return [
                date.strftime('%d.%m.%Y'),
                accepted,
                shipped,
                defective,
                accepted_without_request,
                photo_count,
                retouch_count,
            ]

        # Получаем статистику за обе даты
        stats = [get_stats_for_date(yesterday), get_stats_for_date(today)]

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

        for data in stats:
            date_str = data[0]
            row_index = next(
                (i for i, row in enumerate(rows) if row and row[0] == date_str),
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
                logger.info(f"Строка с датой {date_str} обновлена.")
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
                logger.info(f"Добавлена новая строка с датой {date_str}.")

        print("Экспорт данных выполнен!")
    except Exception as e:
        logger.error(f"Ошибка при экспорте данных: {e}")
        raise e

@shared_task
def export_tvd_stats():
    logger.info("Starting export_tvd_stats task")

    try:
        today = datetime.now().date()

        # Get active stockmen
        stockman_group = Group.objects.filter(name="Товаровед").first()
        if not stockman_group:
            logger.error("Group 'Товаровед' not found")
            return

        active_stockmen = User.objects.filter(
            groups=stockman_group,
            is_active=True
        ).values('id', 'first_name', 'last_name')

        # Collect statistics for each stockman
        stats = []
        for stockman in active_stockmen:
            user_id = stockman['id']
            full_name = f"{stockman['first_name']} {stockman['last_name']}"

            accepted = ProductOperation.objects.filter(
                operation_type=3, user_id=user_id, date__date=today
            ).count()
            accepted_without_request = ProductOperation.objects.filter(
                operation_type=3, user_id=user_id, date__date=today
            ).exclude(product__strequestproduct__isnull=False).count()
            shipped = ProductOperation.objects.filter(
                operation_type=4, user_id=user_id, date__date=today
            ).count()
            defective = ProductOperation.objects.filter(
                operation_type=25, user_id=user_id, date__date=today
            ).count()
            added_to_requests = STRequestHistory.objects.filter(
                operation_id=1, user_id=user_id, date__date=today
            ).count()
            removed_from_requests = STRequestHistory.objects.filter(
                operation_id=2, user_id=user_id, date__date=today
            ).count()

            stats.append([
                today.strftime('%d.%m.%Y'),
                full_name,
                accepted,
                accepted_without_request,
                shipped,
                defective,
                removed_from_requests,
                added_to_requests,
            ])

        # Add a total row
        total_stats = [
            today.strftime('%d.%m.%Y'),
            "ИТОГО",
            sum(stat[2] for stat in stats),
            sum(stat[3] for stat in stats),
            sum(stat[4] for stat in stats),
            sum(stat[5] for stat in stats),
            sum(stat[6] for stat in stats),
            sum(stat[7] for stat in stats),
        ]
        stats.append(total_stats)

        # Authorize and access Google Sheets
        creds = Credentials.from_service_account_file(CREDENTIALS_FILE, scopes=SCOPES)
        service = build('sheets', 'v4', credentials=creds)

        # Fetch existing data
        sheet_data = service.spreadsheets().values().get(
            spreadsheetId=SPREADSHEET_ID,
            range=f'{TVD_SHEET_NAME}!A:H'
        ).execute()
        rows = sheet_data.get('values', [])

        # Update or append rows
        for data in stats:
            date_str, name = data[0], data[1]
            row_index = next(
                (i for i, row in enumerate(rows)
                 if row and row[0] == date_str and row[1] == name),
                None
            )

            if row_index is not None:
                # Update existing row
                range_name = f'{TVD_SHEET_NAME}!A{row_index + 1}:H{row_index + 1}'
                body = {'values': [data]}
                service.spreadsheets().values().update(
                    spreadsheetId=SPREADSHEET_ID,
                    range=range_name,
                    valueInputOption='RAW',
                    body=body
                ).execute()
                logger.info(f"Updated row for {name} on {date_str}")
            else:
                # Append new row
                range_name = f'{TVD_SHEET_NAME}!A1'
                body = {'values': [data]}
                service.spreadsheets().values().append(
                    spreadsheetId=SPREADSHEET_ID,
                    range=range_name,
                    valueInputOption='RAW',
                    insertDataOption='INSERT_ROWS',
                    body=body
                ).execute()
                logger.info(f"Added new row for {name} on {date_str}")

        logger.info("TVD statistics exported successfully")
    except Exception as e:
        logger.error(f"Error in export_tvd_stats: {e}")
        raise e
