let feedId = -1;
let user = {};
let owner = false;

$(document).ready(function () {
  //updateFeed();

  $('[data-toggle="popover"]').popover();

  $(document).keyup(function(event) {
    if ($("#newChannelUrl").is(":focus") && event.key == "Enter")
      newChannel();
  });
});


function newChannel() {
  $.post('/api/channel/new', {
    feedId: feedId,
    url: $('#newChannelUrl').val()
  }, function(data, status) {
    channel = JSON.parse(data);

    if(channel.error)
      showAlertbox('danger', channel.error);
    else if(channel.id) {
      addChannelLi(channel,400);
      $('[data-toggle="popover"]').popover('hide');
      animateChannelCollapses();
    }
  });
}

function deleteChannel(channelId) {
  $.post('/api/channel/delete', {
    channelId: channelId
  }, function(data, status) {
    channel = JSON.parse(data);
    if(channel.error)
      showAlertbox('danger', channel.error);
    else
      removeChannelLi(channelId);
  });
}

function editChannel(channelId) {
  $.post('/api/channel/edit', {
    channelId: channelId,
    filterContains: $('#filterContains'+channelId).val(),
    filterNotContains: $('#filterNotContains'+channelId).val(),
    filterAuthors: $('#filterAuthors'+channelId).val(),
    filterOpt3: $('#filterOpt3'+channelId).val()
  }, function(data, status) {
    data = JSON.parse(data);
    if(data.error) {
      showAlertbox('danger',data.error);
    } else {
      $('#channelCollapse'+channelId).collapse('hide');
    }
  });
}


function addSubscriptionStats(subscriptions) {
  let desktopDevicesCount = 0;
  let tabletDevicesCount = 0;
  let mobileDevicesCount = 0;

  for (subscription of subscriptions) {
    if (subscription.device == 'tablet')
      tabletDevicesCount++;
    else if (subscription.device == 'mobile')
      mobileDevicesCount++;
    else
      desktopDevicesCount++;
  }

  $('#desktopDevicesCount').text(desktopDevicesCount);
  $('#tabletDevicesCount').text(tabletDevicesCount);
  $('#mobileDevicesCount').text(mobileDevicesCount);
}

function addSubscriptionLi(subscription) {
  $('#subscriptionList').append(getSubscriptionLi(subscription));

  $('#subscriptionLi' + subscription.id).animateCss('fadeInUp');
}

function incrementDevicesCount(device) {
  if (device == 'mobile')
    $('#mobileDevicesCount').text(parseInt($('#mobileDevicesCount').text()) + 1);
  else if (device == 'tablet')
    $('#tabletDevicesCount').text(parseInt($('#tabletDevicesCount').text()) + 1);
  else
    $('#desktopDevicesCount').text(parseInt($('#desktopDevicesCount').text()) + 1);
}

function decrementDevicesCount(device) {
  if (device == 'mobile')
    $('#mobileDevicesCount').text(parseInt($('#mobileDevicesCount').text()) - 1);
  else if (device == 'tablet')
    $('#tabletDevicesCount').text(parseInt($('#tabletDevicesCount').text()) - 1);
  else
    $('#desktopDevicesCount').text(parseInt($('#desktopDevicesCount').text()) - 1);
}

function getSubscriptionLi(subscription) {
  let subscriptionLi = $('<li id="subscriptionLi'+subscription.id+'" data-endpoint="'+subscription.endpoint+'" style="padding-top:7px;"></li>');
  subscriptionLi.append($('<span style="float:left;width:30px;margin-right:25px;font-size:1.4em;">'+getDeviceSymbol(subscription.device)+'</span>'));
  subscriptionLi.append($('<span style="float:left;margin-right:8px;font-size:1.4em;">'+getOsSymbol(subscription.os)+'</span>'));
  subscriptionLi.append($('<span style="float:left;font-size:1.4em;">'+getBrowserSymbol(subscription.browsertype)+'</span>'));
  subscriptionLi.append($('<span style="float:right;">'+getDeviceDate(subscription.dateadded)+'</span>'));

  return subscriptionLi;
}

function getDeviceSymbol(device) {
  if (device == 'mobile')
    return '<i class="fas fa-mobile-alt"></i>';
  if (device == 'tablet')
    return '<i class="fas fa-tablet-alt"></i>';
  if (device == 'desktop')
    return '<i class="fas fa-desktop"></i>';

  return '<i class="fas fa-desktop"></i>';
}

function getOsSymbol(os) {
  if (os == 'iphone')
    return '<i class="fab fa-apple"></i>';
  if (os == 'android')
    return '<i class="fab fa-android"></i>';
  if (os == 'blackberry')
    return '<i class="fab fa-blackberry"></i>';
  if (os == 'linux')
    return '<i class="fab fa-linux"></i>';
  if (os == 'windows')
    return '<i class="fab fa-windows"></i>';
  if (os == 'mac')
    return '<i class="fab fa-apple"></i>';

}
function getBrowserSymbol(browser) {
  if (browser == 'chrome')
    return '<i class="fab fa-chrome"></i>';
  if (browser == 'firefox')
    return '<i class="fab fa-firefox"></i>';
  if (browser == 'opera')
    return '<i class="fab fa-opera"></i>';
  if (browser == 'edge')
    return '<i class="fab fa-edge"></i>';
  if (browser == 'safari')
    return '<i class="fab fa-safari"></i>';
  if (browser == 'ie')
    return '<i class="fab fa-internet-explorer"></i>';
}
function getDeviceDate(dateadded) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const today  = new Date(dateadded);


  return today.toLocaleDateString("en-US", options);
}

function addChannelLi(channel) {
  $('#channellist').append(getChannelLi(channel));
  if(owner)
    $('#channellist').append(getChannelEditBox(channel));
  else
    $('#channellist').append(getChannelInfoBox(channel));

  $('#channelLi' + channel.id).animateCss('fadeInUp');

  $('#noChannelsYet').animateCss('fadeOutDown', function() {
    $('#noChannelsYet').hide();
  });
}

function getChannelEditBox(channel) {
  let channelEditBox = $('<div style="margin: 10px 10px;" id="channelCollapse' + channel.id + '" class="collapse"></div>');

  channelEditBox.append(getFilterEditRow('Contains phrases:<br /><small>(comma separated)</small>', channel.filtercontains, 'filterContains'+channel.id, 'bitcoin, patchnotes, ..'));
  channelEditBox.append(getFilterEditRow('Not contains phrases:<br /><small>(comma separated)</small>', channel.filternotcontains, 'filterNotContains'+channel.id, 'newsletter, giveaway, ..'));

  if(channel.type == 'reddit') {
    channelEditBox.append(getFilterEditRow('Min. Karma:', channel.filteropt3, 'filterOpt3'+channel.id, '50'));
    channelEditBox.append(getFilterEditRow('From authors:', channel.filterauthors, 'filterAuthors'+channel.id, 'mcafee, dragon123, ..'));
  }


  channelEditBox.append(getFilterEditSubmitRow(channel.id));

  return channelEditBox;
}


function getFilterEditRow(subject, text, htmlid, placeholder) {
  let left = $('<div class="col-md-4 my-auto" style="font-size:0.9em;">'+subject+'</div>');
  let right = $('<div class="col-md-8 my-auto" style="font-size:0.8em;padding-top:10px;"><input id="'+htmlid+'" class="form-control" value="'+text+'" type="text" placeholder="'+placeholder+'"></div>');
  let row = $('<div class="row" style=""></div>');

  row.append(left);
  row.append(right);

  return row;
}

function getFilterEditSubmitRow(channelId) {
  let left = $('<div class="col-md-6" style="font-size:0.9em;"><button style="width:100%" onclick="editChannel('+channelId+')" class="btn btn-sm btn-success">Save</button></div>');
  let row = $('<div class="row justify-content-center" style="margin-top:16px;"></div>');

  row.append(left);

  return row;
}

function getChannelInfoBox(channel) {
  let channelInfoBox = $('<div style="margin: 10px 10px;" id="channelCollapse' + channel.id + '" class="collapse"></div>');

  if(channel.filtercontains || channel.filternotcontains || channel.filterauthors || channel.filteropt3)
    channelInfoBox.append($('<h5>Filter</h5>'));
  else
    channelInfoBox.append($('<h5>No filters activated for this channel</h5>'));

  if(channel.filtercontains)
    channelInfoBox.append(getFilterInfoRow('Contains words:', channel.filtercontains));
  if(channel.filternotcontains)
    channelInfoBox.append(getFilterInfoRow('Not contains words:', channel.filternotcontains));
  if(channel.filterauthors)
    channelInfoBox.append(getFilterInfoRow('From authors:', channel.filterauthors));

  if(channel.type == 'reddit') {
    if(channel.filteropt3 != 0)
      channelInfoBox.append(getFilterInfoRow('Min. Karma:', channel.filteropt3));
  }

  return channelInfoBox;
}


function getFilterInfoRow(subject, text) {
  let left = $('<div class="col-md-4" style="font-size:0.8em;">' + subject + '</div>');
  let right = $('<div class="col-md-8" style="font-size:0.8em;">' + text + '</div>');
  let row = $('<div class="row"></div>');

  row.append(left);
  row.append(right);

  return row;
}

function animateChannelCollapses() {
  $('.collapse').each(function() {
    $(this).on('show.bs.collapse', function () {
      $(this).animateCss('flipInX');
    });
  });
  $('.collapse').each(function() {
    $(this).on('hide.bs.collapse', function () {
      //$(this).animateCss('flipOutX');
    });
  });
}



function getChannelLi(channel) {
  let channelLi = $('<li id="channelLi'+channel.id+'"></li>');
  channelLi.append($('<span style="float: left; font-size:1.6em;margin-right:6px;">' + getSocialMediaIcon(channel.type) + '</span>'));
  channelLi.append($('<span style="float: left;">'+getTargetPrefix(channel.type)+channel.target+'</span>'));
  if (owner) {
    channelLi.append($('<i style="cursor:pointer;float: right; font-size:1.7em;" onclick="deleteChannel('+channel.id+')" class="fas fa-minus-square text-danger"></i>'));
    channelLi.append($('<i href="#channelCollapse'+channel.id+'" data-toggle="collapse" style="margin-right:5px;cursor:pointer;font-size:1.7em;float: right;" class="fas fa-pen-square text-info"></i>'));
  } else
    channelLi.append($('<i href="#channelCollapse'+channel.id+'" data-toggle="collapse" style="cursor:pointer;font-size:1.6em;float: right;" class="fas fa-info-circle text-info"></i>'));


  return channelLi;
}

function showNoChannelsMessage() {
  let message = $('<div class="text-center" id=""></div>');
  message.append('<br /><p class="text-muted"><b>No social media channels attached to this feed yet.</b></p>')
  setTimeout(function() {
    $('#noChannelsYet').append(message);
    $('#noChannelsYet').animateCss('fadeInUp');
  }, 200);

}

function removeSubscriptionLi(subscriptionId) {
  console.log('#subscriptionLi' + subscriptionId);
  $('#subscriptionLi' + subscriptionId).animateCss('fadeOutDown', function() {
    $('#subscriptionLi' + subscriptionId).hide();
  });
}

function removeChannelLi(channelId) {
  $('#channelLi' + channelId).animateCss('fadeOutDown', function() {
    $('#channelLi' + channelId).hide();
  });
  $('#channelCollapse' + channelId).animateCss('fadeOutDown', function() {
    $('#channelCollapse' + channelId).hide();
  });
}

function getSocialMediaIcon(type) {
  if (type == 'twitter')
    return '<i class="fab fa-twitter">';
  if (type == 'reddit')
    return '<i class="fab fa-reddit">';
}

function getTargetPrefix(type) {
  if (type == 'twitter')
    return '@';
  if (type == 'reddit')
    return '&nbsp;r/';
}
