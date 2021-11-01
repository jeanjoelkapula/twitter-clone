from django import template
from ..models import PostLike

register = template.Library()


@register.filter
def is_liked(post, user):
    try:
        post_like = post.post_likes.get(user=user, post=post)
        return post_like.is_like
    except PostLike.DoesNotExist:
        return None
