import { cn } from "@/src/lib/cn";

type ThermalRowProps = {
  label: string;
  value: string;
  bold?: boolean;
  mono?: boolean;
  className?: string;
};

export function ThermalRow({ label, value, bold, mono, className }: ThermalRowProps) {
  return (
    <div
      className={cn(
        "flex justify-between gap-2 text-[11px]",
        bold && "font-semibold",
        className,
      )}
    >
      <span>{label}</span>
      <span className={cn(mono !== false && "font-mono tabular-nums")}>{value}</span>
    </div>
  );
}
