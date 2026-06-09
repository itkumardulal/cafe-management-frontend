export default function PublicMenuLoading() {
  return (
    <div className="public-menu-shell safe-bottom pb-10">
      <div className="public-menu-header-gradient px-4 pb-5 pt-8 text-center">
        <div className="mx-auto mb-4 h-3 w-24 animate-pulse rounded-full bg-[var(--color-cream-100)]" />
        <div className="mx-auto h-[4.5rem] w-[4.5rem] animate-pulse rounded-2xl bg-[var(--color-cream-100)]" />
        <div className="mx-auto mt-4 h-7 w-44 animate-pulse rounded-lg bg-[var(--color-cream-100)]" />
        <div className="mx-auto mt-3 h-4 w-36 animate-pulse rounded bg-[var(--color-cream-100)]" />
      </div>
      <div className="public-menu-sticky-nav px-4 py-3.5">
        <div className="h-12 animate-pulse rounded-2xl bg-[var(--color-cream-100)]" />
      </div>
      <div className="px-4 pt-2">
        <div className="mx-auto mb-5 h-3 w-28 animate-pulse rounded bg-[var(--color-cream-100)]" />
        <div className="public-menu-category-grid">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-[1.25rem] border border-[var(--color-border)] bg-white"
            >
              <div className="aspect-[5/4] animate-pulse bg-[var(--color-cream-100)]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
