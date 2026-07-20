import { ArrowRight, CheckCircle2, ClipboardCheck, Coins, Heart, PackageCheck, Sparkles, Star, Target, WalletCards, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CustomerShell } from "../components/CustomerShell";
import { Button, Card, Notice, StatusPill } from "../components/Ui";
import { api, money } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useBootstrap } from "../lib/useBootstrap";
import type { Order, Transaction, User } from "../types";

type Overview = { user: User; transactions: Transaction[]; orders: Order[] };

export default function TaskCenterPage() {
  const { user } = useAuth();
  const { data, loading: bootstrapLoading } = useBootstrap();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [acceptingId, setAcceptingId] = useState("");
  const navigate = useNavigate();

  const loadOverview = () => api<Overview>("/customer/overview").then(setOverview);
  useEffect(() => { loadOverview(); }, []);

  const products = useMemo(() => (data?.products ?? [])
    .filter((product) => `${product.name} ${product.code} ${product.category}`.toLowerCase().includes(search.toLowerCase()))
    .sort((left, right) => left.price - right.price), [data?.products, search]);
  const orders = overview?.orders ?? [];
  const activeOrder = orders.find((order) => !["DELIVERED", "REJECTED"].includes(order.status));
  const currentUser = overview?.user ?? user;
  const deliveredOrders = orders.filter((order) => order.status === "DELIVERED");
  const totalCommission = deliveredOrders.reduce((sum, order) => sum + order.commission, 0);
  const taskGoal = 15;
  const completed = currentUser?.totalOrders ?? 0;
  const progress = Math.min(100, Math.round((completed / taskGoal) * 100));

  const acceptTask = async (productId?: string) => {
    if (activeOrder) return navigate("/orders");
    setAcceptingId(productId || "open");
    setMessage("");
    try {
      await api("/customer/orders", { method: "POST", body: JSON.stringify({ productId }) });
      await loadOverview();
      navigate("/orders");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to accept the task.");
    } finally { setAcceptingId(""); }
  };

  return (
    <CustomerShell search={search} onSearch={setSearch}>
      <main className="mx-auto max-w-[1260px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        {message && <div className="mb-5"><Notice message={message} tone="error" onClose={() => setMessage("")} /></div>}

        <section className="relative min-h-[190px] overflow-hidden rounded-[30px] bg-shopee-500 shadow-[0_20px_60px_rgba(238,77,45,.2)] sm:min-h-[240px]">
          <picture><source media="(max-width: 639px)" srcSet="/assets/campaign-mobile-en.png" /><img src="/assets/campaign-desktop-en.png" alt="Super Shopping Day" className="absolute inset-0 h-full w-full object-cover object-center" /></picture>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-shopee-900/35 to-transparent" />
          <div className="relative flex min-h-[190px] max-w-xl flex-col justify-center p-6 text-white sm:min-h-[240px] sm:p-9">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider backdrop-blur"><Sparkles size={14} /> Special promotion</span>
            <h1 className="mt-4 max-w-md text-3xl font-black leading-[1.05] sm:text-4xl">Shopping tasks made simpler—and more rewarding.</h1>
            <p className="mt-3 max-w-md text-sm font-semibold leading-6 text-white/80">Free shipping offers, curated orders, and commissions in one polished workspace.</p>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-[.72fr_1.45fr_.72fr] xl:gap-5">
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-shopee-500 to-orange-500 p-5 text-white shadow-float sm:p-6">
            <div className="absolute -right-10 -top-12 h-32 w-32 rounded-full border-[22px] border-white/10" />
            <div className="relative grid h-12 w-12 place-items-center rounded-2xl bg-white text-shopee-500"><ClipboardCheck /></div>
            <p className="relative mt-5 text-2xl font-black sm:text-3xl">{currentUser?.level || "STARTER"}</p>
            <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-white/30"><span className="block h-full rounded-full bg-amber-300" style={{ width: `${Math.max(progress, 8)}%` }} /></div>
            <p className="relative mt-3 text-xs font-bold text-white/75">{completed} tasks completed</p>
            <div className="relative mt-4 rounded-2xl bg-white/15 p-3 text-[11px] font-black backdrop-blur"><Star size={15} className="mr-1 inline text-amber-300" fill="currentColor" /> Complete your next task to level up.</div>
          </Card>

          <Card className="col-span-2 order-3 border-0 p-5 shadow-card sm:p-6 xl:order-none xl:col-span-1">
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-0 sm:divide-x sm:divide-slate-100">
              <div className="flex items-center gap-4 sm:pr-6"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-50 text-shopee-500"><Coins /></span><div><p className="text-xs font-black uppercase tracking-wide text-slate-400">Total commission</p><p className="mt-1 text-xl font-black text-shopee-500">{money(totalCommission)}</p><p className="mt-1 text-[11px] font-semibold text-slate-400">Credited after completed orders</p></div></div>
              <div className="flex items-center gap-4 border-t border-slate-100 pt-4 sm:border-t-0 sm:pl-6 sm:pt-0"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><WalletCards /></span><div><p className="text-xs font-black uppercase tracking-wide text-slate-400">Account balance</p><p className="mt-1 text-xl font-black text-slate-900">{money(currentUser?.balance ?? 0)}</p><div className="mt-1 flex gap-3 text-[11px] font-black"><Link to="/finance?tab=topup" className="text-shopee-500">Top up</Link><Link to="/finance?tab=withdraw" className="text-emerald-600">Withdraw</Link></div></div></div>
            </div>
            <Button loading={acceptingId === "open"} onClick={() => acceptTask()} className="mt-5 h-[52px] w-full text-base"><Zap size={20} fill="currentColor" /> {activeOrder ? "Continue Active Order" : "Accept an Order"}</Button>
          </Card>

          <Card className="relative overflow-hidden border-orange-100 p-5 text-center shadow-card sm:p-6">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-shopee-50 text-shopee-500"><Target /></div>
            <p className="mt-4 text-3xl font-black text-shopee-500">{progress}%</p>
            <p className="mt-1 text-xs font-black text-slate-500">Task goal progress</p>
            <p className="mt-3 text-2xl font-black text-slate-900">{completed}<span className="text-sm text-slate-400"> / {taskGoal}</span></p>
            <div className="mt-4 rounded-2xl bg-orange-50 px-3 py-2 text-[11px] font-black text-shopee-600">You've got this! <Heart size={14} className="ml-1 inline" fill="currentColor" /></div>
          </Card>
        </section>

        {activeOrder && <Card className="mt-5 overflow-hidden border-orange-100 p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-shopee-50 text-shopee-500"><PackageCheck size={27} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-black text-slate-900">Active order in progress</p><StatusPill status={activeOrder.status} /></div><p className="mt-1 truncate text-sm font-semibold text-slate-500">{activeOrder.items[0]?.productName || "Waiting for product assignment"} · {activeOrder.referenceNumber}</p></div><Link to="/orders" className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white">View progress <ArrowRight size={16} /></Link></div></Card>}

        <section className="mt-5 overflow-hidden rounded-[28px] border border-emerald-100 bg-gradient-to-r from-emerald-50 via-amber-50 to-orange-50 p-5 sm:flex sm:items-center sm:justify-between sm:p-6">
          <div><p className="text-xl font-black text-emerald-700">Stay motivated! 💪</p><p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-slate-600">Complete your order tasks and build a stronger commission record every day.</p></div><Link to="/orders" className="mt-4 inline-flex items-center gap-2 text-sm font-black text-shopee-500 sm:mt-0">See task center <ArrowRight size={17} /></Link>
        </section>

        <section className="mt-8">
          <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.18em] text-shopee-500">Product catalog</p><h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Browse items by price</h2><p className="mt-1 text-xs font-semibold text-slate-400">Displayed from lowest to highest price.</p></div><span className="hidden text-sm font-bold text-slate-400 sm:block">{products.length} products available</span></div>
          {bootstrapLoading ? <div className="mt-5 grid grid-cols-2 gap-4 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-64 animate-pulse rounded-3xl bg-slate-200" />)}</div> : <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">{products.map((product) => <article key={product.id} className="group overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-card transition hover:-translate-y-1 hover:shadow-xl"><div className="relative aspect-[4/3] overflow-hidden bg-slate-100"><img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /><button className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-slate-400 shadow" aria-label="Save product"><Heart size={16} /></button></div><div className="p-3.5 sm:p-4"><p className="text-[10px] font-black uppercase tracking-wide text-shopee-500">{product.category}</p><h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-black leading-5 text-slate-900">{product.name}</h3><p className="mt-3 text-base font-black text-shopee-500 sm:text-lg">{money(product.price)}</p></div></article>)}</div>}
        </section>
      </main>
    </CustomerShell>
  );
}
