import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle, X } from "lucide-react";
import { useI18n } from "../lib/i18n";

export const inputClass = "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-shopee-400 focus:ring-4 focus:ring-shopee-100 disabled:bg-slate-100";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="grid gap-2 text-sm font-extrabold text-slate-700"><span>{label}</span>{children}{hint && <span className="text-xs font-medium text-slate-400">{hint}</span>}</label>;
}

export function Button({ children, loading, variant = "primary", className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  const variants = {
    primary: "bg-gradient-to-r from-shopee-500 to-orange-500 text-white shadow-lg shadow-shopee-500/20 hover:-translate-y-0.5 hover:shadow-xl",
    secondary: "border border-shopee-200 bg-shopee-50 text-shopee-600 hover:bg-shopee-100",
    ghost: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
  };
  return <button {...props} disabled={loading || props.disabled} className={`inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}>{loading && <LoaderCircle size={17} className="animate-spin" />}{children}</button>;
}

export function Notice({ message, tone = "info", onClose }: { message: string; tone?: "info" | "success" | "error"; onClose?: () => void }) {
  const classes = tone === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-sky-200 bg-sky-50 text-sky-700";
  const Icon = tone === "error" ? AlertCircle : CheckCircle2;
  return <div className={`flex items-start gap-3 rounded-2xl border p-3.5 text-sm font-bold ${classes}`}><Icon size={19} className="mt-0.5 shrink-0" /><span className="flex-1 leading-6">{message}</span>{onClose && <button onClick={onClose} aria-label="Close"><X size={17} /></button>}</div>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-3xl border border-slate-100 bg-white shadow-card ${className}`}>{children}</section>;
}

export function StatusPill({ status }: { status: string }) {
  const { t } = useI18n();
  const key = status.toUpperCase();
  const style = key.includes("APPROVED") || key.includes("DELIVERED") ? "bg-emerald-50 text-emerald-700" : key.includes("REJECTED") ? "bg-rose-50 text-rose-700" : key.includes("ASSIGNED") ? "bg-sky-50 text-sky-700" : "bg-amber-50 text-amber-700";
  const label = status.replaceAll("_", " ");
  const translated = t(label === "DELIVERED" ? "Completed" : label === "PRODUCT ASSIGNED" ? "Assigned product" : label);
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${style}`}>{translated}</span>;
}
