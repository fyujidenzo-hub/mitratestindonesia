import { ShoppingBag } from "lucide-react";

export function Brand({ inverse = false, compact = false }: { inverse?: boolean; compact?: boolean }) {
  return (
    <div className={`inline-flex items-center gap-2.5 font-black tracking-tight ${inverse ? "text-white" : "text-shopee-500"}`}>
      <span className={`grid place-items-center rounded-2xl ${compact ? "h-9 w-9" : "h-11 w-11"} ${inverse ? "bg-white/15" : "bg-shopee-50"}`}>
        <ShoppingBag size={compact ? 20 : 24} strokeWidth={2.4} />
      </span>
      <span className={compact ? "text-lg" : "text-xl"}>Shopee <span className={inverse ? "text-white/75" : "text-slate-800"}>Work</span></span>
    </div>
  );
}
