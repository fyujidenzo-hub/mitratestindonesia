import { ArrowDownToLine, Building2, CheckCircle2, CreditCard, LockKeyhole, ShieldCheck, UploadCloud, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CustomerShell } from "../components/CustomerShell";
import { Button, Card, Field, inputClass, Notice, StatusPill } from "../components/Ui";
import { api, dateTime, money } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useBootstrap } from "../lib/useBootstrap";
import { useI18n } from "../lib/i18n";
import type { Order, Transaction, User } from "../types";

export default function FinancePage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "withdraw" ? "withdraw" : "topup";
  const requestedTopUp = Number(params.get("amount"));
  const initialTopUpAmount = Number.isSafeInteger(requestedTopUp) && requestedTopUp > 0 ? String(Math.max(10_000, requestedTopUp)) : "100000";
  const { data } = useBootstrap();
  const { user, refresh, setUser } = useAuth();
  const { t } = useI18n();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [topup, setTopup] = useState({ amount: initialTopUpAmount, senderName: "", proof: null as File | null });
  const [withdraw, setWithdraw] = useState({ amount: "100000", bankName: "", accountName: "", accountNumber: "", withdrawalPassword: "" });
  const [message, setMessage] = useState(""); const [tone, setTone] = useState<"success" | "error">("success"); const [loading, setLoading] = useState(false);
  const activeBank = data?.banks[0];
  const minimumTopUp = activeBank?.minimumDeposit ?? 10_000;
  const maximumTopUp = activeBank?.maximumDeposit ?? 100_000_000;
  const load = () => api<{ user: User; transactions: Transaction[]; orders: Order[] }>("/customer/overview").then((result) => { setUser(result.user); setTransactions(result.transactions); });
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!activeBank) return;
    setTopup((current) => {
      const amount = Number(current.amount);
      if (Number.isSafeInteger(amount) && amount >= activeBank.minimumDeposit && amount <= activeBank.maximumDeposit) return current;
      return { ...current, amount: String(activeBank.minimumDeposit) };
    });
  }, [activeBank?.id, activeBank?.minimumDeposit, activeBank?.maximumDeposit]);

  const submitTopup = async (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Number(topup.amount);
    setTone("error");
    if (!activeBank) return setMessage(t("No active bank account is currently available. Please contact customer support."));
    if (!Number.isSafeInteger(amount) || amount < minimumTopUp || amount > maximumTopUp) {
      return setMessage(t("Enter an amount between {{minimum}} and {{maximum}}.", { minimum: money(minimumTopUp), maximum: money(maximumTopUp) }));
    }
    if (!topup.proof) return setMessage(t("Select a payment proof image first."));
    setLoading(true);
    setMessage("");
    try {
      const body = new FormData();
      body.append("amount", topup.amount);
      body.append("senderName", topup.senderName);
      body.append("proof", topup.proof);
      await api("/customer/topups", { method: "POST", body });
      setTone("success");
      setMessage(t("Your top-up request was submitted and is awaiting Super Admin approval."));
      setTopup({ amount: String(minimumTopUp), senderName: "", proof: null });
      await load();
    } catch (error) {
      setTone("error");
      setMessage(error instanceof Error ? error.message : t("Top-up failed."));
    } finally {
      setLoading(false);
    }
  };
  const submitWithdraw = async (event: React.FormEvent) => { event.preventDefault(); setLoading(true); setMessage(""); try { await api("/customer/withdrawals", { method: "POST", body: JSON.stringify({ ...withdraw, amount: Number(withdraw.amount) }) }); setTone("success"); setMessage("Withdrawal submitted. The balance was deducted and will be refunded if the request is rejected."); setWithdraw({ amount: "100000", bankName: "", accountName: "", accountNumber: "", withdrawalPassword: "" }); await Promise.all([load(), refresh()]); } catch (error) { setTone("error"); setMessage(error instanceof Error ? error.message : "Withdrawal failed."); } finally { setLoading(false); } };

  return <CustomerShell><main className="mx-auto w-full min-w-0 max-w-6xl px-3 py-5 sm:px-6 sm:py-8"><div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,.75fr)] lg:gap-6"><section className="min-w-0"><p className="text-[11px] font-black uppercase tracking-[.18em] text-shopee-500 sm:text-xs">{t("Balance center")}</p><h1 className="mt-1 break-words text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{t("Manage your work balance")}</h1><p className="mt-2 text-sm font-semibold text-slate-500">{t("Current balance")} <strong className="break-all text-shopee-500">{money(user?.balance ?? 0)}</strong></p>
    <div className="mt-5 grid grid-cols-2 rounded-2xl bg-slate-100 p-1 sm:mt-6"><button onClick={() => setParams({ tab: "topup" })} className={`h-11 min-w-0 rounded-xl px-2 text-sm font-black transition ${tab === "topup" ? "bg-white text-shopee-500 shadow" : "text-slate-500"}`}>{t("Top Up")}</button><button onClick={() => setParams({ tab: "withdraw" })} className={`h-11 min-w-0 rounded-xl px-2 text-sm font-black transition ${tab === "withdraw" ? "bg-white text-shopee-500 shadow" : "text-slate-500"}`}>{t("Withdraw")}</button></div>
    {message && <div className="mt-4"><Notice message={message} tone={tone} onClose={() => setMessage("")} /></div>}
    {tab === "topup" && <ImportantTopUpInformation />}
    {tab === "topup" ? (
      <Card className="mt-4 min-w-0 overflow-hidden border-orange-100 shadow-[0_18px_55px_rgba(124,45,18,.10)]">
        <div className="flex min-w-0 items-center gap-3 border-b border-orange-100 bg-gradient-to-r from-orange-50 via-white to-amber-50/60 p-4 sm:gap-4 sm:p-6">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-shopee-500 text-white shadow-lg shadow-shopee-500/20 sm:h-12 sm:w-12"><CreditCard size={21} /></div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[.15em] text-shopee-500">{t("Secure payment")}</p>
            <h2 className="mt-0.5 break-words text-lg font-black text-slate-900 sm:text-xl">{t("Create a top-up request")}</h2>
            <p className="mt-0.5 text-xs font-semibold leading-5 text-slate-500">{t("Transfer only to the selected official account")}</p>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {data?.banks.length ? data.banks.map((bank) => (
            <div key={bank.id} className="relative min-w-0 overflow-hidden rounded-[1.35rem] bg-gradient-to-br from-slate-950 via-slate-900 to-[#34170f] p-4 text-white shadow-xl shadow-slate-900/15 sm:p-5">
              <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full border-[22px] border-orange-500/10" />
              <div className="relative flex min-w-0 items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-orange-300 ring-1 ring-white/10"><Building2 size={19} /></span>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[.16em] text-white/50">{t("Official transfer account")}</p>
                    <p className="mt-0.5 truncate text-lg font-black">{bank.bankName}</p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-emerald-300 ring-1 ring-emerald-300/20">{t("Active")}</span>
              </div>
              <div className="relative mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[.14em] text-white/40">{t("Account number")}</p>
                  <p className="mt-1 break-all text-xl font-black tracking-[.08em] text-white sm:text-2xl">{bank.accountNumber}</p>
                </div>
                <div className="min-w-0 sm:text-right">
                  <p className="text-[9px] font-black uppercase tracking-[.14em] text-white/40">{t("Account holder name")}</p>
                  <p className="mt-1 break-words text-sm font-bold text-white/85">{bank.accountName}</p>
                </div>
              </div>
              <div className="relative mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-4">
                <div><p className="text-[9px] font-black uppercase tracking-[.12em] text-white/40">{t("Minimum top-up")}</p><p className="mt-1 text-xs font-black text-orange-200 sm:text-sm">{money(bank.minimumDeposit)}</p></div>
                <div className="text-right"><p className="text-[9px] font-black uppercase tracking-[.12em] text-white/40">{t("Maximum top-up")}</p><p className="mt-1 text-xs font-black text-orange-200 sm:text-sm">{money(bank.maximumDeposit)}</p></div>
              </div>
            </div>
          )) : (
            <Notice message={t("No active bank account is currently available. Please contact customer support.")} tone="error" />
          )}

          <form onSubmit={submitTopup} className="mt-5 grid min-w-0 gap-4 sm:mt-6 sm:grid-cols-2">
            <Field label={t("Top-up amount")} hint={t("Allowed range: {{minimum}} – {{maximum}}", { minimum: money(minimumTopUp), maximum: money(maximumTopUp) })}>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-shopee-500">Rp</span>
                <input className={`${inputClass} pl-12`} type="number" min={minimumTopUp} max={maximumTopUp} step="1000" value={topup.amount} onChange={(e) => setTopup({ ...topup, amount: e.target.value })} />
              </div>
              <p className="text-xs font-bold leading-5 text-rose-600">
                {t("To ensure a smooth and speedy verification process, please ensure you enter the correct balance amount for the transfer.")}
              </p>
            </Field>
            <Field label={t("Sender name")}>
              <input className={inputClass} required value={topup.senderName} onChange={(e) => setTopup({ ...topup, senderName: e.target.value })} placeholder={t("Name on the sending account")} />
            </Field>
            <div className="sm:col-span-2">
              <Field label={t("Payment proof")} hint={t("JPG, PNG, or WEBP up to 5 MB")}>
                <label className={`group flex min-h-28 min-w-0 cursor-pointer items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-4 transition sm:min-h-24 sm:justify-start sm:px-5 ${topup.proof ? "border-emerald-200 bg-emerald-50/70 text-emerald-700" : "border-orange-200 bg-gradient-to-r from-orange-50/80 to-white text-shopee-500 hover:border-shopee-300 hover:bg-orange-50"}`}>
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl shadow-sm ${topup.proof ? "bg-emerald-500 text-white" : "bg-white text-shopee-500"}`}>{topup.proof ? <CheckCircle2 size={21} /> : <UploadCloud size={21} />}</span>
                  <span className="min-w-0 text-left">
                    <span className="block break-words text-sm font-black">{topup.proof ? t("Proof image selected") : t("Select proof image")}</span>
                    <span className="mt-1 block max-w-full truncate text-xs font-semibold opacity-70">{topup.proof?.name || t("Tap to choose an image from your device")}</span>
                  </span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => setTopup({ ...topup, proof: e.target.files?.[0] || null })} />
                </label>
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Button loading={loading} disabled={!data?.banks.length} className="h-12 w-full text-sm sm:text-base"><ArrowDownToLine size={18} /> {t("Submit request")}</Button>
              <p className="mt-3 text-center text-[11px] font-semibold leading-5 text-slate-400">{t("Your request will be reviewed by the Super Admin after submission.")}</p>
            </div>
          </form>
        </div>
      </Card>
    ) : <Card className="mt-4 min-w-0 p-4 sm:p-7"><div className="flex min-w-0 items-center gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 sm:h-12 sm:w-12"><Wallet /></div><div className="min-w-0"><h2 className="break-words font-black text-slate-900">Request a withdrawal</h2><p className="text-xs font-semibold leading-5 text-slate-500">Minimum withdrawal Rp100,000</p></div></div><form onSubmit={submitWithdraw} className="mt-5 grid min-w-0 gap-4 sm:mt-6 sm:grid-cols-2"><Field label="Withdrawal amount"><input className={inputClass} type="number" min="100000" value={withdraw.amount} onChange={(e) => setWithdraw({ ...withdraw, amount: e.target.value })} /></Field><Field label="Bank name"><input className={inputClass} required value={withdraw.bankName} onChange={(e) => setWithdraw({ ...withdraw, bankName: e.target.value })} /></Field><Field label="Account holder name"><input className={inputClass} required value={withdraw.accountName} onChange={(e) => setWithdraw({ ...withdraw, accountName: e.target.value })} /></Field><Field label="Account number"><input className={inputClass} required value={withdraw.accountNumber} onChange={(e) => setWithdraw({ ...withdraw, accountNumber: e.target.value })} /></Field><div className="sm:col-span-2"><Field label="Withdrawal PIN"><div className="relative"><LockKeyhole size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input className={`${inputClass} pl-11`} type="password" required value={withdraw.withdrawalPassword} onChange={(e) => setWithdraw({ ...withdraw, withdrawalPassword: e.target.value })} /></div></Field></div><div className="sm:col-span-2"><Button loading={loading} className="w-full">Submit withdrawal</Button></div></form></Card>}</section>
    <aside className="min-w-0"><Card className="min-w-0 overflow-hidden"><div className="bg-slate-950 p-4 text-white sm:p-5"><p className="text-[11px] font-black uppercase tracking-[.16em] text-white/50 sm:text-xs">{t("Recent activity")}</p><h2 className="mt-1 text-lg font-black sm:text-xl">{t("Transaction history")}</h2></div><div className="divide-y divide-slate-100">{transactions.length ? transactions.slice(0, 10).map((transaction) => <div key={transaction.id} className="grid min-w-0 grid-cols-[40px_minmax(0,1fr)] items-center gap-x-3 gap-y-2 p-3.5 sm:grid-cols-[40px_minmax(0,1fr)_auto] sm:p-4"><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${transaction.type === "TOPUP" ? "bg-shopee-50 text-shopee-500" : transaction.type === "WITHDRAWAL" ? "bg-sky-50 text-sky-600" : "bg-emerald-50 text-emerald-600"}`}>{transaction.type === "TOPUP" ? <CreditCard size={18} /> : transaction.type === "WITHDRAWAL" ? <Building2 size={18} /> : <CheckCircle2 size={18} />}</div><div className="min-w-0"><p className="text-sm font-black text-slate-900">{transaction.description || t(transaction.type.replace("_", " "))}</p><p className="break-all text-[11px] font-semibold leading-4 text-slate-400 sm:truncate">{transaction.requestNumber} · {dateTime(transaction.createdAt)}</p></div><div className="col-span-2 flex min-w-0 items-center justify-between gap-3 pl-[52px] sm:col-span-1 sm:block sm:pl-0 sm:text-right"><p className="break-all text-sm font-black text-slate-900">{money(transaction.amount)}</p><StatusPill status={transaction.status} /></div></div>) : <p className="p-8 text-center text-sm font-semibold text-slate-400">{t("No transactions yet.")}</p>}</div></Card></aside></div></main></CustomerShell>;
}

function ImportantTopUpInformation() {
  const { t } = useI18n();
  const points = [
    "Use only the official payment accounts listed in the top-up form.",
    "Transfers sent to any other account cannot be validated.",
    "Verify the destination account and payment amount before transferring.",
  ];
  return <Card className="mt-4 min-w-0 overflow-hidden border-orange-200 bg-gradient-to-br from-shopee-500 to-orange-500 p-4 text-white shadow-lg shadow-shopee-500/20 sm:p-6"><div className="flex min-w-0 items-start gap-3 sm:gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-shopee-500 sm:h-12 sm:w-12"><ShieldCheck size={23} /></span><div className="min-w-0"><p className="break-words text-[10px] font-black uppercase tracking-[.14em] text-white/70 sm:text-xs sm:tracking-[.16em]">{t("Please read before transferring")}</p><h2 className="mt-1 break-words text-lg font-black sm:text-xl">{t("Important information")}</h2></div></div><div className="mt-4 grid gap-2.5 sm:mt-5 sm:gap-3">{points.map((point) => <div key={point} className="flex min-w-0 gap-3 rounded-2xl bg-white/15 p-3 text-[13px] font-bold leading-5 sm:p-3.5 sm:text-sm sm:leading-6"><CheckCircle2 size={18} className="mt-0.5 shrink-0 sm:mt-1" /><span className="min-w-0 break-words">{t(point)}</span></div>)}</div><div className="mt-4 break-words border-t border-white/20 pt-4 text-[13px] font-black leading-5 sm:mt-5 sm:text-sm sm:leading-6">{t("All activities and services are supervised by the Financial Services Authority (OJK).")}</div></Card>;
}
