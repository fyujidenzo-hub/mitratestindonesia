/* Shopee Work Web Push service worker. Keep dependency-free for broad browser support. */
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Shopee Work", body: "You have a new account notification.", path: "/" };
  }

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) client.postMessage({ type: "ACCOUNT_NOTIFICATION", notificationId: data.notificationId });
    await self.registration.showNotification(data.title || "Shopee Work", {
      body: data.body || "You have a new account notification.",
      icon: "/favicon.svg",
      badge: "/favicon.svg",
      tag: data.tag || data.notificationId,
      renotify: true,
      data: { path: data.path || "/" },
    });
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destination = new URL(event.notification.data?.path || "/", self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      if (new URL(client.url).origin === self.location.origin) {
        await client.navigate(destination);
        return client.focus();
      }
    }
    return self.clients.openWindow(destination);
  })());
});
