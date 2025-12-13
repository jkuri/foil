import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  label?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  step?: number;
  disabled?: boolean;
}

export function NumberInput({ value, onChange, label, icon, className, step = 1, disabled }: NumberInputProps) {
  const [localValue, setLocalValue] = useState(value.toString());

  useEffect(() => {
    setLocalValue(Number.isFinite(value) ? Number(value).toFixed(2).replace(/\.00$/, "") : "0");
  }, [value]);

  const handleBlur = () => {
    const num = parseFloat(localValue);
    if (!Number.isNaN(num)) {
      onChange(num);
    } else {
      setLocalValue(Number(value).toFixed(2).replace(/\.00$/, ""));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className={cn("relative flex items-center", className)}>
      {(icon || label) && (
        <div className="absolute left-2 flex items-center text-muted-foreground [&>svg]:size-3.5">
          {icon}
          {label && <span className="font-medium text-[10px] uppercase">{label}</span>}
        </div>
      )}
      <Input
        className={cn(
          "h-8 border-transparent bg-muted/50 text-xs shadow-none hover:bg-muted focus-visible:ring-1",
          icon || label ? "pl-8" : "px-2",
        )}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        step={step}
        type="number"
        disabled={disabled}
      />
    </div>
  );
}
