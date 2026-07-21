import { ExternalLink, Headphones, MessageCircle, ShieldCheck } from "lucide-react";
import { CustomerShell } from "../components/CustomerShell";
import { Card } from "../components/Ui";
import { useBootstrap } from "../lib/useBootstrap";
import { useI18n } from "../lib/i18n";

export default function SupportPage() {
  const { data } = useBootstrap();
  const { t } = useI18n();
  return <CustomerShell><main className="mx-auto max-w-4xl px-4 py-8 sm:px-6"><div className="rounded-4xl bg-gradient-to-br from-shopee-500 to-orange-500 p-8 text-white shadow-float sm:p-10"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15"><Headphones size={28} /></div><h1 className="mt-5 text-3xl font-black">{t("We're here to help")}</h1><p className="mt-2 max-w-xl text-sm font-semibold leading-7 text-white/75">{t("Contact customer support for help with your account, tasks, top-ups, or withdrawals.")}</p><a href={data?.settings.supportUrl || "#"} target="_blank" rel="noreferrer" className="mt-6 inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-shopee-600">{t("Open customer support")} <ExternalLink size={17} /></a></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><Card className="p-6"><MessageCircle className="text-shopee-500" /><h2 className="mt-4 font-black text-slate-900">{t("Before contacting us")}</h2><p className="mt-2 text-sm font-semibold leading-6 text-slate-500">Have your username and request reference number ready so the team can help you faster.</p></Card><Card className="p-6"><ShieldCheck className="text-emerald-600" /><h2 className="mt-4 font-black text-slate-900">{t("Keep your account secure")}</h2><p className="mt-2 text-sm font-semibold leading-6 text-slate-500">Never share your password or withdrawal PIN with anyone.</p></Card></div></main></CustomerShell>;
}
