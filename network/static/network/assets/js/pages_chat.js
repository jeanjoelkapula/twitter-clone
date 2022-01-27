$(function() {
  $('.chat-sidebox-toggler').click(function(e) {
    e.preventDefault();
    $('.chat-wrapper').toggleClass('chat-sidebox-open');
  });

});
