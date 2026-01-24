import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { capitalizeString } from "@/lib/utils";

export type FillType = "solid" | "linear" | "radial";

interface FillTypeSelectorProps {
  value: FillType;
  onChange: (type: FillType) => void;
  className?: string;
}

export function FillTypeSelector({ value, onChange, className }: FillTypeSelectorProps) {
  return (
    <Select value={value} onValueChange={(val) => onChange(val as FillType)}>
      <SelectTrigger className={className}>
        <SelectValue>{capitalizeString(value)}</SelectValue>
      </SelectTrigger>
      <SelectContent align="start">
        <SelectItem value="solid">Solid</SelectItem>
        <SelectItem value="linear">Linear</SelectItem>
        <SelectItem value="radial">Radial</SelectItem>
      </SelectContent>
    </Select>
  );
}
