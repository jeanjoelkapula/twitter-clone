# chat/consumers.py
import json
from asgiref.sync import async_to_sync
from django.dispatch import receiver
from channels.generic.websocket import WebsocketConsumer

class ChatConsumer(WebsocketConsumer):
    def connect(self):
         # is user authed
        if self.scope["user"].is_anonymous:
            print('NO USER')
            self.close()
        else:
            if self.scope['user'].id != int(self.scope['url_route']['kwargs']['room_name']):
                self.close()
            else:
                self.room_name = self.scope['url_route']['kwargs']['room_name']
                self.room_group_name = 'inbox_%s' % self.room_name

            
                # Join room group
                async_to_sync(self.channel_layer.group_add)(
                    self.room_group_name,
                    self.channel_name
                )

                # Send message to room group
                async_to_sync(self.channel_layer.group_send)(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message': 'successfully connected'
                    }
                )
                self.accept()

    def disconnect(self, close_code):
        # Leave room group
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        id = text_data_json['id']
        message = text_data_json['message']

        # Send message to sender room group
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message
            }
        )

        # Send message to receiver room group
        receiver_room_group = f"inbox_{id}"
        async_to_sync(self.channel_layer.group_send)(
            receiver_room_group,
            {
                'type': 'chat_message',
                'message': message
            }
        )

    # Receive message from room group
    def chat_message(self, event):
        message = event['message']

        # Send message to WebSocket
        self.send(text_data=json.dumps({
            'message': message
        }))