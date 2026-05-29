export function formatMoney(value: number | string | null | undefined) {
  if (value == null || value === "") {
    return "0.00";
  }
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isFinite(n)) {
    return "0.00";
  }
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDateOnly(isoOrDate: string | null | undefined) {
  if (isoOrDate == null || isoOrDate === "") {
    return "—";
  }
  const d = new Date(isoOrDate.includes("T") ? isoOrDate : `${isoOrDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) {
    return isoOrDate.slice(0, 10);
  }
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string | null | undefined) {
  if (iso == null || iso === "") {
    return "—";
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
