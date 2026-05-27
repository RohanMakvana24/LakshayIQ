import { Link } from "@tanstack/react-router";
import { ChevronRight, ArrowLeft } from "lucide-react";

export function BreadcrumbNav({ items }: { items: { label: string; to?: string; params?: Record<string, string> }[] }) {
  const previousItem = items.length > 1 ? items[items.length - 2] : null;

  return (
    <div className="flex items-center gap-3">
      {previousItem && previousItem.to && (
        <Link
          to={previousItem.to as never}
          params={previousItem.params as never}
          className="hidden md:flex h-8 w-8 rounded-lg bg-white border border-slate-200 items-center justify-center text-slate-500 hover:text-slate-800 hover:border-slate-300 shadow-sm transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
      )}
      <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {items.map((it, i) => (
          <span key={i} className="flex items-center gap-1">
            {it.to ? (
              <Link to={it.to as never} params={it.params as never} className="hover:text-foreground">{it.label}</Link>
            ) : (
              <span className="text-foreground">{it.label}</span>
            )}
            {i < items.length - 1 && <ChevronRight className="h-3.5 w-3.5" />}
          </span>
        ))}
      </nav>
    </div>
  );
}
