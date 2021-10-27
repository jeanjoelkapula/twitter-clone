from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    followers = models.ManyToManyField('self', symmetrical = False, related_name = 'followees')

    def __str__(self):
        return f"{self.username}"

class Post(models.Model):
    user = models.ForeignKey(User, null=False, on_delete = models.CASCADE)
    date_created = models.DateTimeField(auto_now=True)
    post = models.CharField(max_length=255,null=False, default="")

    def __str__(self):
        return f"{self.user} {self.date_created} post"

class PostLike(models.Model):
    user = models.ForeignKey(User, null=False, on_delete = models.CASCADE)
    Post = models.ForeignKey(Post, null=False, on_delete = models.CASCADE)
    is_dislike = models.BooleanField(default=False)