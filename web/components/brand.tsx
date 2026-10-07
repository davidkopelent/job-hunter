import { Crosshair } from "lucide-react";

export function Brand() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="bg-brand flex size-8 items-center justify-center rounded-[10px] text-white">
        <Crosshair className="size-4" strokeWidth={2.5} />
      </span>
      <span className="text-[15px] font-semibold tracking-tight">
        Job<span className="text-muted-foreground">Hunter</span>
      </span>
    </span>
  );
}
