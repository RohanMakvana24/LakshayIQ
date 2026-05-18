import { createFileRoute, Link } from "@tanstack/react-router";
import { subjects, universities, units } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Search as SearchIcon } from "lucide-react";

interface SearchParams { q?: string }

export const Route = createFileRoute("/_authenticated/student/search")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({ q: typeof s.q === "string" ? s.q : "" }),
  head: () => ({ meta: [{ title: "Search — Lakshay IQ" }] }),
  component: Search,
});

function Search() {
  const { q = "" } = Route.useSearch();
  const query = q.toLowerCase().trim();
  const uniMatches = query ? universities.filter(u => u.name.toLowerCase().includes(query)) : [];
  const subMatches = query ? subjects.filter(s => s.name.toLowerCase().includes(query) || s.code.toLowerCase().includes(query)) : [];
  const unitMatches = query ? units.filter(u => u.title.toLowerCase().includes(query)) : [];
  const empty = !query;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Search</h1>
        <p className="text-sm text-muted-foreground">{empty ? "Type a query in the top bar to search." : `Results for "${q}"`}</p>
      </header>

      {empty && (
        <Card className="grid place-items-center p-16 text-center shadow-soft">
          <SearchIcon className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Try "computer science", "OOP" or "CS101".</p>
        </Card>
      )}

      {!empty && (
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 font-display text-lg font-semibold">Universities · {uniMatches.length}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {uniMatches.map(u => (
                <Link key={u.id} to="/student/university/$id" params={{ id: u.id }}>
                  <Card className="p-4 shadow-soft hover:shadow-elegant">{u.logo} <span className="ml-2 font-medium">{u.name}</span></Card>
                </Link>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-3 font-display text-lg font-semibold">Subjects · {subMatches.length}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {subMatches.map(s => (
                <Link key={s.id} to="/student/subject/$id" params={{ id: s.id }}>
                  <Card className="p-4 shadow-soft hover:shadow-elegant"><p className="font-medium">{s.name}</p><p className="text-xs text-muted-foreground">{s.code}</p></Card>
                </Link>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-3 font-display text-lg font-semibold">Units · {unitMatches.length}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {unitMatches.map(u => (
                <Link key={u.id} to="/student/unit/$id" params={{ id: u.id }}>
                  <Card className="p-4 shadow-soft hover:shadow-elegant"><p className="font-medium">Unit {u.number}: {u.title}</p></Card>
                </Link>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
