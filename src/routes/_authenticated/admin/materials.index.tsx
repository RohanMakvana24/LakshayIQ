import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { useSupabaseTable } from "@/hooks/use-supabase-table";
import { Plus, Trash2, Edit3, Loader2, Layers, FileText, ExternalLink, ShieldAlert, FileUp, X, CheckCircle, HardDrive } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Row = { 
  id: string; 
  unit_id: string; 
  title: string; 
  file_url: string; 
  file_type: string; 
  file_size: string | null; 
  created_at: string 
};
type Unit = { id: string; title: string; unit_number: number };

export const Route = createFileRoute("/_authenticated/admin/materials/")({
  head: () => ({ meta: [{ title: "Unit Materials — Lakshay IQ" }] }),
  component: ManageMaterials,
});

function ManageMaterials() {
  const { data, loading, remove, update } = useSupabaseTable<Row>("unit_materials");
  const { data: units } = useSupabaseTable<Unit>("units", { orderBy: "unit_number", ascending: true });

  // Dialog, Processing, & Sync States
  const [selectedMaterial, setSelectedMaterial] = useState<Row | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Buffer Form States for Quick Edit
  const [unitId, setUnitId] = useState("");
  const [title, setTitle] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileType, setFileType] = useState("pdf");
  const [fileSize, setFileSize] = useState("");

  // Target Unit string builder mapping
  const resolveUnitLabel = (id: string) => {
    const u = units?.find((x) => x.id === id);
    return u ? `U${u.unit_number} · ${u.title}` : "—";
  };

  // Helper extension mapping logic
  const detectFileTypeGroup = (extension: string): string => {
    const maps: Record<string, string> = {
      pdf: "pdf", png: "image", jpg: "image", jpeg: "image", svg: "image", webp: "image",
      doc: "doc", docx: "doc", ppt: "doc", pptx: "doc", xls: "doc", xlsx: "doc", txt: "notes",
    };
    return maps[extension.toLowerCase()] || "doc";
  };

  // 1. Cloud Storage Object Auto-Purge Pipeline (On Delete Action)
  const handlePurgeMaterialRecord = async (material: Row) => {
    if (!confirm(`Are you sure you want to permanently delete: "${material.title}"?\nThis wipes the database registry and completely clears the binary attachment from cloud storage.`)) return;

    try {
      if (material.file_url.includes("/storage/v1/object/public/university-assets/")) {
        const extractedStoragePath = material.file_url.split("/storage/v1/object/public/university-assets/")[1];
        
        if (extractedStoragePath) {
          const { error: storageError } = await supabase.storage
            .from("university-assets")
            .remove([extractedStoragePath]);

          if (storageError) {
            console.warn("Storage object missing from bucket. Moving forward with database row purge:", storageError);
          }
        }
      }
      await remove(material.id);
    } catch (err) {
      console.error("Critical block caught inside storage purge lifecycle:", err);
    }
  };

  // 2. Direct Drawer File Replacement Pipeline with Auto-extracted Metadata
  const handleEditReplacementUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      try {
        setUploading(true);
        const fileExt = file.name.split(".").pop() || "pdf";
        const path = `materials/edit-sync-${Date.now()}.${fileExt}`;

        const { data: storageData, error } = await supabase.storage
          .from("university-assets")
          .upload(path, file, { cacheControl: "3600", upsert: true });

        if (error) throw error;

        const { data: publicLink } = supabase.storage.from("university-assets").getPublicUrl(storageData.path);
        
        // Auto-extract size & type and flush into active editing states instantly
        const parsedSize = (file.size / (1024 * 1024)).toFixed(2) + " MB";
        const resolvedType = detectFileTypeGroup(fileExt);

        setFileUrl(publicLink.publicUrl);
        setFileSize(parsedSize);
        setFileType(resolvedType);
      } catch (err) {
        console.error("Cloud document upload replacement buffer broken:", err);
      } finally {
        setUploading(false);
      }
    }
  };

  // Hydrate states with exact target parameters when Drawer opens
  const handleEditInitialize = (material: Row) => {
    setSelectedMaterial(material);
    setUnitId(material.unit_id);
    setTitle(material.title);
    setFileUrl(material.file_url);
    setFileType(material.file_type);
    setFileSize(material.file_size || "");
    setIsModalOpen(true);
  };

  // 3. Database Write Execution Trigger
  const handleCommitMaterialChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial || !unitId || !title.trim() || !fileUrl) return;

    try {
      setUpdating(true);
      const ok = await update(selectedMaterial.id, {
        unit_id: unitId,
        title: title.trim(),
        file_url: fileUrl,
        file_type: fileType,
        file_size: fileSize || null,
      });
      if (ok) setIsModalOpen(false);
    } catch (err) {
      console.error("Database modification entry transaction blocked:", err);
    } finally {
      setUpdating(false);
    }
  };

  // Modernized High Density DataTable Core Schema definition
  const columns: DataTableColumn<Row>[] = [
    {
      key: "title",
      header: "Resource Title / Node ID",
      sortable: true,
      sortValue: (r) => r.title,
      accessor: (r) => (
        <div className="flex flex-col truncate max-w-[240px] sm:max-w-xs">
          <span className="font-semibold text-neutral-900 text-[13px] tracking-tight leading-normal truncate">
            {r.title}
          </span>
          <span className="text-[10px] text-neutral-400 font-mono mt-0.5">
            Resource Ref: {r.id.substring(0, 8)}
          </span>
        </div>
      ),
    },
    {
      key: "unit",
      header: "Chapter Assignment Unit",
      accessor: (r) => (
        <span className="text-xs font-semibold text-neutral-700 truncate max-w-[180px] block">
          {resolveUnitLabel(r.unit_id)}
        </span>
      ),
    },
    {
      key: "type",
      header: "Class Format",
      sortable: true,
      sortValue: (r) => r.file_type,
      accessor: (r) => (
        <Badge 
          variant="outline" 
          className={cn(
            "text-[10px] font-mono font-bold uppercase rounded-md tracking-wider px-2 py-0.5 border bg-white shadow-none",
            r.file_type === "pdf" && "text-rose-600 border-rose-200 bg-rose-50/10",
            r.file_type === "notes" && "text-amber-600 border-amber-200 bg-amber-50/10",
            r.file_type === "image" && "text-blue-600 border-blue-200 bg-blue-50/10",
            r.file_type === "doc" && "text-indigo-600 border-indigo-200 bg-indigo-50/10"
          )}
        >
          {r.file_type}
        </Badge>
      ),
    },
    {
      key: "size",
      header: "Data Weight",
      accessor: (r) => (
        <span className="text-[11px] font-mono font-bold text-neutral-500">
          {r.file_size ?? "—"}
        </span>
      ),
    },
    {
      key: "file_url",
      header: "Attachment Link",
      accessor: (r) => (
        <a 
          href={r.file_url} 
          target="_blank" 
          rel="noreferrer" 
          className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-900 hover:underline bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-lg transition-colors"
        >
          <ExternalLink className="h-3 w-3 stroke-[2.2]" /> Launch File
        </a>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      accessor: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 text-neutral-400 hover:text-neutral-900 rounded-lg transition-colors"
            onClick={() => handleEditInitialize(r)}
          >
            <Edit3 className="h-4 w-4 stroke-[1.8]" />
          </Button>
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 text-neutral-400 hover:text-red-600 rounded-lg transition-colors"
            onClick={() => handlePurgeMaterialRecord(r)}
          >
            <Trash2 className="h-4 w-4 stroke-[1.8]" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full space-y-5 px-4 pb-6 max-w-full antialiased">
      
      {/* Upper Title Section Layout Row */}
      <div className="flex items-center justify-between border-b border-neutral-100 pb-5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 mb-0.5">
            <div className="h-4 w-4 rounded bg-neutral-900 flex items-center justify-center text-[9px] text-white font-bold font-mono">M</div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Library Assets Registry</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">Unit Study Materials</h1>
        </div>
        <Button asChild size="sm" className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-xl text-xs font-semibold h-9 px-4 shadow-sm">
          <Link to="/admin/materials/add">
            <Plus className="mr-1 h-3.5 w-3.5 stroke-[2.5]" /> Add Material
          </Link>
        </Button>
      </div>

      {/* Main Table Controller Conditional Router Node */}
      {loading ? (
        <div className="flex items-center justify-center py-24 border border-neutral-100 rounded-2xl bg-neutral-50/20">
          <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
        </div>
      ) : data && data.length > 0 ? (
        <div className="w-full">
          <DataTable<Row> 
            data={data} 
            columns={columns} 
            searchableKeys={["title"]} 
            rowKey={(r) => r.id} 
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-16 border border-dashed border-neutral-200 rounded-2xl bg-white p-6">
          <ShieldAlert className="h-5 w-5 text-neutral-400 mb-2" />
          <h3 className="text-xs font-semibold text-neutral-950">No academic documents staged in this repository</h3>
        </div>
      )}

      {/* Pop-up Interactive Modal for Inline Document Editing */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[480px] w-[95vw] rounded-2xl border-neutral-200 bg-white p-5 shadow-2xl focus:outline-none overflow-hidden">
          <DialogHeader className="space-y-1 pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-1.5 text-neutral-400 mb-0.5">
              <Layers className="h-3.5 w-3.5" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Asset Modifiers Mapping</span>
            </div>
            <DialogTitle className="text-base font-bold text-neutral-900 tracking-tight">Modify Material Details</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCommitMaterialChanges} className="space-y-4 pt-3">
            
            {/* Core Unit Selector Node */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-neutral-700">Target Chapter Module Alignment *</Label>
              <Select value={unitId} onValueChange={setUnitId} required>
                <SelectTrigger className="h-9 border-neutral-200 rounded-xl text-xs focus:ring-0 focus:border-neutral-400 bg-white">
                  <SelectValue placeholder="Map chapter node" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-neutral-200 bg-white shadow-lg max-h-[180px]">
                  {units?.map((u) => (
                    <SelectItem key={u.id} value={u.id} className="text-xs py-2 rounded-lg cursor-pointer">
                      Unit {u.unit_number} : {u.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Document Title Header String */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-neutral-700">Document Structural Title *</Label>
              <Input 
                required 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className="h-9 border-neutral-200 rounded-xl text-xs focus-visible:ring-0 focus-visible:border-neutral-400 bg-white"
              />
            </div>

            {/* Format Group Category Type Selector & Size Metric */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-700">Format Class *</Label>
                <Select value={fileType} onValueChange={setFileType} required>
                  <SelectTrigger className="h-9 border-neutral-200 rounded-xl text-xs focus:ring-0 focus:border-neutral-400 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-neutral-200 bg-white shadow-md">
                    <SelectItem value="pdf" className="text-xs cursor-pointer">PDF Document</SelectItem>
                    <SelectItem value="notes" className="text-xs cursor-pointer">Lecture Notes</SelectItem>
                    <SelectItem value="image" className="text-xs cursor-pointer">Blueprint/Image</SelectItem>
                    <SelectItem value="doc" className="text-xs cursor-pointer">Doc / Slide Matrix</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-700 flex items-center gap-0.5">
                  <HardDrive className="h-3 w-3 text-neutral-400" />
                  <span>Calculated Size</span>
                </Label>
                <Input 
                  value={fileSize} 
                  onChange={(e) => setFileSize(e.target.value)} 
                  placeholder="e.g., 2.30 MB"
                  className="h-9 border-neutral-200 rounded-xl text-xs focus-visible:ring-0 focus-visible:border-neutral-400 bg-white font-mono"
                />
              </div>
            </div>

            {/* Dynamic Re-Upload Processing Component */}
            <div className="space-y-1.5 pt-1">
              <Label className="text-xs font-bold text-neutral-700 flex items-center gap-1">
                <FileUp className="h-3.5 w-3.5 text-neutral-400" />
                <span>Overwrite Binary Object Attachment</span>
              </Label>
              
              <div className="flex items-center gap-3 p-3 border border-neutral-200 rounded-xl bg-neutral-50/50">
                <label className={cn(
                  "px-3 py-1.5 bg-white border border-neutral-200 text-neutral-700 rounded-lg text-[11px] font-bold shadow-sm hover:bg-neutral-50 cursor-pointer flex-shrink-0",
                  uploading && "opacity-40 cursor-wait pointer-events-none"
                )}>
                  {uploading ? "Uploading..." : "Replace File"}
                  <input type="file" accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.txt,image/*" className="hidden" onChange={handleEditReplacementUpload} />
                </label>
                <div className="truncate text-[11px] text-neutral-500 font-medium">
                  {fileUrl ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                      <CheckCircle className="h-3 w-3" /> Binary Injected
                    </span>
                  ) : "No binary pointer found"}
                </div>
              </div>
            </div>

            {/* Action Group Modals Drawer Buttons Footer */}
            <DialogFooter className="pt-3 border-t border-neutral-100 flex flex-row items-center justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl text-xs font-semibold h-9 px-4 border-neutral-200 hover:bg-neutral-50"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updating || uploading || !fileUrl}
                className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-xl text-xs font-semibold h-9 px-5 shadow-sm transition-all"
              >
                {updating ? "Syncing..." : "Update Resource"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}