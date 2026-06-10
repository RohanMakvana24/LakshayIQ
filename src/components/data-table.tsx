import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  accessor: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  className?: string;
  sortable?: boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  searchableKeys?: (keyof T)[];
  pageSizeOptions?: number[];
  initialPageSize?: number;
  emptyMessage?: string;
  toolbar?: ReactNode;
  rowKey: (row: T) => string;
}

export function DataTable<T>({
  data, columns, searchableKeys = [], pageSizeOptions = [10, 25, 50, 100],
  initialPageSize = 10, emptyMessage = "No records found.", toolbar, rowKey,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);

  const filtered = useMemo(() => {
    if (!query) return data;
    const q = query.toLowerCase();
    return data.filter((row) =>
      searchableKeys.some((k) => String(row[k] ?? "").toLowerCase().includes(q))
    );
  }, [data, query, searchableKeys]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return filtered;
    const arr = [...filtered];
    arr.sort((a, b) => {
      const va = col.sortValue!(a); const vb = col.sortValue!(b);
      if (va < vb) return sort.dir === "asc" ? -1 : 1;
      if (va > vb) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sort, columns]);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const rows = sorted.slice(start, start + pageSize);

  // Keep page in range if data shrinks (e.g. after delete or filter)
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const toggleSort = (key: string) => {
    setSort((s) => s?.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" });
  };

  return (
    <div className="space-y-3.5">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Show</span>
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
            <SelectTrigger className="h-8 w-16 rounded-lg border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-bold focus:ring-0"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-900 rounded-lg border-slate-200 dark:border-zinc-800">
              {pageSizeOptions.map((n) => <SelectItem key={n} value={String(n)} className="text-xs">{n}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider text-[10px]">entries</span>
        </div>
        <div className="flex flex-1 flex-wrap items-center justify-end gap-2 sm:ml-auto sm:flex-nowrap">
          {toolbar}
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
            <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search matching records..." className="h-8 w-full pl-9 rounded-lg border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs placeholder:text-slate-450 focus-visible:ring-0" />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/50 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 select-none">
                {columns.map((c) => {
                  const isSorted = sort?.key === c.key;
                  const SortGlyph = !isSorted ? ArrowUpDown : sort!.dir === "asc" ? ArrowUp : ArrowDown;
                  return (
                    <th key={c.key} className={cn("whitespace-nowrap px-4.5 py-3 font-extrabold align-middle", c.className)}>
                      {c.sortable && c.sortValue ? (
                        <button onClick={() => toggleSort(c.key)} className="inline-flex items-center gap-1.5 hover:text-slate-800 dark:hover:text-white transition-colors">
                          {c.header}
                          <SortGlyph className={cn("h-3 w-3", isSorted ? "text-violet-600 dark:text-violet-400" : "opacity-50")} />
                        </button>
                      ) : c.header}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
              {rows.length === 0 ? (
                <tr><td colSpan={columns.length} className="px-4.5 py-12 text-center text-xs font-semibold text-slate-400 dark:text-zinc-555 bg-white dark:bg-zinc-900">{emptyMessage}</td></tr>
              ) : rows.map((row) => (
                <tr key={rowKey(row)} className="hover:bg-slate-50/45 dark:hover:bg-zinc-850/30 transition-colors">
                  {columns.map((c) => (
                    <td key={c.key} className={cn("px-4.5 py-3.5 align-middle text-xs text-slate-700 dark:text-zinc-300", c.className)}>{c.accessor(row)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-3 text-xs sm:flex-row sm:flex-wrap sm:items-center pt-1.5">
        <p className="text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
          Showing <span className="font-extrabold text-slate-800 dark:text-white">{total === 0 ? 0 : start + 1}</span> to{" "}
          <span className="font-extrabold text-slate-800 dark:text-white">{Math.min(start + pageSize, total)}</span> of{" "}
          <span className="font-extrabold text-slate-800 dark:text-white">{total}</span> entries
        </p>
        <div className="flex flex-wrap items-center gap-1 sm:ml-auto">
          <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900" disabled={currentPage === 1} onClick={() => setPage(1)}><ChevronsLeft className="h-3.5 w-3.5" /></Button>
          <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900" disabled={currentPage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}><ChevronLeft className="h-3.5 w-3.5" /></Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
             .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
             .map((p, i, arr) => (
               <span key={p} className="flex items-center">
                 {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1 text-slate-350 dark:text-zinc-600 font-bold">…</span>}
                 <Button variant={p === currentPage ? "default" : "outline"} size="sm" className={cn("h-7 min-w-7 px-2.5 rounded-lg text-xs font-bold", p === currentPage ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-none" : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900")} onClick={() => setPage(p)}>{p}</Button>
               </span>
             ))}
          <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900" disabled={currentPage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}><ChevronRight className="h-3.5 w-3.5" /></Button>
          <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900" disabled={currentPage === totalPages} onClick={() => setPage(totalPages)}><ChevronsRight className="h-3.5 w-3.5" /></Button>
        </div>
      </div>
    </div>
  );
}
