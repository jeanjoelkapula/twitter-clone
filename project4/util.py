from urllib.parse import urlparse

#https://stackoverflow.com/questions/62777377/long-url-including-a-key-causes-unicode-idna-codec-decoding-error-whilst-using
def parse_redis_url(url):
    """ parses a redis url into component parts, stripping password from the host.
    Long keys in the url result in parsing errors, since labels within a hostname cannot exceed 64 characters under
    idna rules.
    In that event, we remove the key/password so that it can be passed separately to the RedisChannelLayer.
    Heroku REDIS_URL does not include the DB number, so we allow for a default value of '0'
    """
    parsed = urlparse(url)
    parts = parsed.netloc.split(':')
    host = ':'.join(parts[0:-1])
    port = parts[-1]
    path = parsed.path.split('/')[1:]
    db = int(path[0]) if len(path) >= 1 else 0

    user, password = (None, None)
    if '@' in host:
        creds, host = host.split('@')
        user, password = creds.split(':')
        host = f'{user}@{host}'

    return host, port, user, password, db