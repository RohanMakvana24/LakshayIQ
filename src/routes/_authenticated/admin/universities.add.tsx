import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft } from "lucide-react";
import { useSupabaseTable, slugify } from "@/hooks/use-supabase-table";

export const Route = createFileRoute("/_authenticated/admin/universities/add")({
  head: () => ({ meta: [{ title: "Add University — Lakshay IQ" }] }),
  component: AddUniversity,
});

function AddUniversity() {
  const nav = useNavigate();
  const { insert } = useSupabaseTable("universities");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" asChild><Link to="/admin/universities"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link></Button>
      <header>
        <h1 className="font-display text-3xl font-bold">Add University</h1>
        <p className="text-sm text-muted-foreground">Create a new university record.</p>
      </header>
      <Card className="p-6 shadow-soft">
        <form
          className="grid gap-5 sm:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault(); setSaving(true);
            const ok = await insert({ name, slug: slug || slugify(name), description: description || null, logo_url: logoUrl || null, banner_url: bannerUrl || null, is_active: isActive });
            setSaving(false);
            if (ok) nav({ to: "/admin/universities" });
          }}
        >
          <div className="space-y-2 sm:col-span-2"><Label>Name *</Label><Input required value={name} onChange={(e) => { setName(e.target.value); if (!slug) setSlug(slugify(e.target.value)); }} placeholder="Delhi University" /></div>
          <div className="space-y-2"><Label>Slug *</Label><Input required value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="delhi-university" /></div>
          <div className="space-y-2"><Label>Logo URL / Emoji</Label><Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="🎓 or https://…" /></div>
          <div className="space-y-2 sm:col-span-2"><Label>Banner URL</Label><Input value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} placeholder="https://…" /></div>
          <div className="space-y-2 sm:col-span-2"><Label>Description</Label><Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="flex items-center gap-3 sm:col-span-2"><Switch checked={isActive} onCheckedChange={setIsActive} id="active" /><Label htmlFor="active">Active</Label></div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" asChild><Link to="/admin/universities">Cancel</Link></Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save University"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
