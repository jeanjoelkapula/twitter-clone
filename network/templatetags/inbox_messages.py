from django import template

register = template.Library()


@register.filter
def get_inbox_messages(messages, user):
    return messages.filter(user=user).all()
