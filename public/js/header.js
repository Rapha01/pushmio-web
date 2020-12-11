function toggleSearchbar() {
  const searchBar = $('#searchbar');
  if(searchBar.is(':visible')) {
    searchBar.animateCss('flipOutX', function() {
      searchBar.hide();
    });
  } else
    searchBar.show();$('#searchbar').animateCss('flipInX');
}

$(document).ready(function () {
  // Get the input field
  var input = document.getElementById("searchName");
  // Execute a function when the user releases a key on the keyboard
  input.addEventListener("keyup", function(event) {
    // Cancel the default action, if needed
    event.preventDefault();
    // Number 13 is the "Enter" key on the keyboard
    if (event.keyCode === 13) {
      // Trigger the button element with a click
      document.getElementById("searchButton").click();
    }
  });

  $(document).on('click', 'a[href^="/#"]', function (event) {
    let id = $.attr(this, 'href').substr(1);
    if($(id).length > 0) {
      event.preventDefault();

      $('html, body').animate({
          scrollTop: $(id).offset().top
      }, 1000);
    }
  });

});
