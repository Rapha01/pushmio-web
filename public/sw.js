self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');
  console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);

  if (!(self.Notification && self.Notification.permission === 'granted'))
      return;

  const data = JSON.parse(event.data.text());
  const title = data.title;
  const options = {
    body: data.message,
    icon: data.icon,
    tag: data.clickTarget
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close();

  if(clients.openWindow)
      event.waitUntil(clients.openWindow(event.notification.tag));

});
