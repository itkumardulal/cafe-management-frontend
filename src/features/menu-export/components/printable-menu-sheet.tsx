import "../styles/printable-menu.css";

import { forwardRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { formatPrice, formatSubtitle } from "../lib/menu-pdf-export";
import type { PrintableMenuData } from "../types";
import { getPublicMenuUrl } from "@/src/services/public-menu-api";
import { resolvePublicMenuAssetUrl } from "@/src/services/public-menu-api";
import { SPECIALS_SECTION_LABEL } from "@/src/lib/menu-catalog-layout";

type PrintableMenuSheetProps = {
  data: PrintableMenuData;
};

function MenuItem({ item }: { item: PrintableMenuData["specials"][number] }) {
  const subtitle = formatSubtitle(item);
  return (
    <div className="menu-print-item">
      <div className="menu-print-item-head">
        <span className="menu-print-item-name">
          {item.name}
          {item.isSpecial ? <span className="menu-print-star"> ★</span> : null}
        </span>
        <span className="menu-print-item-price">{formatPrice(item.sellPricePerUnit)}</span>
      </div>
      {subtitle ? <p className="menu-print-item-desc">{subtitle}</p> : null}
    </div>
  );
}

function MenuSection({
  title,
  items,
  keyPrefix,
}: {
  title: string;
  items: PrintableMenuData["specials"];
  keyPrefix: string;
}) {
  return (
    <section className="menu-print-section">
      <h2 className="menu-print-section-title">{title}</h2>
      <div className="menu-print-item-list">
        {items.map((item) => (
          <MenuItem key={`${keyPrefix}-${item.name}`} item={item} />
        ))}
      </div>
    </section>
  );
}

export const PrintableMenuSheet = forwardRef<HTMLDivElement, PrintableMenuSheetProps>(
  function PrintableMenuSheet({ data }, ref) {
    const { cafe } = data;
    const initial = cafe.cafeName.trim().charAt(0).toUpperCase() || "C";
    const logoUrl = resolvePublicMenuAssetUrl(cafe.logo);
    const menuUrl = cafe.slug ? getPublicMenuUrl(cafe.slug) : "";
    const generatedDate = new Date(data.generatedAt).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    return (
      <div ref={ref} className="menu-print-sheet" data-menu-print-sheet>
        <header className="menu-print-header">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="menu-print-logo" />
          ) : (
            <div className="menu-print-logo-fallback">{initial}</div>
          )}
          <h1 className="menu-print-cafe-name">{cafe.cafeName}</h1>
          <div className="menu-print-rule" />
        </header>

        <div className="menu-print-body">
          {data.specials.length > 0 ? (
            <MenuSection
              title={SPECIALS_SECTION_LABEL}
              items={data.specials}
              keyPrefix="special"
            />
          ) : null}

          {data.categories.map((category) => (
            <MenuSection
              key={category.id}
              title={category.name}
              items={category.items}
              keyPrefix={category.id}
            />
          ))}
        </div>

        <footer className="menu-print-footer">
          <div className="menu-print-footer-contact">
            {cafe.address ? <span>{cafe.address}</span> : null}
            {cafe.contactNumber ? <span>{cafe.contactNumber}</span> : null}
          </div>
          {menuUrl ? (
            <div className="menu-print-qr">
              <QRCodeCanvas value={menuUrl} size={56} level="H" includeMargin bgColor="#ffffff" />
              <span>Scan for live menu</span>
            </div>
          ) : null}
          <p className="menu-print-date">Menu as of {generatedDate}</p>
        </footer>
      </div>
    );
  },
);
