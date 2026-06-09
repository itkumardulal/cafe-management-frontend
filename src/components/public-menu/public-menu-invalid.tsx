import { UtensilsCrossed } from "lucide-react";

export function PublicMenuInvalidSlug() {
  return (
    <div className="public-menu-shell flex min-h-[60dvh] flex-col items-center justify-center px-6 text-center">
      <span className="public-menu-icon-badge mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
        <UtensilsCrossed className="h-7 w-7" strokeWidth={1.5} aria-hidden />
      </span>
      <h1 className="public-menu-text text-lg font-semibold">Invalid menu link</h1>
      <p className="public-menu-text-muted mt-1 text-sm">
        This menu address is not valid. Please scan the QR code again or ask cafe staff for help.
      </p>
    </div>
  );
}
