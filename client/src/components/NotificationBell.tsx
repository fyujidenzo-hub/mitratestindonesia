import { Bell, CheckCheck, Gift, PackageCheck, RefreshCw, WalletCards, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api, dateTime, money } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { Order, Transaction, User } from "../types";

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  to: string;
  kind: "task" | "reward" | "finance";
};

export function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const storageKey = `shopee-work-notifications-read:${user?.id || "guest"}`;

  const load = async (showSpinner = false) => {
    if (!user) return;
    if (showSpinner) setRefreshing(true);
    try {
      const result = await api<{ user: User; transactions: Transaction[]; orders: Order[] }>("/customer/overview");
      setOrders(result.orders);
      setTransactions(result.transactions);
    } catch {
      // The rest of the application already surfaces API availability errors.
    } finally {
      if (showSpinner) setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    try {
      const stored = JSON.parse(window.localStorage.getItem(storageKey) || "[]") as string[];
      setReadIds(new Set(stored));
    } catch {
      setReadIds(new Set());
    }
    load();
    const interval = window.setInterval(() => load(), 20_000);
    const refreshOnFocus = () => load();
    window.addEventListener("focus", refreshOnFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshOnFocus);
    };
  }, [user?.id]);

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

  const notifications = useMemo(() => buildNotifications(orders, transactions), [orders, transactions]);
  const unreadCount = notifications.filter((item) => !readIds.has(item.id)).length;

  const saveReadIds = (next: Set<string>) => {
    setReadIds(next);
    window.localStorage.setItem(storageKey, JSON.stringify(Array.from(next).slice(-100)));
  };

  const markRead = (id: string) => {
    if (readIds.has(id)) return;
    saveReadIds(new Set([...readIds, id]));
  };

  const markAllRead = () => saveReadIds(new Set([...readIds, ...notifications.map((item) => item.id)]));

  return <div ref={containerRef} className="relative">
    <button type="button" onClick={() => setOpen((value) => !value)} aria-label="Notifications" aria-expanded={open} className="relative grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-slate-600 transition hover:bg-shopee-50 hover:text-shopee-500">
      <Bell size={19} />
      {unreadCount > 0 && <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-shopee-500 px-1 text-[9px] font-black text-white ring-2 ring-white">{unreadCount > 9 ? "9+" : unreadCount}</span>}
    </button>

    {open && <div role="dialog" aria-label="Notifications panel" className="fixed left-3 right-3 top-[68px] z-[70] overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-[0_24px_70px_rgba(15,23,42,.2)] sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-96">
      <div className="flex items-center gap-3 border-b border-orange-100 bg-gradient-to-r from-shopee-500 to-orange-500 p-4 text-white">
        <div className="min-w-0 flex-1"><p className="text-[10px] font-black uppercase tracking-[.16em] text-white/70">Latest activity</p><h2 className="mt-1 text-lg font-black">Notifications</h2></div>
        <button type="button" onClick={() => load(true)} disabled={refreshing} aria-label="Refresh notifications" className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 transition hover:bg-white/25 disabled:opacity-60"><RefreshCw size={17} className={refreshing ? "animate-spin" : ""} /></button>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close notifications" className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 transition hover:bg-white/25"><X size={18} /></button>
      </div>

      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><p className="text-xs font-bold text-slate-500">{unreadCount ? `${unreadCount} unread` : "You're all caught up"}</p>{unreadCount > 0 && <button type="button" onClick={markAllRead} className="inline-flex items-center gap-1.5 text-xs font-black text-shopee-500"><CheckCheck size={15} /> Mark all read</button>}</div>

      <div className="max-h-[min(65vh,520px)] divide-y divide-slate-100 overflow-y-auto">
        {notifications.length ? notifications.map((item) => {
          const unread = !readIds.has(item.id);
          const Icon = item.kind === "task" ? PackageCheck : item.kind === "reward" ? Gift : WalletCards;
          return <Link key={item.id} to={item.to} onClick={() => { markRead(item.id); setOpen(false); }} className={`flex gap-3 p-4 transition hover:bg-orange-50/60 ${unread ? "bg-orange-50/30" : "bg-white"}`}>
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${item.kind === "reward" ? "bg-amber-50 text-amber-600" : item.kind === "task" ? "bg-shopee-50 text-shopee-500" : "bg-slate-100 text-slate-600"}`}><Icon size={19} /></span>
            <span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="truncate text-sm font-black text-slate-900">{item.title}</span>{unread && <span className="h-2 w-2 shrink-0 rounded-full bg-shopee-500" />}</span><span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">{item.description}</span><span className="mt-1.5 block text-[10px] font-bold text-slate-400">{dateTime(item.createdAt)}</span></span>
          </Link>;
        }) : <div className="grid place-items-center p-10 text-center"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-shopee-50 text-shopee-500"><Bell size={24} /></span><p className="mt-4 text-sm font-black text-slate-900">No notifications yet</p><p className="mt-1 text-xs font-semibold text-slate-400">Task and balance updates will appear here.</p></div>}
      </div>
    </div>}
  </div>;
}

function buildNotifications(orders: Order[], transactions: Transaction[]): NotificationItem[] {
  const orderItems = orders.map((order): NotificationItem => {
    const productName = order.items[0]?.productName;
    if (order.status === "DELIVERED") return { id: `order:${order.id}:delivered`, title: "Task completed", description: `${productName || "Your task"} was completed. Commission ${money(order.commission)} was credited.`, createdAt: order.completedAt || order.createdAt, to: "/orders", kind: "task" };
    if (["PRODUCT_ASSIGNED", "WAITING_SHIPMENT", "PENDING_DELIVERY"].includes(order.status)) return { id: `order:${order.id}:assigned`, title: "Product assigned", description: `${productName || "A product"} is ready in your Task Orders.`, createdAt: order.assignedAt || order.createdAt, to: "/orders", kind: "task" };
    return { id: `order:${order.id}:waiting`, title: "Order task received", description: "Your request was received and is waiting for product assignment.", createdAt: order.createdAt, to: "/orders", kind: "task" };
  });

  const transactionItems = transactions.map((transaction): NotificationItem => {
    if (transaction.type === "REWARD") return { id: `transaction:${transaction.id}:${transaction.status}`, title: "Reward credited", description: `${transaction.senderName || "Task milestone reward"}: +${money(transaction.amount)}`, createdAt: transaction.createdAt, to: "/history", kind: "reward" };
    const label = transaction.type === "TOPUP" ? "Top-up" : "Withdrawal";
    return { id: `transaction:${transaction.id}:${transaction.status}`, title: `${label} ${transaction.status.toLowerCase()}`, description: `${money(transaction.amount)} · ${transaction.requestNumber}`, createdAt: transaction.createdAt, to: transaction.type === "TOPUP" ? "/finance?tab=topup" : "/finance?tab=withdraw", kind: "finance" };
  });

  return [...orderItems, ...transactionItems]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 15);
}
