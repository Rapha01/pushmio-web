
//Vapid public key.
const applicationServerPublicKey = 'BLAtUUx1u43RbPMdOCg6OVNrDvhi58hboEsEYyQsZoqvrioJi_6W03mhS_F5ffEpnUGevLroK0Ot49hUAry_oE8';

const serviceWorkerName = '/sw.js';

let isSubscribed = false;
let swRegistration = null;

$(document).ready(function () {
  $('#newSubscriptionSubmit').click(function (event) {
    if(isSubscribed) {
      console.log("Unsubscribing...");
      unsubscribe();
    } else {
      subscribe();
    }
  });

  $('#grantPermission').click(function (event) {
    requestPermission();
  });

  if (Notification.permission == 'default') {
    $('#grantPermission').show();
  } else {
    requestPermission();
  }
});

function requestPermission() {
  Notification.requestPermission().then(function (status) {
    if (status === 'denied') {
      console.log('The user has blocked notifications.');
      $('#grantPermission').hide();
      disableButtonAndSetErrorMessage('Your Browsers notifications have been disabled for Pushm.io. Please enable them in your browsers settings and reload the page.');
    } else if (status === 'granted') {
      console.log('Initializing service worker.');
      $('#grantPermission').hide();
      $('#newSubscriptionSubmit').show();
      initialiseServiceWorker();
    }
  });
}

function initialiseServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register(serviceWorkerName).then(handleSWRegistration);
  } else {
    console.log('Service workers aren\'t supported in this browser.');
    disableButtonAndSetErrorMessage('Service workers unsupported. Please try again with chrome browser or reinstall it.');
  }
};

function handleSWRegistration(reg) {
  if (reg.installing) {
    console.log('Service worker installing');
  } else if (reg.waiting) {
    console.log('Service worker installed');
  } else if (reg.active) {
    console.log('Service worker active');
  }

  swRegistration = reg;
  initialiseState(reg);
}

// Once the service worker is registered set the initial state
function initialiseState(reg) {
  // Are Notifications supported in the service worker?
  if (!(reg.showNotification)) {
    console.log('Notifications aren\'t supported on service workers.');
    disableButtonAndSetErrorMessage('Notifications unsupported. Please try again with chrome browser or reinstall it.');
    return;
  }

  // Check if push messaging is supported
  if (!('PushManager' in window)) {
    console.log('Push messaging isn\'t supported.');
    disableButtonAndSetErrorMessage('Push messaging unsupported. Please try again with chrome browser or reinstall it.');
    return;
  }

  // We need the service worker registration to check for a subscription
  navigator.serviceWorker.ready.then(function (reg) {
    // Do we already have a push message subscription?
    reg.pushManager.getSubscription()
      .then(function (subscription) {
        if (!subscription) {
          console.log('Not yet subscribed to Push');

          isSubscribed = false;
          makeButtonSubscribable();

        } else {
          // initialize status, which includes setting UI elements for subscribed status
          // and updating Subscribers list via push
          isSubscribed = true;
          makeButtonUnsubscribable();

          getActiveFeedName(subscription.endpoint);
        }
      })
      .catch(function (err) {
        console.log('Error during getting subscription.', err);
      });
  });
}

function getActiveFeedName(endpoint) {
  $.post('/api/feed/getNameByEndpoint', {
    endpoint: endpoint
  }, function(data, status) {
    feed = JSON.parse(data);

    if(feed.error) {
      //showAlertbox('danger', channel.error);
    } else {
      showHeaderFeedBox(feed.name);
    }
  });
}

function showHeaderFeedBox(feedName) {
  $('#headerFeedName').text(' ' + feedName);
  $('#headerFeedName').click(function(){ window.location.href='/feed/' + feedName; });
  $('#headerFeedNameBox').show();
  $('#headerFeedNameBox').animateCss('fadeInRight');
  $('#headerFeedNameBox').show();
}

function hideHeaderFeedBox() {
  $('#headerFeedNameBox').show();
  $('#headerFeedNameBox').animateCss('fadeOutRight', function() {
    $('#headerFeedNameBox').hide();
  });

}

function subscribe() {
  if(!$('#customCheck2').prop("checked"))
    showAlertbox('warning', 'Please accept Terms and Conditions first');
  else {
    $('#newSubscriptionSubmit').attr('disabled','disabled');
    navigator.serviceWorker.ready.then(function (reg) {
      var subscribeParams = {userVisibleOnly: true};

      //Setting the public key of our VAPID key pair.
      var applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);
      subscribeParams.applicationServerKey = applicationServerKey;

      reg.pushManager.subscribe(subscribeParams)
        .then(function (subscription) {

          // Update status to subscribe current user on server
          var endpoint = subscription.endpoint;
          var key = subscription.getKey('p256dh');
          var auth = subscription.getKey('auth');
          sendSubscriptionToServer(endpoint, key, auth);
          isSubscribed = true;
          makeButtonUnsubscribable();
          showHeaderFeedBox($('#feedName').text());

        })
        .catch(function (e) {
          // A problem occurred with the subscription.
          console.log('Unable to subscribe to push.', e);
          makeButtonSubscribable();
        });
    });
  }
}

function unsubscribe() {
  $('#newSubscriptionSubmit').attr('disabled','disabled');
  var endpoint = null;
  swRegistration.pushManager.getSubscription()
    .then(function(subscription) {
      if (subscription) {
        endpoint = subscription.endpoint;
        return subscription.unsubscribe();
      }
    })
    .catch(function(error) {
      console.log('Error unsubscribing', error);
      makeButtonUnsubscribable();
    })
    .then(function() {
      isSubscribed = false;
      removeSubscriptionFromServer(endpoint);
      makeButtonSubscribable();
      hideHeaderFeedBox();
      console.log('User is unsubscribed.');
    });
}

function sendSubscriptionToServer(endpoint, key, auth) {
  const encodedKey = btoa(String.fromCharCode.apply(null, new Uint8Array(key)));
  const encodedAuth = btoa(String.fromCharCode.apply(null, new Uint8Array(auth)));

  $.post('/api/subscription/new', {
    feedId: feedId,
    publicKey: encodedKey,
    auth: encodedAuth,
    endpoint: endpoint
  },
  function(data, status) {
    subscription = JSON.parse(data);
    if (subscription.error) {
      showAlertbox('danger', subscription.error);
      unsubscribe();
    } else {
      incrementDevicesCount(subscription.device);
      if (parseInt($('#mobileDevicesCount').text()) + parseInt($('#mobileDevicesCount').text()) + parseInt($('#mobileDevicesCount').text()) < 10)
        addSubscriptionLi(subscription);
    }

  });
}

function removeSubscriptionFromServer(endpoint) {
  $.post('/api/subscription/remove', {
    endpoint: endpoint
  },
  function(data, status) {
    console.log(data);
    subscription = JSON.parse(data);
    if (subscription.error) {
      showAlertbox('danger', subscription.error);
      //subscribe();
    } else {
      if (subscription.feedid == feedId) {
        decrementDevicesCount(subscription.device);
        if (parseInt($('#mobileDevicesCount').text()) + parseInt($('#mobileDevicesCount').text()) + parseInt($('#mobileDevicesCount').text()) < 10)
          removeSubscriptionLi(subscription.id);
      }
    }
  });
}

function disableButtonAndSetErrorMessage(message) {
  $('#subscriptionErrorMessage').text(message);
  $('#subscriptionErrorBox').show();
  //$('#newSubscriptionSubmit').attr('disabled','disabled');
  //$('#newSubscriptionSubmit').hide();
}


function makeButtonSubscribable() {
  $('#newSubscriptionSubmit').text('Activate notifications');
  $('#acceptTCBox').show();
  $('#newSubscriptionSubmit').addClass('btn-success').removeClass('btn-warning');
  $('#newSubscriptionSubmit').removeAttr('disabled');
}

function makeButtonUnsubscribable() {
  $('#newSubscriptionSubmit').text('Pause notifications');
  $('#acceptTCBox').hide();
  $('#newSubscriptionSubmit').addClass('btn-warning').addClass('text-white').removeClass('btn-success');
  $('#newSubscriptionSubmit').removeAttr('disabled');
}

function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (var i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
