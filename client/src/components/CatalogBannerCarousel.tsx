import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { CatalogBanner } from "../types";

const fallbackBanners = [
  { id: "fallback-1", code: "BANNER-001", title: "Say It With Love", imageUrl: "/assets/catalog-banners/09-say-it-with-love-enhanced.jpg", altText: "Shopee Say It With Love promotion", sortOrder: 1, active: true },
  { id: "fallback-2", code: "BANNER-002", title: "SPayLater", imageUrl: "/assets/catalog-banners/10-spaylater-enhanced.jpg", altText: "Shopee SPayLater installment promotion", sortOrder: 2, active: true },
  { id: "fallback-3", code: "BANNER-003", title: "SPinjam Fest", imageUrl: "/assets/catalog-banners/11-spinjam-fest-enhanced.jpg", altText: "Shopee SPinjam Fest promotion", sortOrder: 3, active: true },
];

export function CatalogBannerCarousel({ banners = [] }: { banners?: CatalogBanner[] }) {
  const slides = banners.length ? banners : fallbackBanners;
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (paused || reduceMotion) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setCurrent((value) => (value + 1) % slides.length);
    }, 4800);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  useEffect(() => { setCurrent((value) => Math.min(value, slides.length - 1)); }, [slides.length]);

  const move = (direction: number) => setCurrent((value) => (value + direction + slides.length) % slides.length);
  const finishSwipe = (clientX: number) => {
    if (touchStart.current === null) return;
    const distance = clientX - touchStart.current;
    if (Math.abs(distance) > 45) move(distance > 0 ? -1 : 1);
    touchStart.current = null;
  };

  return (
    <section
      tabIndex={0}
      aria-roledescription="carousel"
      aria-label="Catalog promotion banners"
      className="relative mx-auto aspect-[15/8] w-full max-w-[1080px] overflow-hidden rounded-[24px] bg-slate-900 shadow-[0_20px_60px_rgba(15,23,42,.2)] outline-none ring-shopee-200 focus-visible:ring-4 sm:rounded-[30px]"
      onKeyDown={(event) => { if (event.key === "ArrowLeft") move(-1); if (event.key === "ArrowRight") move(1); }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }}
      onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }}
      onTouchEnd={(event) => finishSwipe(event.changedTouches[0]?.clientX ?? 0)}
    >
      {slides.map((banner, index) => <figure key={banner.id} aria-hidden={index !== current} className={`absolute inset-0 overflow-hidden transition duration-700 ease-out motion-reduce:transition-none ${index === current ? "z-10 translate-x-0 opacity-100" : index < current ? "-translate-x-4 opacity-0" : "translate-x-4 opacity-0"}`}><img src={banner.imageUrl} alt="" aria-hidden="true" loading={index === 0 ? "eager" : "lazy"} decoding="async" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-55 blur-2xl" /><div className="absolute inset-0 bg-slate-950/10" /><img src={banner.imageUrl} alt={index === current ? banner.altText : ""} loading={index === 0 ? "eager" : "lazy"} fetchPriority={index === 0 ? "high" : "auto"} decoding="async" className="relative h-full w-full object-contain" /></figure>)}

      <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/15 bg-slate-950/35 px-3 py-2 shadow-lg backdrop-blur sm:bottom-4 sm:gap-2">
        {slides.map((banner, index) => <button key={banner.id} type="button" aria-label={`Show banner ${index + 1}: ${banner.title}`} aria-current={index === current} onClick={() => setCurrent(index)} className={`h-2 rounded-full transition-all ${index === current ? "w-6 bg-white sm:w-8" : "w-2 bg-white/45 hover:bg-white/80"}`} />)}
      </div>
      <button type="button" onClick={() => move(-1)} aria-label="Previous banner" className="absolute left-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-slate-950/30 text-white shadow-lg backdrop-blur transition hover:bg-slate-950/60 sm:grid"><ChevronLeft size={22} /></button>
      <button type="button" onClick={() => move(1)} aria-label="Next banner" className="absolute right-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-slate-950/30 text-white shadow-lg backdrop-blur transition hover:bg-slate-950/60 sm:grid"><ChevronRight size={22} /></button>
    </section>
  );
}
