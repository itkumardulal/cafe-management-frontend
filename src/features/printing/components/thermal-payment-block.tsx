import { ThermalDivider } from "@/src/features/printing/components/thermal-divider";
import { ThermalRow } from "@/src/features/printing/components/thermal-row";

type ThermalPaymentRow = {
  label: string;
  value: string;
  bold?: boolean;
};

type ThermalPaymentBlockProps = {
  title?: string;
  statusLabel?: string | null;
  rows: ThermalPaymentRow[];
  footnote?: string | null;
};

export function ThermalPaymentBlock({
  title = "Payment",
  statusLabel,
  rows,
  footnote,
}: ThermalPaymentBlockProps) {
  if (rows.length === 0 && !statusLabel) return null;

  return (
    <>
      <ThermalDivider />
      <div className="space-y-0.5 text-[10px]">
        <p className="font-semibold uppercase tracking-wide">{title}</p>
        {statusLabel ? <p>{statusLabel}</p> : null}
        {rows.map((row) => (
          <ThermalRow
            key={row.label}
            label={row.label}
            value={row.value}
            bold={row.bold}
          />
        ))}
        {footnote ? <p className="pt-0.5 text-[9px]">{footnote}</p> : null}
      </div>
    </>
  );
}
