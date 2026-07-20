import { BadgeCheck, Eye, EyeOff, Headphones, LockKeyhole, Phone, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Brand } from "../components/Brand";
import { Button, inputClass, Notice } from "../components/Ui";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { User } from "../types";

export default function LoginPage() {
  const [params] = useSearchParams();
  const area = params.get("area") === "admin" ? "admin" : "customer";
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
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
    <main className="min-h-screen bg-[#fff5ec] p-3 sm:p-5">
      <div className="mx-auto max-w-[1500px] overflow-hidden rounded-[30px] border border-orange-100 bg-white shadow-[0_28px_90px_rgba(139,55,27,.15)]">
        <header className="flex h-[74px] items-center justify-between px-5 sm:px-8"><Brand /><span className="inline-flex items-center gap-2 text-xs font-black text-slate-600"><Headphones size={18} /> 24/7 Support</span></header>
        <section className="relative min-h-[calc(100vh-114px)] overflow-hidden bg-orange-100">
          <picture><source media="(max-width: 767px)" srcSet="/assets/campaign-mobile-en.png" /><img src="/assets/campaign-desktop-en.png" alt="Shopee work campaign" className="absolute inset-0 h-full w-full object-cover object-center" /></picture>
          <div className="absolute inset-0 bg-gradient-to-r from-white/88 via-white/38 to-orange-950/20 md:bg-gradient-to-r md:from-white/85 md:via-white/20 md:to-orange-950/10" />
          <div className="relative grid min-h-[calc(100vh-114px)] items-center gap-8 px-4 py-8 sm:px-8 lg:grid-cols-[1fr_430px] lg:px-12 xl:px-20">
            <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/75 px-4 py-2 text-xs font-black uppercase tracking-[.16em] text-shopee-600 shadow-sm backdrop-blur"><Sparkles size={15} /> Work smarter every day</span>
              <h1 className="mt-5 text-4xl font-black leading-[1.08] text-slate-950 sm:text-5xl xl:text-6xl">Welcome to your <span className="text-shopee-500">Shopee Work</span> account.</h1>
              <p className="mx-auto mt-5 max-w-xl text-sm font-semibold leading-7 text-slate-700 sm:text-base lg:mx-0">Manage tasks, monitor orders, and grow your commission record through one friendly workspace.</p>
              <div className="mt-6 hidden flex-wrap gap-3 lg:flex"><TrustChip icon={<ShieldCheck />} label="Secure access" /><TrustChip icon={<BadgeCheck />} label="Protected records" /><TrustChip icon={<Headphones />} label="Always supported" /></div>
            </div>

            <div className="mx-auto w-full max-w-md rounded-[28px] border border-white/80 bg-white/94 p-5 shadow-[0_24px_70px_rgba(84,38,23,.18)] backdrop-blur-xl sm:p-7">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-shopee-500 to-orange-400 text-white shadow-float">{area === "admin" ? <ShieldCheck size={23} /> : <LockKeyhole size={23} />}</div>
              <h2 className="mt-5 text-2xl font-black text-slate-950">{area === "admin" ? "Administrator access" : "Sign in to Shopee Work"}</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">{area === "admin" ? "Manage members, tasks, and finance requests." : "Continue to your tasks, balance, and rewards."}</p>
              <form onSubmit={submit} className="mt-6 grid gap-4">
                <label className="relative"><Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-shopee-500" /><input className={`${inputClass} h-14 pl-12`} required value={form.identifier} onChange={(event) => setForm({ ...form, identifier: event.target.value })} placeholder="Username or phone number" aria-label="Username or phone number" /></label>
                <label className="relative"><LockKeyhole size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-shopee-500" /><input className={`${inputClass} h-14 pl-12 pr-12`} required type={showPassword ? "text" : "password"} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Password" aria-label="Password" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-xl text-slate-400 hover:bg-slate-100" aria-label="Show password">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></label>
                {message && <Notice message={message} tone="error" />}
                <Button loading={loading} className="h-[52px] w-full text-base">Sign in</Button>
              </form>
              {area === "customer" ? <div className="mt-5 grid gap-3 text-center"><span className="text-xs font-bold text-slate-400">or</span><Link to="/register" className="inline-flex h-12 items-center justify-center rounded-2xl border border-shopee-300 text-sm font-black text-shopee-500 transition hover:bg-shopee-50">Register now</Link><Link to="/login?area=admin" className="text-xs font-black text-slate-400 hover:text-shopee-500">Sign in as an administrator</Link></div> : <div className="mt-5 text-center"><Link to="/login" className="text-sm font-black text-shopee-500">Back to customer sign in</Link></div>}
              <div className="mt-6 grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 pt-5 text-center"><MiniTrust icon={<ShieldCheck />} label="Secure" /><MiniTrust icon={<BadgeCheck />} label="Protected" /><MiniTrust icon={<Headphones />} label="Support" /></div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function TrustChip({ icon, label }: { icon: React.ReactNode; label: string }) { return <span className="inline-flex items-center gap-2 rounded-2xl border border-white/80 bg-white/70 px-3 py-2 text-xs font-black text-slate-700 backdrop-blur">{icon}{label}</span>; }
function MiniTrust({ icon, label }: { icon: React.ReactNode; label: string }) { return <span className="grid place-items-center gap-1 text-[10px] font-black text-slate-500"><span className="text-shopee-500">{icon}</span>{label}</span>; }
