import { ThermalRow } from "@/src/features/printing/components/thermal-row";

type ThermalMetaItem = {
  label: string;
  value: string;
};

type ThermalReceiptMetaProps = {
  items: ThermalMetaItem[];
};

export function ThermalReceiptMeta({ items }: ThermalReceiptMetaProps) {
  return (
    <dl className="space-y-0.5 text-[10px]">
      {items.map((item) => (
        <ThermalRow key={item.label} label={item.label} value={item.value} />
      ))}
    </dl>
  );
}
