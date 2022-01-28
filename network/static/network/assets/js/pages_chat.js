//get csrf token
const csrftoken = getCookie('csrftoken');

$(function() {
  $('.chat-sidebox-toggler').click(function(e) {
    e.preventDefault();
    $('.chat-wrapper').toggleClass('chat-sidebox-open');
  });

});

function set_active_chat(element) {
    $('.list-group-item').each(function( index, item ) {
        $(item).removeClass('active');
    });

    $(element).addClass('active');
}

function chat_click(element) {
    set_active_chat(element);
}


