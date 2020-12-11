const db = require('../db.js');
const mysql = require('mysql');
const webpush = require('web-push');
const applicationServerPublicKey = '';
const applicationServerPrivateKey = '';

exports.sendNotification = (subscription,post) => {
  const notification = getNotificationPayload(subscription,post);

  pushTarget = {
     endpoint: subscription.endpoint,
     keys: {
         p256dh: subscription.publickey,
         auth: subscription.auth
     }
  };

  const options = {
    vapidDetails: {
      subject: 'mailto:pushmioadm@gmail.com',
      publicKey: applicationServerPublicKey,
      privateKey: applicationServerPrivateKey
    }
  };

  //console.log('Sending "' + JSON.parse(notification).message.substr(0, 20) + '.." to ' + subscription.browsertype + ' ' + subscription.device + ' ' + pushTarget.endpoint.substr(pushTarget.endpoint.length - 10));

  webpush.sendNotification(pushTarget, notification, options).then((response) => {
    //console.log(response);
    if (subscription.onlyerrorssince != '1970-01-01 00:00:00') {
      let sql = `UPDATE subscription SET onlyerrorssince = '1970-01-01 00:00:00' WHERE id = ${subscription.id}`;

      db.query(sql, function (err, subscriptions, fields) {
        try { if (err) throw err; } catch (err) { console.log(err); } });
    }
  }).catch((error) => {
    console.log('PushError on ' + error.endpoint.substr(error.endpoint.length - 10) + ': ' + error.message);

    if (subscription.onlyerrorssince == '1970-01-01 00:00:00') {
      let sql = `UPDATE subscription SET onlyerrorssince = NOW() WHERE id = ${subscription.id}`;

      db.query(sql, function (err, subscriptions, fields) {
        try { if (err) throw err; } catch (err) { console.log(err); } });

    } else if (Date.parse(subscription.onlyerrorssince) + 432000000 < Date.now()) {
      let sql = `DELETE FROM subscription WHERE id = ${subscription.id}`;

      db.query(sql, function (err, subscriptions, fields) {
        try { if (err) throw err; } catch (err) { console.log(err); } });
    }
  });
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

function getNotificationPayload(subscription,post) {
  let payload = {};
  let message = post.content;
  if (message.length > 60)
    message = message.substr(0,60) + '..';

  payload.message = message;
  payload.icon = post.icon;

  payload.clickTarget = post.link;

  hoursRegistered = ( Date.now() - Date.parse(subscription.dateadded) ) /1000 /60 /60;
  if (hoursRegistered > 72 && Math.random() < 0.21) {
    payload.clickTarget = 'https://pushm.io/admediator/' + subscription.feedid + '/' + encodeURIComponent(post.link) + '?utm_source=admediator&utm_medium=' + subscription.feedid;
    //console.log('link admediated');
  }

  if (post.type == 'twitter')
    payload.title = '@' + post.target;

  if (post.type == 'reddit')
    payload.title = 'r/' + post.target;

  return JSON.stringify(payload);
}
