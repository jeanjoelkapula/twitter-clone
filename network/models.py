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
    date_created = models.DateTimeField(auto_now=True)
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

class PostLike(models.Model):
    user = models.ForeignKey(User, null=False, on_delete = models.CASCADE)
    post = models.ForeignKey(Post, null=False, on_delete = models.CASCADE, related_name="post_likes")
    is_like = models.BooleanField(default=True)

    def __str__(self):
        return f"Post - {self.post.id} - {self.user} - {self.is_like}"