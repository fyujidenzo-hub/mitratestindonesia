import { ArrowRight, BadgeCheck, Eye, EyeOff, Headphones, LockKeyhole, Phone, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Brand } from "../components/Brand";
import { Button, inputClass, Notice } from "../components/Ui";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { LanguageSwitcher, useI18n } from "../lib/i18n";
import type { User } from "../types";

export default function LoginPage({ area = "customer" }: { area?: "customer" | "admin" }) {
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const result = await api<{ user: User }>("/auth/login", { method: "POST", body: JSON.stringify({ ...form, area }) });
      setUser(result.user);
      navigate(result.user.role === "CUSTOMER" ? "/" : "/admin");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sign-in failed.");
    } finally { setLoading(false); }
  };

  return (
    <main
      className="relative min-h-screen bg-[#ead8ca] bg-cover bg-center lg:p-6"
      style={{ backgroundImage: "url('/assets/auth-background-hd.png')" }}
    >
      <div className="relative mx-auto min-h-screen max-w-[1500px] lg:min-h-[calc(100vh-48px)]">
        <header className="relative z-20 flex h-[68px] items-center justify-between border-b border-white/70 bg-white/[.97] px-4 sm:h-[72px] sm:px-6 lg:mx-7 lg:mt-7 lg:rounded-[22px] lg:border">
          <Brand compact />
          <div className="flex items-center gap-2"><LanguageSwitcher compact /><span className="hidden w-36 items-center justify-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-[11px] font-black text-slate-600 sm:inline-flex sm:text-xs"><Headphones size={17} /> {t("24/7 Support")}</span></div>
        </header>

        <div className="relative z-10 grid lg:min-h-[calc(100vh-140px)] lg:grid-cols-[minmax(0,1fr)_500px] lg:items-center">
          <section className="relative flex items-end overflow-hidden px-3 py-3 text-white sm:min-h-[340px] sm:px-10 sm:pb-10 sm:pt-10 lg:min-h-full lg:items-end lg:px-12 lg:py-12 xl:px-16">
            <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent sm:block lg:from-slate-950/70 lg:via-transparent" />
            <div className="relative z-10 w-full max-w-[600px] rounded-[22px] border border-slate-800 bg-[linear-gradient(135deg,#111827_0%,#1e293b_68%,#3a1b12_100%)] p-5 shadow-[0_20px_50px_rgba(15,23,42,.3)] sm:w-auto sm:rounded-none sm:border-0 sm:bg-none sm:p-0 sm:shadow-none">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.16em] text-orange-100 sm:bg-slate-950/80 sm:px-4 sm:py-2 sm:text-[10px] sm:tracking-[.18em] sm:shadow-lg"><Sparkles size={14} /> {t("Work smarter every day")}</span>
              <h1 className="mt-3 max-w-2xl text-[1.75rem] font-black leading-[1.03] tracking-[-.04em] sm:mt-4 sm:text-4xl lg:text-5xl">{t("One workspace for every task, order, and reward.")}</h1>
              <p className="mt-4 hidden max-w-xl text-sm font-semibold leading-6 text-white/80 sm:block">{t("Stay organized, track progress, and manage your Shopee Work activity with clarity.")}</p>
              <div className="mt-6 hidden flex-wrap gap-2 sm:flex"><HeroTrust icon={<ShieldCheck />} label={t("Secure access")} /><HeroTrust icon={<BadgeCheck />} label={t("Protected records")} /><HeroTrust icon={<Headphones />} label={t("Always supported")} /></div>
            </div>
          </section>

          <section className="relative flex items-center px-3 pb-3 sm:px-7 sm:pb-7 lg:px-7 lg:py-7">
            <div className="mx-auto w-full max-w-[460px] rounded-[28px] border border-white/80 bg-white/[.98] p-6 shadow-[0_28px_80px_rgba(15,23,42,.28)] sm:p-8 lg:p-9">
              <div className={`grid h-[52px] w-[52px] place-items-center rounded-2xl text-white shadow-lg ${area === "admin" ? "bg-slate-900 shadow-slate-900/20" : "bg-gradient-to-br from-shopee-500 to-orange-400 shadow-shopee-500/20"}`}>{area === "admin" ? <ShieldCheck size={24} /> : <LockKeyhole size={24} />}</div>
              <p className="mt-5 text-[11px] font-black uppercase tracking-[.18em] text-shopee-500">{area === "admin" ? t("Secure staff portal") : t("Welcome back")}</p>
              <h2 className="mt-2 flex min-h-[72px] items-center text-3xl font-black tracking-[-.035em] text-slate-950 sm:text-[35px]">{area === "admin" ? t("Administrator access") : t("Sign in to Shopee Work")}</h2>
              <p className="mt-3 min-h-12 text-sm font-semibold leading-6 text-slate-500">{area === "admin" ? t("Sign in to manage members, tasks, and finance requests.") : t("Continue to your tasks, balance, and commission history.")}</p>

              <form onSubmit={submit} className="mt-7 grid gap-5">
                <label className="grid gap-2 text-sm font-black text-slate-700">
                  <span>{t("Username or phone number")}</span>
                  <span className="relative"><Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-shopee-500" /><input className={`${inputClass} h-14 border-slate-200 bg-slate-50 pl-12 focus:bg-white`} required autoComplete="username" value={form.identifier} onChange={(event) => setForm({ ...form, identifier: event.target.value })} placeholder={t("Enter your username or phone")} /></span>
                </label>
                <label className="grid gap-2 text-sm font-black text-slate-700">
                  <span>{t("Password")}</span>
                  <span className="relative"><LockKeyhole size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-shopee-500" /><input className={`${inputClass} h-14 border-slate-200 bg-slate-50 pl-12 pr-12 focus:bg-white`} required autoComplete="current-password" type={showPassword ? "text" : "password"} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={t("Enter your password")} /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-xl text-slate-400 transition hover:bg-white hover:text-slate-700" aria-label={showPassword ? t("Hide password") : t("Show password")}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span>
                </label>
                {message && <Notice message={message} tone="error" />}
                <Button loading={loading} className="h-14 w-full rounded-2xl text-base">{t("Sign in")} <ArrowRight size={18} /></Button>
              </form>

              {area === "customer" ? <div className="mt-7 min-h-[101px] border-t border-slate-100 pt-6 text-center"><p className="text-xs font-bold text-slate-400">{t("New to Shopee Work?")}</p><Link to="/register" className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-shopee-200 bg-shopee-50 text-sm font-black text-shopee-600 transition hover:border-shopee-300 hover:bg-shopee-100">{t("Create an account")} <ArrowRight size={16} /></Link></div> : <div className="mt-7 flex min-h-[101px] items-center justify-center border-t border-slate-100 pt-6 text-center"><Link to="/login" className="text-sm font-black text-shopee-500 hover:text-shopee-600">{t("← Back to customer sign in")}</Link></div>}

              <div className="mt-7 grid grid-cols-3 divide-x divide-slate-200 rounded-2xl border border-slate-100 bg-slate-50 px-2 py-4 text-center"><MiniTrust icon={<ShieldCheck />} label="Secure" /><MiniTrust icon={<BadgeCheck />} label="Protected" /><MiniTrust icon={<Headphones />} label="Support" /></div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function HeroTrust({ icon, label }: { icon: React.ReactNode; label: string }) { return <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-[11px] font-black text-white/85">{icon}{label}</span>; }
function MiniTrust({ icon, label }: { icon: React.ReactNode; label: string }) { return <span className="grid place-items-center gap-1 text-[10px] font-black text-slate-500"><span className="text-shopee-500">{icon}</span>{label}</span>; }
