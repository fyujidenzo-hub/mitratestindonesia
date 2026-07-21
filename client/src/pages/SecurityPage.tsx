import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, ShieldCheck, WalletCards } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { CustomerShell } from "../components/CustomerShell";
import { Button, Card, Field, inputClass, Notice } from "../components/Ui";
import { api } from "../lib/api";
import { useI18n } from "../lib/i18n";

type Mode = "account" | "withdrawal";

export default function SecurityPage({ mode }: { mode: Mode }) {
  const accountMode = mode === "account";
  const { t } = useI18n();
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextSecret, setNextSecret] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showSecrets, setShowSecrets] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  const validNextSecret = accountMode ? nextSecret.length >= 8 : /^\d{6}$/.test(nextSecret);
  const formIsValid = currentPassword.length >= 4 && validNextSecret && nextSecret === confirmation;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setNotice(null);
    if (nextSecret !== confirmation) {
      setNotice({ message: "The confirmation does not match.", tone: "error" });
      return;
    }
    setBusy(true);
    try {
      if (accountMode) {
        await api("/customer/security/password", { method: "PATCH", body: JSON.stringify({ currentPassword, newPassword: nextSecret }) });
      } else {
        await api("/customer/security/withdrawal-password", { method: "PATCH", body: JSON.stringify({ accountPassword: currentPassword, newWithdrawalPassword: nextSecret }) });
      }
      setCurrentPassword("");
      setNextSecret("");
      setConfirmation("");
      setNotice({ message: accountMode ? "Your account password was updated successfully." : "Your withdrawal PIN was reset successfully.", tone: "success" });
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "Unable to update your security settings.", tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <CustomerShell>
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <Link to="/profile" className="mb-5 inline-flex items-center gap-2 text-sm font-black text-slate-500 transition hover:text-shopee-500"><ArrowLeft size={17} /> {t("Back to profile")}</Link>
        <div className="grid overflow-hidden rounded-[32px] border border-orange-100 bg-white shadow-card lg:grid-cols-[.85fr_1.15fr]">
          <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-[#6e281c] p-6 text-white sm:p-9">
            <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full border-[34px] border-white/5" />
            <div className="relative">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-orange-300 backdrop-blur">{accountMode ? <ShieldCheck size={27} /> : <WalletCards size={27} />}</span>
              <p className="mt-7 text-[10px] font-black uppercase tracking-[.18em] text-orange-300">Protected account setting</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight">{accountMode ? t("Reset account password") : t("Reset withdrawal PIN")}</h1>
              <p className="mt-4 text-sm font-semibold leading-6 text-white/60">{accountMode ? "Choose a strong new sign-in password. Your current customer session stays open, and your separate admin session is unaffected." : "Set a new six-digit PIN for future withdrawal requests. Existing withdrawal locks and pending requests remain unchanged."}</p>
              <div className="mt-8 grid gap-3 text-xs font-bold text-white/70"><p className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400" /> Current account password required</p><p className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400" /> New secret stored securely</p></div>
            </div>
          </section>

          <section className="p-5 sm:p-8 lg:p-10">
            <div><p className="text-[10px] font-black uppercase tracking-[.18em] text-shopee-500">Security check</p><h2 className="mt-2 text-2xl font-black text-slate-900">{t("Confirm it is really you")}</h2><p className="mt-1 text-sm font-semibold text-slate-400">{t("Enter your account password before making this change.")}</p></div>
            {notice && <div className="mt-5"><Notice message={notice.message} tone={notice.tone} onClose={() => setNotice(null)} /></div>}
            <form className="mt-6 grid gap-4" onSubmit={submit}>
              <Field label={t("Current account password")}><div className="relative"><KeyRound size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input required minLength={4} maxLength={100} type={showSecrets ? "text" : "password"} autoComplete="current-password" className={`${inputClass} pl-11 pr-12`} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /><button type="button" aria-label={showSecrets ? "Hide passwords" : "Show passwords"} onClick={() => setShowSecrets((value) => !value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">{showSecrets ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></Field>
              <Field label={accountMode ? "New account password" : "New withdrawal PIN"} hint={accountMode ? "Use at least 8 characters." : "Use exactly 6 numbers."}><input required minLength={accountMode ? 8 : 6} maxLength={accountMode ? 100 : 6} inputMode={accountMode ? undefined : "numeric"} pattern={accountMode ? undefined : "[0-9]{6}"} type={showSecrets ? "text" : "password"} autoComplete="new-password" className={inputClass} value={nextSecret} onChange={(event) => setNextSecret(accountMode ? event.target.value : event.target.value.replace(/\D/g, "").slice(0, 6))} /></Field>
              <Field label={accountMode ? "Confirm new password" : "Confirm new PIN"}><input required minLength={accountMode ? 8 : 6} maxLength={accountMode ? 100 : 6} inputMode={accountMode ? undefined : "numeric"} pattern={accountMode ? undefined : "[0-9]{6}"} type={showSecrets ? "text" : "password"} autoComplete="new-password" className={inputClass} value={confirmation} onChange={(event) => setConfirmation(accountMode ? event.target.value : event.target.value.replace(/\D/g, "").slice(0, 6))} /></Field>
              {confirmation && nextSecret !== confirmation && <p className="text-xs font-bold text-rose-600">The confirmation does not match yet.</p>}
              <Button type="submit" loading={busy} disabled={!formIsValid} className="mt-2 h-12 w-full">{accountMode ? t("Update account password") : t("Reset withdrawal PIN")}</Button>
            </form>
          </section>
        </div>
      </main>
    </CustomerShell>
  );
}
