import { UtensilsCrossed } from "lucide-react";

export default function PublicMenuNotFound() {
  return (
    <div className="public-menu-shell flex min-h-[60dvh] flex-col items-center justify-center px-6 text-center">
      <span className="public-menu-icon-badge mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
        <UtensilsCrossed className="h-7 w-7" strokeWidth={1.5} aria-hidden />
      </span>
      <h1 className="public-menu-text text-lg font-semibold">Menu not found</h1>
      <p className="public-menu-text-muted mt-1 text-sm">
        This menu may be unavailable. Please ask cafe staff for assistance.
      </p>
    </div>
  );
}
