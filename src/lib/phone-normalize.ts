/** Mirror of backend phone-normalize.util.ts */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (raw == null) {
    return null;
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const plus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) {
    return null;
  }
  return plus ? `+${digits}` : digits;
}
