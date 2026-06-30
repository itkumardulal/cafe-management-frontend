import { PublicMenuImage } from "./public-menu-image";

type DigitalMenuHeaderProps = {
  cafeName: string;
  logo: string | null;
  subtitle?: string;
  compact?: boolean;
};

export function DigitalMenuHeader({
  cafeName,
  logo,
  subtitle = "Explore our menu",
  compact = false,
}: DigitalMenuHeaderProps) {
  const initial = cafeName.trim().charAt(0).toUpperCase() || "C";

  if (compact) {
    return (
      <header className="public-menu-glass public-menu-edge-pad flex items-center gap-3 border-b border-[var(--color-border)] py-2.5">
        {logo ? (
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg ring-1 ring-[var(--color-border)]">
            <PublicMenuImage src={logo} alt={cafeName} sizes="32px" />
          </div>
        ) : (
          <div className="public-menu-logo-fallback flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold">
            {initial}
          </div>
        )}
        <div className="min-w-0">
          <p className="public-menu-text truncate text-sm font-bold tracking-tight">{cafeName}</p>
          <p className="public-menu-text-muted truncate text-[11px]">{subtitle}</p>
        </div>
      </header>
    );
  }

  return (
    <header className="public-menu-header-gradient public-menu-edge-pad pb-4 pt-7 text-center">
      <p className="public-menu-eyebrow mb-4">Digital Menu</p>

      <div className="relative mx-auto mb-4 inline-flex">
        <div className="public-menu-logo-glow absolute -inset-1 rounded-[1.35rem] blur-sm" aria-hidden />
        {logo ? (
          <div className="relative h-[4.5rem] w-[4.5rem] overflow-hidden rounded-2xl shadow-[var(--shadow-md)] ring-2 ring-white/90">
            <PublicMenuImage src={logo} alt={cafeName} sizes="72px" priority />
          </div>
        ) : (
          <div className="public-menu-logo-fallback relative flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl text-2xl font-bold shadow-[var(--shadow-md)] ring-2 ring-white/90">
            {initial}
          </div>
        )}
      </div>

      <h1 className="public-menu-text text-2xl font-bold tracking-tight">{cafeName}</h1>

      <div className="public-menu-ornament mx-auto mt-4 max-w-[12rem] text-[10px] font-medium uppercase tracking-widest">
        <span className="shrink-0 px-1">✦</span>
      </div>

      <p className="public-menu-text-muted mt-3 text-sm leading-relaxed">{subtitle}</p>
    </header>
  );
}
