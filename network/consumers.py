# chat/consumers.py
import json
from asgiref.sync import async_to_sync
from django.dispatch import receiver
from .models import *
from datetime import datetime
from channels.generic.websocket import WebsocketConsumer

class ChatConsumer(WebsocketConsumer):
    def connect(self):
         # is user authed
        if self.scope["user"].is_anonymous:
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
        chat = text_data_json['chat']
    
        recipient = text_data_json['recipient']
        message = text_data_json['message']
        
        #check recipient
        try:
            user = User.objects.get(pk=int(recipient))

            #check if chat exists
            is_chat_new = False
            result = Chat.objects.filter(participants=self.scope["user"]).filter(participants=user).first()
            if result is not None:
                chat_room = result
                chat_room.last_activity = datetime.now()
            else:
                chat_room = Chat()
                chat_room.save()
                chat_room.participants.add(user)
                chat_room.participants.add(self.scope["user"])

                is_chat_new = True

            #create chat messages for inboxes
            sender_message = ChatMessage(user=self.scope['user'], sender=self.scope['user'], recipient=user, message=message, chat=chat_room)
            recipient_message = ChatMessage(user=user, sender=self.scope['user'], recipient=user, message=message, chat=chat_room)

            sender_message.save()
            recipient_message.save()

            # Send message to sender room group
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'chat': chat_room.serialize(self.scope['user']),
                    'message': sender_message.serialize(),
                    'total_unread_count': ChatMessage.objects.filter(user=user,recipient=user, read=False).count(),
                    'is_chat_new': is_chat_new
                }
            )

            # Send message to receiver room group
            receiver_room_group = f"inbox_{recipient}"
            async_to_sync(self.channel_layer.group_send)(
                receiver_room_group,
                {
                    'type': 'chat_message',
                    'chat': chat_room.serialize(user),
                    'message': recipient_message.serialize(),
                    'total_unread_count': ChatMessage.objects.filter(user=user,recipient=user, read=False).count(),
                    'is_chat_new': is_chat_new
                }
            )
        except User.DoesNotExist:
            # Send message to sender room group
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    'type': 'error_message',
                    'message': 'The user does not exist'
                }
            )

    # Receive message from room group
    def chat_message(self, event):
        message = event['message']
        chat = event['chat']
        total_unread_count = event['total_unread_count']
        is_chat_new = event['is_chat_new']

        # Send message to WebSocket
        self.send(text_data=json.dumps({
            'message': message,
            'chat': chat,
            'total_unread_count': total_unread_count,
            'is_chat_new': is_chat_new
        }))
    
     # Receive message from room group
    def error_message(self, event):
        message = event['message']

        # Send message to WebSocket
        self.send(text_data=json.dumps({
            'error': message
        }))