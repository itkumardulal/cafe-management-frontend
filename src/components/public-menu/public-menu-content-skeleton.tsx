type PublicMenuContentSkeletonProps = {
  variant: "grid" | "category" | "items";
};

function SkeletonCard() {
  return (
    <div className="public-menu-skeleton-card">
      <div className="public-menu-skeleton-media" />
      <div className="space-y-3 p-4">
        <div className="public-menu-skeleton-line h-5 w-[58%]" />
        <div className="public-menu-skeleton-line h-4 w-[82%]" />
        <div className="public-menu-skeleton-line h-4 w-[34%]" />
      </div>
    </div>
  );
}

function SkeletonCategoryCard() {
  return (
    <div className="overflow-hidden rounded-[1.25rem] border border-[var(--color-border)] bg-white">
      <div className="public-menu-skeleton-media aspect-[5/4]" />
    </div>
  );
}

export function PublicMenuContentSkeleton({ variant }: PublicMenuContentSkeletonProps) {
  if (variant === "grid") {
    return (
      <div className="public-menu-filter-skeleton" aria-hidden>
        <div className="public-menu-specials-section">
          <div className="public-menu-edge-pad py-3">
            <div className="public-menu-skeleton-line mb-4 h-8 w-44" />
            <div className="public-menu-item-list">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        </div>
        <div className="public-menu-edge-pad pt-3">
          <div className="public-menu-skeleton-line mb-5 h-3 w-28" />
          <div className="public-menu-category-grid">
            <SkeletonCategoryCard />
            <SkeletonCategoryCard />
            <SkeletonCategoryCard />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "category") {
    return (
      <div className="public-menu-filter-skeleton" aria-hidden>
        <div className="public-menu-category-hero-skeleton" />
        <div className="public-menu-edge-pad pt-3 public-menu-item-list">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="public-menu-filter-skeleton public-menu-edge-pad pt-3 public-menu-item-list" aria-hidden>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}
