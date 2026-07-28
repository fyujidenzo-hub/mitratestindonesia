import { ArrowLeft, BadgeCheck, Gift, TicketCheck } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Brand } from "../components/Brand";
import { Button, Field, inputClass, Notice } from "../components/Ui";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { LanguageSwitcher, useI18n } from "../lib/i18n";
import type { User } from "../types";

export default function RegisterPage() {
  const [params] = useSearchParams();
  const [form, setForm] = useState({ displayName: "", username: "", phone: "", invitationCode: params.get("code") || "", password: "", withdrawalPassword: "" });
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
      const result = await api<{ user: User }>("/auth/register", { method: "POST", body: JSON.stringify(form) });
      setUser(result.user);
      navigate("/");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Registration failed.");
    } finally { setLoading(false); }
  };

  return (
    <main
      className="relative min-h-screen bg-[#ead8ca] bg-cover bg-center lg:p-6"
      style={{ backgroundImage: "url('/assets/auth-background-hd.png')" }}
    >
      <div className="relative mx-auto min-h-screen max-w-[1500px] lg:min-h-[calc(100vh-48px)]">
        <header className="relative z-20 flex h-[68px] items-center justify-between border-b border-white/70 bg-white/[.97] px-2 sm:h-[72px] sm:px-6 lg:mx-7 lg:mt-7 lg:rounded-[22px] lg:border">
          <Brand compact />
          <div className="flex items-center sm:gap-2"><LanguageSwitcher compact /><Link to="/login" className="inline-flex items-center gap-1.5 rounded-xl p-1.5 text-xs font-black text-slate-500 transition hover:bg-slate-50 hover:text-shopee-500 sm:px-3 sm:py-2 sm:text-sm"><ArrowLeft size={17} /><span className="hidden sm:inline">{t("Back")}</span></Link></div>
        </header>

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-68px)] max-w-6xl items-center px-3 py-5 sm:min-h-[calc(100vh-124px)] sm:px-7 sm:py-8 lg:py-10">
          <div className="grid w-full gap-4 lg:grid-cols-[.78fr_1.22fr]">
            <section className="relative flex min-h-[260px] items-end overflow-hidden rounded-[30px] border border-slate-800 bg-[linear-gradient(145deg,#111827_0%,#1e293b_62%,#3a1b12_100%)] p-6 text-white shadow-[0_28px_80px_rgba(15,23,42,.3)] sm:min-h-[300px] sm:p-8 lg:min-h-full lg:items-center lg:p-10">
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-shopee-500 via-orange-400 to-amber-300" />
              <div className="relative">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.17em] text-orange-100"><Gift size={14} /> {t("Create a work account")}</span>
                <h1 className="mt-4 max-w-sm text-4xl font-black leading-[1.02] tracking-[-.04em] sm:text-5xl">{t("Start your journey")}</h1>
                <p className="mt-4 max-w-md text-sm font-semibold leading-6 text-white/70">{t("Complete the details below. Your invitation code determines your team and registration bonus.")}</p>
                <div className="mt-7 grid gap-3">
                  <Feature icon={<TicketCheck />} text={t("Register using an official invitation code")} />
                  <Feature icon={<Gift />} text={t("Receive your registration bonus instantly")} />
                  <Feature icon={<BadgeCheck />} text={t("Connect directly with your administrator team")} />
                </div>
              </div>
            </section>
            <section className="rounded-[30px] border border-white/80 bg-white/[.98] p-6 shadow-[0_28px_80px_rgba(15,23,42,.2)] sm:p-9 lg:p-10">
              <p className="text-xs font-black uppercase tracking-[.2em] text-shopee-500">{t("Join Shopee Work")}</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-.035em] text-slate-950">{t("Create your account")}</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-500">{t("Enter your details to access tasks, rewards, and your work dashboard.")}</p>
              <form onSubmit={submit} className="mt-7 grid gap-4 sm:grid-cols-2">
                <Field label={t("Full name")}><input className={`${inputClass} bg-slate-50 focus:bg-white`} required value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} /></Field>
                <Field label={t("Username")}><input className={`${inputClass} bg-slate-50 focus:bg-white`} required value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} /></Field>
                <Field label={t("Phone number")}><input className={`${inputClass} bg-slate-50 focus:bg-white`} required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field>
                <Field label={t("Invitation code")}><input className={`${inputClass} bg-slate-50 focus:bg-white`} required value={form.invitationCode} onChange={(event) => setForm({ ...form, invitationCode: event.target.value })} /></Field>
                <Field label={t("Password")} hint={t("At least 6 characters")}><input className={`${inputClass} bg-slate-50 focus:bg-white`} type="password" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></Field>
                <Field label={t("Withdrawal PIN")} hint={t("Use a different PIN")}><input className={`${inputClass} bg-slate-50 focus:bg-white`} type="password" required value={form.withdrawalPassword} onChange={(event) => setForm({ ...form, withdrawalPassword: event.target.value })} /></Field>
                {message && <div className="sm:col-span-2"><Notice message={message} tone="error" /></div>}
                <div className="sm:col-span-2"><Button loading={loading} className="h-13 w-full rounded-2xl">{t("Create my account")}</Button></div>
              </form>
              <p className="mt-6 text-center text-xs font-bold text-slate-400">{t("Already have an account?")} <Link to="/login" className="text-shopee-500 hover:text-shopee-600">{t("Sign in")}</Link></p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.08] p-3 text-sm font-bold"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-shopee-500 text-white">{icon}</span>{text}</div>;
}
