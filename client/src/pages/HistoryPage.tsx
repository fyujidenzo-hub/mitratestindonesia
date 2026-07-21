import { CheckCircle2, CreditCard, Gift, Landmark, LockKeyhole } from "lucide-react";
import { useEffect, useState } from "react";
import { CustomerShell } from "../components/CustomerShell";
import { Card, StatusPill } from "../components/Ui";
import { api, dateTime, money } from "../lib/api";
import { useAuth } from "../lib/auth";
import { rewardMilestones, rewardTaskGoal } from "../lib/rewards";
import type { Order, Transaction, User } from "../types";

export default function HistoryPage() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<{ user: User; transactions: Transaction[]; orders: Order[] } | null>(null);

  useEffect(() => {
    api<{ user: User; transactions: Transaction[]; orders: Order[] }>("/customer/overview").then(setOverview);
  }, []);

  const currentUser = overview?.user ?? user;
  const completedTasks = currentUser?.totalOrders ?? 0;
  const transactions = overview?.transactions ?? [];
  const rewards = transactions.filter((transaction) => transaction.type === "REWARD");

  return (
    <CustomerShell>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-shopee-500">Rewards and activity</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">Usage & transaction history</h1>
            <p className="mt-2 text-sm font-semibold text-slate-500">Track completed tasks, automatic milestone rewards, and account transactions.</p>
          </div>
          <div className="rounded-2xl bg-shopee-50 px-5 py-3 text-right ring-1 ring-shopee-100">
            <p className="text-[10px] font-black uppercase tracking-wide text-shopee-500">Tasks completed</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{completedTasks}<span className="text-sm text-slate-400"> / {rewardTaskGoal}</span></p>
          </div>
        </div>

        <section className="mt-6">
          <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-shopee-50 text-shopee-500"><Gift size={21} /></div><div><h2 className="font-black text-slate-900">Task reward milestones</h2><p className="text-xs font-semibold text-slate-400">Rewards are credited automatically when each target is reached.</p></div></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {rewardMilestones.map((milestone) => {
              const earned = completedTasks >= milestone.task;
              return <Card key={milestone.task} className={`p-4 ${earned ? "border-orange-200 bg-orange-50/30" : ""}`}><div className={`grid h-10 w-10 place-items-center rounded-2xl ${earned ? "bg-shopee-500 text-white" : "bg-slate-100 text-slate-400"}`}>{earned ? <CheckCircle2 size={19} /> : <LockKeyhole size={18} />}</div><p className="mt-4 text-xs font-black uppercase tracking-wide text-slate-400">Complete task {milestone.task}</p><p className={`mt-1 text-lg font-black ${earned ? "text-shopee-600" : "text-slate-700"}`}>{money(milestone.amount)}</p><p className="mt-2 text-[11px] font-bold text-slate-400">{earned ? "Reward earned" : `${Math.max(0, milestone.task - completedTasks)} tasks remaining`}</p></Card>;
            })}
          </div>
        </section>

        <div className="mt-7 grid gap-6 lg:grid-cols-[.85fr_1.15fr]">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-shopee-500 to-orange-500 p-5 text-white"><p className="text-xs font-black uppercase tracking-[.16em] text-white/70">Automatic bonuses</p><h2 className="mt-1 text-xl font-black">Reward history</h2></div>
            <div className="divide-y divide-slate-100">
              {rewards.length ? rewards.map((reward) => <div key={reward.id} className="flex items-center gap-3 p-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-orange-50 text-shopee-500"><Gift size={19} /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-slate-900">{reward.senderName || "Task milestone reward"}</p><p className="mt-1 text-[11px] font-semibold text-slate-400">{reward.requestNumber} · {dateTime(reward.createdAt)}</p></div><p className="text-sm font-black text-shopee-600">+{money(reward.amount)}</p></div>) : <p className="p-8 text-center text-sm font-semibold text-slate-400">Complete milestone tasks to earn your first reward.</p>}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="bg-slate-950 p-5 text-white"><p className="text-xs font-black uppercase tracking-[.16em] text-white/50">Account usage</p><h2 className="mt-1 text-xl font-black">All transactions</h2></div>
            <div className="divide-y divide-slate-100">
              {transactions.length ? transactions.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} />) : <p className="p-8 text-center text-sm font-semibold text-slate-400">No transactions yet.</p>}
            </div>
          </Card>
        </div>
      </main>
    </CustomerShell>
  );
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const Icon = transaction.type === "TOPUP" ? CreditCard : transaction.type === "WITHDRAWAL" ? Landmark : Gift;
  return <div className="flex items-center gap-3 p-4"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${transaction.type === "REWARD" ? "bg-orange-50 text-shopee-500" : "bg-slate-100 text-slate-600"}`}><Icon size={19} /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-slate-900">{transaction.senderName || transaction.type.replace("_", " ")}</p><p className="mt-1 text-[11px] font-semibold text-slate-400">{transaction.requestNumber} · {dateTime(transaction.createdAt)}</p></div><div className="text-right"><p className="text-sm font-black text-slate-900">{transaction.type === "WITHDRAWAL" ? "−" : "+"}{money(transaction.amount)}</p><StatusPill status={transaction.status} /></div></div>;
}
