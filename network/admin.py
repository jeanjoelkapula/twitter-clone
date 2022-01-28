from django.contrib import admin
from .models import * 

# Register your models here.
admin.site.register(User)
admin.site.register(Post)
admin.site.register(PostLike)
admin.site.register(Chat)
admin.site.register(ChatMessage)