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

function MenuItemRow({ item }: { item: PrintableMenuData["specials"][number] }) {
  const subtitle = formatSubtitle(item);
  return (
    <tr className="menu-print-item">
      <td className="menu-print-item-name">
        <span className="menu-print-item-title">
          {item.name}
          {item.isSpecial ? <span className="menu-print-star"> ★</span> : null}
        </span>
        {subtitle ? <span className="menu-print-item-sub">{subtitle}</span> : null}
      </td>
      <td className="menu-print-item-dots">
        <span aria-hidden />
      </td>
      <td className="menu-print-item-price">{formatPrice(item.sellPricePerUnit)}</td>
    </tr>
  );
}

function MenuItemsTable({
  items,
  keyPrefix,
}: {
  items: PrintableMenuData["specials"];
  keyPrefix: string;
}) {
  return (
    <table className="menu-print-items">
      <tbody>
        {items.map((item) => (
          <MenuItemRow key={`${keyPrefix}-${item.name}`} item={item} />
        ))}
      </tbody>
    </table>
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
        <div className="menu-print-ornament">✦</div>
      </header>

      {data.specials.length > 0 ? (
        <section className="menu-print-section">
          <h2 className="menu-print-section-title">{SPECIALS_SECTION_LABEL}</h2>
          <MenuItemsTable items={data.specials} keyPrefix="special" />
        </section>
      ) : null}

      {data.categories.map((category) => {
        const useColumns = category.items.length >= 6;
        const mid = Math.ceil(category.items.length / 2);
        return (
          <section key={category.id} className="menu-print-section menu-print-category-block">
            <h2 className="menu-print-section-title">{category.name}</h2>
            {useColumns ? (
              <div className="menu-print-columns">
                <MenuItemsTable items={category.items.slice(0, mid)} keyPrefix={`${category.id}-a`} />
                <MenuItemsTable items={category.items.slice(mid)} keyPrefix={`${category.id}-b`} />
              </div>
            ) : (
              <MenuItemsTable items={category.items} keyPrefix={category.id} />
            )}
          </section>
        );
      })}

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
},
);
