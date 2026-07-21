import { CheckCircle2, CircleDot, Clock3, ShoppingBag, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CustomerShell } from "../components/CustomerShell";
import { Card, Notice, StatusPill } from "../components/Ui";
import { api, dateTime, money } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { Order, Transaction, User } from "../types";

const stepOrder = ["WAITING_ASSIGNMENT", "PRODUCT_ASSIGNED", "DELIVERED"];
const labels: Record<string, string> = {
  WAITING_ASSIGNMENT: "Order received",
  PRODUCT_ASSIGNED: "Order shipped",
  WAITING_SHIPMENT: "Order shipped",
  PENDING_DELIVERY: "Order shipped",
  DELIVERED: "Completed",
  REJECTED: "Rejected",
};
const assignedStatuses = ["PRODUCT_ASSIGNED", "WAITING_SHIPMENT", "PENDING_DELIVERY"];

export default function OrdersPage() {
  const { user, refresh } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"success" | "error">("success");
  const [loading, setLoading] = useState("");
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null);

  const load = () => api<{ user: User; transactions: Transaction[]; orders: Order[] }>("/customer/overview")
    .then((result) => setOrders(result.orders));

  useEffect(() => { load(); }, []);

  const active = orders.find((order) => !["DELIVERED", "REJECTED"].includes(order.status));
  const completedOrder = completedOrderId ? orders.find((order) => order.id === completedOrderId && order.status === "DELIVERED") : undefined;
  const assigned = active ? assignedStatuses.includes(active.status) : false;
  const activeItem = active?.items[0];

  const act = async (action: string) => {
    if (!active) return;
    setLoading(action);
    setMessage("");
    try {
      const result = await api<{ order: Order; completedTasks: number; milestoneReward: { task: number; amount: number } | null }>(`/customer/orders/${active.id}/action`, { method: "POST", body: JSON.stringify({ action }) });
      setCompletedOrderId(active.id);
      await Promise.all([load(), refresh()]);
      setTone("success");
      setMessage(result.milestoneReward
        ? `Task completed. ${money(active.commission)} commission and a ${money(result.milestoneReward.amount)} milestone reward were added.`
        : `Task completed. A ${money(active.commission)} commission was added.`);
    } catch (error) {
      setTone("error");
      setMessage(error instanceof Error ? error.message : "Action failed.");
    } finally {
      setLoading("");
    }
  };

  const refreshOrder = async () => {
    setLoading("refresh");
    setMessage("");
    try {
      await load();
    } catch (error) {
      setTone("error");
      setMessage(error instanceof Error ? error.message : "Unable to refresh the order task.");
    } finally {
      setLoading("");
    }
  };

  return (
    <CustomerShell>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div>
          <p className="text-xs font-black uppercase tracking-[.18em] text-shopee-500">Task center</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">Your tasks & orders</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">Review assigned products and submit completed order tasks.</p>
        </div>

        {message && <div className="mt-5"><Notice message={message} tone={tone} onClose={() => setMessage("")} /></div>}

        {completedOrder && <CompletedTaskCard order={completedOrder} />}

        {active ? (
          <Card className="mt-6 overflow-hidden p-4 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[.16em] text-shopee-500">{assigned ? "Assigned product" : "Waiting for order task"}</p>
                <p className="mt-1 text-xs font-bold text-slate-400">Order {active.referenceNumber}</p>
              </div>
              <StatusPill status={assigned ? "TASK ASSIGNED" : "ORDER NOT YET AVAILABLE"} />
            </div>

            <div className="mt-5 grid gap-0 sm:grid-cols-3">
              {stepOrder.map((step, index) => {
                const visibleStatus = assigned ? "PRODUCT_ASSIGNED" : active.status;
                const current = stepOrder.indexOf(visibleStatus);
                const complete = index <= current;
                return (
                  <div key={step} className="relative flex gap-3 pb-4 sm:block sm:pb-0 sm:text-center">
                    <div className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full sm:mx-auto ${complete ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                      {index < current ? <CheckCircle2 size={16} /> : <CircleDot size={15} />}
                    </div>
                    {index < stepOrder.length - 1 && <span className={`absolute left-[15px] top-8 h-full w-0.5 sm:left-1/2 sm:top-[15px] sm:h-0.5 sm:w-full ${index < current ? "bg-emerald-500" : "bg-slate-100"}`} />}
                    <p className={`pt-1.5 text-xs font-black sm:mt-2 ${complete ? "text-slate-800" : "text-slate-400"}`}>{labels[step]}</p>
                  </div>
                );
              })}
            </div>

            {activeItem ? (
              <div className="mt-6 rounded-3xl border border-slate-200 p-4 sm:p-5">
                <div className="grid gap-5 sm:grid-cols-[140px_1fr] sm:items-center">
                  <div className="aspect-square overflow-hidden rounded-2xl bg-slate-50">
                    {activeItem.product?.imageUrl ? (
                      <img src={activeItem.product.imageUrl} alt={activeItem.productName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center text-slate-300"><ShoppingBag size={42} /></div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-[.15em] text-slate-400">Product</p>
                    <h2 className="mt-1 text-xl font-black leading-snug text-slate-900">{activeItem.productName}</h2>
                    <p className="mt-1 text-sm font-bold text-slate-400">{activeItem.productCode} · {active.referenceNumber}</p>
                    <div className="mt-5">
                      <p className="text-[11px] font-black uppercase tracking-[.15em] text-slate-400">Order price</p>
                      <p className="mt-1 text-2xl font-black text-slate-900">{money(active.totalValue)}</p>
                      <p className="mt-1 text-sm font-black text-emerald-600">Estimated commission {money(active.commission)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-3xl border border-amber-100 bg-amber-50 p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-amber-600 shadow-sm"><Clock3 size={22} /></div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-black text-slate-900">Waiting for order task</h2>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Your order task has been picked up; please click refresh in the section below.</p>
                    <p className="mt-3 text-xs font-black uppercase tracking-wide text-amber-700">Status: Order not yet available</p>
                    <button
                      type="button"
                      onClick={refreshOrder}
                      disabled={loading === "refresh"}
                      className="mt-4 inline-flex h-11 min-w-28 items-center justify-center rounded-2xl bg-shopee-500 px-5 text-sm font-black text-white shadow-lg shadow-shopee-500/20 transition hover:bg-shopee-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading === "refresh" ? "Refreshing…" : "Refresh"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {assigned && (
              <>
                <div className="mt-5 grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm sm:text-base">
                  <SummaryRow label="Your balance" value={money(user?.balance ?? 0)} />
                  <SummaryRow label="Order price" value={money(active.totalValue)} />
                  <SummaryRow label="Commission earned" value={`+${money(active.commission)}`} accent />
                </div>
                {active.requiresCustomerApproval && (
                  <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">The administrator updated this assigned product. Review it before submitting.</p>
                )}
                <button
                  type="button"
                  disabled={loading === "accept"}
                  onClick={() => act("accept")}
                  style={{ backgroundColor: "#ee4d2d", color: "#ffffff", boxShadow: "0 12px 26px rgba(238, 77, 45, 0.26)" }}
                  className="mt-5 inline-flex h-14 w-full items-center justify-center rounded-2xl px-6 text-base font-black transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading === "accept" ? "Submitting…" : "Submit Task"}
                </button>
              </>
            )}
          </Card>
        ) : (
          <Card className="mt-6 grid place-items-center p-10 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-3xl bg-shopee-50 text-shopee-500"><ShoppingBag size={30} /></div>
            <h2 className="mt-5 text-xl font-black">No active tasks yet</h2>
            <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500">Select a product or accept a new task from the lightning Task Center.</p>
            <Link to="/task-center" className="mt-5 inline-flex h-11 items-center gap-2 rounded-2xl bg-shopee-500 px-5 text-sm font-black text-white"><Zap size={17} fill="currentColor" /> Open task center</Link>
          </Card>
        )}

        <section className="mt-8">
          <h2 className="text-xl font-black text-slate-900">Order history</h2>
          <div className="mt-4 grid gap-3">
            {orders.filter((order) => order.id !== active?.id && order.id !== completedOrder?.id).map((order) => (
              <Card key={order.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-500">{order.status === "DELIVERED" ? <CheckCircle2 /> : <Clock3 />}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-black text-slate-900">{order.items[0]?.productName || "Task without a product"}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-400">{order.referenceNumber} · {dateTime(order.createdAt)}</p>
                </div>
                <div className="flex items-center justify-between gap-3 sm:block sm:text-right">
                  <StatusPill status={order.status} />
                  {order.status === "DELIVERED" && <p className="mt-1 text-xs font-black text-emerald-600">+{money(order.commission)}</p>}
                </div>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </CustomerShell>
  );
}

function SummaryRow({ label, value, accent = false, orange = false }: { label: string; value: string; accent?: boolean; orange?: boolean }) {
  const valueColor = orange ? "text-shopee-600" : accent ? "text-emerald-600" : "text-slate-900";
  return <div className="flex items-center justify-between gap-4"><span className="font-bold text-slate-500">{label}</span><strong className={`text-lg ${valueColor}`}>{value}</strong></div>;
}

function CompletedTaskCard({ order }: { order: Order }) {
  const item = order.items[0];
  return (
    <Card className="mt-6 overflow-hidden border-orange-100">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-shopee-500 to-orange-500 px-5 py-5 text-white sm:px-7">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15"><CheckCircle2 size={24} /></div>
          <div>
            <p className="text-xs font-black uppercase tracking-[.16em] text-white/75">Task completed</p>
            <h2 className="mt-1 text-xl font-black">Product successfully submitted</h2>
          </div>
        </div>
        <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black uppercase tracking-wide text-shopee-600">Completed</span>
      </div>

      <div className="p-4 sm:p-7">
        <div className="grid gap-5 rounded-3xl border border-orange-100 bg-orange-50/30 p-4 sm:grid-cols-[140px_1fr] sm:items-center sm:p-5">
          <div className="aspect-square overflow-hidden rounded-2xl bg-white">
            {item?.product?.imageUrl ? (
              <img src={item.product.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-shopee-300"><ShoppingBag size={42} /></div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[.15em] text-shopee-500">Completed product</p>
            <h3 className="mt-1 text-xl font-black leading-snug text-slate-900">{item?.productName || "Completed order task"}</h3>
            <p className="mt-1 text-sm font-bold text-slate-400">{item?.productCode} · {order.referenceNumber}</p>
            <div className="mt-5 grid gap-2 text-sm">
              <SummaryRow label="Order price" value={money(order.totalValue)} />
              <SummaryRow label="Commission earned" value={`+${money(order.commission)}`} orange />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
