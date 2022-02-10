import imp
from django import template
from ..models import ChatMessage
from django.db.models import Q
from django.core.paginator import Paginator
register = template.Library()


@register.filter
def get_inbox_messages(messages, user):
    limit = 14
    paginator = Paginator(messages.filter(user=user).order_by('-timestamp').all(), limit)
    messages = []

    for message in paginator.get_page(1).object_list:
        messages.append(message)
    messages.reverse()

    return messages

@register.filter
def get_recipient(participants, user):
    return participants.filter(~Q(id=user.id)).first().id

@register.simple_tag
def define(val=None):
  return val

@register.filter
def first_message_date(messages, user):
    return get_inbox_messages(messages, user)[0].timestamp.date

@register.filter
def get_unread_count(chat, user):
    return len(chat.chat_messages.filter(user=user, recipient=user, read=False))

@register.filter
def get_total_unread_count(user):
    count = ChatMessage.objects.filter(user=user, recipient=user, read=False).count()

    if count == 0:
        data = ''
    else:
        data = count
    return data