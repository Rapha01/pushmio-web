function showAlertbox(type,text) {
  let alertbox = $('<div class="alertbox alert-'+type+'">' + text + '</div>');
  $('#alertframe').append(alertbox);

  alertbox.animateCss('fadeInUp');

  alertbox.show();

  setTimeout(function() {
    alertbox.animateCss('fadeOutUp', function() {
      alertbox.hide();
    });
  }, 4000);

}
