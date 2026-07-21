import { AlertTriangle, BadgeDollarSign, Banknote, Boxes, Check, ChevronLeft, ChevronRight, ClipboardList, ExternalLink, Eye, LayoutDashboard, LockKeyhole, LogOut, Menu, PackageCheck, PackagePlus, Pencil, Plus, Power, RefreshCw, Search, ShieldCheck, ShoppingBag, Trash2, UserCog, UserPlus, Users, WalletCards, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Brand } from "../components/Brand";
import { Button, Card, Field, inputClass, Notice, StatusPill } from "../components/Ui";
import { api, dateTime, money } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { Bank, CatalogBanner, CatalogProduct, Order, Product, Transaction, User, UserLevel } from "../types";

type AdminData = { members: User[]; transactions: Transaction[]; orders: Order[]; taskProducts: Product[]; catalogProducts: CatalogProduct[]; catalogBanners: CatalogBanner[]; banks: Bank[]; staff: User[] };
type Tab = "overview" | "members" | "tasks" | "topups" | "withdrawals" | "catalog" | "staff";
const tabs: Array<{ key: Tab; label: string; icon: typeof LayoutDashboard; superOnly?: boolean }> = [
  { key: "overview", label: "Overview", icon: LayoutDashboard }, { key: "members", label: "Members", icon: Users }, { key: "tasks", label: "Tasks & Orders", icon: ClipboardList }, { key: "topups", label: "Top-up", icon: BadgeDollarSign }, { key: "withdrawals", label: "Withdrawal", icon: Banknote }, { key: "catalog", label: "Catalog", icon: Boxes, superOnly: true }, { key: "staff", label: "Admin Team", icon: UserCog, superOnly: true },
];

export default function AdminPage() {
  const { user, logout } = useAuth(); const navigate = useNavigate();
  const [data, setData] = useState<AdminData | null>(null); const [tab, setTab] = useState<Tab>("overview"); const [query, setQuery] = useState(""); const [menuOpen, setMenuOpen] = useState(false); const [message, setMessage] = useState(""); const [tone, setTone] = useState<"success" | "error">("success"); const [refreshing, setRefreshing] = useState(false);
  const load = async () => { setRefreshing(true); try { setData(await api<AdminData>("/admin/overview")); } finally { setRefreshing(false); } };
  useEffect(() => { load(); }, []);
  const visibleTabs = tabs.filter((item) => !item.superOnly || user?.role === "SUPER_ADMIN");
  const say = (value: string, nextTone: "success" | "error" = "success") => { setTone(nextTone); setMessage(value); };
  const perform = async (path: string, body: unknown, success: string, method = "POST") => { try { await api(path, { method, body: JSON.stringify(body) }); say(success); await load(); return true; } catch (error) { say(error instanceof Error ? error.message : "Action failed.", "error"); return false; } };

  const filteredMembers = useMemo(() => data?.members.filter((member) => `${member.displayName} ${member.username} ${member.phone}`.toLowerCase().includes(query.toLowerCase())) ?? [], [data?.members, query]);
  const filteredOrders = useMemo(() => data?.orders.filter((order) => `${order.referenceNumber} ${order.user?.displayName} ${order.items.map((item) => item.productName).join(" ")}`.toLowerCase().includes(query.toLowerCase())) ?? [], [data?.orders, query]);
  const filteredTopups = useMemo(() => data?.transactions.filter((transaction) => transaction.type === "TOPUP" && `${transaction.requestNumber} ${transaction.user?.displayName} ${transaction.user?.username} ${transaction.senderName}`.toLowerCase().includes(query.toLowerCase())) ?? [], [data?.transactions, query]);
  const filteredWithdrawals = useMemo(() => data?.transactions.filter((transaction) => transaction.type === "WITHDRAWAL" && `${transaction.requestNumber} ${transaction.user?.displayName} ${transaction.user?.username} ${transaction.withdrawalBankName} ${transaction.withdrawalAccountNumber}`.toLowerCase().includes(query.toLowerCase())) ?? [], [data?.transactions, query]);
  const filteredCatalogProducts = useMemo(() => data?.catalogProducts.filter((product) => `${product.code} ${product.name} ${product.category}`.toLowerCase().includes(query.toLowerCase())) ?? [], [data?.catalogProducts, query]);
  const filteredCatalogBanners = useMemo(() => data?.catalogBanners.filter((banner) => `${banner.code} ${banner.title} ${banner.altText}`.toLowerCase().includes(query.toLowerCase())) ?? [], [data?.catalogBanners, query]);
  const filteredStaff = useMemo(() => data?.staff.filter((staffMember) => `${staffMember.displayName} ${staffMember.username} ${staffMember.adminCode} ${staffMember.invitationCode} ${staffMember.role}`.toLowerCase().includes(query.toLowerCase())) ?? [], [data?.staff, query]);

  const pendingTopups = data?.transactions.filter((item) => item.type === "TOPUP" && item.status === "PENDING").length ?? 0;
  const pendingWithdrawals = data?.transactions.filter((item) => item.type === "WITHDRAWAL" && item.status === "PENDING").length ?? 0;
  const pendingTasks = data?.orders.filter((item) => item.status === "WAITING_ASSIGNMENT").length ?? 0;
  const totalBalance = data?.members.reduce((sum, member) => sum + member.balance, 0) ?? 0;

  return <div className="min-h-screen bg-[#f4f5f7] text-slate-900"><header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur"><div className="flex h-16 items-center gap-3 px-4 lg:px-6"><button aria-label="Open navigation" className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 lg:hidden" onClick={() => setMenuOpen(true)}><Menu /></button><Brand compact /><div className="relative ml-auto hidden w-full max-w-md md:block"><Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-semibold outline-none focus:border-shopee-300" placeholder="Search members, orders, and transactions" /></div><div className="ml-auto flex items-center gap-3 md:ml-0"><div className="hidden text-right sm:block"><p className="text-sm font-black">{user?.displayName}</p><p className="text-[10px] font-black uppercase tracking-wide text-shopee-500">{user?.role.replace("_", " ")}</p></div><button aria-label="Sign out" onClick={async () => { await logout("admin"); navigate("/admin"); }} className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600"><LogOut size={18} /></button></div></div></header>
    <div className="flex"><aside className={`${menuOpen ? "fixed inset-0 z-50 flex" : "hidden"} w-full bg-slate-950/50 lg:sticky lg:top-16 lg:flex lg:h-[calc(100vh-4rem)] lg:w-64 lg:bg-transparent`}><div className="h-full w-72 bg-slate-950 p-4 text-white lg:w-full"><div className="mb-5 flex items-center justify-between lg:hidden"><Brand inverse compact /><button aria-label="Close navigation" onClick={() => setMenuOpen(false)}><X /></button></div><nav className="grid gap-1.5">{visibleTabs.map(({ key, label, icon: Icon }) => <button key={key} onClick={() => { setTab(key); setMenuOpen(false); }} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition ${tab === key ? "bg-gradient-to-r from-shopee-500 to-orange-500 text-white shadow-lg" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}><Icon size={19} />{label}<ChevronRight size={15} className="ml-auto opacity-40" /></button>)}</nav><div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-[10px] font-black uppercase tracking-[.16em] text-slate-500">Invitation code</p><p className="mt-2 text-xl font-black text-white">{user?.invitationCode || "-"}</p><p className="mt-1 text-xs font-semibold text-slate-500">Bonus {money(user?.registrationBonus ?? 0)}</p></div></div><button aria-label="Close navigation overlay" className="flex-1 lg:hidden" onClick={() => setMenuOpen(false)} /></aside>
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-[1680px]"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.18em] text-shopee-500">Admin command center</p><h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{visibleTabs.find((item) => item.key === tab)?.label}</h1></div><Button variant="ghost" loading={refreshing} onClick={load}><RefreshCw size={17} /> Refresh data</Button></div>{message && <div className="mt-5"><Notice message={message} tone={tone} onClose={() => setMessage("")} /></div>}
        <div className="relative mt-5 md:hidden"><Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} className={`${inputClass} pl-10`} placeholder="Search data" /></div>
        {tab === "overview" && <Overview members={data?.members.length ?? 0} totalBalance={totalBalance} pendingTopups={pendingTopups} pendingWithdrawals={pendingWithdrawals} pendingTasks={pendingTasks} transactions={data?.transactions ?? []} orders={data?.orders ?? []} />}
        {tab === "members" && <Members members={filteredMembers} orders={data?.orders ?? []} canManage={user?.role === "SUPER_ADMIN"} canManageSecurity={user?.role === "SUPER_ADMIN" || user?.role === "ADMIN"} canManageWithdrawals={user?.role === "SUPER_ADMIN" || user?.role === "ADMIN"} perform={perform} />}
        {tab === "tasks" && <Tasks orders={filteredOrders} products={data?.taskProducts ?? []} perform={perform} />}
        {tab === "topups" && <Topups transactions={filteredTopups} canReview={user?.role === "SUPER_ADMIN"} perform={perform} />}
        {tab === "withdrawals" && <Withdrawals transactions={filteredWithdrawals} canReview={user?.role === "SUPER_ADMIN"} perform={perform} />}
        {tab === "catalog" && <Catalog products={filteredCatalogProducts} banners={filteredCatalogBanners} perform={perform} />}
        {tab === "staff" && <Staff staff={filteredStaff} perform={perform} />}
      </div></main>
    </div>
  </div>;
}

function Overview({ members, totalBalance, pendingTopups, pendingWithdrawals, pendingTasks, transactions, orders }: { members: number; totalBalance: number; pendingTopups: number; pendingWithdrawals: number; pendingTasks: number; transactions: Transaction[]; orders: Order[] }) {
  return <><div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={<Users />} label="Total members" value={String(members)} tone="orange" /><Metric icon={<WalletCards />} label="Total balance" value={money(totalBalance)} tone="green" /><Metric icon={<Banknote />} label="Finance requests" value={String(pendingTopups + pendingWithdrawals)} tone="blue" /><Metric icon={<ClipboardList />} label="Tasks awaiting assignment" value={String(pendingTasks)} tone="purple" /></div><div className="mt-5 grid gap-5 xl:grid-cols-2"><Card className="overflow-hidden"><SectionTitle title="Latest requests" subtitle="Top-ups and withdrawals that need attention" /><div className="divide-y divide-slate-100">{transactions.slice(0, 6).map((item) => <div key={item.id} className="flex items-center gap-3 p-4"><span className={`grid h-10 w-10 place-items-center rounded-xl ${item.type === "TOPUP" ? "bg-shopee-50 text-shopee-500" : "bg-sky-50 text-sky-600"}`}>{item.type === "TOPUP" ? <BadgeDollarSign size={19} /> : <Banknote size={19} />}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{item.user?.displayName} · {item.type}</p><p className="text-xs font-semibold text-slate-400">{money(item.amount)}</p></div><StatusPill status={item.status} /></div>)}</div></Card><Card className="overflow-hidden"><SectionTitle title="Task activity" subtitle="Latest customer task statuses" /><div className="divide-y divide-slate-100">{orders.slice(0, 6).map((item) => <div key={item.id} className="flex items-center gap-3 p-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-600"><PackageCheck size={19} /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{item.user?.displayName} · {item.items[0]?.productName || "Waiting for product"}</p><p className="text-xs font-semibold text-slate-400">{item.referenceNumber}</p></div><StatusPill status={item.status} /></div>)}</div></Card></div></>;
}

const tableHeadClass = "whitespace-nowrap border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-[10px] font-black uppercase tracking-[.08em] text-slate-500";
const tableCellClass = "border-b border-slate-100 px-4 py-3.5 align-middle text-xs font-semibold text-slate-600";
const activeOrderStatuses = ["WAITING_ASSIGNMENT", "PRODUCT_ASSIGNED", "WAITING_SHIPMENT", "PENDING_DELIVERY"];
const assignedTaskStatuses: Order["status"][] = ["PRODUCT_ASSIGNED", "WAITING_SHIPMENT", "PENDING_DELIVERY"];

function memberHasActiveAssignedTask(orders: Order[], order: Order) {
  return orders.some((candidate) => candidate.id !== order.id && candidate.userId === order.userId && assignedTaskStatuses.includes(candidate.status));
}

function MobileRecordCard({ title, subtitle, badge, children, actions }: { title: string; subtitle?: string; badge?: React.ReactNode; children: React.ReactNode; actions: React.ReactNode }) {
  return <article className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"><div className="flex items-start justify-between gap-3 border-b border-slate-100 p-4"><div className="min-w-0"><p className="break-all text-sm font-black text-slate-900">{title}</p>{subtitle && <p className="mt-1 truncate text-[11px] font-semibold text-slate-400">{subtitle}</p>}</div>{badge && <div className="shrink-0">{badge}</div>}</div><div className="grid grid-cols-2 gap-x-4 gap-y-3 p-4">{children}</div><div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-slate-50/70 p-3">{actions}</div></article>;
}

function MobileRecordField({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <div className={wide ? "col-span-2" : ""}><p className="text-[9px] font-black uppercase tracking-[.08em] text-slate-400">{label}</p><div className="mt-1 break-words text-xs font-bold leading-5 text-slate-800">{children}</div></div>;
}

function shortfallForMember(member: User, orders: Order[]) {
  return Math.max(0, ...orders.filter((order) => order.userId === member.id && activeOrderStatuses.includes(order.status)).map((order) => order.requiredBalance - member.balance));
}

function Members({ members, orders, canManage, canManageSecurity, canManageWithdrawals, perform }: { members: User[]; orders: Order[]; canManage: boolean; canManageSecurity: boolean; canManageWithdrawals: boolean; perform: (path: string, body: unknown, success: string, method?: string) => Promise<boolean> }) {
  const [viewing, setViewing] = useState<User | null>(null);
  const [reward, setReward] = useState<{ user: User; amount: string } | null>(null);
  const [access, setAccess] = useState<{ user: User; level: UserLevel; active: boolean; withdrawalLocked?: boolean; accountPassword?: string; withdrawalPassword?: string; remarks?: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const saveAccess = async () => {
    if (!access) return;
    setBusy(true);
    const succeeded = await perform(`/admin/members/${access.user.id}/access`, {
      level: access.level,
      active: access.active,
      withdrawalLocked: access.withdrawalLocked ?? access.user.withdrawalLocked,
      accountPassword: access.accountPassword || "",
      withdrawalPassword: access.withdrawalPassword || "",
      remarks: access.remarks || "",
    }, "Member settings updated securely.", "PATCH");
    setBusy(false);
    if (succeeded) { setAccess(null); setViewing(null); }
  };

  const securityResetRequested = Boolean(access?.accountPassword || access?.withdrawalPassword);
  const accessFormValid = Boolean(
    access
    && (!access.accountPassword || access.accountPassword.length >= 8)
    && (!access.withdrawalPassword || /^\d{6}$/.test(access.withdrawalPassword))
    && (!securityResetRequested || (access.remarks?.trim().length ?? 0) >= 3),
  );

  return <><Card className="mt-6 overflow-hidden"><div className="flex flex-col gap-2 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-black text-slate-900">Member directory</p><p className="mt-1 text-xs font-semibold text-slate-400">{members.length} accounts · Promo ownership, balances, membership, and access activity</p></div><span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-slate-500">{canManage ? "Super Admin controls" : canManageSecurity ? "Admin member controls" : "Admin monitoring"}</span></div><div className="grid gap-3 p-3 md:hidden">{members.map((member) => { const shortfall = shortfallForMember(member, orders); return <MobileRecordCard key={member.id} title={member.displayName} subtitle={`@${member.username} · ${member.phone || "No phone"}`} badge={<span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${member.isActive === false ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>{member.isActive === false ? "Inactive" : "Active"}</span>} actions={<><Button variant="ghost" className="h-9 flex-1 px-3 text-xs" onClick={() => setViewing(member)}><Eye size={14} /> View</Button>{canManageSecurity && <Button variant="secondary" className="h-9 flex-1 px-3 text-xs" onClick={() => setAccess({ user: member, level: member.level, active: member.isActive !== false })}><UserCog size={14} /> Manage</Button>}</>}><MobileRecordField label="Promo code">{member.referrer?.invitationCode || "—"}</MobileRecordField><MobileRecordField label="Administrator">{member.referrer?.displayName || "Not linked"}</MobileRecordField><MobileRecordField label="Shortfall"><span className={shortfall > 0 ? "text-rose-600" : "text-emerald-600"}>{money(shortfall)}</span></MobileRecordField><MobileRecordField label="Orders">{member.totalOrders}</MobileRecordField><MobileRecordField label="Level">{member.level}</MobileRecordField><MobileRecordField label="Last login">{member.lastLoginAt ? dateTime(member.lastLoginAt) : "Never"}</MobileRecordField></MobileRecordCard>; })}{!members.length && <p className="py-8 text-center text-sm font-bold text-slate-400">No members match the current search.</p>}</div><div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[1240px]"><caption className="sr-only">Member account management</caption><thead><tr><th className={tableHeadClass}>Promo Code</th><th className={tableHeadClass}>User</th><th className={tableHeadClass}>Name / Account</th><th className={tableHeadClass}>Shortfall</th><th className={tableHeadClass}>Orders</th><th className={tableHeadClass}>Level</th><th className={tableHeadClass}>Last Login</th><th className={`${tableHeadClass} sticky right-0 z-10 shadow-[-8px_0_16px_-16px_rgba(15,23,42,.7)]`}>Action</th></tr></thead><tbody>{members.map((member) => { const shortfall = shortfallForMember(member, orders); return <tr key={member.id} className="group bg-white transition hover:bg-orange-50/30"><td className={tableCellClass}><span className="rounded-lg bg-shopee-50 px-2.5 py-1.5 font-black text-shopee-600">{member.referrer?.invitationCode || "—"}</span></td><td className={tableCellClass}><p className="font-black text-slate-900">@{member.username}</p><p className="mt-1 text-[10px] text-slate-400">{member.isActive === false ? "Access disabled" : "Active user"}</p></td><td className={tableCellClass}><p className="font-black text-slate-900">{member.displayName}</p><p className="mt-1 text-[10px] text-slate-400">{member.phone || "No phone"} · {member.referrer?.displayName || "No administrator"}</p></td><td className={tableCellClass}><span className={`font-black ${shortfall > 0 ? "text-rose-600" : "text-emerald-600"}`}>{money(shortfall)}</span></td><td className={tableCellClass}><span className="font-black text-slate-900">{member.totalOrders}</span></td><td className={tableCellClass}><span className="rounded-full bg-violet-50 px-2.5 py-1 font-black text-violet-700">{member.level}</span></td><td className={tableCellClass}>{member.lastLoginAt ? dateTime(member.lastLoginAt) : <span className="text-slate-400">Never</span>}</td><td className={`${tableCellClass} sticky right-0 bg-white shadow-[-8px_0_16px_-16px_rgba(15,23,42,.7)] group-hover:bg-orange-50/30`}><div className="flex justify-end gap-2"><Button variant="ghost" className="h-9 px-3 text-xs" onClick={() => setViewing(member)}><Eye size={14} /> View</Button>{canManageSecurity && <Button variant="secondary" className="h-9 px-3 text-xs" onClick={() => setAccess({ user: member, level: member.level, active: member.isActive !== false })}><UserCog size={14} /> Manage</Button>}</div></td></tr>; })}{!members.length && <tr><td colSpan={8} className="px-6 py-12 text-center text-sm font-bold text-slate-400">No members match the current search.</td></tr>}</tbody></table></div></Card>

    {viewing && <Modal title="Member account details" onClose={() => setViewing(null)} wide><div className="flex items-center gap-4 rounded-3xl bg-slate-950 p-5 text-white"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/10 font-black">{viewing.displayName.slice(0, 2).toUpperCase()}</span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-xl font-black">{viewing.displayName}</h3><span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${viewing.isActive === false ? "bg-rose-400/15 text-rose-300" : "bg-emerald-400/15 text-emerald-300"}`}>{viewing.isActive === false ? "Inactive" : "Active"}</span></div><p className="mt-1 text-sm font-semibold text-slate-300">@{viewing.username} · {viewing.level}</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><StaffDetail label="Promo code" value={viewing.referrer?.invitationCode || "Not linked"} /><StaffDetail label="Administrator" value={viewing.referrer?.displayName || "Not linked"} /><StaffDetail label="Phone number" value={viewing.phone || "Not provided"} /><StaffDetail label="Account balance" value={money(viewing.balance)} /><StaffDetail label="Orders" value={String(viewing.totalOrders)} /><StaffDetail label="Balance shortfall" value={money(shortfallForMember(viewing, orders))} /><StaffDetail label="Last login" value={viewing.lastLoginAt ? dateTime(viewing.lastLoginAt) : "Never"} /><StaffDetail label="Withdrawal access" value={viewing.withdrawalLocked ? "Closed" : "Open"} /></div><div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end"><Button variant="ghost" onClick={() => setViewing(null)}>Close</Button>{canManageWithdrawals && <Button variant={viewing.withdrawalLocked ? "secondary" : "danger"} onClick={async () => { const member = viewing; const succeeded = await perform(`/admin/members/${member.id}/withdrawal-lock`, { locked: !member.withdrawalLocked, remarks: !member.withdrawalLocked ? "Withdrawals closed by an administrator." : "" }, member.withdrawalLocked ? "Member withdrawals opened." : "Member withdrawals closed.", "PATCH"); if (succeeded) setViewing(null); }}><LockKeyhole size={16} /> {viewing.withdrawalLocked ? "Open withdrawals" : "Close withdrawals"}</Button>}{canManage && <><Button variant="secondary" onClick={() => { setReward({ user: viewing, amount: "50000" }); setViewing(null); }}><BadgeDollarSign size={16} /> Add bonus</Button><Button onClick={() => { setAccess({ user: viewing, level: viewing.level, active: viewing.isActive !== false }); setViewing(null); }}><UserCog size={16} /> Manage access</Button></>}</div></Modal>}

    {access && <Modal title="Manage member" onClose={() => !busy && setAccess(null)} wide>
      <div className="rounded-2xl bg-slate-950 p-4 text-white">
        <p className="font-black">{access.user.displayName}</p>
        <p className="mt-1 text-xs font-semibold text-slate-400">@{access.user.username}</p>
      </div>
      {canManage && <div className="mt-5 grid gap-4 rounded-3xl border border-slate-200 p-4">
        <div><p className="text-sm font-black text-slate-900">Membership and access</p><p className="mt-1 text-xs font-semibold text-slate-400">Super Admin controls for account level and sign-in access.</p></div>
        <Field label="Membership level"><select className={inputClass} value={access.level} onChange={(event) => setAccess({ ...access, level: event.target.value as UserLevel })}><option value="STARTER">Starter</option><option value="SILVER">Silver</option><option value="GOLD">Gold</option><option value="VIP">VIP</option></select></Field>
        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4"><span><span className="block text-sm font-black text-slate-800">Deactivate account</span><span className="mt-1 block text-xs font-semibold text-slate-400">Turn this on to block member sign-in and customer features.</span></span><input type="checkbox" checked={!access.active} onChange={(event) => setAccess({ ...access, active: !event.target.checked })} className="h-5 w-5 accent-[#ee4d2d]" /></label>
      </div>}
      <div className="mt-5 rounded-3xl border border-slate-200 p-4">
        <div><p className="text-sm font-black text-slate-900">Withdrawal access</p><p className="mt-1 text-xs font-semibold text-slate-500">Open or close withdrawal requests for this member.</p></div>
        <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-slate-100 p-1.5">
          <button type="button" onClick={() => setAccess({ ...access, withdrawalLocked: false })} className={`h-11 rounded-xl text-sm font-black transition ${(access.withdrawalLocked ?? access.user.withdrawalLocked) === false ? "bg-shopee-500 text-white shadow-md" : "text-slate-500 hover:bg-white"}`}>Withdrawal On</button>
          <button type="button" onClick={() => setAccess({ ...access, withdrawalLocked: true })} className={`h-11 rounded-xl text-sm font-black transition ${(access.withdrawalLocked ?? access.user.withdrawalLocked) === true ? "bg-shopee-500 text-white shadow-md" : "text-slate-500 hover:bg-white"}`}>Withdrawal Off</button>
        </div>
      </div>
      <div className="mt-5 rounded-3xl border border-orange-100 bg-orange-50/30 p-4">
        <div><p className="text-sm font-black text-slate-900">Password reset</p><p className="mt-1 text-xs font-semibold leading-5 text-slate-500">Leave a password field blank to keep its current value. A remark is required whenever a password is reset.</p></div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="New account password" hint="At least 8 characters."><input type="password" minLength={8} maxLength={100} autoComplete="new-password" className={inputClass} value={access.accountPassword || ""} onChange={(event) => setAccess({ ...access, accountPassword: event.target.value })} placeholder="Keep current password" /></Field>
          <Field label="New withdrawal password" hint="Use exactly 6 digits."><input type="password" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="new-password" className={inputClass} value={access.withdrawalPassword || ""} onChange={(event) => setAccess({ ...access, withdrawalPassword: event.target.value.replace(/\D/g, "").slice(0, 6) })} placeholder="Keep current PIN" /></Field>
          <div className="sm:col-span-2"><Field label="Remarks" hint={securityResetRequested ? "Required for this password reset." : "Optional when no password is changed."}><textarea rows={3} maxLength={500} className={`${inputClass} h-auto resize-y py-3`} value={access.remarks || ""} onChange={(event) => setAccess({ ...access, remarks: event.target.value })} placeholder="Reason or support note for this change" /></Field></div>
        </div>
      </div>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button variant="ghost" disabled={busy} onClick={() => setAccess(null)}>Cancel</Button><Button loading={busy} disabled={!accessFormValid} onClick={saveAccess}><Check size={16} /> Save member settings</Button></div>
    </Modal>}

    {reward && <Modal title={`Add a bonus for ${reward.user.displayName}`} onClose={() => !busy && setReward(null)}><Field label="Bonus amount"><input className={inputClass} type="number" min="1" value={reward.amount} onChange={(event) => setReward({ ...reward, amount: event.target.value })} /></Field><Button loading={busy} className="mt-4 w-full" onClick={async () => { setBusy(true); const succeeded = await perform(`/admin/members/${reward.user.id}/reward`, { amount: Number(reward.amount), note: "Super Admin Bonus" }, "Bonus added successfully."); setBusy(false); if (succeeded) setReward(null); }}>Add bonus</Button></Modal>}
  </>;
}

function Tasks({ orders, products, perform }: { orders: Order[]; products: Product[]; perform: (path: string, body: unknown, success: string) => Promise<boolean> }) {
  const [viewing, setViewing] = useState<Order | null>(null);
  const [target, setTarget] = useState<Order | null>(null);
  const beginAssignment = (order: Order) => { setViewing(null); setTarget(order); };

  return <><Card className="mt-6 overflow-hidden"><div className="border-b border-slate-100 p-4"><p className="font-black text-slate-900">Order and task monitoring</p><p className="mt-1 text-xs font-semibold text-slate-400">Assignment, customer balance exposure, task progress, and commission records</p></div><div className="overflow-x-auto"><table className="w-full min-w-[1850px]"><caption className="sr-only">Order and task management</caption><thead><tr>{["Order Code", "User", "Name", "User Balance", "Product", "Total Price", "Commission", "Balance Shortfall", "Status", "Task", "Date"].map((label) => <th key={label} className={tableHeadClass}>{label}</th>)}<th className={`${tableHeadClass} sticky right-0 z-10 shadow-[-8px_0_16px_-16px_rgba(15,23,42,.7)]`}>Action</th></tr></thead><tbody>{orders.map((order) => { const userBalance = order.user?.balance ?? 0; const shortfall = Math.max(0, order.requiredBalance - userBalance); const taskCount = Math.min(order.user?.totalOrders ?? 0, 15); const assignable = order.status === "WAITING_ASSIGNMENT" && !memberHasActiveAssignedTask(orders, order); return <tr key={order.id} className="group bg-white transition hover:bg-orange-50/30"><td className={tableCellClass}><p className="max-w-44 break-all font-black text-slate-900">{order.referenceNumber}</p></td><td className={tableCellClass}><span className="font-black text-slate-900">@{order.user?.username || "—"}</span></td><td className={tableCellClass}><span className="font-black text-slate-900">{order.user?.displayName || "Unknown"}</span></td><td className={tableCellClass}><span className="font-black text-shopee-600">{money(userBalance)}</span></td><td className={tableCellClass}><p className="max-w-64 font-bold text-slate-800">{order.items.map((item) => item.productName).join(", ") || "Awaiting assignment"}</p></td><td className={tableCellClass}><span className="font-black text-slate-900">{money(order.totalValue)}</span></td><td className={tableCellClass}><span className="font-black text-emerald-600">{money(order.commission)}</span></td><td className={tableCellClass}><span className={`font-black ${shortfall > 0 ? "text-rose-600" : "text-emerald-600"}`}>{money(shortfall)}</span></td><td className={tableCellClass}><StatusPill status={order.status} /></td><td className={tableCellClass}><p className="font-black text-slate-900">{taskCount}/15</p>{order.requiresCustomerApproval && <p className="mt-1 text-[10px] font-black text-amber-600">Approval required</p>}</td><td className={tableCellClass}>{dateTime(order.createdAt)}</td><td className={`${tableCellClass} sticky right-0 bg-white shadow-[-8px_0_16px_-16px_rgba(15,23,42,.7)] group-hover:bg-orange-50/30`}><div className="flex justify-end gap-2"><Button variant="ghost" className="h-9 px-3 text-xs" onClick={() => setViewing(order)}><Eye size={14} /> View</Button>{assignable && <Button className="h-9 px-3 text-xs" onClick={() => beginAssignment(order)}><ClipboardList size={14} /> Assign</Button>}</div></td></tr>; })}{!orders.length && <tr><td colSpan={12} className="px-6 py-12 text-center text-sm font-bold text-slate-400">No orders match the current search.</td></tr>}</tbody></table></div></Card>

    {viewing && <Modal title="Order and task details" onClose={() => setViewing(null)} wide><div className="flex flex-wrap items-start justify-between gap-3 rounded-3xl bg-slate-950 p-5 text-white"><div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Order code</p><p className="mt-1 break-all text-lg font-black">{viewing.referenceNumber}</p><p className="mt-2 text-sm font-semibold text-slate-300">{viewing.user?.displayName} · @{viewing.user?.username}</p></div><StatusPill status={viewing.status} /></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><StaffDetail label="User balance" value={money(viewing.user?.balance ?? 0)} /><StaffDetail label="Balance shortfall" value={money(Math.max(0, viewing.requiredBalance - (viewing.user?.balance ?? 0)))} /><StaffDetail label="Total price" value={money(viewing.totalValue)} /><StaffDetail label="Commission" value={money(viewing.commission)} /><StaffDetail label="Created" value={dateTime(viewing.createdAt)} /><StaffDetail label="Customer approval" value={viewing.requiresCustomerApproval ? "Required" : "Not required"} /></div><div className="mt-5 rounded-2xl border border-slate-100"><p className="border-b border-slate-100 px-4 py-3 text-xs font-black uppercase text-slate-500">Products</p>{viewing.items.length ? viewing.items.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-3 last:border-0"><div><p className="text-sm font-black text-slate-900">{item.productName}</p><p className="mt-1 text-xs font-semibold text-slate-400">{item.productCode} · Qty {item.quantity}</p></div><p className="text-sm font-black text-slate-900">{money(item.total)}</p></div>) : <p className="p-4 text-sm font-semibold text-slate-400">No product assigned yet.</p>}</div><div className="mt-6 flex justify-end gap-3"><Button variant="ghost" onClick={() => setViewing(null)}>Close</Button>{viewing.status === "WAITING_ASSIGNMENT" && !memberHasActiveAssignedTask(orders, viewing) && <Button onClick={() => beginAssignment(viewing)}><ClipboardList size={16} /> Assign product</Button>}</div></Modal>}

    {target && <AssignmentProductPicker order={target} products={products} onClose={() => setTarget(null)} onSave={(productId) => perform(`/admin/orders/${target.id}/assign`, { items: [{ productId, quantity: 1 }] }, "Product assigned successfully.")} />}
  </>;
}

type ProductSort = "default" | "price-asc" | "price-desc" | "commission-desc" | "name-asc";
const assignmentPageSize = 5;

function AssignmentProductPicker({ order, products, onClose, onSave }: { order: Order; products: Product[]; onClose: () => void; onSave: (productId: string) => Promise<boolean> }) {
  const [selectedProductId, setSelectedProductId] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [sort, setSort] = useState<ProductSort>("default");
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = productQuery.trim().toLowerCase();
    const available = products.filter((product) => product.active && (!normalizedQuery || `${product.name} ${product.code} ${product.category}`.toLowerCase().includes(normalizedQuery)));
    return [...available].sort((left, right) => {
      if (sort === "price-asc") return left.price - right.price;
      if (sort === "price-desc") return right.price - left.price;
      if (sort === "commission-desc") return right.commission - left.commission;
      if (sort === "name-asc") return left.name.localeCompare(right.name);
      return 0;
    });
  }, [productQuery, products, sort]);

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / assignmentPageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleProducts = filteredProducts.slice((currentPage - 1) * assignmentPageSize, currentPage * assignmentPageSize);
  const selectedProduct = products.find((product) => product.id === selectedProductId);

  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);

  const save = async () => {
    if (!selectedProductId || saving) return;
    setSaving(true);
    const succeeded = await onSave(selectedProductId);
    setSaving(false);
    if (succeeded) onClose();
  };

  return <Modal title="Add product to order" onClose={() => !saving && onClose()} wide>
    <div className="-mt-3 mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
      <div><p className="text-[10px] font-black uppercase tracking-[.12em] text-slate-400">Order reference</p><p className="mt-1 break-all text-sm font-black text-slate-800">{order.referenceNumber}</p></div>
      <span className="rounded-full bg-shopee-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-shopee-600">Choose one product</span>
    </div>

    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
      <label className="relative block"><span className="sr-only">Search task products</span><Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input aria-label="Search task products" value={productQuery} onChange={(event) => { setProductQuery(event.target.value); setPage(1); }} className={`${inputClass} pl-11`} placeholder="Search products or codes" /></label>
      <label><span className="sr-only">Sort products</span><select aria-label="Sort products" className={inputClass} value={sort} onChange={(event) => { setSort(event.target.value as ProductSort); setPage(1); }}><option value="default">Default order</option><option value="price-asc">Price: lowest first</option><option value="price-desc">Price: highest first</option><option value="commission-desc">Commission: highest first</option><option value="name-asc">Name: A to Z</option></select></label>
    </div>

    <div className="mt-4 space-y-2" role="listbox" aria-label="Task products">
      {visibleProducts.map((product) => { const selected = product.id === selectedProductId; return <button type="button" role="option" aria-selected={selected} key={product.id} onClick={() => setSelectedProductId(product.id)} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition sm:p-3.5 ${selected ? "border-shopee-400 bg-shopee-50 shadow-sm ring-2 ring-shopee-100" : "border-slate-200 bg-white hover:border-shopee-200 hover:bg-orange-50/40"}`}>
        <img src={product.imageUrl} alt="" className="h-14 w-14 shrink-0 rounded-xl bg-slate-100 object-cover sm:h-16 sm:w-16" />
        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-black text-slate-900">{product.name}</span><span className="mt-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">{product.code} · {product.category} · {product.quantity > 0 ? `${product.quantity} available` : "Available"}</span><span className="mt-1 block text-[11px] font-bold text-emerald-600 sm:hidden">{money(product.price)}</span></span>
        <span className="hidden shrink-0 text-right sm:block"><span className="block text-sm font-black text-emerald-600">{money(product.price)}</span><span className="mt-1 block text-[10px] font-bold text-slate-400">Commission {money(product.commission)}</span></span>
        <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${selected ? "border-shopee-500 bg-shopee-500 text-white" : "border-slate-300"}`}>{selected && <Check size={12} strokeWidth={3} />}</span>
      </button>; })}
      {!visibleProducts.length && <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-10 text-center"><PackagePlus size={28} className="mx-auto text-slate-300" /><p className="mt-3 text-sm font-black text-slate-600">No matching products</p><p className="mt-1 text-xs font-semibold text-slate-400">Try another search or sorting option.</p></div>}
    </div>

    <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-2.5">
      <Button type="button" variant="ghost" className="h-9 px-3 text-xs" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft size={15} /> Previous</Button>
      <p className="text-center text-[11px] font-black text-slate-500">Page {currentPage} of {pageCount}<span className="hidden sm:inline"> · {filteredProducts.length} products</span></p>
      <Button type="button" variant="ghost" className="h-9 px-3 text-xs" disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next <ChevronRight size={15} /></Button>
    </div>

    <div className="mt-5 rounded-2xl border border-slate-100 bg-white px-4 py-3"><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Selected product</p><p className={`mt-1 truncate text-sm font-black ${selectedProduct ? "text-slate-900" : "text-slate-400"}`}>{selectedProduct ? `${selectedProduct.name} · ${money(selectedProduct.price)}` : "Select a product from the list"}</p></div>
    <div className="mt-5 grid grid-cols-2 gap-3"><Button type="button" variant="ghost" disabled={saving} onClick={onClose}>Cancel</Button><Button type="button" loading={saving} disabled={!selectedProductId} onClick={save}><Check size={16} /> Save assignment</Button></div>
  </Modal>;
}

function Topups({ transactions, canReview, perform }: { transactions: Transaction[]; canReview: boolean; perform: (path: string, body: unknown, success: string) => Promise<boolean> }) {
  const [viewing, setViewing] = useState<Transaction | null>(null);
  const review = async (transaction: Transaction, status: "APPROVED" | "REJECTED") => { const succeeded = await perform(`/admin/transactions/${transaction.id}/review`, { status }, status === "APPROVED" ? "Top-up approved." : "Top-up rejected."); if (succeeded) setViewing(null); };
  return <><Card className="mt-6 overflow-hidden"><div className="border-b border-slate-100 p-4"><p className="font-black text-slate-900">Top-up requests</p><p className="mt-1 text-xs font-semibold text-slate-400">{canReview ? "Review transfer evidence and approve or reject funding requests." : "Monitor top-up requests within your assigned member scope."}</p></div><div className="overflow-x-auto"><table className="w-full min-w-[1280px]"><caption className="sr-only">Top-up request management</caption><thead><tr>{["Code", "User", "Sender", "Amount", "Transfer Proof / Notes", "Payment Method", "Status"].map((label) => <th key={label} className={tableHeadClass}>{label}</th>)}<th className={`${tableHeadClass} sticky right-0 z-10 shadow-[-8px_0_16px_-16px_rgba(15,23,42,.7)]`}>Action</th></tr></thead><tbody>{transactions.map((transaction) => <tr key={transaction.id} className="group bg-white transition hover:bg-orange-50/30"><td className={tableCellClass}><p className="max-w-44 break-all font-black text-slate-900">{transaction.requestNumber}</p></td><td className={tableCellClass}><p className="font-black text-slate-900">@{transaction.user?.username || "—"}</p><p className="mt-1 text-[10px] text-slate-400">{transaction.user?.displayName}</p></td><td className={tableCellClass}><span className="font-black text-slate-900">{transaction.senderName || "Not provided"}</span></td><td className={tableCellClass}><span className="font-black text-shopee-600">{money(transaction.amount)}</span></td><td className={tableCellClass}>{transaction.proofPath ? <a href={`/api/admin/transactions/${transaction.id}/proof`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-black text-shopee-500 hover:text-shopee-600"><ExternalLink size={14} /> View transfer proof</a> : <span className="text-slate-400">No proof or notes</span>}<p className="mt-1 max-w-52 truncate text-[10px] text-slate-400">{transaction.proofOriginalName}</p></td><td className={tableCellClass}><span className="font-black text-slate-900">Bank transfer</span></td><td className={tableCellClass}><StatusPill status={transaction.status} /></td><td className={`${tableCellClass} sticky right-0 bg-white shadow-[-8px_0_16px_-16px_rgba(15,23,42,.7)] group-hover:bg-orange-50/30`}><div className="flex justify-end gap-2"><Button variant="ghost" className="h-9 px-3 text-xs" onClick={() => setViewing(transaction)}><Eye size={14} /> View</Button>{canReview && transaction.status === "PENDING" && <><Button className="h-9 px-3 text-xs" onClick={() => review(transaction, "APPROVED")}>Approve</Button><Button variant="danger" className="h-9 px-3 text-xs" onClick={() => review(transaction, "REJECTED")}>Reject</Button></>}</div></td></tr>)}{!transactions.length && <tr><td colSpan={8} className="px-6 py-12 text-center text-sm font-bold text-slate-400">No top-up requests match the current search.</td></tr>}</tbody></table></div></Card>{viewing && <Modal title="Top-up request details" onClose={() => setViewing(null)}><div className="grid gap-3"><StaffDetail label="Code" value={viewing.requestNumber} /><StaffDetail label="User" value={`${viewing.user?.displayName || "Unknown"} · @${viewing.user?.username || "—"}`} /><StaffDetail label="Sender" value={viewing.senderName || "Not provided"} /><StaffDetail label="Amount" value={money(viewing.amount)} /><StaffDetail label="Payment method" value="Bank transfer" /><StaffDetail label="Submitted" value={dateTime(viewing.createdAt)} /></div>{viewing.proofPath && <a href={`/api/admin/transactions/${viewing.id}/proof`} target="_blank" rel="noreferrer" className="mt-4 flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-100 text-sm font-black text-slate-700"><ExternalLink size={16} /> Open transfer proof</a>}<div className="mt-6 flex flex-wrap justify-end gap-2"><Button variant="ghost" onClick={() => setViewing(null)}>Close</Button>{canReview && viewing.status === "PENDING" && <><Button onClick={() => review(viewing, "APPROVED")}>Approve</Button><Button variant="danger" onClick={() => review(viewing, "REJECTED")}>Reject</Button></>}</div></Modal>}</>;
}

function Withdrawals({ transactions, canReview, perform }: { transactions: Transaction[]; canReview: boolean; perform: (path: string, body: unknown, success: string) => Promise<boolean> }) {
  const [viewing, setViewing] = useState<Transaction | null>(null);
  const review = async (transaction: Transaction, status: "APPROVED" | "REJECTED") => { const succeeded = await perform(`/admin/transactions/${transaction.id}/review`, { status }, status === "APPROVED" ? "Withdrawal approved." : "Withdrawal rejected and balance refunded."); if (succeeded) setViewing(null); };
  return <><Card className="mt-6 overflow-hidden"><div className="border-b border-slate-100 p-4"><p className="font-black text-slate-900">Withdrawal requests</p><p className="mt-1 text-xs font-semibold text-slate-400">{canReview ? "Validate destination details before approving or refunding a rejected request." : "Monitor withdrawal requests within your assigned member scope."}</p></div><div className="overflow-x-auto"><table className="w-full min-w-[1050px]"><caption className="sr-only">Withdrawal request management</caption><thead><tr>{["Code", "User", "Amount", "Withdrawal Information", "Status"].map((label) => <th key={label} className={tableHeadClass}>{label}</th>)}<th className={`${tableHeadClass} sticky right-0 z-10 shadow-[-8px_0_16px_-16px_rgba(15,23,42,.7)]`}>Action</th></tr></thead><tbody>{transactions.map((transaction) => <tr key={transaction.id} className="group bg-white transition hover:bg-orange-50/30"><td className={tableCellClass}><p className="max-w-44 break-all font-black text-slate-900">{transaction.requestNumber}</p></td><td className={tableCellClass}><p className="font-black text-slate-900">@{transaction.user?.username || "—"}</p><p className="mt-1 text-[10px] text-slate-400">{transaction.user?.displayName}</p></td><td className={tableCellClass}><span className="font-black text-shopee-600">{money(transaction.amount)}</span></td><td className={tableCellClass}><p className="font-black text-slate-900">{transaction.withdrawalBankName || "Bank not provided"}</p><p className="mt-1 text-[10px] font-semibold text-slate-500">{transaction.withdrawalAccountName || "—"} · {transaction.withdrawalAccountNumber || "—"}</p></td><td className={tableCellClass}><StatusPill status={transaction.status} /></td><td className={`${tableCellClass} sticky right-0 bg-white shadow-[-8px_0_16px_-16px_rgba(15,23,42,.7)] group-hover:bg-orange-50/30`}><div className="flex justify-end gap-2"><Button variant="ghost" className="h-9 px-3 text-xs" onClick={() => setViewing(transaction)}><Eye size={14} /> View</Button>{canReview && transaction.status === "PENDING" && <><Button className="h-9 px-3 text-xs" onClick={() => review(transaction, "APPROVED")}>Approve</Button><Button variant="danger" className="h-9 px-3 text-xs" onClick={() => review(transaction, "REJECTED")}>Reject</Button></>}</div></td></tr>)}{!transactions.length && <tr><td colSpan={6} className="px-6 py-12 text-center text-sm font-bold text-slate-400">No withdrawal requests match the current search.</td></tr>}</tbody></table></div></Card>{viewing && <Modal title="Withdrawal request details" onClose={() => setViewing(null)}><div className="grid gap-3"><StaffDetail label="Code" value={viewing.requestNumber} /><StaffDetail label="User" value={`${viewing.user?.displayName || "Unknown"} · @${viewing.user?.username || "—"}`} /><StaffDetail label="Amount" value={money(viewing.amount)} /><StaffDetail label="Bank" value={viewing.withdrawalBankName || "Not provided"} /><StaffDetail label="Account holder" value={viewing.withdrawalAccountName || "Not provided"} /><StaffDetail label="Account number" value={viewing.withdrawalAccountNumber || "Not provided"} /><StaffDetail label="Submitted" value={dateTime(viewing.createdAt)} /><StaffDetail label="Status" value={viewing.status} /></div><div className="mt-6 flex flex-wrap justify-end gap-2"><Button variant="ghost" onClick={() => setViewing(null)}>Close</Button>{canReview && viewing.status === "PENDING" && <><Button onClick={() => review(viewing, "APPROVED")}>Approve</Button><Button variant="danger" onClick={() => review(viewing, "REJECTED")}>Reject</Button></>}</div></Modal>}</>;
}

type BannerDraft = {
  code: string;
  title: string;
  altText: string;
  imageUrl: string;
  sortOrder: string;
  active: boolean;
};

const emptyBannerDraft: BannerDraft = { code: "", title: "", altText: "", imageUrl: "", sortOrder: "1", active: true };

function bannerDraftFromRecord(banner: CatalogBanner): BannerDraft {
  return { code: banner.code, title: banner.title, altText: banner.altText, imageUrl: banner.imageUrl, sortOrder: String(banner.sortOrder), active: banner.active };
}

function BannerManager({ banners, perform }: { banners: CatalogBanner[]; perform: (path: string, body: unknown, success: string, method?: string) => Promise<boolean> }) {
  const [viewing, setViewing] = useState<CatalogBanner | null>(null);
  const [editing, setEditing] = useState<{ mode: "create" | "edit"; banner?: CatalogBanner; draft: BannerDraft } | null>(null);
  const [deleting, setDeleting] = useState<CatalogBanner | null>(null);
  const [busy, setBusy] = useState(false);
  const draft = editing?.draft;

  const updateDraft = <Key extends keyof BannerDraft>(key: Key, value: BannerDraft[Key]) => {
    setEditing((current) => current ? { ...current, draft: { ...current.draft, [key]: value } } : current);
  };
  const beginEdit = (banner: CatalogBanner) => { setViewing(null); setEditing({ mode: "edit", banner, draft: bannerDraftFromRecord(banner) }); };
  const save = async () => {
    if (!editing) return;
    setBusy(true);
    const created = editing.mode === "create";
    const succeeded = await perform(
      created ? "/admin/catalog-banners" : `/admin/catalog-banners/${editing.banner!.id}`,
      { ...editing.draft, code: editing.draft.code.trim().toUpperCase(), sortOrder: Number(editing.draft.sortOrder) },
      created ? "Banner added successfully." : "Banner updated successfully.",
      created ? "POST" : "PATCH",
    );
    setBusy(false);
    if (succeeded) setEditing(null);
  };
  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    const succeeded = await perform(`/admin/catalog-banners/${deleting.id}`, {}, "Banner deleted successfully.", "DELETE");
    setBusy(false);
    if (succeeded) setDeleting(null);
  };
  const valid = Boolean(draft?.code.trim() && draft.title.trim() && draft.altText.trim() && draft.imageUrl.trim() && Number(draft.sortOrder) >= 0);

  return <>
    <div className="mt-6 flex flex-col gap-4 rounded-3xl border border-orange-100 bg-gradient-to-br from-white to-orange-50/60 p-4 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-5"><div><p className="text-xs font-black uppercase tracking-[.15em] text-shopee-500">Promotion banners</p><h2 className="mt-1 text-xl font-black text-slate-900">Customer carousel</h2><p className="mt-1 text-sm font-semibold text-slate-500">{banners.length} banners · Order, artwork, and visibility are controlled here.</p></div><Button onClick={() => setEditing({ mode: "create", draft: { ...emptyBannerDraft, sortOrder: String(banners.length + 1) } })}><Plus size={18} /> Add banner</Button></div>

    {banners.length ? <div className="mt-5 grid gap-4 lg:grid-cols-2">{banners.map((banner) => <Card key={banner.id} className="overflow-hidden"><button type="button" className="group relative block aspect-[15/6] w-full overflow-hidden bg-slate-900" onClick={() => setViewing(banner)} aria-label={`View ${banner.title}`}><img src={banner.imageUrl} alt={banner.altText} className="h-full w-full object-contain transition duration-500 group-hover:scale-[1.02]" /></button><div className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-wide text-shopee-500">{banner.code} · Position {banner.sortOrder}</p><h3 className="mt-1 truncate font-black text-slate-900">{banner.title}</h3></div><StatusPill status={banner.active ? "ACTIVE" : "INACTIVE"} /></div><div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4"><Button variant="ghost" className="h-10 px-2 text-xs" onClick={() => setViewing(banner)}><Eye size={15} /> View</Button><Button variant="secondary" className="h-10 px-2 text-xs" onClick={() => beginEdit(banner)}><Pencil size={15} /> Edit</Button><Button variant="danger" className="h-10 px-2 text-xs" onClick={() => setDeleting(banner)}><Trash2 size={15} /> Delete</Button></div></div></Card>)}</div> : <Card className="mt-5 grid place-items-center p-10 text-center"><ShoppingBag size={32} className="text-shopee-500" /><h2 className="mt-4 text-xl font-black">No banners found</h2><Button className="mt-5" onClick={() => setEditing({ mode: "create", draft: { ...emptyBannerDraft } })}><Plus size={18} /> Add banner</Button></Card>}

    {viewing && <Modal title="Banner details" onClose={() => setViewing(null)} wide><div className="overflow-hidden rounded-3xl bg-slate-900"><img src={viewing.imageUrl} alt={viewing.altText} className="aspect-[15/6] w-full object-contain" /></div><div className="mt-5 flex flex-wrap gap-2"><StatusPill status={viewing.active ? "ACTIVE" : "INACTIVE"} /><span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase text-slate-500">Position {viewing.sortOrder}</span></div><h3 className="mt-4 text-2xl font-black">{viewing.title}</h3><p className="mt-2 text-sm font-semibold text-slate-500">{viewing.altText}</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><ProductDetail label="Banner code" value={viewing.code} /><ProductDetail label="Image path" value={viewing.imageUrl} /></div><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button variant="ghost" onClick={() => setViewing(null)}>Close</Button><Button onClick={() => beginEdit(viewing)}><Pencil size={17} /> Edit banner</Button></div></Modal>}

    {editing && draft && <Modal title={editing.mode === "create" ? "Add carousel banner" : "Edit carousel banner"} onClose={() => !busy && setEditing(null)} wide><form onSubmit={(event) => { event.preventDefault(); save(); }}><div className="grid gap-4 sm:grid-cols-2"><Field label="Banner code"><input required maxLength={40} className={inputClass} value={draft.code} onChange={(event) => updateDraft("code", event.target.value.toUpperCase())} placeholder="BANNER-012" /></Field><Field label="Display order"><input required type="number" min="0" max="10000" step="1" className={inputClass} value={draft.sortOrder} onChange={(event) => updateDraft("sortOrder", event.target.value)} /></Field><div className="sm:col-span-2"><Field label="Internal title"><input required maxLength={160} className={inputClass} value={draft.title} onChange={(event) => updateDraft("title", event.target.value)} placeholder="Campaign name" /></Field></div><div className="sm:col-span-2"><Field label="Image description" hint="Used by screen readers; it is not printed over the banner."><input required maxLength={240} className={inputClass} value={draft.altText} onChange={(event) => updateDraft("altText", event.target.value)} placeholder="Describe the promotion artwork" /></Field></div><div className="sm:col-span-2"><Field label="Image URL or asset path" hint="Use https://... or an existing /assets/... path."><input required maxLength={2000} className={inputClass} value={draft.imageUrl} onChange={(event) => updateDraft("imageUrl", event.target.value)} placeholder="/assets/catalog-banners/banner.jpg" /></Field></div></div>{draft.imageUrl && <div className="mt-4 overflow-hidden rounded-2xl bg-slate-900"><img src={draft.imageUrl} alt="Banner preview" className="aspect-[15/6] w-full object-contain" /></div>}<label className="mt-5 flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"><span><span className="block text-sm font-black text-slate-800">Active banner</span><span className="mt-1 block text-xs font-semibold text-slate-400">Only active banners appear in the customer carousel.</span></span><input type="checkbox" checked={draft.active} onChange={(event) => updateDraft("active", event.target.checked)} className="h-5 w-5 accent-[#ee4d2d]" /></label><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="ghost" disabled={busy} onClick={() => setEditing(null)}>Cancel</Button><Button type="submit" loading={busy} disabled={!valid}>{editing.mode === "create" ? <><Plus size={17} /> Add banner</> : <><Check size={17} /> Save changes</>}</Button></div></form></Modal>}

    {deleting && <Modal title="Delete carousel banner?" onClose={() => !busy && setDeleting(null)}><div className="flex gap-4 rounded-3xl border border-rose-200 bg-rose-50 p-4"><AlertTriangle className="shrink-0 text-rose-600" /><div><p className="font-black text-rose-900">{deleting.title}</p><p className="mt-1 text-sm font-semibold text-rose-700">This artwork will be removed from the carousel.</p></div></div><div className="mt-6 flex justify-end gap-3"><Button variant="ghost" disabled={busy} onClick={() => setDeleting(null)}>Cancel</Button><Button variant="danger" loading={busy} onClick={remove}><Trash2 size={17} /> Delete permanently</Button></div></Modal>}
  </>;
}

type CatalogDraft = {
  code: string;
  name: string;
  description: string;
  price: string;
  category: string;
  imageUrl: string;
  active: boolean;
};

const emptyCatalogDraft: CatalogDraft = {
  code: "",
  name: "",
  description: "",
  price: "",
  category: "",
  imageUrl: "",
  active: true,
};

function draftFromCatalogProduct(product: CatalogProduct): CatalogDraft {
  return {
    code: product.code,
    name: product.name,
    description: product.description || "",
    price: String(product.price),
    category: product.category,
    imageUrl: product.imageUrl,
    active: product.active,
  };
}

function Catalog({ products, banners, perform }: { products: CatalogProduct[]; banners: CatalogBanner[]; perform: (path: string, body: unknown, success: string, method?: string) => Promise<boolean> }) {
  const [viewing, setViewing] = useState<CatalogProduct | null>(null);
  const [editing, setEditing] = useState<{ mode: "create" | "edit"; product?: CatalogProduct; draft: CatalogDraft } | null>(null);
  const [deleting, setDeleting] = useState<CatalogProduct | null>(null);
  const [busy, setBusy] = useState(false);

  const beginEdit = (product: CatalogProduct) => {
    setViewing(null);
    setEditing({ mode: "edit", product, draft: draftFromCatalogProduct(product) });
  };

  const updateDraft = <Key extends keyof CatalogDraft>(key: Key, value: CatalogDraft[Key]) => {
    setEditing((current) => current ? { ...current, draft: { ...current.draft, [key]: value } } : current);
  };

  const saveCatalogProduct = async () => {
    if (!editing) return;
    setBusy(true);
    const payload = {
      ...editing.draft,
      code: editing.draft.code.trim().toUpperCase(),
      price: Number(editing.draft.price),
    };
    const created = editing.mode === "create";
    const succeeded = await perform(
      created ? "/admin/catalog-products" : `/admin/catalog-products/${editing.product!.id}`,
      payload,
      created ? "Catalog product added successfully." : "Catalog product updated successfully.",
      created ? "POST" : "PATCH",
    );
    setBusy(false);
    if (succeeded) setEditing(null);
  };

  const deleteCatalogProduct = async () => {
    if (!deleting) return;
    setBusy(true);
    const succeeded = await perform(`/admin/catalog-products/${deleting.id}`, {}, "Catalog product deleted successfully.", "DELETE");
    setBusy(false);
    if (succeeded) setDeleting(null);
  };

  const draft = editing?.draft;
  const draftIsValid = Boolean(
    draft?.code.trim()
    && draft.name.trim()
    && draft.category.trim()
    && draft.imageUrl.trim()
    && Number(draft.price) > 0,
  );

  return <>
    <BannerManager banners={banners} perform={perform} />
    <div className="mt-8 flex flex-col gap-4 rounded-3xl border border-orange-100 bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-5"><div><p className="text-xs font-black uppercase tracking-[.15em] text-shopee-500">Product gallery</p><h2 className="mt-1 text-xl font-black text-slate-900">Storefront images</h2><p className="mt-1 text-sm font-semibold text-slate-500">{products.length} products · Customer galleries follow price order automatically.</p></div><Button onClick={() => setEditing({ mode: "create", draft: { ...emptyCatalogDraft } })}><Plus size={18} /> Add product</Button></div>

    {products.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{products.map((product) => <Card key={product.id} className="group overflow-hidden"><button type="button" onClick={() => setViewing(product)} className="relative block aspect-[16/10] w-full overflow-hidden bg-slate-100 text-left" aria-label={`View ${product.name}`}><PackagePlus className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-300" size={34} /><img src={product.imageUrl} alt={product.name} className="relative h-full w-full object-cover transition duration-500 group-hover:scale-105" onError={(event) => event.currentTarget.classList.add("hidden")} /></button><div className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-wide text-shopee-500">{product.category} · {product.code}</p><h3 className="mt-1 truncate font-black">{product.name}</h3></div><StatusPill status={product.active ? "ACTIVE" : "INACTIVE"} /></div><div className="mt-4 text-sm"><span className="font-black text-shopee-500">{money(product.price)}</span></div><div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4"><Button variant="ghost" className="h-10 px-2 text-xs" onClick={() => setViewing(product)}><Eye size={15} /> View</Button><Button variant="secondary" className="h-10 px-2 text-xs" onClick={() => beginEdit(product)}><Pencil size={15} /> Edit</Button><Button variant="danger" className="h-10 px-2 text-xs" onClick={() => setDeleting(product)}><Trash2 size={15} /> Delete</Button></div></div></Card>)}</div> : <Card className="mt-5 grid place-items-center p-10 text-center"><span className="grid h-16 w-16 place-items-center rounded-3xl bg-shopee-50 text-shopee-500"><PackagePlus size={30} /></span><h2 className="mt-5 text-xl font-black">No catalog products found</h2><p className="mt-2 text-sm font-semibold text-slate-500">Add a product or clear the catalog search.</p><Button className="mt-5" onClick={() => setEditing({ mode: "create", draft: { ...emptyCatalogDraft } })}><Plus size={18} /> Add product</Button></Card>}

    {viewing && <Modal title="Catalog product details" onClose={() => setViewing(null)} wide><div className="overflow-hidden rounded-3xl bg-slate-100"><img src={viewing.imageUrl} alt={viewing.name} className="aspect-[16/8] w-full object-cover" /></div><div className="mt-5 flex flex-wrap items-center gap-2"><StatusPill status={viewing.active ? "ACTIVE" : "INACTIVE"} /><span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-slate-500">{viewing.category}</span></div><h3 className="mt-4 text-2xl font-black text-slate-900">{viewing.name}</h3><p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{viewing.description || "No product description has been added."}</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><ProductDetail label="Price" value={money(viewing.price)} /><ProductDetail label="Product code" value={viewing.code} /></div><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button variant="ghost" onClick={() => setViewing(null)}>Close</Button><Button onClick={() => beginEdit(viewing)}><Pencil size={17} /> Edit product</Button></div></Modal>}

    {editing && draft && <Modal title={editing.mode === "create" ? "Add catalog product" : "Edit catalog product"} onClose={() => !busy && setEditing(null)} wide><form onSubmit={(event) => { event.preventDefault(); saveCatalogProduct(); }}><div className="grid gap-4 sm:grid-cols-2"><Field label="Product code" hint="Unique code using letters, numbers, dots, dashes, or underscores."><input required maxLength={40} className={inputClass} value={draft.code} onChange={(event) => updateDraft("code", event.target.value.toUpperCase())} placeholder="CAT-ITEM-01" /></Field><Field label="Category"><input required maxLength={80} className={inputClass} value={draft.category} onChange={(event) => updateDraft("category", event.target.value)} placeholder="Electronics" /></Field><div className="sm:col-span-2"><Field label="Product name"><input required maxLength={180} className={inputClass} value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} placeholder="Product name" /></Field></div><div className="sm:col-span-2"><Field label="Description" hint="Optional storefront product details."><textarea maxLength={5000} className={`${inputClass} min-h-24 resize-y py-3`} value={draft.description} onChange={(event) => updateDraft("description", event.target.value)} placeholder="Add a short product description" /></Field></div><Field label="Price (IDR)"><input required min="1" max="1000000000000" step="1" type="number" className={inputClass} value={draft.price} onChange={(event) => updateDraft("price", event.target.value)} placeholder="189000" /></Field><div className="sm:col-span-2"><Field label="Image URL or asset path" hint="Use https://... or an existing /assets/... path."><input required maxLength={2000} className={inputClass} value={draft.imageUrl} onChange={(event) => updateDraft("imageUrl", event.target.value)} placeholder="https://images.unsplash.com/..." /></Field></div></div>{draft.imageUrl && <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"><img src={draft.imageUrl} alt="Product preview" className="h-40 w-full object-cover" /></div>}<label className="mt-5 flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"><span><span className="block text-sm font-black text-slate-800">Active product</span><span className="mt-1 block text-xs font-semibold text-slate-400">Active products appear in the customer product galleries.</span></span><input type="checkbox" checked={draft.active} onChange={(event) => updateDraft("active", event.target.checked)} className="h-5 w-5 accent-[#ee4d2d]" /></label><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="ghost" disabled={busy} onClick={() => setEditing(null)}>Cancel</Button><Button type="submit" loading={busy} disabled={!draftIsValid}>{editing.mode === "create" ? <><Plus size={17} /> Add product</> : <><Check size={17} /> Save changes</>}</Button></div></form></Modal>}

    {deleting && <Modal title="Delete catalog product?" onClose={() => !busy && setDeleting(null)}><div className="flex gap-4 rounded-3xl border border-rose-200 bg-rose-50 p-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-rose-600"><AlertTriangle size={23} /></span><div><p className="font-black text-rose-900">{deleting.name}</p><p className="mt-1 text-sm font-semibold leading-6 text-rose-700">This removes the item from the customer product galleries.</p></div></div><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button variant="ghost" disabled={busy} onClick={() => setDeleting(null)}>Cancel</Button><Button variant="danger" loading={busy} onClick={deleteCatalogProduct}><Trash2 size={17} /> Delete permanently</Button></div></Modal>}
  </>;
}

function ProductDetail({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-slate-50 p-3"><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 truncate text-sm font-black text-slate-900">{value}</p></div>;
}
type StaffDraft = {
  displayName: string;
  username: string;
  phone: string;
  role: "ADMIN" | "EMPLOYEE";
  adminCode: string;
  invitationCode: string;
  registrationBonus: string;
  password: string;
};

function randomStaffCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function newStaffDraft(): StaffDraft {
  return {
    displayName: "",
    username: "",
    phone: "",
    role: "ADMIN",
    adminCode: randomStaffCode(),
    invitationCode: randomStaffCode(),
    registrationBonus: "150000",
    password: "",
  };
}

function staffDraftFromUser(staffMember: User): StaffDraft {
  return {
    displayName: staffMember.displayName,
    username: staffMember.username,
    phone: staffMember.phone || "",
    role: staffMember.role === "EMPLOYEE" ? "EMPLOYEE" : "ADMIN",
    adminCode: staffMember.adminCode || "",
    invitationCode: staffMember.invitationCode || "",
    registrationBonus: String(staffMember.registrationBonus || 0),
    password: "",
  };
}

function StaffForm({ draft, mode, onChange }: { draft: StaffDraft; mode: "create" | "edit"; onChange: <Key extends keyof StaffDraft>(key: Key, value: StaffDraft[Key]) => void }) {
  return <div className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><Field label="Full name"><input autoFocus required maxLength={100} className={inputClass} value={draft.displayName} onChange={(event) => onChange("displayName", event.target.value)} placeholder="Administrator's full name" /></Field></div><Field label="Username" hint="Used to sign in at /admin."><input required minLength={3} maxLength={64} pattern="[a-zA-Z0-9._-]+" autoComplete="off" className={inputClass} value={draft.username} onChange={(event) => onChange("username", event.target.value.toLowerCase())} placeholder="admin.name" /></Field><Field label="Phone number" hint="Optional; must be unique when supplied."><input type="tel" minLength={8} maxLength={32} autoComplete="off" className={inputClass} value={draft.phone} onChange={(event) => onChange("phone", event.target.value)} placeholder="0812 3456 7890" /></Field><Field label="Account role"><select className={inputClass} value={draft.role} onChange={(event) => onChange("role", event.target.value as StaffDraft["role"])}><option value="ADMIN">Administrator</option><option value="EMPLOYEE">Employee</option></select></Field><Field label={mode === "create" ? "Temporary password" : "New password"} hint={mode === "create" ? "At least 8 characters. Share it securely." : "Leave blank to keep the current password."}><input required={mode === "create"} minLength={8} maxLength={100} type="password" autoComplete="new-password" className={inputClass} value={draft.password} onChange={(event) => onChange("password", event.target.value)} placeholder={mode === "create" ? "Create a secure password" : "Keep current password"} /></Field><Field label="Admin code"><input required minLength={4} maxLength={32} pattern="[a-zA-Z0-9._-]+" className={inputClass} value={draft.adminCode} onChange={(event) => onChange("adminCode", event.target.value.toUpperCase())} /></Field><Field label="Invitation code"><input required minLength={4} maxLength={32} pattern="[a-zA-Z0-9._-]+" className={inputClass} value={draft.invitationCode} onChange={(event) => onChange("invitationCode", event.target.value.toUpperCase())} /></Field><div className="sm:col-span-2"><Field label="Registration bonus (IDR)" hint="Bonus assigned to customers who register with this invitation code."><input required type="number" min="0" max="1000000000" step="1" className={inputClass} value={draft.registrationBonus} onChange={(event) => onChange("registrationBonus", event.target.value)} /></Field></div></div>;
}

function Staff({ staff, perform }: { staff: User[]; perform: (path: string, body: unknown, success: string, method?: string) => Promise<boolean> }) {
  const [viewing, setViewing] = useState<User | null>(null);
  const [editing, setEditing] = useState<{ mode: "create" | "edit"; staffMember?: User; draft: StaffDraft } | null>(null);
  const [statusTarget, setStatusTarget] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);
  const activeCount = staff.filter((item) => item.isActive !== false).length;

  const updateDraft = <Key extends keyof StaffDraft>(key: Key, value: StaffDraft[Key]) => {
    setEditing((current) => current ? { ...current, draft: { ...current.draft, [key]: value } } : current);
  };

  const saveStaff = async () => {
    if (!editing) return;
    setBusy(true);
    const creating = editing.mode === "create";
    const succeeded = await perform(
      creating ? "/admin/staff" : `/admin/staff/${editing.staffMember!.id}`,
      { ...editing.draft, phone: editing.draft.phone.trim(), registrationBonus: Number(editing.draft.registrationBonus) },
      creating ? "Administrator account created successfully." : "Administrator account updated successfully.",
      creating ? "POST" : "PATCH",
    );
    setBusy(false);
    if (succeeded) setEditing(null);
  };

  const changeStatus = async () => {
    if (!statusTarget) return;
    const nextActive = statusTarget.isActive === false;
    setBusy(true);
    const succeeded = await perform(
      `/admin/staff/${statusTarget.id}/status`,
      { active: nextActive },
      nextActive ? "Administrator account reactivated." : "Administrator account deactivated.",
      "PATCH",
    );
    setBusy(false);
    if (succeeded) { setStatusTarget(null); setViewing(null); }
  };

  const draft = editing?.draft;
  const draftIsValid = Boolean(
    draft?.displayName.trim()
    && draft.username.trim().length >= 3
    && draft.adminCode.trim().length >= 4
    && draft.invitationCode.trim().length >= 4
    && Number(draft.registrationBonus) >= 0
    && (editing?.mode === "edit" || draft.password.length >= 8),
  );

  return <><div className="mt-6 flex flex-col gap-4 rounded-3xl border border-orange-100 bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-5"><div><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-black uppercase tracking-[.15em] text-shopee-500">Team access</p><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700">{activeCount} active</span></div><p className="mt-2 text-sm font-semibold text-slate-500">Create administrator access and manage every team account from one place.</p></div><Button onClick={() => setEditing({ mode: "create", draft: newStaffDraft() })}><UserPlus size={18} /> Add admin</Button></div>

    {staff.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{staff.map((item) => { const protectedAccount = item.role === "SUPER_ADMIN"; const active = item.isActive !== false; return <Card key={item.id} className={`overflow-hidden p-5 ${active ? "" : "border-rose-200 bg-rose-50/30"}`}><div className="flex items-start gap-3"><div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl font-black text-white ${active ? "bg-slate-900" : "bg-slate-400"}`}>{item.displayName.slice(0, 2).toUpperCase()}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-black">{item.displayName}</p><span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${active ? "bg-emerald-50 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{active ? "Active" : "Inactive"}</span></div><p className="mt-1 text-xs font-black uppercase text-shopee-500">{item.role.replace("_", " ")}</p><p className="mt-1 truncate text-xs font-semibold text-slate-400">@{item.username}</p></div></div><div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-3 text-xs"><div><p className="font-bold text-slate-400">Admin code</p><p className="mt-1 font-black">{item.adminCode || "-"}</p></div><div><p className="font-bold text-slate-400">Invitation</p><p className="mt-1 font-black">{item.invitationCode || "-"}</p></div></div>{protectedAccount && <div className="mt-3 flex items-center gap-2 rounded-2xl bg-sky-50 px-3 py-2 text-xs font-black text-sky-700"><ShieldCheck size={16} /> Protected Super Admin account</div>}<div className={`mt-4 grid gap-2 border-t border-slate-100 pt-4 ${protectedAccount ? "grid-cols-1" : "grid-cols-3"}`}><Button variant="ghost" className="h-10 px-2 text-xs" onClick={() => setViewing(item)}><Eye size={15} /> View</Button>{!protectedAccount && <><Button variant="secondary" className="h-10 px-2 text-xs" onClick={() => setEditing({ mode: "edit", staffMember: item, draft: staffDraftFromUser(item) })}><Pencil size={15} /> Edit</Button><Button variant={active ? "danger" : "ghost"} className="h-10 px-2 text-xs" onClick={() => setStatusTarget(item)}><Power size={15} /> {active ? "Deactivate" : "Activate"}</Button></>}</div></Card>; })}</div> : <Card className="mt-5 grid place-items-center p-10 text-center"><span className="grid h-16 w-16 place-items-center rounded-3xl bg-shopee-50 text-shopee-500"><UserCog size={30} /></span><h2 className="mt-5 text-xl font-black">No administrators found</h2><p className="mt-2 text-sm font-semibold text-slate-500">Create an administrator or clear the current search.</p><Button className="mt-5" onClick={() => setEditing({ mode: "create", draft: newStaffDraft() })}><UserPlus size={18} /> Add admin</Button></Card>}

    {viewing && <Modal title="Administrator details" onClose={() => setViewing(null)} wide><div className="flex flex-col gap-4 rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 p-5 text-white sm:flex-row sm:items-center"><div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/10 text-xl font-black">{viewing.displayName.slice(0, 2).toUpperCase()}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-xl font-black">{viewing.displayName}</h3><span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${viewing.isActive !== false ? "bg-emerald-400/15 text-emerald-300" : "bg-rose-400/15 text-rose-300"}`}>{viewing.isActive !== false ? "Active" : "Inactive"}</span></div><p className="mt-1 text-sm font-semibold text-slate-300">@{viewing.username} · {viewing.role.replace("_", " ")}</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><StaffDetail label="Phone number" value={viewing.phone || "Not provided"} /><StaffDetail label="Registration bonus" value={money(viewing.registrationBonus)} /><StaffDetail label="Admin code" value={viewing.adminCode || "-"} /><StaffDetail label="Invitation code" value={viewing.invitationCode || "-"} /><StaffDetail label="Created" value={viewing.createdAt ? dateTime(viewing.createdAt) : "Not available"} /><StaffDetail label="Last sign-in" value={viewing.lastLoginAt ? dateTime(viewing.lastLoginAt) : "No sign-in recorded"} /></div><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button variant="ghost" onClick={() => setViewing(null)}>Close</Button>{viewing.role !== "SUPER_ADMIN" && <><Button variant="secondary" onClick={() => { const staffMember = viewing; setViewing(null); setEditing({ mode: "edit", staffMember, draft: staffDraftFromUser(staffMember) }); }}><Pencil size={17} /> Edit account</Button><Button variant={viewing.isActive !== false ? "danger" : "ghost"} onClick={() => setStatusTarget(viewing)}><Power size={17} /> {viewing.isActive !== false ? "Deactivate" : "Reactivate"}</Button></>}</div></Modal>}

    {editing && draft && <Modal title={editing.mode === "create" ? "Add administrator" : "Edit administrator"} onClose={() => !busy && setEditing(null)} wide><form onSubmit={(event) => { event.preventDefault(); saveStaff(); }}><div className="mb-5 rounded-2xl border border-orange-100 bg-orange-50 p-4"><p className="text-sm font-black text-orange-900">{editing.mode === "create" ? "Create secure team access" : `Editing ${editing.staffMember?.displayName}`}</p><p className="mt-1 text-xs font-semibold leading-5 text-orange-700">{editing.mode === "create" ? "The account can sign in through the hidden /admin page after creation." : "Leave the password blank unless it needs to be replaced."}</p></div><StaffForm draft={draft} mode={editing.mode} onChange={updateDraft} /><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="ghost" disabled={busy} onClick={() => setEditing(null)}>Cancel</Button><Button type="submit" loading={busy} disabled={!draftIsValid}>{editing.mode === "create" ? <><UserPlus size={17} /> Create administrator</> : <><Check size={17} /> Save changes</>}</Button></div></form></Modal>}

    {statusTarget && <Modal title={statusTarget.isActive === false ? "Reactivate administrator?" : "Deactivate administrator?"} onClose={() => !busy && setStatusTarget(null)}><div className={`flex gap-4 rounded-3xl border p-4 ${statusTarget.isActive === false ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}><span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white ${statusTarget.isActive === false ? "text-emerald-600" : "text-rose-600"}`}><Power size={23} /></span><div><p className={`font-black ${statusTarget.isActive === false ? "text-emerald-900" : "text-rose-900"}`}>{statusTarget.displayName}</p><p className={`mt-1 text-sm font-semibold leading-6 ${statusTarget.isActive === false ? "text-emerald-700" : "text-rose-700"}`}>{statusTarget.isActive === false ? "This restores administrator sign-in and access immediately." : "This blocks new sign-ins and stops any existing admin session on its next API request. Records and activity history are preserved."}</p></div></div><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button variant="ghost" disabled={busy} onClick={() => setStatusTarget(null)}>Cancel</Button><Button variant={statusTarget.isActive === false ? "primary" : "danger"} loading={busy} onClick={changeStatus}><Power size={17} /> {statusTarget.isActive === false ? "Reactivate account" : "Deactivate account"}</Button></div></Modal>}
  </>;
}

function StaffDetail({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 break-words text-sm font-black text-slate-900">{value}</p></div>;
}

function Metric({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) { const colors: Record<string, string> = { orange: "bg-shopee-50 text-shopee-500", green: "bg-emerald-50 text-emerald-600", blue: "bg-sky-50 text-sky-600", purple: "bg-violet-50 text-violet-600" }; return <Card className="p-5"><div className={`grid h-11 w-11 place-items-center rounded-2xl ${colors[tone]}`}>{icon}</div><p className="mt-5 text-2xl font-black tracking-tight">{value}</p><p className="mt-1 text-xs font-black uppercase tracking-wide text-slate-400">{label}</p></Card>; }
function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) { return <div className="border-b border-slate-100 p-5"><h2 className="font-black">{title}</h2><p className="mt-1 text-xs font-semibold text-slate-400">{subtitle}</p></div>; }
function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onCloseRef.current(); };
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.removeEventListener("keydown", closeOnEscape); document.body.style.overflow = previousOverflow; previousFocus?.focus(); };
  }, []);
  return <div className="fixed inset-0 z-[70] grid place-items-end bg-slate-950/55 p-3 sm:place-items-center"><div ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className={`max-h-[calc(100vh-1.5rem)] w-full overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl outline-none sm:p-6 ${wide ? "max-w-2xl" : "max-w-md"}`}><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-black">{title}</h2><button type="button" onClick={onClose} aria-label="Close dialog" className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100"><X size={18} /></button></div>{children}</div></div>;
}
