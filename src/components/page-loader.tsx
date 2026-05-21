import { Loader2 } from "lucide-react";

export function PageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 animate-fade-in">
      <Loader2 className="h-6 w-6 animate-spin text-neutral-900 stroke-[2.5]" />
      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-400">
        {label}
      </span>
    </div>
  );
}
