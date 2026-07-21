import { Award, Banknote, Headphones, KeyRound, LogOut, Phone, RefreshCcw, ShieldCheck, UserRound, WalletCards } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { CustomerShell } from "../components/CustomerShell";
import { Button, Card } from "../components/Ui";
import { money } from "../lib/api";
import { useAuth } from "../lib/auth";
import { membershipLabel } from "../lib/commission";
import { useI18n } from "../lib/i18n";

const quickLinks = [
  { to: "/finance?tab=topup", label: "Top Up", hint: "Add funds to your account", icon: WalletCards, tone: "bg-orange-50 text-shopee-500" },
  { to: "/finance?tab=withdraw", label: "Withdrawal", hint: "Request a balance withdrawal", icon: Banknote, tone: "bg-emerald-50 text-emerald-600" },
  { to: "/security/password", label: "Account Password Reset", hint: "Change your sign-in password", icon: KeyRound, tone: "bg-sky-50 text-sky-600" },
  { to: "/security/withdrawal", label: "Withdrawal Reset", hint: "Create a new six-digit PIN", icon: RefreshCcw, tone: "bg-violet-50 text-violet-600" },
  { to: "/support", label: "Customer Support", hint: "Get help with your account", icon: Headphones, tone: "bg-rose-50 text-rose-600" },
];

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <CustomerShell>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <Card className="overflow-hidden">
          <div className="relative overflow-hidden bg-gradient-to-br from-shopee-500 to-orange-500 p-6 text-white sm:p-9">
            <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border-[30px] border-white/10" />
            <div className="relative flex items-center gap-5"><div className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-white text-2xl font-black text-shopee-500 shadow-xl">{user?.displayName.slice(0, 2).toUpperCase()}</div><div><p className="text-xs font-black uppercase tracking-[.18em] text-white/65">{t("Work Account")}</p><h1 className="mt-1 text-3xl font-black">{user?.displayName}</h1><p className="mt-1 text-sm font-semibold text-white/75">@{user?.username}</p></div></div>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-7"><Stat icon={<WalletCards />} label="Balance" value={money(user?.balance ?? 0)} /><Stat icon={<Award />} label="Level & commission" value={membershipLabel(user?.level ?? "STARTER")} /><Stat icon={<ShieldCheck />} label="Tasks completed" value={String(user?.totalOrders ?? 0)} /></div>
        </Card>

        <div className="mt-5 grid gap-4 lg:grid-cols-[.72fr_1.28fr]">
          <Card className="p-5 sm:p-6"><h2 className="font-black text-slate-900">{t("Account information")}</h2><p className="mt-1 text-xs font-semibold text-slate-400">Your customer account details.</p><div className="mt-5 grid gap-3"><Info icon={<UserRound />} label={t("Username")} value={user?.username || "-"} /><Info icon={<Phone />} label={t("Phone number")} value={user?.phone || "-"} /><Info icon={<ShieldCheck />} label="Referred by" value={user?.referrer?.displayName || "-"} /></div></Card>

          <Card className="p-5 sm:p-6">
            <div><p className="text-[10px] font-black uppercase tracking-[.16em] text-shopee-500">Everything in one place</p><h2 className="mt-1 text-xl font-black text-slate-900">{t("Quick access")}</h2></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {quickLinks.map(({ to, label, hint, icon: Icon, tone }) => <Link key={to} to={to} className="group flex items-center gap-3 rounded-[22px] border border-slate-100 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-orange-100 hover:bg-orange-50/60"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${tone}`}><Icon size={20} /></span><span className="min-w-0"><span className="block text-sm font-black text-slate-800 group-hover:text-shopee-600">{t(label)}</span><span className="mt-0.5 block text-[10px] font-semibold text-slate-400">{t(hint)}</span></span></Link>)}
            </div>
            <Button variant="ghost" className="mt-4 w-full" onClick={async () => { await logout(); navigate("/login"); }}><LogOut size={18} /> {t("Sign out")}</Button>
          </Card>
        </div>
      </main>
    </CustomerShell>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-shopee-500 shadow-sm">{icon}</span><div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p><p className="mt-0.5 font-black text-slate-900">{value}</p></div></div>;
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3"><span className="text-shopee-500">{icon}</span><div className="min-w-0"><p className="text-[10px] font-black uppercase text-slate-400">{label}</p><p className="truncate text-sm font-black text-slate-800">{value}</p></div></div>;
}
