import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from ftback.routing import websocket_urlpatterns  # Подключаем маршруты WebSocket

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),  # HTTP-протоколы (Django)
    "websocket": AuthMiddlewareStack(
        URLRouter(
            websocket_urlpatterns  # Маршруты WebSocket
        )
    ),
})
