import { Bell, Check, CheckCheck, ChevronLeft, ExternalLink, Home, RefreshCw, Share2, Smartphone, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api, dateTime } from "../lib/api";
import { useAuth } from "../lib/auth";
import {
  enablePushNotifications,
  isIosWithoutHomeScreenInstall,
  pushSupported,
  syncGrantedPushNotifications,
  type NotificationArea,
} from "../lib/push";

export type AccountNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  path: string;
  entityType?: string;
  entityId?: string;
  readAt?: string;
  clearedAt?: string;
  createdAt: string;
};

export function NotificationBell() {
  const { user } = useAuth();
  const area: NotificationArea = user?.role === "CUSTOMER" ? "customer" : "admin";
  const apiBase = `/${area}/notifications`;
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"unread" | "all">("unread");
  const [notifications, setNotifications] = useState<AccountNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMessage, setPushMessage] = useState("");
  const [pushEnabled, setPushEnabled] = useState(() => pushSupported() && Notification.permission === "granted");
  const [showIosGuide, setShowIosGuide] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iosNeedsInstall = isIosWithoutHomeScreenInstall();
  const browserSupportsPush = pushSupported();

  const load = useCallback(async (showSpinner = false) => {
    if (!user) return;
    if (showSpinner) setRefreshing(true);
    try {
      const result = await api<{ notifications: AccountNotification[]; unreadCount: number }>(apiBase, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
    } catch {
      // Authentication and global API errors are handled elsewhere in the app.
    } finally {
      if (showSpinner) setRefreshing(false);
    }
  }, [apiBase, user?.id]);

  useEffect(() => {
    if (!user) return;
    void load();
    void syncGrantedPushNotifications(area).then(setPushEnabled).catch(() => undefined);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    const interval = window.setInterval(refreshWhenVisible, 15_000);
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    const serviceWorkerMessage = () => void load();
    navigator.serviceWorker?.addEventListener("message", serviceWorkerMessage);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      navigator.serviceWorker?.removeEventListener("message", serviceWorkerMessage);
    };
  }, [area, load, user?.id]);

  useEffect(() => {
    const notificationId = new URLSearchParams(window.location.search).get("notificationId");
    if (!notificationId || !user) return;
    void api(`${apiBase}/${encodeURIComponent(notificationId)}/read`, { method: "PATCH", body: JSON.stringify({}) })
      .then(() => load())
      .catch(() => undefined);
    const url = new URL(window.location.href);
    url.searchParams.delete("notificationId");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }, [apiBase, load, user?.id]);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", closeOutside);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("mousedown", closeOutside);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, [open]);

  const visibleNotifications = useMemo(() => filter === "unread"
    ? notifications.filter((notification) => !notification.readAt)
    : notifications, [filter, notifications]);

  const markRead = async (id: string) => {
    const notification = notifications.find((item) => item.id === id);
    if (!notification || notification.readAt) return;
    await api(`${apiBase}/${encodeURIComponent(id)}/read`, { method: "PATCH", body: JSON.stringify({}) });
    setNotifications((items) => items.map((item) => item.id === id ? { ...item, readAt: new Date().toISOString() } : item));
    setUnreadCount((count) => Math.max(0, count - 1));
  };

  const markAllRead = async () => {
    await api(`${apiBase}/read-all`, { method: "POST", body: JSON.stringify({}) });
    const now = new Date().toISOString();
    setNotifications((items) => items.map((item) => item.readAt ? item : { ...item, readAt: now }));
    setUnreadCount(0);
  };

  const clearOne = async (id: string) => {
    const wasUnread = notifications.some((item) => item.id === id && !item.readAt);
    await api(`${apiBase}/${encodeURIComponent(id)}`, { method: "DELETE", body: JSON.stringify({}) });
    setNotifications((items) => items.filter((item) => item.id !== id));
    if (wasUnread) setUnreadCount((count) => Math.max(0, count - 1));
  };

  const clearAll = async () => {
    await api(apiBase, { method: "DELETE", body: JSON.stringify({}) });
    setNotifications([]);
    setUnreadCount(0);
  };

  const enablePhonePush = async () => {
    setPushBusy(true);
    setPushMessage("");
    try {
      const enabled = await enablePushNotifications(area);
      setPushEnabled(enabled);
      setPushMessage(enabled ? "Phone notifications enabled on this device." : "Notification permission was not granted.");
    } catch (error) {
      setPushMessage(error instanceof Error ? error.message : "Unable to enable phone notifications.");
    } finally {
      setPushBusy(false);
    }
  };

  return <div ref={containerRef} className="relative">
    <button type="button" onClick={() => { setOpen((value) => !value); if (!open) void load(); }} aria-label="Notifications" aria-expanded={open} className="relative grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-slate-600 transition hover:bg-shopee-50 hover:text-shopee-500">
      <Bell size={19} />
      {unreadCount > 0 && <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-shopee-500 px-1 text-[9px] font-black text-white ring-2 ring-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}
    </button>

    {open && <div role="dialog" aria-label="Notifications panel" className="fixed left-3 right-3 top-[68px] z-[70] overflow-hidden rounded-3xl border border-orange-100 bg-white text-slate-900 shadow-[0_24px_70px_rgba(15,23,42,.2)] sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-[420px]">
      <div className="flex items-center gap-3 border-b border-orange-100 bg-gradient-to-r from-shopee-500 to-orange-500 p-4 text-white">
        <div className="min-w-0 flex-1"><p className="text-[10px] font-black uppercase tracking-[.16em] text-white/70">Account inbox</p><h2 className="mt-1 text-lg font-black">Notifications</h2></div>
        <button type="button" onClick={() => load(true)} disabled={refreshing} aria-label="Refresh notifications" className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 transition hover:bg-white/25 disabled:opacity-60"><RefreshCw size={17} className={refreshing ? "animate-spin" : ""} /></button>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close notifications" className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 transition hover:bg-white/25"><X size={18} /></button>
      </div>

      <div className="border-b border-slate-100 p-3">
        <div className="flex items-center gap-2">
          <div className="flex flex-1 rounded-xl bg-slate-100 p-1 text-xs font-black">
            <button className={`flex-1 rounded-lg px-3 py-2 ${filter === "unread" ? "bg-white text-shopee-600 shadow-sm" : "text-slate-500"}`} onClick={() => setFilter("unread")}>Unread {unreadCount ? `(${unreadCount})` : ""}</button>
            <button className={`flex-1 rounded-lg px-3 py-2 ${filter === "all" ? "bg-white text-shopee-600 shadow-sm" : "text-slate-500"}`} onClick={() => setFilter("all")}>All</button>
          </div>
          {unreadCount > 0 && <button type="button" onClick={() => void markAllRead()} title="Mark all read" className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-shopee-600"><CheckCheck size={17} /></button>}
          {notifications.length > 0 && <button type="button" onClick={() => void clearAll()} title="Clear all" className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-600"><Trash2 size={16} /></button>}
        </div>
      </div>

      {!pushEnabled && <div className="border-b border-slate-100 bg-sky-50/70 p-3">
        {showIosGuide && iosNeedsInstall ? <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-sky-100">
          <button type="button" onClick={() => setShowIosGuide(false)} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-sky-700"><ChevronLeft size={14} /> Back</button>
          <div className="mt-3 flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-100 text-sky-700"><Smartphone size={19} /></span>
            <div><p className="text-sm font-black text-slate-900">Install on iPhone first</p><p className="mt-0.5 text-[10px] font-semibold leading-4 text-slate-500">Apple enables Web Push only for Home Screen web apps on iOS 16.4 or later.</p></div>
          </div>
          <ol className="mt-4 space-y-3 text-xs font-bold leading-5 text-slate-700">
            <li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sky-100 text-[10px] text-sky-700">1</span><span>Open <strong>mitratestindonesia.com</strong> in Safari.</span></li>
            <li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sky-100 text-[10px] text-sky-700">2</span><span>Tap Safari’s <Share2 size={14} className="mx-1 inline" /> <strong>Share</strong> button, then choose <strong>Add to Home Screen</strong>.</span></li>
            <li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sky-100 text-[10px] text-sky-700">3</span><span>Tap <strong>Add</strong>, then close this browser tab.</span></li>
            <li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sky-100 text-[10px] text-sky-700">4</span><span>Open the <Home size={14} className="mx-1 inline" /> Home Screen app, sign in, open this bell, and tap <strong>Enable phone notifications</strong>.</span></li>
          </ol>
        </div> : <button type="button" disabled={pushBusy || (!iosNeedsInstall && !browserSupportsPush)} onClick={() => { if (iosNeedsInstall) setShowIosGuide(true); else void enablePhonePush(); }} className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm ring-1 ring-sky-100 disabled:opacity-60">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-100 text-sky-700"><Smartphone size={19} /></span>
          <span className="min-w-0 flex-1"><span className="block text-xs font-black text-slate-900">{pushBusy ? "Enabling…" : iosNeedsInstall ? "Set up notifications on iPhone" : "Enable phone notifications"}</span><span className="mt-0.5 block text-[10px] font-semibold leading-4 text-slate-500">{iosNeedsInstall ? "Tap for the Safari and Home Screen steps." : browserSupportsPush ? "Receive alerts even when this page is closed." : "This browser does not support Web Push notifications."}</span></span>
          <ExternalLink size={15} className="text-slate-400" />
        </button>}
        {pushMessage && <p className="mt-2 px-1 text-[10px] font-bold leading-4 text-sky-800">{pushMessage}</p>}
      </div>}
      {pushEnabled && <div className="flex items-center gap-2 border-b border-emerald-100 bg-emerald-50 px-4 py-2.5 text-[10px] font-black text-emerald-700"><Check size={14} /> Phone alerts enabled on this device</div>}

      <div className="max-h-[min(62vh,520px)] divide-y divide-slate-100 overflow-y-auto">
        {visibleNotifications.length ? visibleNotifications.map((item) => {
          const unread = !item.readAt;
          return <div key={item.id} className={`group relative flex gap-3 p-4 pr-12 transition hover:bg-orange-50/60 ${unread ? "bg-orange-50/30" : "bg-white"}`}>
            <Link to={item.path} onClick={() => { void markRead(item.id); setOpen(false); }} className="flex min-w-0 flex-1 gap-3">
              <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${unread ? "bg-shopee-500" : "bg-slate-200"}`} />
              <span className="min-w-0 flex-1"><span className="block text-sm font-black text-slate-900">{item.title}</span><span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">{item.body}</span><span className="mt-1.5 block text-[10px] font-bold text-slate-400">{dateTime(item.createdAt)}</span></span>
            </Link>
            <button type="button" onClick={() => void clearOne(item.id)} title="Clear notification" aria-label={`Clear ${item.title}`} className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg text-slate-300 opacity-100 transition hover:bg-rose-50 hover:text-rose-600 sm:opacity-0 sm:group-hover:opacity-100"><X size={15} /></button>
          </div>;
        }) : <div className="grid place-items-center p-10 text-center"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-shopee-50 text-shopee-500"><Bell size={24} /></span><p className="mt-4 text-sm font-black text-slate-900">{filter === "unread" ? "No unread notifications" : "No notifications yet"}</p><p className="mt-1 text-xs font-semibold text-slate-400">You’re all caught up.</p></div>}
      </div>
    </div>}
  </div>;
}
