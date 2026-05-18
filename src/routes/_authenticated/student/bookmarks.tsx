import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Bookmark, FileText, Play } from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/bookmarks")({
  head: () => ({ meta: [{ title: "Bookmarks — Lakshay IQ" }] }),
  component: Bookmarks,
});

function Bookmarks() {
  const items = [
    { type: "video", title: "Lecture 3: Functions & Recursion", subject: "Programming Fundamentals" },
    { type: "pdf", title: "OOP — Complete Notes.pdf", subject: "Programming Fundamentals" },
    { type: "pdf", title: "PYQ End-Sem 2023", subject: "Discrete Mathematics" },
  ];
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Bookmarks</h1>
        <p className="text-sm text-muted-foreground">Everything you've saved, in one place.</p>
      </header>
      <div className="space-y-3">
        {items.map((it, i) => (
          <Card key={i} className="flex items-center gap-4 p-4 shadow-soft">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-accent-foreground">
              {it.type === "video" ? <Play className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{it.title}</p>
              <p className="text-xs text-muted-foreground">{it.subject}</p>
            </div>
            <Bookmark className="h-4 w-4 fill-primary text-primary" />
          </Card>
        ))}
      </div>
    </div>
  );
}
