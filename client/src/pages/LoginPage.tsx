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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff7ed_0%,#fffaf7_38%,#f8fafc_100%)] sm:p-5 lg:p-7">
      <div className="mx-auto min-h-screen max-w-[1450px] overflow-hidden bg-white shadow-[0_30px_100px_rgba(124,45,18,.14)] sm:min-h-[calc(100vh-40px)] sm:rounded-[32px] sm:border sm:border-orange-100 lg:min-h-[calc(100vh-56px)]">
        <header className="flex h-[68px] items-center justify-between border-b border-slate-100 bg-white px-4 sm:h-[76px] sm:px-8">
          <Brand />
          <div className="flex items-center gap-2"><LanguageSwitcher compact /><span className="hidden items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-[11px] font-black text-slate-600 sm:inline-flex sm:text-xs"><Headphones size={17} /> {t("24/7 Support")}</span></div>
        </header>

        <div className="grid lg:min-h-[calc(100vh-132px)] lg:grid-cols-[minmax(0,1.28fr)_minmax(410px,.72fr)]">
          <section className="relative min-h-[220px] overflow-hidden bg-orange-100 sm:min-h-[330px] lg:min-h-full">
            <picture><source media="(max-width: 639px)" srcSet="/assets/campaign-mobile-en.png" /><img src="/assets/campaign-desktop-en.png" alt="Shopee Super Shopping Day campaign" className="absolute inset-0 h-full w-full object-cover object-top lg:object-center" /></picture>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent sm:from-slate-950/55 lg:from-slate-950/70" />

            <div className="absolute inset-x-4 bottom-4 hidden max-w-xl rounded-[26px] border border-white/15 bg-slate-950/82 p-5 text-white shadow-2xl backdrop-blur-md sm:block sm:inset-x-auto sm:bottom-6 sm:left-6 sm:right-6 lg:bottom-8 lg:left-8 lg:p-7 xl:left-10">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.16em] text-orange-200"><Sparkles size={14} /> {t("Work smarter every day")}</span>
              <h1 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">{t("One workspace for every task, order, and reward.")}</h1>
              <p className="mt-3 max-w-lg text-sm font-semibold leading-6 text-white/75">{t("Stay organized, track progress, and manage your Shopee Work activity with clarity.")}</p>
              <div className="mt-5 flex flex-wrap gap-2"><HeroTrust icon={<ShieldCheck />} label={t("Secure access")} /><HeroTrust icon={<BadgeCheck />} label={t("Protected records")} /><HeroTrust icon={<Headphones />} label={t("Always supported")} /></div>
            </div>
          </section>

          <section className="flex items-center bg-white px-5 py-8 sm:px-10 sm:py-10 lg:px-10 xl:px-14">
            <div className="mx-auto w-full max-w-[430px]">
              <div className={`grid h-[52px] w-[52px] place-items-center rounded-2xl text-white shadow-lg ${area === "admin" ? "bg-slate-900 shadow-slate-900/20" : "bg-gradient-to-br from-shopee-500 to-orange-400 shadow-shopee-500/20"}`}>{area === "admin" ? <ShieldCheck size={24} /> : <LockKeyhole size={24} />}</div>
              <p className="mt-6 text-[11px] font-black uppercase tracking-[.18em] text-shopee-500">{area === "admin" ? t("Secure staff portal") : t("Welcome back")}</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-[34px]">{area === "admin" ? t("Administrator access") : t("Sign in to Shopee Work")}</h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">{area === "admin" ? t("Sign in to manage members, tasks, and finance requests.") : t("Continue to your tasks, balance, and commission history.")}</p>

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

              {area === "customer" ? <div className="mt-7 border-t border-slate-100 pt-6 text-center"><p className="text-xs font-bold text-slate-400">{t("New to Shopee Work?")}</p><Link to="/register" className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-shopee-200 bg-shopee-50 text-sm font-black text-shopee-600 transition hover:border-shopee-300 hover:bg-shopee-100">{t("Create an account")} <ArrowRight size={16} /></Link></div> : <div className="mt-7 border-t border-slate-100 pt-6 text-center"><Link to="/login" className="text-sm font-black text-shopee-500 hover:text-shopee-600">{t("← Back to customer sign in")}</Link></div>}

              <div className="mt-7 grid grid-cols-3 divide-x divide-slate-100 rounded-2xl bg-slate-50 px-2 py-4 text-center"><MiniTrust icon={<ShieldCheck />} label="Secure" /><MiniTrust icon={<BadgeCheck />} label="Protected" /><MiniTrust icon={<Headphones />} label="Support" /></div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function HeroTrust({ icon, label }: { icon: React.ReactNode; label: string }) { return <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-[11px] font-black text-white/85">{icon}{label}</span>; }
function MiniTrust({ icon, label }: { icon: React.ReactNode; label: string }) { return <span className="grid place-items-center gap-1 text-[10px] font-black text-slate-500"><span className="text-shopee-500">{icon}</span>{label}</span>; }
