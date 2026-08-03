export function AuthBackground() {
  return (
    <picture className="pointer-events-none absolute inset-0 z-0 block overflow-hidden" aria-hidden="true">
      <source media="(max-width: 767px)" srcSet="/assets/auth-background-mobile.webp" type="image/webp" />
      <img
        src="/assets/auth-background-desktop.webp"
        alt=""
        className="h-full w-full object-cover object-center"
        decoding="async"
        fetchPriority="high"
        loading="eager"
      />
    </picture>
  );
}
