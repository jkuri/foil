import { ColorPicker } from "@/components/shared/color-picker";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ColorInputProps {
  value?: string;
  opacity?: number;
  onChange: (value: string, opacity?: number) => void;
  className?: string;
}

export function ColorInput({ value = "#000000", opacity = 1, onChange, className }: ColorInputProps) {
  // We'll trust the parent to pass correct hex for now, or fallback
  const displayValue = value.toUpperCase();

  return (
    <Popover>
      <div className={cn("flex h-8 items-center gap-2 rounded-md border bg-muted/50 px-2 shadow-sm", className)}>
        <PopoverTrigger className="relative size-4 shrink-0 cursor-pointer overflow-hidden rounded-sm border shadow-sm transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1">
          <div className="absolute inset-0" style={{ backgroundColor: value }} />
          {opacity < 1 && (
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNjY0MiLz48cmVjdCB4PSI0IiB5PSI0IiB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjY2NjIi8+PC9zdmc+')] opacity-20" />
          )}
        </PopoverTrigger>

        <div className="min-w-0 flex-1">
          <Input
            className="h-full w-full border-none bg-transparent p-0 px-0 text-xs uppercase shadow-none focus-visible:ring-0"
            value={displayValue}
            onChange={(e) => onChange(e.target.value, opacity)}
            maxLength={7}
          />
        </div>

        <div className="h-3 w-px shrink-0 bg-border" />

        <div className="flex w-12 shrink-0 items-center justify-end gap-0.5">
          <Input
            className="h-full w-full border-none bg-transparent p-0 text-right text-xs shadow-none focus-visible:ring-0"
            value={Math.round(opacity * 100)}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!Number.isNaN(val)) {
                onChange(value, Math.max(0, Math.min(100, val)) / 100);
              }
            }}
            type="number"
            min={0}
            max={100}
          />
          <span className="select-none text-[10px] text-muted-foreground">%</span>
        </div>
      </div>

      <PopoverContent className="w-auto p-3" align="start" sideOffset={8}>
        <ColorPicker
          color={value}
          onChange={(newColor) => onChange(newColor, opacity)}
          opacity={opacity}
          onOpacityChange={(newOpacity) => onChange(value, newOpacity)}
        />
      </PopoverContent>
    </Popover>
  );
}
