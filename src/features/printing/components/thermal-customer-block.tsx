import { truncateThermalText } from "@/src/features/printing/lib/thermal-text";
import { DEFAULT_PAPER_PROFILE } from "@/src/features/printing/constants/paper-profiles";

type ThermalCustomerBlockProps = {
  name?: string | null;
  phone?: string | null;
  address?: string | null;
  email?: string | null;
  /** Prepended to address on the left (e.g. "Deliver to: "). */
  addressPrefix?: string | null;
};

function PairRow({
  left,
  right,
  leftClassName,
  rightClassName,
}: {
  left?: string | null;
  right?: string | null;
  leftClassName?: string;
  rightClassName?: string;
}) {
  const leftValue = left?.trim() ?? "";
  const rightValue = right?.trim() ?? "";
  if (!leftValue && !rightValue) return null;

  return (
    <div className="mt-0.5 flex items-baseline justify-between gap-2">
      {leftValue ? (
        <span className={`min-w-0 leading-snug break-words ${leftClassName ?? ""}`}>
          {leftValue}
        </span>
      ) : (
        <span aria-hidden />
      )}
      {rightValue ? (
        <span
          className={`shrink-0 text-right leading-snug ${rightClassName ?? ""}`}
        >
          {rightValue}
        </span>
      ) : null}
    </div>
  );
}

export function ThermalCustomerBlock({
  name,
  phone,
  address,
  email,
  addressPrefix,
}: ThermalCustomerBlockProps) {
  const addressLeft = [addressPrefix?.trim(), address?.trim()].filter(Boolean).join(" ");
  const addressDisplay = addressLeft
    ? truncateThermalText(addressLeft, DEFAULT_PAPER_PROFILE.maxChars - 18)
    : null;

  const hasContent =
    name?.trim() || phone?.trim() || addressDisplay || email?.trim();
  if (!hasContent) return null;

  return (
    <div className="text-[10px]">
      <p className="font-semibold uppercase tracking-wide">Customer</p>
      <PairRow
        left={name}
        right={phone}
        leftClassName="font-medium"
        rightClassName="font-mono tabular-nums"
      />
      <PairRow
        left={addressDisplay}
        right={email}
        rightClassName="text-[9px]"
      />
    </div>
  );
}
