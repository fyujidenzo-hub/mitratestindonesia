import {
  ArrowRight,
  BadgePercent,
  Banknote,
  CheckCircle2,
  ClipboardList,
  Headphones,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  WalletCards,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CustomerShell } from "../components/CustomerShell";
import { Card, Notice, StatusPill } from "../components/Ui";
import { api, dateTime, money } from "../lib/api";
import { useAuth } from "../lib/auth";
import { membershipLabel } from "../lib/commission";
import { useBootstrap } from "../lib/useBootstrap";
import { useI18n } from "../lib/i18n";
import type { Order, Transaction, User } from "../types";

type Overview = { user: User; transactions: Transaction[]; orders: Order[] };

const quickActions = [
  { to: "/task-center", label: "Start a task", hint: "Browse available orders", icon: Zap, tone: "bg-orange-50 text-shopee-500" },
  { to: "/orders", label: "My orders", hint: "Track active progress", icon: ClipboardList, tone: "bg-sky-50 text-sky-600" },
  { to: "/finance", label: "My balance", hint: "Top up or withdraw", icon: WalletCards, tone: "bg-emerald-50 text-emerald-600" },
  { to: "/support", label: "Get support", hint: "We're here to help", icon: Headphones, tone: "bg-violet-50 text-violet-600" },
];

export default function CustomerHomePage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { data: bootstrap, loading: catalogLoading } = useBootstrap();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api<Overview>("/customer/overview")
      .then(setOverview)
      .catch((error) => setMessage(error instanceof Error ? error.message : "Unable to load your home page."))
      .finally(() => setLoading(false));
  }, []);

  const currentUser = overview?.user ?? user;
  const orders = overview?.orders ?? [];
  const transactions = overview?.transactions ?? [];
  const activeOrder = orders.find((order) => !["DELIVERED", "REJECTED"].includes(order.status));
  const completedOrders = orders.filter((order) => order.status === "DELIVERED");
  const totalCommission = completedOrders.reduce((sum, order) => sum + order.commission, 0);
  const firstName = currentUser?.displayName?.trim().split(/\s+/)[0] || "there";
  const catalogProducts = useMemo(() => (bootstrap?.catalogProducts ?? [])
    .slice()
    .sort((left, right) => left.price - right.price || left.name.localeCompare(right.name))
    .slice(0, 6), [bootstrap?.catalogProducts]);

  return (
    <CustomerShell>
      <main className="mx-auto max-w-[1260px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        {message && <div className="mb-5"><Notice message={message} tone="error" onClose={() => setMessage("")} /></div>}

        <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#f04424] via-shopee-500 to-orange-400 p-6 text-white shadow-[0_24px_70px_rgba(238,77,45,.24)] sm:p-8 lg:p-10">
          <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full border-[42px] border-white/10" />
          <div className="absolute -bottom-28 right-[24%] h-56 w-56 rounded-full bg-amber-300/20 blur-2xl" />
          <div className="relative grid items-center gap-8 lg:grid-cols-[1.2fr_.8fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.16em] backdrop-blur"><Sparkles size={14} /> {t("Your workday, organized")}</span>
              <h1 className="mt-5 max-w-2xl text-3xl font-black leading-[1.08] tracking-tight sm:text-4xl lg:text-5xl">{t("Welcome back, {name}.", { name: firstName })}</h1>
              <p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-white/78 sm:text-base">{t("See what needs your attention, track your earnings, and jump into your next task from one calm home base.")}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/task-center" className="inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-shopee-600 shadow-lg transition hover:-translate-y-0.5"><Zap size={18} fill="currentColor" /> {t("Open task center")}</Link>
                <Link to="/orders" className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-5 text-sm font-black text-white backdrop-blur transition hover:bg-white/20">{t("View my orders")} <ArrowRight size={17} /></Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/25 bg-white/14 p-5 backdrop-blur-xl sm:p-6">
              <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-white/65">{t("Available balance")}</p><p className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{money(currentUser?.balance ?? 0)}</p></div><span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-shopee-500 shadow-lg"><WalletCards size={24} /></span></div>
              <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/20 pt-5"><div><p className="text-[10px] font-black uppercase tracking-wide text-white/60">{t("Completed")}</p><p className="mt-1 text-xl font-black">{currentUser?.totalOrders ?? 0} {t("tasks")}</p></div><div><p className="text-[10px] font-black uppercase tracking-wide text-white/60">{t("Level & rate")}</p><p className="mt-1 text-xl font-black">{membershipLabel(currentUser?.level ?? "STARTER")}</p></div></div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {quickActions.map(({ to, label, hint, icon: Icon, tone }) => (
            <Link key={to} to={to} className="group rounded-[24px] border border-orange-100 bg-white p-4 shadow-card transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl sm:p-5">
              <span className={`grid h-11 w-11 place-items-center rounded-2xl ${tone}`}><Icon size={21} /></span>
              <p className="mt-4 text-sm font-black text-slate-900 sm:text-base">{t(label)}</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-400 sm:text-xs">{t(hint)}</p>
              <ArrowRight size={16} className="mt-3 text-slate-300 transition group-hover:translate-x-1 group-hover:text-shopee-500" />
            </Link>
          ))}
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-3 sm:gap-4">
          <SummaryCard icon={<WalletCards />} label={t("Account balance")} value={money(currentUser?.balance ?? 0)} tone="bg-emerald-50 text-emerald-600" />
          <SummaryCard icon={<CheckCircle2 />} label={t("Completed tasks")} value={String(currentUser?.totalOrders ?? 0)} tone="bg-sky-50 text-sky-600" />
          <SummaryCard icon={<BadgePercent />} label={t("Total commission")} value={money(totalCommission)} tone="bg-orange-50 text-shopee-500" />
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
          <Card className="overflow-hidden border-orange-100 shadow-card">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6"><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-shopee-500">{t("Right now")}</p><h2 className="mt-1 text-xl font-black text-slate-900">{t("Your active task")}</h2></div><Link to="/orders" className="text-xs font-black text-shopee-500">{t("View orders →")}</Link></div>
            {loading ? <div className="m-5 h-40 animate-pulse rounded-3xl bg-slate-100 sm:m-6" /> : activeOrder ? (
              <div className="p-5 sm:p-6"><div className="flex flex-col gap-5 rounded-[26px] bg-gradient-to-br from-slate-950 to-slate-800 p-5 text-white sm:flex-row sm:items-center sm:p-6"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/10 text-orange-300"><PackageCheck size={27} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-black">{activeOrder.items[0]?.productName || t("Waiting for product assignment")}</h3><StatusPill status={activeOrder.status} /></div><p className="mt-2 text-xs font-semibold text-white/50">{activeOrder.referenceNumber} · {t("Commission")} {money(activeOrder.commission)}</p></div><Link to="/orders" className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-shopee-500 px-5 text-sm font-black text-white">{t("Continue")} <ArrowRight size={16} /></Link></div></div>
            ) : (
              <div className="p-5 sm:p-6"><div className="flex flex-col items-start gap-5 rounded-[26px] bg-gradient-to-r from-orange-50 to-amber-50 p-6 sm:flex-row sm:items-center"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-shopee-500 shadow-sm"><Zap size={26} fill="currentColor" /></span><div className="flex-1"><h3 className="font-black text-slate-900">{t("Ready for your next opportunity?")}</h3><p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{t("Open the lightning Task Center to request an available task. Product assignment happens separately.")}</p></div><Link to="/task-center" className="inline-flex h-11 items-center gap-2 rounded-2xl bg-shopee-500 px-5 text-sm font-black text-white">{t("Find a task")} <ArrowRight size={16} /></Link></div></div>
            )}
          </Card>

          <Card className="overflow-hidden border-orange-100 shadow-card">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6"><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-emerald-600">{t("Activity")}</p><h2 className="mt-1 text-xl font-black text-slate-900">{t("Recent balance updates")}</h2></div><Link to="/finance" className="text-xs font-black text-shopee-500">{t("View all →")}</Link></div>
            <div className="divide-y divide-slate-100">
              {loading ? Array.from({ length: 3 }).map((_, index) => <div key={index} className="mx-5 my-4 h-12 animate-pulse rounded-2xl bg-slate-100" />) : transactions.length ? transactions.slice(0, 4).map((transaction) => (
                <div key={transaction.id} className="flex items-center gap-3 px-5 py-4 sm:px-6"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${transaction.type === "TOPUP" ? "bg-orange-50 text-shopee-500" : transaction.type === "WITHDRAWAL" ? "bg-sky-50 text-sky-600" : "bg-emerald-50 text-emerald-600"}`}>{transaction.type === "WITHDRAWAL" ? <Banknote size={18} /> : transaction.type === "TOPUP" ? <WalletCards size={18} /> : <CheckCircle2 size={18} />}</span><div className="min-w-0 flex-1"><p className="text-sm font-black text-slate-900">{transaction.type.replace("_", " ")}</p><p className="truncate text-[10px] font-semibold text-slate-400">{dateTime(transaction.createdAt)}</p></div><div className="text-right"><p className="text-sm font-black text-slate-900">{money(transaction.amount)}</p><StatusPill status={transaction.status} /></div></div>
              )) : <p className="p-8 text-center text-sm font-semibold text-slate-400">{t("Your recent balance activity will appear here.")}</p>}
            </div>
          </Card>
        </section>

        <section className="mt-5 overflow-hidden rounded-[32px] border border-[#f7dcc8] bg-[#fff8f2] p-5 shadow-card sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-shopee-500 shadow-sm"><ShoppingBag size={18} /></span><p className="text-[10px] font-black uppercase tracking-[.18em] text-shopee-500">{t("Product gallery")}</p></div><h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900">{t("A little inspiration for today")}</h2></div>
            <Link to="/task-center#catalog" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black text-white">{t("View full catalog")} <ArrowRight size={15} /></Link>
          </div>

          {catalogLoading ? <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="aspect-[4/3] animate-pulse rounded-[24px] bg-orange-100" />)}</div> : catalogProducts.length ? <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {catalogProducts.map((product, index) => <figure key={product.id} className={`group overflow-hidden rounded-[24px] bg-slate-100 shadow-sm ${index === 0 ? "col-span-2 row-span-2" : ""}`}><img src={product.imageUrl} alt={product.name} loading="lazy" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/assets/catalog-banners/08-belanja-instant-enhanced.jpg"; }} className="aspect-[4/3] h-full w-full object-cover transition duration-500 group-hover:scale-105" /></figure>)}
          </div> : <div className="mt-6 rounded-[28px] border border-dashed border-orange-200 bg-white/60 p-8 text-center"><p className="font-black text-slate-900">{t("The product gallery is being prepared.")}</p></div>}
        </section>

        <Link to="/task-center" className="group relative mt-5 block min-h-[150px] overflow-hidden rounded-[28px] border border-orange-100 bg-white shadow-card sm:min-h-[190px]">
          <picture><source media="(max-width: 639px)" srcSet="/assets/campaign-mobile-en.png" /><img src="/assets/campaign-desktop-en.png" alt="Super Shopping Day promotion" className="absolute inset-0 h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.02]" /></picture>
          <span className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-2xl bg-slate-950/90 px-4 py-3 text-xs font-black text-white shadow-xl backdrop-blur">{t("Explore the full catalog")} <ArrowRight size={16} /></span>
        </Link>

        <section aria-label="Important regulatory information" className="mt-5 overflow-hidden rounded-2xl border border-orange-200 bg-gradient-to-r from-shopee-500 to-orange-500 py-3 text-white shadow-lg shadow-shopee-500/15">
          <div className="ojk-marquee-track">
            {[0, 1].map((copy) => <div key={copy} aria-hidden={copy === 1} className="flex shrink-0 items-center gap-10 pr-10 text-sm font-black"><span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-white" /> {t("Important information")}</span><span>{t("All activities and services are supervised by the Financial Services Authority (OJK).")}</span><span className="inline-flex items-center gap-2"><ShieldCheck size={18} /> {t("Secure and supervised services")}</span></div>)}
          </div>
        </section>
      </main>
    </CustomerShell>
  );
}

function SummaryCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) {
  return <Card className="flex items-center gap-4 border-orange-100 p-4 shadow-card sm:p-5"><span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${tone}`}>{icon}</span><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 truncate text-lg font-black text-slate-900 sm:text-xl">{value}</p></div></Card>;
}
