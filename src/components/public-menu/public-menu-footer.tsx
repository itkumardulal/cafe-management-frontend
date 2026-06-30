type PublicMenuFooterProps = {
  cafeName: string;
  address: string | null;
  contactNumber: string | null;
};

export function PublicMenuFooter({ cafeName, address, contactNumber }: PublicMenuFooterProps) {
  const hasContact = Boolean(address?.trim() || contactNumber?.trim());

  return (
    <footer className="public-menu-edge-pad mt-8 pb-2 text-center">
      {hasContact ? (
        <div className="public-menu-footer-contact mb-4 space-y-1.5 text-sm">
          {address?.trim() ? (
            <p className="public-menu-text-muted leading-relaxed">{address.trim()}</p>
          ) : null}
          {contactNumber?.trim() ? (
            <p>
              <a
                href={`tel:${contactNumber.trim()}`}
                className="public-menu-footer-link font-semibold"
              >
                {contactNumber.trim()}
              </a>
            </p>
          ) : null}
        </div>
      ) : null}
      <p className="public-menu-footer-text text-[10px] font-medium uppercase tracking-[0.15em]">
        {cafeName}
      </p>
    </footer>
  );
}
