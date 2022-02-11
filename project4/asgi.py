"""
ASGI config for project4 project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/3.0/howto/deployment/asgi/
"""

import os
import django

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.routing import ProtocolTypeRouter
from django.core.asgi import get_asgi_application
import network.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project4.settings')
django.setup()

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            network.routing.websocket_urlpatterns
        )
    ),
})
