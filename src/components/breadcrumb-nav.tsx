import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

export function BreadcrumbNav({ items }: { items: { label: string; to?: string; params?: Record<string, string> }[] }) {
  return (
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
  );
}
