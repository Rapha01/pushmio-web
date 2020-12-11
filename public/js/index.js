$( document ).ready(function() {

  /*$( '#newFeedSubmit' ).click(function() {
    $.post('/api/feed/new', {
      name: $('#newFeedName').val(),
      password: $('#newFeedPassword').val(),
      passwordVerify: $('#newFeedPasswordVerify').val(),
      email: $('#newFeedEmail').val()
    },
    function(data, status) {
      if ($.isNumeric(data))
        window.location.href = 'feed/' + $('#newFeedName').val();
      else {
        //Handle Error Msgs
      }
    });
  });*/



});

function scrollToId(id) {
  $('html, body').animate({
      scrollTop: $('#' + id).offset().top
  }, 500);
}
