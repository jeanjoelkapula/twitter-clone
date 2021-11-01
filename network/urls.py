
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("profile/<int:user_id>", views.profile, name="profile"),
    path("<int:user_id>/<str:following>", views.followers, name="followers"),
    path("following", views.following, name="following"),
    path("post/<int:post_id>", views.post, name="post"),
    path("follow/<int:user_id>", views.follow, name="follow"),
    path("user_following/<int:user_id>", views.user_following, name="user_following")
]
