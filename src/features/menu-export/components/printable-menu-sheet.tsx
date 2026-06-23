import "../styles/printable-menu.css";

import { QRCodeCanvas } from "qrcode.react";
import { formatPrice, formatSubtitle } from "../lib/menu-pdf-export";
import type { PrintableMenuData } from "../types";
import { getPublicMenuUrl } from "@/src/services/public-menu-api";
import { resolvePublicMenuAssetUrl } from "@/src/services/public-menu-api";

type PrintableMenuSheetProps = {
  data: PrintableMenuData;
};

function MenuItemRow({ item }: { item: PrintableMenuData["specials"][number] }) {
  const subtitle = formatSubtitle(item);
  return (
    <div className="menu-print-item">
      <div className="menu-print-item-name">
        <span>
          {item.name}
          {item.isSpecial ? <span className="menu-print-star"> ★</span> : null}
        </span>
        {subtitle ? <span className="menu-print-item-sub">{subtitle}</span> : null}
      </div>
      <span className="menu-print-item-dots" aria-hidden />
      <span className="menu-print-item-price">{formatPrice(item.sellPricePerUnit)}</span>
    </div>
  );
}

export function PrintableMenuSheet({ data }: PrintableMenuSheetProps) {
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
    <div className="menu-print-sheet" data-menu-print-sheet>
      <header className="menu-print-header">
        {logoUrl ? (
          <img src={logoUrl} alt="" className="menu-print-logo" />
        ) : (
          <div className="menu-print-logo-fallback">{initial}</div>
        )}
        <h1 className="menu-print-cafe-name">{cafe.cafeName}</h1>
        <div className="menu-print-ornament">✦</div>
      </header>

      {data.specials.length > 0 ? (
        <section className="menu-print-section">
          <h2 className="menu-print-section-title">Chef&apos;s Specials</h2>
          <div className="menu-print-items">
            {data.specials.map((item) => (
              <MenuItemRow key={`special-${item.name}`} item={item} />
            ))}
          </div>
        </section>
      ) : null}

      {data.categories.map((category) => (
        <section key={category.id} className="menu-print-section menu-print-category-block">
          <h2 className="menu-print-section-title">{category.name}</h2>
          <div
            className={
              category.items.length >= 6
                ? "menu-print-items menu-print-items-columns"
                : "menu-print-items"
            }
          >
            {category.items.map((item) => (
              <MenuItemRow key={`${category.id}-${item.name}`} item={item} />
            ))}
          </div>
        </section>
      ))}

      <footer className="menu-print-footer">
        <div className="menu-print-footer-contact">
          {cafe.address ? <span>{cafe.address}</span> : null}
          {cafe.contactNumber ? <span>{cafe.contactNumber}</span> : null}
        </div>
        {menuUrl ? (
          <div className="menu-print-qr">
            <QRCodeCanvas value={menuUrl} size={56} level="H" includeMargin bgColor="#f4f0eb" />
            <span>Scan for live menu</span>
          </div>
        ) : null}
        <p className="menu-print-date">Menu as of {generatedDate}</p>
      </footer>
    </div>
  );
}
