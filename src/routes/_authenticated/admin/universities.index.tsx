import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useSupabaseTable, slugify } from "@/hooks/use-supabase-table";
import { cn } from "@/lib/utils";

// Components & UI Elements
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle 
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";

// Icons
import { 
  Plus, Trash2, Pencil, Search, ChevronLeft, ChevronRight, 
  ArrowUpDown, ArrowUp, ArrowDown, UploadCloud, X, GraduationCap 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Row = { 
  id: string; 
  name: string; 
  slug: string; 
  description: string | null; 
  logo_url: string | null;
  banner_url: string | null;
  is_active: boolean; 
  created_at: string 
};

export const Route = createFileRoute("/_authenticated/admin/universities/")({
  head: () => ({ meta: [{ title: "Manage Universities — Lakshay IQ" }] }),
  component: ManageUniversities,
});

// Update Validation Schema
const UniversityUpdateSchema = Yup.object().shape({
  name: Yup.string().min(3, "Too short!").required("University name is required"),
  slug: Yup.string().matches(/^[a-z0-9-_]+$/, "Invalid slug format").required("Slug is required"),
  description: Yup.string().max(500, "Max 500 characters allowed").nullable(),
  isActive: Yup.boolean().default(true),
});

function ManageUniversities() {
  const { data, loading, remove, update } = useSupabaseTable<Row>("universities");

  // Client-side Search, Sort & Pagination States
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<keyof Row>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals Core State Pipelines
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editRow, setEditRow] = useState<Row | null>(null);
  const [updating, setUpdating] = useState(false);

  // States to keep track of updated asset instances
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  // 1. Sorting Handler Engine
  const handleSort = (key: keyof Row) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  // 2. Computed Pipeline Matrix (Filtering -> Sorting -> Pagination)
  const processedData = useMemo(() => {
    if (!data) return [];
    
    // Step A: Search Filtering
    let result = data.filter((item) => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Step B: Structural Sorting
    result.sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (typeof valA === "string" && typeof valB === "string") {
        return sortDirection === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (typeof valA === "boolean" && typeof valB === "boolean") {
        return sortDirection === "asc" ? (valA === valB ? 0 : valA ? -1 : 1) : (valA === valB ? 0 : valB ? -1 : 1);
      }
      return 0;
    });

    return result;
  }, [data, searchQuery, sortKey, sortDirection]);

  // Step C: Paginated Chunk Calculation
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedData.slice(start, start + itemsPerPage);
  }, [processedData, currentPage]);

  const SortIcon = ({ columnKey }: { columnKey: keyof Row }) => {
    if (sortKey !== columnKey) return <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 opacity-60" />;
    return sortDirection === "asc" 
      ? <ArrowUp className="ml-1.5 h-3.5 w-3.5 text-slate-900" /> 
      : <ArrowDown className="ml-1.5 h-3.5 w-3.5 text-slate-900" />;
  };

  // 3. Storage Bucket Upload Subroutine
  const uploadAsset = async (file: File, folder: "logos" | "banners", targetSlug: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${folder}/${targetSlug}-${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage.from("university-assets").upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("university-assets").getPublicUrl(data.path);
      return urlData.publicUrl;
    } catch (err) {
      console.error("Asset modification runtime crashed:", err);
      return null;
    }
  };

  // 4. Formik Update Architecture Pipeline Injection
  const updateFormik = useFormik({
    initialValues: {
      name: "",
      slug: "",
      description: "",
      isActive: true,
      logoFile: null as File | null,
      bannerFile: null as File | null,
    },
    enableReinitialize: false, // Prevents blowing away active image uploads mid-session
    validationSchema: UniversityUpdateSchema,
    onSubmit: async (values) => {
      if (!editRow) return;
      setUpdating(true);
      const cleanSlug = values.slug || slugify(values.name);

      let finalLogoUrl = editRow.logo_url;
      let finalBannerUrl = editRow.banner_url;

      try {
        if (values.logoFile) finalLogoUrl = await uploadAsset(values.logoFile, "logos", cleanSlug);
        if (values.bannerFile) finalBannerUrl = await uploadAsset(values.bannerFile, "banners", cleanSlug);

        const ok = await update(editRow.id, {
          name: values.name,
          slug: cleanSlug,
          description: values.description || null,
          logo_url: finalLogoUrl,
          banner_url: finalBannerUrl,
          is_active: values.isActive,
        });

        if (ok) {
          setEditRow(null);
          updateFormik.resetForm();
        }
      } catch (e) {
        console.error("Critical edit runtime error:", e);
      } finally {
        setUpdating(false);
      }
    },
  });

  const triggerEditModal = (row: Row) => {
    setEditRow(row);
    setLogoPreview(row.logo_url);
    setBannerPreview(row.banner_url);
    updateFormik.setValues({
      name: row.name,
      slug: row.slug,
      description: row.description || "",
      isActive: row.is_active,
      logoFile: null,
      bannerFile: null,
    });
  };

  // 5. Delete Action Subroutine Execution
  const executeDeletion = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await remove(deleteId);
      setDeleteId(null);
      if (paginatedData.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 w-full px-1">
      {/* Platform Dashboard Layout Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Universities Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">Configure structural metadata, manage storage bucket assets, filters, and records live.</p>
        </div>
        <Button asChild className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-semibold px-4 py-2 shadow-sm shrink-0">
          <Link to="/admin/universities/add"><Plus className="mr-2 h-4 w-4 stroke-[2.5]" /> Add New Registry</Link>
        </Button>
      </header>

      {/* Real-time Searching & Metric Control Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search matching names or slugs..." 
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="pl-10 h-9 rounded-xl border-slate-200 bg-white text-xs placeholder:text-slate-400 focus-visible:ring-slate-900/10 focus-visible:border-slate-900"
          />
        </div>
        <span className="text-[11px] font-bold text-slate-400 shrink-0 px-2">
          Found {processedData.length} instances inside index
        </span>
      </div>

      {/* Main Analytical Core Table Shell */}
      {loading ? (
        <div className="w-full h-48 flex items-center justify-center border border-dashed border-slate-200 rounded-2xl bg-white">
          <p className="text-xs font-semibold text-slate-400 animate-pulse">Fetching records from Supabase clustering framework...</p>
        </div>
      ) : (
        <Card className="overflow-hidden border-slate-200 shadow-sm rounded-2xl bg-white">
          <div className="w-full overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader className="bg-slate-50/70 border-b border-slate-100">
                <TableRow>
                  <TableHead onClick={() => handleSort("name")} className="cursor-pointer select-none text-xs font-bold text-slate-700 h-11 hover:bg-slate-100/50 transition-colors">
                    <div className="flex items-center">University Name <SortIcon columnKey="name" /></div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("slug")} className="cursor-pointer select-none text-xs font-bold text-slate-700 h-11 hover:bg-slate-100/50 transition-colors">
                    <div className="flex items-center">Slug Reference <SortIcon columnKey="slug" /></div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("is_active")} className="cursor-pointer select-none text-xs font-bold text-slate-700 h-11 hover:bg-slate-100/50 transition-colors">
                    <div className="flex items-center">Status <SortIcon columnKey="is_active" /></div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("created_at")} className="cursor-pointer select-none text-xs font-bold text-slate-700 h-11 hover:bg-slate-100/50 transition-colors">
                    <div className="flex items-center">Created At <SortIcon columnKey="created_at" /></div>
                  </TableHead>
                  <TableHead className="text-right text-xs font-bold text-slate-700 h-11 pr-6">Action Hub</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-32 text-xs font-medium text-slate-400">
                      No matching records structural blocks detected in matrix.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((row) => (
                    <TableRow key={row.id} className="hover:bg-slate-50/40 border-b border-slate-100 transition-colors group">
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-center p-1 overflow-hidden shrink-0">
                            {row.logo_url ? (
                              <img src={row.logo_url} alt="Emblem" className="w-full h-full object-contain" />
                            ) : <GraduationCap className="h-4 w-4 text-slate-400" />}
                          </div>
                          <span className="font-extrabold text-xs text-slate-800 line-clamp-1">{row.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3"><Badge variant="outline" className="font-mono text-[10px] tracking-tight bg-slate-50 text-slate-600 border-slate-200 rounded-lg">{row.slug}</Badge></TableCell>
                      <TableCell className="py-3">
                        {row.is_active ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-none rounded-full text-[10px] px-2.5 py-0.5">Active</Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-400 border border-slate-200 shadow-none rounded-full text-[10px] px-2.5 py-0.5">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-3 text-xs font-medium text-slate-500">{new Date(row.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</TableCell>
                      <TableCell className="py-3 pr-6 text-right">
                        <div className="flex justify-end gap-1.5 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="outline" onClick={() => triggerEditModal(row)} className="h-8 w-8 rounded-lg border-slate-200 text-slate-600 hover:text-slate-900 bg-white shadow-sm">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="outline" onClick={() => setDeleteId(row.id)} className="h-8 w-8 rounded-lg border-slate-200 text-rose-500 hover:text-rose-600 hover:bg-rose-50/50 bg-white shadow-sm">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Fully Managed Pagination Controller */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/30">
              <span className="text-[11px] font-bold text-slate-400">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <Button 
                  variant="outline" size="icon" 
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="h-8 w-8 rounded-lg border-slate-200 bg-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" size="icon" 
                  disabled={currentPage === totalPages} 
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="h-8 w-8 rounded-lg border-slate-200 bg-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ========================================================= */}
      {/* 1. STRUCTURAL ACTION MODAL: EDIT REGISTRY MODAL CONTAINER */}
      {/* ========================================================= */}
      <Dialog open={editRow !== null} onOpenChange={(open) => !open && setEditRow(null)}>
        <DialogContent className="sm:max-w-[550px] rounded-2xl border-slate-200 bg-white p-6 gap-0 overflow-y-auto max-h-[90vh]">
          <DialogHeader className="pb-4 border-b border-slate-100">
            <DialogTitle className="text-xl font-black text-slate-900">Update Profile Blueprint</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-0.5">Modify core institutional variables and sync directly to Supabase Storage structures.</DialogDescription>
          </DialogHeader>

          <form onSubmit={updateFormik.handleSubmit} className="space-y-5 pt-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs font-bold text-slate-700">University Title</Label>
                <Input 
                  name="name"
                  value={updateFormik.values.name}
                  onChange={(e) => {
                    updateFormik.handleChange(e);
                    if (!updateFormik.touched.slug) updateFormik.setFieldValue("slug", slugify(e.target.value));
                  }}
                  className="h-10 border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs font-bold text-slate-700">Slug Pointer</Label>
                <Input name="slug" value={updateFormik.values.slug} onChange={updateFormik.handleChange} className="h-10 border-slate-200 rounded-xl text-xs font-mono" />
              </div>
            </div>

            {/* Asset Modifier Integration Blocks */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Emblem Logo Asset</Label>
                <div className="relative">
                  {logoPreview ? (
                    <div className="relative flex items-center justify-center w-full h-24 border border-slate-200 bg-slate-50 rounded-xl overflow-hidden">
                      <img src={logoPreview} className="h-12 w-12 object-contain" alt="Preview" />
                      <button type="button" onClick={() => { setLogoPreview(null); updateFormik.setFieldValue("logoFile", null); }} className="absolute top-1.5 right-1.5 p-1 rounded-md bg-white border border-slate-200 text-slate-400 hover:text-rose-500"><X className="h-3 w-3" /></button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50/50">
                      <UploadCloud className="h-5 w-5 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-600 mt-1">Upload Logo</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { if(e.target.files?.[0]){ updateFormik.setFieldValue("logoFile", e.target.files[0]); setLogoPreview(URL.createObjectURL(e.target.files[0])); } }} />
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Cover Landscape Banner</Label>
                <div className="relative">
                  {bannerPreview ? (
                    <div className="relative w-full h-24 border border-slate-200 rounded-xl overflow-hidden">
                      <img src={bannerPreview} className="w-full h-full object-cover" alt="Preview" />
                      <button type="button" onClick={() => { setBannerPreview(null); updateFormik.setFieldValue("bannerFile", null); }} className="absolute top-1.5 right-1.5 p-1 rounded-md bg-white border border-slate-200 text-slate-400 hover:text-rose-500"><X className="h-3 w-3" /></button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50/50">
                      <UploadCloud className="h-5 w-5 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-600 mt-1">Upload Banner</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { if(e.target.files?.[0]){ updateFormik.setFieldValue("bannerFile", e.target.files[0]); setBannerPreview(URL.createObjectURL(e.target.files[0])); } }} />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Profile Synopsis</Label>
              <Textarea name="description" rows={3} value={updateFormik.values.description} onChange={updateFormik.handleChange} className="border-slate-200 rounded-xl text-xs resize-none" />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
              <Label className="text-xs font-bold text-slate-800">Public Stream Visibility</Label>
              <Switch checked={updateFormik.values.isActive} onCheckedChange={(val) => updateFormik.setFieldValue("isActive", val)} className="data-[state=checked]:bg-emerald-500" />
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100 gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setEditRow(null)} className="rounded-xl text-xs px-4 h-9">Dismiss</Button>
              <Button type="submit" disabled={updating} className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs px-5 h-9 shadow-sm">
                {updating ? "Syncing Pipelines..." : "Apply Updates"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* 2. STRUCTURAL ACTION MODAL: DESTRUCTIVE DELETE MODAL       */}
      {/* ========================================================= */}
      <Dialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl border-slate-200 bg-white p-6 gap-0">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-slate-900">Purge Registry Architecture?</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              This structural action will immediately drop the selected university entity from the core relational index table. **This cannot be reversed.**
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-6 mt-6 border-t border-slate-100 gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setDeleteId(null)} className="rounded-xl text-xs px-4 h-9">Retain Entity</Button>
            <Button type="button" onClick={executeDeletion} disabled={deleting} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs px-5 h-9 shadow-sm">
              {deleting ? "Purging Record..." : "Confirm Purge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}