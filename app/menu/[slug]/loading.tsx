export default function PublicMenuLoading() {
  return (
    <div className="public-menu-shell safe-bottom pb-10">
      <div className="public-menu-header-gradient public-menu-edge-pad pb-5 pt-8 text-center">
        <div className="mx-auto mb-4 h-3 w-24 animate-pulse rounded-full bg-[var(--color-cream-100)]" />
        <div className="mx-auto h-[4.5rem] w-[4.5rem] animate-pulse rounded-2xl bg-[var(--color-cream-100)]" />
        <div className="mx-auto mt-4 h-7 w-44 animate-pulse rounded-lg bg-[var(--color-cream-100)]" />
        <div className="mx-auto mt-3 h-4 w-36 animate-pulse rounded bg-[var(--color-cream-100)]" />
      </div>
      <div className="public-menu-sticky-nav public-menu-edge-pad py-3">
        <div className="h-12 animate-pulse rounded-2xl bg-[var(--color-cream-100)]" />
        <div className="mt-3 flex gap-2 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-11 w-20 animate-pulse rounded-full bg-[var(--color-cream-100)]" />
          ))}
        </div>
      </div>
      <div className="public-menu-specials-section">
        <div className="public-menu-edge-pad py-3">
          <div className="mb-3 h-8 w-40 animate-pulse rounded-lg bg-[var(--color-cream-100)]" />
          <div className="public-menu-item-list">
            {Array.from({ length: 2 }).map((_, cardIndex) => (
              <div key={cardIndex} className="public-menu-skeleton-card">
                <div className="public-menu-skeleton-media" />
                <div className="space-y-3 p-4">
                  <div className="h-5 w-1/2 animate-pulse rounded bg-[var(--color-cream-100)]" />
                  <div className="h-4 w-4/5 animate-pulse rounded bg-[var(--color-cream-100)]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="public-menu-edge-pad pt-3">
        <div className="mb-3 h-3 w-28 animate-pulse rounded bg-[var(--color-cream-100)]" />
        <div className="public-menu-category-grid">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-[1.25rem] border border-[var(--color-border)] bg-white">
              <div className="aspect-[5/4] animate-pulse bg-[var(--color-cream-100)]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
