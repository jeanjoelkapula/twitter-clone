const chatSocket = new WebSocket(
    'ws://'
    + window.location.host
    + '/ws/chat/'
    + user.id
    + '/'
);