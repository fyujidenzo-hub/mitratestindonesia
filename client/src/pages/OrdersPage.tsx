import { CheckCircle2, CircleDot, Clock3, PackageCheck, Send, ShoppingBag, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { CustomerShell } from "../components/CustomerShell";
import { Button, Card, Notice, StatusPill } from "../components/Ui";
import { api, dateTime, money } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { Order, Transaction, User } from "../types";

const stepOrder = ["WAITING_ASSIGNMENT", "PRODUCT_ASSIGNED", "WAITING_SHIPMENT", "PENDING_DELIVERY", "DELIVERED"];
const labels: Record<string, string> = { WAITING_ASSIGNMENT: "Waiting for admin", PRODUCT_ASSIGNED: "Product assigned", WAITING_SHIPMENT: "Shipment in progress", PENDING_DELIVERY: "Awaiting delivery", DELIVERED: "Completed", REJECTED: "Rejected" };

export default function OrdersPage() {
  const { refresh } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"success" | "error">("success");
  const [loading, setLoading] = useState("");

  const load = () => api<{ user: User; transactions: Transaction[]; orders: Order[] }>("/customer/overview").then((result) => setOrders(result.orders));
  useEffect(() => { load(); }, []);
  const active = orders.find((order) => !["DELIVERED", "REJECTED"].includes(order.status));

  const act = async (action: string) => {
    if (!active) return;
    setLoading(action); setMessage("");
    try {
      await api(`/customer/orders/${active.id}/action`, { method: "POST", body: JSON.stringify({ action }) });
      await Promise.all([load(), refresh()]);
      setTone("success");
      setMessage(action === "confirm-delivery" ? `Task completed. A ${money(active.commission)} commission was added.` : "Order status updated successfully.");
    } catch (error) { setTone("error"); setMessage(error instanceof Error ? error.message : "Action failed."); }
    finally { setLoading(""); }
  };

  return <CustomerShell><main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8"><div><p className="text-xs font-black uppercase tracking-[.18em] text-shopee-500">Task center</p><h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">Your tasks & orders</h1><p className="mt-2 text-sm font-semibold text-slate-500">Follow every stage from product assignment to commission payment.</p></div>{message && <div className="mt-5"><Notice message={message} tone={tone} onClose={() => setMessage("")} /></div>}
    {active ? <Card className="mt-6 overflow-hidden"><div className="bg-gradient-to-r from-shopee-500 to-orange-500 p-6 text-white sm:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.16em] text-white/70">Active task</p><h2 className="mt-2 text-2xl font-black">{active.items[0]?.productName || "Waiting for product assignment"}</h2><p className="mt-1 text-sm font-semibold text-white/75">{active.referenceNumber}</p></div><span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-shopee-600">{labels[active.status]}</span></div></div>
      <div className="p-5 sm:p-8"><div className="grid gap-0 sm:grid-cols-5">{stepOrder.map((step, index) => { const current = stepOrder.indexOf(active.status); const complete = index <= current; return <div key={step} className="relative flex gap-3 pb-5 sm:block sm:pb-0 sm:text-center"><div className={`relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full sm:mx-auto ${complete ? "bg-shopee-500 text-white" : "bg-slate-100 text-slate-400"}`}>{index < current ? <CheckCircle2 size={18} /> : <CircleDot size={17} />}</div>{index < stepOrder.length - 1 && <span className={`absolute left-4 top-9 h-full w-0.5 sm:left-1/2 sm:top-4 sm:h-0.5 sm:w-full ${index < current ? "bg-shopee-400" : "bg-slate-100"}`} />}<p className={`pt-2 text-xs font-black sm:mt-2 ${complete ? "text-slate-900" : "text-slate-400"}`}>{labels[step]}</p></div>; })}</div>
        {active.items.length > 0 && <div className="mt-7 grid gap-3 rounded-3xl bg-slate-50 p-4 sm:grid-cols-[1fr_auto]"><div><p className="font-black text-slate-900">{active.items.map((item) => item.productName).join(", ")}</p><p className="mt-1 text-xs font-semibold text-slate-500">Task value {money(active.totalValue)} · Commission {money(active.commission)}</p></div><div className="self-center"><StatusPill status={active.status} /></div></div>}
        {active.requiresCustomerApproval && <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-5"><p className="font-black text-amber-900">The administrator changed the product selection</p><p className="mt-1 text-sm font-semibold leading-6 text-amber-700">Review the product above, then accept or reject the change before continuing.</p><div className="mt-4 flex gap-3"><Button loading={loading === "accept-change"} onClick={() => act("accept-change")}>Accept</Button><Button loading={loading === "reject-change"} variant="danger" onClick={() => act("reject-change")}>Reject</Button></div></div>}
        {!active.requiresCustomerApproval && active.status === "PRODUCT_ASSIGNED" && <Button loading={loading === "start-shipment"} onClick={() => act("start-shipment")} className="mt-6 w-full sm:w-auto"><Truck size={18} /> Start shipment</Button>}
        {active.status === "WAITING_SHIPMENT" && <Button loading={loading === "submit"} onClick={() => act("submit")} className="mt-6 w-full sm:w-auto"><Send size={18} /> Submit order</Button>}
        {active.status === "PENDING_DELIVERY" && <Button loading={loading === "confirm-delivery"} onClick={() => act("confirm-delivery")} className="mt-6 w-full sm:w-auto"><PackageCheck size={18} /> Confirm delivery</Button>}
      </div></Card> : <Card className="mt-6 grid place-items-center p-10 text-center"><div className="grid h-16 w-16 place-items-center rounded-3xl bg-shopee-50 text-shopee-500"><ShoppingBag size={30} /></div><h2 className="mt-5 text-xl font-black">No active tasks yet</h2><p className="mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500">Select a product or accept a new task from the home page.</p></Card>}
    <section className="mt-8"><h2 className="text-xl font-black text-slate-900">Order history</h2><div className="mt-4 grid gap-3">{orders.filter((order) => order.id !== active?.id).map((order) => <Card key={order.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-500">{order.status === "DELIVERED" ? <CheckCircle2 /> : <Clock3 />}</div><div className="min-w-0 flex-1"><p className="truncate font-black text-slate-900">{order.items[0]?.productName || "Task without a product"}</p><p className="mt-1 text-xs font-semibold text-slate-400">{order.referenceNumber} · {dateTime(order.createdAt)}</p></div><div className="flex items-center justify-between gap-3 sm:block sm:text-right"><StatusPill status={order.status} /><p className="mt-1 text-xs font-black text-emerald-600">+{money(order.commission)}</p></div></Card>)}</div></section>
  </main></CustomerShell>;
}
