from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    followers = models.ManyToManyField('self', symmetrical = False, related_name = 'followees')

class Post(models.Model):
    user = models.ForeignKey(User, null=False, on_delete = models.CASCADE)
    date_created = models.DateTimeField(auto_now=True)

class PostLike(models.Model):
    user = models.ForeignKey(User, null=False, on_delete = models.CASCADE)
    Post = models.ForeignKey(Post, null=False, on_delete = models.CASCADE)
    is_dislike = models.BooleanField(default=False)