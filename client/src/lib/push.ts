import { api } from "./api";

export type NotificationArea = "customer" | "admin";

const base = (area: NotificationArea) => `/${area}/notifications`;

function applicationServerKey(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

export function pushSupported() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function isIosDevice() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
    || (/macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
}

export function isStandaloneApp() {
  return window.matchMedia("(display-mode: standalone)").matches
    || ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
}

export function isIosWithoutHomeScreenInstall() {
  return isIosDevice() && !isStandaloneApp();
}

export async function registerAppServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

async function registerSubscription(area: NotificationArea, requestPermission: boolean) {
  if (!pushSupported()) throw new Error("Phone notifications are not supported by this browser.");
  if (isIosWithoutHomeScreenInstall()) {
    throw new Error("On iPhone, add this website to your Home Screen first, then open it there and enable notifications.");
  }

  let permission = Notification.permission;
  if (permission === "default" && requestPermission) permission = await Notification.requestPermission();
  if (permission === "denied") throw new Error("Notifications are blocked. Enable them in your phone or browser settings.");
  if (permission !== "granted") return false;

  const [{ publicKey }, registration] = await Promise.all([
    api<{ enabled: boolean; publicKey: string }>(`${base(area)}/push-config`),
    registerAppServiceWorker(),
  ]);
  if (!publicKey || !registration) throw new Error("Phone notifications are temporarily unavailable.");

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey(publicKey),
    });
  }
  const serialized = subscription.toJSON();
  if (!serialized.endpoint || !serialized.keys?.p256dh || !serialized.keys.auth) {
    throw new Error("The browser returned an incomplete notification subscription.");
  }
  await api(`${base(area)}/subscriptions`, {
    method: "POST",
    body: JSON.stringify({ endpoint: serialized.endpoint, keys: serialized.keys }),
  });
  return true;
}

export const enablePushNotifications = (area: NotificationArea) => registerSubscription(area, true);

export async function syncGrantedPushNotifications(area: NotificationArea) {
  if (!pushSupported() || Notification.permission !== "granted") return false;
  return registerSubscription(area, false);
}

/** Detaches this browser endpoint from the signed-in account without revoking permission. */
export async function detachCurrentPushSubscription(area: NotificationArea) {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;
  await api(`${base(area)}/subscriptions/current`, {
    method: "DELETE",
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  }).catch(() => undefined);
}
