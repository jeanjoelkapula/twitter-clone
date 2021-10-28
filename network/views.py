import json
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse

from django.shortcuts import render
from django.urls import reverse
from django.core.paginator import Paginator
from django.views.decorators.csrf import csrf_exempt

from .models import *


def index(request):
    if not request.user.is_authenticated:
        return HttpResponseRedirect(reverse('login'))

    if request.method == "POST":
        post = request.POST['post']
        post = Post(user=request.user, post=post)
        post.save()
        return HttpResponseRedirect(reverse('index'))
    
    page = request.GET.get('page', 1)
    posts = Post.objects.all()
    page = Paginator(posts, 10).page(page)

    return render(request, "network/index.html", {"page": page})

def profile(request):
    if not request.user.is_authenticated:
        return HttpResponseRedirect(reverse('login'))
    return render(request, "network/profile.html")

def following(request):
    if not request.user.is_authenticated:
        return HttpResponseRedirect(reverse('login'))
    return render(request, "network/following.html")

@csrf_exempt
def post(request, post_id):

    if request.method == "PUT":
        # Query for post
        try:
            post = Post.objects.get(pk=post_id)
        except Post.DoesNotExist:
            return JsonResponse({"error": "post not found."}, status=404)

        data = json.loads(request.body)

        #check if post has already been liked or disliked
        try:
            post_like = PostLike.objects.get(user=request.user, post=post)
            if data.get('liked') is not None:
                post_like.is_like = data["liked"]
                post_like.save()

                likes = len(PostLike.objects.filter(post=post, is_like=True))
                dislikes = len(PostLike.objects.filter(post=post, is_like=False))

                return JsonResponse({"success": "the post has been updated", "likes":likes, "dislikes": dislikes}, status=201)
        except PostLike.DoesNotExist:
            post_like = PostLike(user=request.user, post=post, is_like=data["liked"])
            post_like.save()

            likes = len(PostLike.objects.filter(post=post, is_like=True))
            dislikes = len(PostLike.objects.filter(post=post, is_like=False))

            return JsonResponse({"success": "the post has been updated", "likes":likes, "dislikes": dislikes}, status=201)

    # Post must be via PUT
    else:
        return JsonResponse({
            "error": "GET or PUT request required."
        }, status=400)


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login2.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register2.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register2.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register2.html")
