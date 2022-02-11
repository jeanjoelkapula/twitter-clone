from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    followers = models.ManyToManyField('self', symmetrical = False, related_name = 'followees')

    def __str__(self):
        return f"{self.username}"
    
    def serialize(self):
        return {
            "id": self.id,
            "username": self.username,
            "followers": [{"id": u.id, "username": u.username} for u in self.followers.all()],
            "followees": [{"id": u.id, "username": u.username}  for u in self.followees.all()]
        }

class Post(models.Model):
    user = models.ForeignKey(User, null=False, on_delete = models.CASCADE)
    date_created = models.DateTimeField(auto_now_add=True)
    post = models.CharField(max_length=255,null=False, default="")

    def __str__(self):
        return f"{self.user} {self.date_created} post"

    def likes(self):
        count = len(self.post_likes.filter(is_like=True))

        if count > 0:
            return count
        else:
            return "" 
    
    def dislikes(self):
        count = len (self.post_likes.filter(is_like=False))

        if count > 0:
            return count
        else:
            return ""
    def serialize(self):
        return {
            "id": self.id,
            "post": str(self.post),
            "user": self.user.username,
            "user_id": self.user.id,
            "likes": self.likes(),
            "dislikes": self.dislikes(),
            "date_created": self.date_created.strftime("%b.%d.%Y, %H:%M %p")
        }

class PostLike(models.Model):
    user = models.ForeignKey(User, null=False, on_delete = models.CASCADE)
    post = models.ForeignKey(Post, null=False, on_delete = models.CASCADE, related_name="post_likes")
    is_like = models.BooleanField(default=True)

    def __str__(self):
        return f"Post - {self.post.id} - {self.user} - {self.is_like}"

class Chat(models.Model):
    participants = models.ManyToManyField(User, blank=False, related_name="chats")
    last_activity = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Chat - {self.id}"
    
    def serialize(self, user):
        return {
            'id': self.id,
            'last_activity': self.last_activity.strftime("%b %d %Y, %I:%M %p"),
            'participants': [{'id': participant.id, 'username': participant.username} for participant in self.participants.all()],
            'messages': [message.serialize() for message in self.chat_messages.filter(user=user).all()]
        }
    
    def get_latest_messages(self, user):
        limit = 5
        offset = len(self.chat_messages.all()) - (1 * limit)
        return self.chat_messages.filter(user=user).order_by('timestamp').all()[offset:limit+offset]

    def get_unread_count(self, user):
        return len(self.chat_messages.filter(user=user, recipient=user, read=False))

class ChatMessage(models.Model):
    user = models.ForeignKey("User", on_delete=models.CASCADE, related_name="user_messages")
    sender = models.ForeignKey("User", on_delete=models.PROTECT, related_name="messages_sent")
    recipient = models.ForeignKey("User", on_delete=models.PROTECT, related_name="messages_received")
    message = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name="chat_messages", null=False)

    def serialize(self):
        return {
            "id": self.id,
            "sender": self.sender.username,
            "recipient": self.recipient.username,
            "message": self.message,
            "timestamp": self.timestamp.strftime("%b %d %Y, %I:%M %p"),
            "read": self.read,
        }
    
    def __str__(self):
        return f"{self.chat} {self.user.username} {self.message}"
