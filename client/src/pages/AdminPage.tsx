import { AlertTriangle, BadgeDollarSign, Banknote, Boxes, Check, ChevronRight, ClipboardList, ExternalLink, Eye, LayoutDashboard, LockKeyhole, LogOut, Menu, PackageCheck, PackagePlus, Pencil, Plus, RefreshCw, Search, ShieldCheck, ShoppingBag, Trash2, UserCog, Users, WalletCards, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Brand } from "../components/Brand";
import { Button, Card, Field, inputClass, Notice, StatusPill } from "../components/Ui";
import { api, dateTime, money } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { Bank, CatalogProduct, Order, Product, Transaction, User } from "../types";

type AdminData = { members: User[]; transactions: Transaction[]; orders: Order[]; taskProducts: Product[]; catalogProducts: CatalogProduct[]; banks: Bank[]; staff: User[] };
type Tab = "overview" | "members" | "tasks" | "finance" | "catalog" | "staff";
const tabs: Array<{ key: Tab; label: string; icon: typeof LayoutDashboard; superOnly?: boolean }> = [
  { key: "overview", label: "Overview", icon: LayoutDashboard }, { key: "members", label: "Members", icon: Users }, { key: "tasks", label: "Tasks & Orders", icon: ClipboardList }, { key: "finance", label: "Finance", icon: WalletCards }, { key: "catalog", label: "Catalog", icon: Boxes, superOnly: true }, { key: "staff", label: "Admin Team", icon: UserCog, superOnly: true },
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
  const filteredTransactions = useMemo(() => data?.transactions.filter((transaction) => `${transaction.requestNumber} ${transaction.user?.displayName} ${transaction.type}`.toLowerCase().includes(query.toLowerCase())) ?? [], [data?.transactions, query]);
  const filteredCatalogProducts = useMemo(() => data?.catalogProducts.filter((product) => `${product.code} ${product.name} ${product.category}`.toLowerCase().includes(query.toLowerCase())) ?? [], [data?.catalogProducts, query]);

  const pendingTopups = data?.transactions.filter((item) => item.type === "TOPUP" && item.status === "PENDING").length ?? 0;
  const pendingWithdrawals = data?.transactions.filter((item) => item.type === "WITHDRAWAL" && item.status === "PENDING").length ?? 0;
  const pendingTasks = data?.orders.filter((item) => item.status === "WAITING_ASSIGNMENT").length ?? 0;
  const totalBalance = data?.members.reduce((sum, member) => sum + member.balance, 0) ?? 0;

  return <div className="min-h-screen bg-[#f4f5f7] text-slate-900"><header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur"><div className="flex h-16 items-center gap-3 px-4 lg:px-6"><button aria-label="Open navigation" className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 lg:hidden" onClick={() => setMenuOpen(true)}><Menu /></button><Brand compact /><div className="relative ml-auto hidden w-full max-w-md md:block"><Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-semibold outline-none focus:border-shopee-300" placeholder="Search members, orders, and transactions" /></div><div className="ml-auto flex items-center gap-3 md:ml-0"><div className="hidden text-right sm:block"><p className="text-sm font-black">{user?.displayName}</p><p className="text-[10px] font-black uppercase tracking-wide text-shopee-500">{user?.role.replace("_", " ")}</p></div><button aria-label="Sign out" onClick={async () => { await logout("admin"); navigate("/admin"); }} className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600"><LogOut size={18} /></button></div></div></header>
    <div className="flex"><aside className={`${menuOpen ? "fixed inset-0 z-50 flex" : "hidden"} w-full bg-slate-950/50 lg:sticky lg:top-16 lg:flex lg:h-[calc(100vh-4rem)] lg:w-64 lg:bg-transparent`}><div className="h-full w-72 bg-slate-950 p-4 text-white lg:w-full"><div className="mb-5 flex items-center justify-between lg:hidden"><Brand inverse compact /><button aria-label="Close navigation" onClick={() => setMenuOpen(false)}><X /></button></div><nav className="grid gap-1.5">{visibleTabs.map(({ key, label, icon: Icon }) => <button key={key} onClick={() => { setTab(key); setMenuOpen(false); }} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition ${tab === key ? "bg-gradient-to-r from-shopee-500 to-orange-500 text-white shadow-lg" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}><Icon size={19} />{label}<ChevronRight size={15} className="ml-auto opacity-40" /></button>)}</nav><div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-[10px] font-black uppercase tracking-[.16em] text-slate-500">Invitation code</p><p className="mt-2 text-xl font-black text-white">{user?.invitationCode || "-"}</p><p className="mt-1 text-xs font-semibold text-slate-500">Bonus {money(user?.registrationBonus ?? 0)}</p></div></div><button aria-label="Close navigation overlay" className="flex-1 lg:hidden" onClick={() => setMenuOpen(false)} /></aside>
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-7xl"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.18em] text-shopee-500">Admin command center</p><h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{visibleTabs.find((item) => item.key === tab)?.label}</h1></div><Button variant="ghost" loading={refreshing} onClick={load}><RefreshCw size={17} /> Refresh data</Button></div>{message && <div className="mt-5"><Notice message={message} tone={tone} onClose={() => setMessage("")} /></div>}
        <div className="relative mt-5 md:hidden"><Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} className={`${inputClass} pl-10`} placeholder="Search data" /></div>
        {tab === "overview" && <Overview members={data?.members.length ?? 0} totalBalance={totalBalance} pendingTopups={pendingTopups} pendingWithdrawals={pendingWithdrawals} pendingTasks={pendingTasks} transactions={data?.transactions ?? []} orders={data?.orders ?? []} />}
        {tab === "members" && <Members members={filteredMembers} canManage={user?.role === "SUPER_ADMIN"} perform={perform} />}
        {tab === "tasks" && <Tasks orders={filteredOrders} products={data?.taskProducts ?? []} perform={perform} />}
        {tab === "finance" && <Finance transactions={filteredTransactions} canReview={user?.role === "SUPER_ADMIN"} perform={perform} />}
        {tab === "catalog" && <Catalog products={filteredCatalogProducts} perform={perform} />}
        {tab === "staff" && <Staff staff={data?.staff ?? []} />}
      </div></main>
    </div>
  </div>;
}

function Overview({ members, totalBalance, pendingTopups, pendingWithdrawals, pendingTasks, transactions, orders }: { members: number; totalBalance: number; pendingTopups: number; pendingWithdrawals: number; pendingTasks: number; transactions: Transaction[]; orders: Order[] }) {
  return <><div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={<Users />} label="Total members" value={String(members)} tone="orange" /><Metric icon={<WalletCards />} label="Total balance" value={money(totalBalance)} tone="green" /><Metric icon={<Banknote />} label="Finance requests" value={String(pendingTopups + pendingWithdrawals)} tone="blue" /><Metric icon={<ClipboardList />} label="Tasks awaiting assignment" value={String(pendingTasks)} tone="purple" /></div><div className="mt-5 grid gap-5 xl:grid-cols-2"><Card className="overflow-hidden"><SectionTitle title="Latest requests" subtitle="Top-ups and withdrawals that need attention" /><div className="divide-y divide-slate-100">{transactions.slice(0, 6).map((item) => <div key={item.id} className="flex items-center gap-3 p-4"><span className={`grid h-10 w-10 place-items-center rounded-xl ${item.type === "TOPUP" ? "bg-shopee-50 text-shopee-500" : "bg-sky-50 text-sky-600"}`}>{item.type === "TOPUP" ? <BadgeDollarSign size={19} /> : <Banknote size={19} />}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{item.user?.displayName} · {item.type}</p><p className="text-xs font-semibold text-slate-400">{money(item.amount)}</p></div><StatusPill status={item.status} /></div>)}</div></Card><Card className="overflow-hidden"><SectionTitle title="Task activity" subtitle="Latest customer task statuses" /><div className="divide-y divide-slate-100">{orders.slice(0, 6).map((item) => <div key={item.id} className="flex items-center gap-3 p-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-600"><PackageCheck size={19} /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{item.user?.displayName} · {item.items[0]?.productName || "Waiting for product"}</p><p className="text-xs font-semibold text-slate-400">{item.referenceNumber}</p></div><StatusPill status={item.status} /></div>)}</div></Card></div></>;
}

function Members({ members, canManage, perform }: { members: User[]; canManage: boolean; perform: (path: string, body: unknown, success: string, method?: string) => Promise<boolean> }) {
  const [reward, setReward] = useState<{ user: User; amount: string } | null>(null);
  return <div className="mt-6 grid gap-4">{members.map((member) => <Card key={member.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-shopee-50 font-black text-shopee-500">{member.displayName.slice(0, 2).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate font-black">{member.displayName} <span className="text-xs text-slate-400">@{member.username}</span></p><p className="mt-1 text-xs font-semibold text-slate-500">{member.phone} · {member.referrer?.displayName || "No referrer"}</p></div><div className="grid grid-cols-2 gap-4 sm:text-right"><div><p className="text-[10px] font-black uppercase text-slate-400">Balance</p><p className="font-black text-shopee-500">{money(member.balance)}</p></div><div><p className="text-[10px] font-black uppercase text-slate-400">Tasks</p><p className="font-black">{member.totalOrders}</p></div></div>{canManage && <div className="flex gap-2"><Button variant="secondary" onClick={() => setReward({ user: member, amount: "50000" })}>Bonus</Button><Button variant="ghost" onClick={() => perform(`/admin/members/${member.id}/withdrawal-lock`, { locked: !member.withdrawalLocked, remarks: !member.withdrawalLocked ? "Contact customer support for assistance." : "" }, member.withdrawalLocked ? "Account withdrawals enabled." : "Account withdrawals locked.", "PATCH")}><LockKeyhole size={16} />{member.withdrawalLocked ? "Unlock" : "Lock"}</Button></div>}</Card>)}{reward && <Modal title={`Add a bonus for ${reward.user.displayName}`} onClose={() => setReward(null)}><Field label="Bonus amount"><input className={inputClass} type="number" min="1" value={reward.amount} onChange={(e) => setReward({ ...reward, amount: e.target.value })} /></Field><Button className="mt-4 w-full" onClick={async () => { await perform(`/admin/members/${reward.user.id}/reward`, { amount: Number(reward.amount), note: "Super Admin Bonus" }, "Bonus added successfully."); setReward(null); }}>Add bonus</Button></Modal>}</div>;
}

function Tasks({ orders, products, perform }: { orders: Order[]; products: Product[]; perform: (path: string, body: unknown, success: string) => Promise<boolean> }) {
  const [target, setTarget] = useState<Order | null>(null); const [productId, setProductId] = useState("");
  return <div className="mt-6 grid gap-4">{orders.map((order) => <Card key={order.id} className="p-4 sm:p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-50 text-violet-600"><ShoppingBag /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-black">{order.user?.displayName}</p><StatusPill status={order.status} /></div><p className="mt-1 truncate text-xs font-semibold text-slate-400">{order.referenceNumber} · {dateTime(order.createdAt)}</p><p className="mt-2 text-sm font-bold text-slate-600">{order.items.map((item) => item.productName).join(", ") || "No product yet"}</p></div><div className="grid grid-cols-2 gap-4 lg:text-right"><div><p className="text-[10px] font-black uppercase text-slate-400">Value</p><p className="font-black">{money(order.totalValue)}</p></div><div><p className="text-[10px] font-black uppercase text-slate-400">Commission</p><p className="font-black text-emerald-600">{money(order.commission)}</p></div></div>{["WAITING_ASSIGNMENT", "PRODUCT_ASSIGNED"].includes(order.status) && <Button onClick={() => { setTarget(order); setProductId(order.items[0]?.productId || ""); }}>Assign product</Button>}</div></Card>)}{target && <Modal title="Assign task product" onClose={() => setTarget(null)}><Field label="Select product"><select className={inputClass} value={productId} onChange={(e) => setProductId(e.target.value)}><option value="">Select product</option>{products.filter((item) => item.active).map((product) => <option key={product.id} value={product.id}>{product.name} · {money(product.commission)}</option>)}</select></Field><Button disabled={!productId} className="mt-4 w-full" onClick={async () => { await perform(`/admin/orders/${target.id}/assign`, { items: [{ productId, quantity: 1 }] }, "Product assigned successfully."); setTarget(null); }}>Save assignment</Button></Modal>}</div>;
}

function Finance({ transactions, canReview, perform }: { transactions: Transaction[]; canReview: boolean; perform: (path: string, body: unknown, success: string) => Promise<boolean> }) {
  return <div className="mt-6 grid gap-4">{transactions.map((transaction) => <Card key={transaction.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"><div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${transaction.type === "TOPUP" ? "bg-shopee-50 text-shopee-500" : transaction.type === "WITHDRAWAL" ? "bg-sky-50 text-sky-600" : "bg-emerald-50 text-emerald-600"}`}>{transaction.type === "TOPUP" ? <BadgeDollarSign /> : transaction.type === "WITHDRAWAL" ? <Banknote /> : <Check />}</div><div className="min-w-0 flex-1"><p className="font-black">{transaction.user?.displayName} · {transaction.type}</p><p className="mt-1 text-xs font-semibold text-slate-400">{transaction.requestNumber} · {dateTime(transaction.createdAt)}</p>{transaction.withdrawalBankName && <p className="mt-1 text-xs font-bold text-slate-500">{transaction.withdrawalBankName} · {transaction.withdrawalAccountNumber}</p>}{transaction.proofPath && <a href={`/api/admin/transactions/${transaction.id}/proof`} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-black text-shopee-500 hover:text-shopee-600">View proof <ExternalLink size={13} /></a>}</div><div><p className="text-lg font-black">{money(transaction.amount)}</p><StatusPill status={transaction.status} /></div>{canReview && transaction.status === "PENDING" && <div className="flex gap-2"><Button onClick={() => perform(`/admin/transactions/${transaction.id}/review`, { status: "APPROVED" }, "Request approved.")}>Approve</Button><Button variant="danger" onClick={() => perform(`/admin/transactions/${transaction.id}/review`, { status: "REJECTED" }, "Request rejected.")}>Reject</Button></div>}</Card>)}</div>;
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

function Catalog({ products, perform }: { products: CatalogProduct[]; perform: (path: string, body: unknown, success: string, method?: string) => Promise<boolean> }) {
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
    <div className="mt-6 flex flex-col gap-4 rounded-3xl border border-orange-100 bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-5"><div><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-black uppercase tracking-[.15em] text-shopee-500">Display catalog</p><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700">Separate from tasks</span></div><p className="mt-2 text-sm font-semibold text-slate-500">{products.length} storefront products · Customer catalogs sort these from lowest to highest price.</p></div><Button onClick={() => setEditing({ mode: "create", draft: { ...emptyCatalogDraft } })}><Plus size={18} /> Add product</Button></div>

    {products.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{products.map((product) => <Card key={product.id} className="group overflow-hidden"><button type="button" onClick={() => setViewing(product)} className="relative block aspect-[16/10] w-full overflow-hidden bg-slate-100 text-left" aria-label={`View ${product.name}`}><PackagePlus className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-300" size={34} /><img src={product.imageUrl} alt={product.name} className="relative h-full w-full object-cover transition duration-500 group-hover:scale-105" onError={(event) => event.currentTarget.classList.add("hidden")} /></button><div className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-wide text-shopee-500">{product.category} · {product.code}</p><h3 className="mt-1 truncate font-black">{product.name}</h3></div><StatusPill status={product.active ? "ACTIVE" : "INACTIVE"} /></div><div className="mt-4 flex items-center justify-between gap-3 text-sm"><span className="font-black text-shopee-500">{money(product.price)}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase text-slate-500">Display only</span></div><div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4"><Button variant="ghost" className="h-10 px-2 text-xs" onClick={() => setViewing(product)}><Eye size={15} /> View</Button><Button variant="secondary" className="h-10 px-2 text-xs" onClick={() => beginEdit(product)}><Pencil size={15} /> Edit</Button><Button variant="danger" className="h-10 px-2 text-xs" onClick={() => setDeleting(product)}><Trash2 size={15} /> Delete</Button></div></div></Card>)}</div> : <Card className="mt-5 grid place-items-center p-10 text-center"><span className="grid h-16 w-16 place-items-center rounded-3xl bg-shopee-50 text-shopee-500"><PackagePlus size={30} /></span><h2 className="mt-5 text-xl font-black">No catalog products found</h2><p className="mt-2 text-sm font-semibold text-slate-500">Add a display product or clear the catalog search.</p><Button className="mt-5" onClick={() => setEditing({ mode: "create", draft: { ...emptyCatalogDraft } })}><Plus size={18} /> Add product</Button></Card>}

    {viewing && <Modal title="Catalog product details" onClose={() => setViewing(null)} wide><div className="overflow-hidden rounded-3xl bg-slate-100"><img src={viewing.imageUrl} alt={viewing.name} className="aspect-[16/8] w-full object-cover" /></div><div className="mt-5 flex flex-wrap items-center gap-2"><StatusPill status={viewing.active ? "ACTIVE" : "INACTIVE"} /><span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-emerald-700">Display only</span><span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-slate-500">{viewing.category}</span></div><h3 className="mt-4 text-2xl font-black text-slate-900">{viewing.name}</h3><p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{viewing.description || "No product description has been added."}</p><div className="mt-5 grid gap-3 sm:grid-cols-3"><ProductDetail label="Price" value={money(viewing.price)} /><ProductDetail label="Product code" value={viewing.code} /><ProductDetail label="Task orders" value="Not connected" /></div><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button variant="ghost" onClick={() => setViewing(null)}>Close</Button><Button onClick={() => beginEdit(viewing)}><Pencil size={17} /> Edit product</Button></div></Modal>}

    {editing && draft && <Modal title={editing.mode === "create" ? "Add catalog product" : "Edit catalog product"} onClose={() => !busy && setEditing(null)} wide><form onSubmit={(event) => { event.preventDefault(); saveCatalogProduct(); }}><div className="grid gap-4 sm:grid-cols-2"><Field label="Product code" hint="Unique code using letters, numbers, dots, dashes, or underscores."><input required maxLength={40} className={inputClass} value={draft.code} onChange={(event) => updateDraft("code", event.target.value.toUpperCase())} placeholder="CAT-ITEM-01" /></Field><Field label="Category"><input required maxLength={80} className={inputClass} value={draft.category} onChange={(event) => updateDraft("category", event.target.value)} placeholder="Electronics" /></Field><div className="sm:col-span-2"><Field label="Product name"><input required maxLength={180} className={inputClass} value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} placeholder="Product name" /></Field></div><div className="sm:col-span-2"><Field label="Description" hint="Optional storefront product details."><textarea maxLength={5000} className={`${inputClass} min-h-24 resize-y py-3`} value={draft.description} onChange={(event) => updateDraft("description", event.target.value)} placeholder="Add a short product description" /></Field></div><Field label="Display price (IDR)"><input required min="1" max="1000000000000" step="1" type="number" className={inputClass} value={draft.price} onChange={(event) => updateDraft("price", event.target.value)} placeholder="189000" /></Field><div className="sm:col-span-2"><Field label="Image URL" hint="Use a complete https:// image address."><input required type="url" pattern="https://.*" maxLength={2000} className={inputClass} value={draft.imageUrl} onChange={(event) => updateDraft("imageUrl", event.target.value)} placeholder="https://images.unsplash.com/..." /></Field></div></div>{draft.imageUrl && <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"><img src={draft.imageUrl} alt="Product preview" className="h-40 w-full object-cover" /></div>}<label className="mt-5 flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"><span><span className="block text-sm font-black text-slate-800">Active product</span><span className="mt-1 block text-xs font-semibold text-slate-400">Active products appear in both customer display catalogs, never in Task Orders.</span></span><input type="checkbox" checked={draft.active} onChange={(event) => updateDraft("active", event.target.checked)} className="h-5 w-5 accent-[#ee4d2d]" /></label><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="ghost" disabled={busy} onClick={() => setEditing(null)}>Cancel</Button><Button type="submit" loading={busy} disabled={!draftIsValid}>{editing.mode === "create" ? <><Plus size={17} /> Add product</> : <><Check size={17} /> Save changes</>}</Button></div></form></Modal>}

    {deleting && <Modal title="Delete catalog product?" onClose={() => !busy && setDeleting(null)}><div className="flex gap-4 rounded-3xl border border-rose-200 bg-rose-50 p-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-rose-600"><AlertTriangle size={23} /></span><div><p className="font-black text-rose-900">{deleting.name}</p><p className="mt-1 text-sm font-semibold leading-6 text-rose-700">This removes the item only from the customer display catalogs. Task products and order history remain unchanged.</p></div></div><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button variant="ghost" disabled={busy} onClick={() => setDeleting(null)}>Cancel</Button><Button variant="danger" loading={busy} onClick={deleteCatalogProduct}><Trash2 size={17} /> Delete permanently</Button></div></Modal>}
  </>;
}

function ProductDetail({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-slate-50 p-3"><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 truncate text-sm font-black text-slate-900">{value}</p></div>;
}
function Staff({ staff }: { staff: User[] }) { return <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{staff.map((item) => <Card key={item.id} className="p-5"><div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-900 font-black text-white">{item.displayName.slice(0, 2).toUpperCase()}</div><div><p className="font-black">{item.displayName}</p><p className="text-xs font-black uppercase text-shopee-500">{item.role.replace("_", " ")}</p></div></div><div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-3 text-xs"><div><p className="font-bold text-slate-400">Admin code</p><p className="mt-1 font-black">{item.adminCode || "-"}</p></div><div><p className="font-bold text-slate-400">Invitation</p><p className="mt-1 font-black">{item.invitationCode || "-"}</p></div></div></Card>)}</div>; }

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
