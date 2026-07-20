import { ArrowLeft, BadgeCheck, Gift, TicketCheck } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Brand } from "../components/Brand";
import { Button, Field, inputClass, Notice } from "../components/Ui";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { User } from "../types";

export default function RegisterPage() {
  const [params] = useSearchParams();
  const [form, setForm] = useState({ displayName: "", username: "", phone: "", invitationCode: params.get("code") || "", password: "", withdrawalPassword: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
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
    <main className="min-h-screen bg-[#fff7f3] px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between"><Brand /><Link to="/login" className="inline-flex items-center gap-2 text-sm font-black text-slate-500 hover:text-shopee-500"><ArrowLeft size={17} /> Back</Link></div>
        <div className="mt-8 grid overflow-hidden rounded-4xl border border-white bg-white shadow-[0_28px_90px_rgba(168,62,33,0.14)] lg:grid-cols-[.8fr_1.2fr]">
          <section className="relative min-h-[280px] overflow-hidden bg-shopee-500 lg:min-h-full">
            <img src="/assets/campaign-mobile-en.png" alt="Shopee 9.9" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-shopee-900/80 via-shopee-700/5 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
              <div className="grid gap-3">
                <Feature icon={<TicketCheck />} text="Register using an official invitation code" />
                <Feature icon={<Gift />} text="Receive your registration bonus instantly" />
                <Feature icon={<BadgeCheck />} text="Connect directly with your administrator team" />
              </div>
            </div>
          </section>
          <section className="p-6 sm:p-9">
            <p className="text-xs font-black uppercase tracking-[.2em] text-shopee-500">Create a work account</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Start your journey</h1>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-500">Complete the details below. Your invitation code determines your team and registration bonus.</p>
            <form onSubmit={submit} className="mt-7 grid gap-4 sm:grid-cols-2">
              <Field label="Full name"><input className={inputClass} required value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} /></Field>
              <Field label="Username"><input className={inputClass} required value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} /></Field>
              <Field label="Phone number"><input className={inputClass} required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field>
              <Field label="Invitation code"><input className={inputClass} required value={form.invitationCode} onChange={(event) => setForm({ ...form, invitationCode: event.target.value })} /></Field>
              <Field label="Password" hint="At least 6 characters"><input className={inputClass} type="password" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></Field>
              <Field label="Withdrawal PIN" hint="Use a different PIN"><input className={inputClass} type="password" required value={form.withdrawalPassword} onChange={(event) => setForm({ ...form, withdrawalPassword: event.target.value })} /></Field>
              {message && <div className="sm:col-span-2"><Notice message={message} tone="error" /></div>}
              <div className="sm:col-span-2"><Button loading={loading} className="h-12 w-full">Create my account</Button></div>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-slate-950/25 p-3 text-sm font-bold backdrop-blur"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/15">{icon}</span>{text}</div>;
}
