import os
from celery import Celery
import logging

logger = logging.getLogger('celery')
logger.setLevel(logging.DEBUG)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')

app = Celery('myproject')

# Настройка из settings.py
app.config_from_object('django.conf:settings', namespace='CELERY')

# Автоматическое обнаружение задач
app.autodiscover_tasks()

app.conf.timezone = 'Asia/Almaty'

app.conf.beat_schedule = {
    'export-daily-stats': {
        'task': 'core.tasks.export_daily_stats',
        'schedule': 600.0,  # Every 10 minutes
    },
    'export-tvd-stats': {
        'task': 'core.tasks.export_tvd_stats',
        'schedule': 1200.0,  # Every 24 hours (daily)
    },
}



@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
