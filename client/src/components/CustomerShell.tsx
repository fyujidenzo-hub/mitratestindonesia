import { ClipboardList, Headphones, History, Home, LogOut, Search, UserRound, WalletCards, Zap } from "lucide-react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Brand } from "./Brand";
import { useAuth } from "../lib/auth";
import { NotificationBell } from "./NotificationBell";

const desktopNav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/task-center", label: "Task Center", icon: Zap },
  { to: "/orders", label: "Task Orders", icon: ClipboardList },
  { to: "/history", label: "Usage & History", icon: History },
  { to: "/finance", label: "Commission & Balance", icon: WalletCards },
  { to: "/support", label: "Customer Support", icon: Headphones },
  { to: "/profile", label: "My Account", icon: UserRound },
];

const mobileNav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/orders", label: "Tasks", icon: ClipboardList },
  { to: "/support", label: "Support", icon: Headphones },
  { to: "/profile", label: "Profile", icon: UserRound },
];

export function CustomerShell({ children, search, onSearch }: { children: React.ReactNode; search?: string; onSearch?: (value: string) => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#fff8f3] pb-28 text-ink lg:pb-0">
      <header className="sticky top-0 z-50 border-b border-orange-100 bg-white/95 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1500px] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Brand compact />
          {onSearch && <div className="relative ml-auto hidden w-full max-w-xl md:block"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search ?? ""} onChange={(event) => onSearch(event.target.value)} placeholder="Search products and categories" className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-shopee-300 focus:bg-white focus:ring-4 focus:ring-shopee-50" /></div>}
          <div className={`${onSearch ? "" : "ml-auto"} flex items-center gap-2`}>
            <span className="hidden rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 sm:block">🇮🇩 ID</span>
            <Link to="/history" aria-label="Usage and transaction history" className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-slate-600 transition hover:bg-shopee-50 hover:text-shopee-500"><History size={19} /></Link>
            <NotificationBell />
            <Link to="/profile" className="hidden items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-slate-50 sm:flex"><span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-shopee-500 to-orange-400 text-xs font-black text-white">{user?.displayName.slice(0, 2).toUpperCase()}</span><span className="hidden text-left xl:block"><span className="block text-xs font-black text-slate-900">{user?.displayName}</span><span className="block text-[10px] font-bold text-slate-400">Work Account</span></span></Link>
            <button onClick={handleLogout} className="hidden h-10 items-center gap-2 rounded-xl bg-slate-100 px-3 text-xs font-black text-slate-600 transition hover:bg-rose-50 hover:text-rose-600 md:flex"><LogOut size={16} /> Sign out</button>
          </div>
        </div>
        {onSearch && <div className="px-4 pb-3 md:hidden"><div className="relative"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search ?? ""} onChange={(event) => onSearch(event.target.value)} placeholder="Search products and categories" className="h-11 w-full rounded-2xl border border-orange-100 bg-[#fffaf7] pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none" /></div></div>}
      </header>

      <div className="mx-auto max-w-[1500px] lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="sticky top-[72px] hidden h-[calc(100vh-72px)] flex-col border-r border-orange-100 bg-white p-4 lg:flex">
          <nav className="grid gap-1.5">
            {desktopNav.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-black transition ${isActive ? "bg-gradient-to-r from-shopee-50 to-orange-50 text-shopee-600 shadow-sm ring-1 ring-shopee-100" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}><Icon size={19} /><span>{label}</span></NavLink>)}
          </nav>
          <div className="relative mt-auto overflow-hidden rounded-3xl bg-gradient-to-br from-orange-50 via-amber-50 to-shopee-50 p-5 ring-1 ring-orange-100">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-orange-200/40" />
            <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-shopee-500 to-orange-400 text-white shadow-float"><Zap size={24} fill="currentColor" /></span>
            <h3 className="relative mt-4 text-lg font-black text-emerald-700">Keep going!</h3>
            <p className="relative mt-2 text-xs font-semibold leading-5 text-slate-600">Complete your tasks and unlock better commissions every day.</p>
            <Link to="/task-center" className="relative mt-4 inline-flex text-xs font-black text-shopee-500">Open task center →</Link>
          </div>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-50 rounded-[28px] border border-orange-100 bg-white/95 px-2 pb-[max(.55rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_16px_55px_rgba(124,41,29,.22)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-5 items-end">
          {mobileNav.slice(0, 2).map(({ to, label, icon: Icon }) => <MobileLink key={to} to={to} label={label} icon={Icon} active={to === "/" ? location.pathname === "/" : location.pathname.startsWith(to)} />)}
          <Link to="/task-center" aria-label="Open task center" aria-current={location.pathname.startsWith("/task-center") ? "page" : undefined} className={`mx-auto -mt-7 grid h-16 w-16 place-items-center rounded-full border-[6px] border-white bg-gradient-to-br from-shopee-500 to-orange-400 text-white shadow-float transition active:scale-95 ${location.pathname.startsWith("/task-center") ? "ring-4 ring-orange-200" : ""}`}><Zap size={29} fill="currentColor" /></Link>
          {mobileNav.slice(2).map(({ to, label, icon: Icon }) => <MobileLink key={to} to={to} label={label} icon={Icon} active={location.pathname.startsWith(to)} />)}
        </div>
      </nav>
    </div>
  );
}

function MobileLink({ to, label, icon: Icon, active }: { to: string; label: string; icon: typeof Home; active: boolean }) {
  return <NavLink to={to} className={`grid place-items-center gap-1 rounded-xl py-1.5 text-[10px] font-black transition ${active ? "text-shopee-500" : "text-slate-400"}`}><Icon size={21} fill={active && to === "/" ? "currentColor" : "none"} /><span>{label}</span></NavLink>;
}
