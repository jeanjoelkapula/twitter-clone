import json
import re
from select import select
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.http.response import Http404

from django.shortcuts import render
from django.template import library
from django.urls import reverse
from django.core.paginator import Paginator, EmptyPage
from .models import *
from datetime import datetime

def index(request):
    if not request.user.is_authenticated:
        return HttpResponseRedirect(reverse('login'))

    if request.method == "POST":
        post = request.POST['post']
        post = Post(user=request.user, post=post)
        post.save()
        return HttpResponseRedirect(reverse('index'))
    
    posts = Post.objects.order_by('-date_created').all()
    page = Paginator(posts, 10).page(1)

    return render(request, "network/index.html", {"page": page, "header":"All Posts"})

def profile(request, user_id):
    if not request.user.is_authenticated:
        return HttpResponseRedirect(reverse('login'))

    #check user id 
    try:
        user = User.objects.get(pk=user_id)
        
        #get user posts
        page = request.GET.get('page', 1)
        posts = Post.objects.filter(user=user).order_by('-date_created').all()
        page = Paginator(posts, 10).page(page)

        #check if request user is following user
        if request.user != user:
            if request.user in user.followers.all():
                is_following = True
            else:
                is_following = False
        else:
            is_following = None

        followers = len(user.followers.all())
        followees = len(user.followees.all())

        context = {
            "header":"Profile",
            "profile_user": user,
            "page":page,
            "is_following": is_following,
            "followers":followers,
            "followees": followees
        }

        return render(request, "network/profile.html", context)
        
    except User.DoesNotExist:
        return render(request, "network/profile_not_found.html")
    

def following(request):
    if not request.user.is_authenticated:
        return HttpResponseRedirect(reverse('login'))

    posts = Post.objects.filter(user__in=request.user.followees.all()).order_by('-date_created').all()
    page = request.GET.get('page', 1)
    page = Paginator(posts, 10).page(page)

    return render(request, "network/index.html", {"page": page, "header":"Following Posts"})

def messages(request):
    if not request.user.is_authenticated:
        return HttpResponseRedirect(reverse('login'))

    #if user desires to message another user for the first time
    r_new = request.GET.get('chat', None)
    sender_id = request.GET.get('s', None)
    recipient_id = request.GET.get('r', None)
    if (r_new is not None) and (sender_id is not None) and (recipient_id is not None):
        #validate user ids
        valid = True
        try:
            sender = User.objects.get(pk=sender_id)
        except User.DoesNotExist:
            valid = False
        
        try:
            recipient = User.objects.get(pk=recipient_id)
        except User.DoesNotExist:
            valid = False

        if valid:
            try:
                chat = Chat.objects.get(participants=recipient)
                return HttpResponseRedirect(reverse('chat_messages', args=(chat.id,)))
            except Chat.DoesNotExist:
                new_chat = {
                    'id': -1,
                    'sender': sender.serialize(),
                    'recipient': recipient.serialize(),
                    'messages':[]
                }
        else:
            new_chat = None
    else:
        new_chat = None
    
    #when no chat is selected
    selected_chat = None

    chats = Chat.objects.filter(participants=request.user).order_by('-last_activity').all()
    context = {
        'chats': chats,
        'selected_chat': selected_chat,
        'new_chat': new_chat
    }
    return render(request, "network/messages.html", context)

def chat_messages(request, chat_id):
    if not request.user.is_authenticated:
        return HttpResponseRedirect(reverse('login'))

    chat = None
    try:
        chat = Chat.objects.get(pk=chat_id)

    except Chat.DoesNotExist:
        raise Http404("Chat does not exist")
    else:
        if request.user not in chat.participants.all():
            context = {
                'message': 'You are not a participant in this chat'
            }

            return render(request, "network/error.html", context)
        else:
            chats = Chat.objects.filter(participants=request.user).order_by('-last_activity').all()
            context = {
                'chats': chats,
                'selected_chat': chat,
                'current_date': datetime.now()
            }

            return render(request, "network/messages.html", context)
def get_chat_messages(request, chat_id):
    if not request.user.is_authenticated:
        return JsonResponse({
            "error": "Access denied."
        }, status=403)
    
    if request.method == "GET":
        try:
            chat = Chat.objects.get(pk=chat_id)
        except Chat.DoesNotExist:
            return JsonResponse({
                "error": "The chat does not exist"
            }, status=201)

        #paginate messages
        order = request.GET.get('order', 'asc')
        page = request.GET.get('page', 1)
        limit = 14
        paginator = Paginator(chat.chat_messages.filter(user=request.user).order_by('-timestamp').all(), limit)
        messages = []
        try:
            page = paginator.page(page)
            for message in page.object_list:
                messages.append(message.serialize()) 
            if order == "asc":
                messages.reverse()
        except EmptyPage:
            pass
        
        data = {
            'id': chat.id,
            'last_activity': chat.last_activity.strftime("%b %d %Y, %I:%M %p"),
            'participants': [{'id': participant.id, 'username': participant.username} for participant in chat.participants.all()],
            'messages': messages
        }
        return JsonResponse(data, status=201)

def user_following(request, user_id):
    if not request.user.is_authenticated:
        return HttpResponseRedirect(reverse('login'))

    #check user id
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return JsonResponse({"error": "user not found."}, status=404)

    if request.method == "GET":
        context = {
            "followers": [u.serialize() for u in user.followers.all()],
            "followees":  [u.serialize() for u in user.followees.all()]
        }

        return JsonResponse(context,status=201)
    else:
           return JsonResponse({
            "error": "GET or PUT request required."
        }, status=400)

def get_page_posts(request, page):
    if not request.user.is_authenticated:
        return JsonResponse({
            "error": "Access denied."
        }, status=403)
    
    posts = Post.objects.order_by('-date_created').all()
    
    try:
        paginator = Paginator(posts, 10)
        page_posts = paginator.page(page).object_list
        data = []

        for post in page_posts:
            p = post.serialize()
            liked = None
            try:
                post_like = post.post_likes.get(user=request.user, post=post)
                liked = post_like.is_like
            except PostLike.DoesNotExist:
                liked = None
            p['liked'] = liked
            data.append(p)

        page
        context = {
            'posts': data,
            'num_pages': paginator.num_pages,
            'success': 'done'
        }

        return JsonResponse(context,status=200)
        
    except EmptyPage:
        return JsonResponse({
            "error": "That page contains no results."
        }, status=200)

def get_profile_posts(request, user_id, page):
    try:
        user = User.objects.get(pk=user_id)
        posts = Post.objects.filter(user=user).order_by('-date_created').all()

        try:
            paginator = Paginator(posts, 10)
            page_posts = paginator.page(page).object_list
            data = []

            for post in page_posts:
                p = post.serialize()
                liked = None
                try:
                    post_like = post.post_likes.get(user=request.user, post=post)
                    liked = post_like.is_like
                except PostLike.DoesNotExist:
                    liked = None
                p['liked'] = liked
                data.append(p)

            page
            context = {
                'posts': data,
                'num_pages': paginator.num_pages,
                'success': 'done'
            }

            return JsonResponse(context,status=200)
            
        except EmptyPage:
            return JsonResponse({
                "error": "That page contains no results."
            }, status=200)
    except User.DoesNotExist:
        return JsonResponse({
            "error": "The profile requested does not exist."
        }, status=200)

def followers(request, user_id, following):
    if not request.user.is_authenticated:
        return HttpResponseRedirect(reverse('login'))

    #check user id
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Http404()

    if following == "followers" or following == "following":
        context = {
            "following": following,
            "profile_user": user
        }

        return render(request, "network/following.html", context)
    else:
         return Http404()


def post(request, post_id):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "access denied"}, status=403)

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

            if data.get('unliked') is not None:
                if data['unliked'] == 'True':
                    post_like.delete()

                    likes = len(PostLike.objects.filter(post=post, is_like=True))
                    dislikes = len(PostLike.objects.filter(post=post, is_like=False))

                    return JsonResponse({"success": "the post has been updated", "likes":likes, "dislikes": dislikes}, status=201)
                else:
                    return JsonResponse({"error": "invalid unliked value."}, status=404)

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

def post_edit(request, post_id):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "access denied"}, status=403)
    
    if request.method == "PUT":
        #check post id
        try:
            post = Post.objects.get(pk=post_id)

            #check if request user is the creator of the post
            if request.user != post.user:
                return JsonResponse({"error": "access denied. You are not allowed to edit the content of this post"}, status=403)

            data = json.loads(request.body)

            if data.get('post') is not None:
                post.post = data.get('post')
                post.save()

                return JsonResponse({"success": "the post has been updated"}, status=201)

            else:
                return JsonResponse({
                    "error": "Post content was not found"
                }, status=400)
        except Post.DoesNotExist:
            return JsonResponse({
                "error": "Post not found"
            }, status=400)
    else:
        return JsonResponse({
                "error": "GET or PUT request required."
            }, status=400)

def follow(request, user_id):
    if not request.user.is_authenticated:
        return HttpResponseRedirect(reverse('login'))

    #check user id
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return JsonResponse({"error": "user not found."}, status=404)

    data = json.loads(request.body)

    #update user following
    if user != request.user and data.get('is_follow') is not None:
        if data['is_follow'] == "True":
            user.followers.add(request.user)
            request.user.followees.add(user)
        else:
            user.followers.remove(request.user)
            request.user.followees.remove(user)

        followers = len(user.followers.all())
        followees = len(user.followees.all())

        return JsonResponse({"success": "User follow successfully updated", "followers":followers, "followees": followees}, status=201)
    else:
        return JsonResponse({"error": "User follow successfully updated"}, status=403)

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
