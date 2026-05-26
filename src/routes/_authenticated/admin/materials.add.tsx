import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Layers, FileText, UploadCloud, X, Eye, HardDrive, Link2, GraduationCap, BookOpen, Calendar, BookMarked } from "lucide-react";
import { useSupabaseTable, slugify } from "@/hooks/use-supabase-table";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

// Database Relations Types
type University = { id: string; name: string };
type Course = { id: string; name: string; university_id: string; total_semesters: number };
type Sem = { id: string; course_id: string; semester_number: number; title: string | null };
type Subject = { id: string; semester_id: string; name: string; subject_code: string | null; slug: string };
type Unit = { id: string; title: string; unit_number: number; subject_id: string };

export const Route = createFileRoute("/_authenticated/admin/materials/add")({
  head: () => ({ meta: [{ title: "Add Material — Lakshay IQ" }] }),
  component: AddMaterial,
});

const MaterialSchema = Yup.object().shape({
  universityId: Yup.string().required("University selection is required"),
  courseId: Yup.string().required("Course selection is required"),
  semesterId: Yup.string().required("Semester selection is required"), // 🛠️ Updated to ID validation
  subjectId: Yup.string().required("Subject selection is required"),
  unitId: Yup.string().required("Unit allocation is required"),
  title: Yup.string()
    .min(3, "Title should be descriptive (Min 3 characters)")
    .required("Material structural title name is required"),
  fileUrl: Yup.string()
    .test("is-valid-url", "Invalid binary cloud URL stream", (value) => {
      if (!value) return true;
      const cleanValue = value.trim();
      try {
        if (/^https?:\/\//i.test(cleanValue)) {
          new URL(cleanValue);
          return true;
        }
        const domainPart = cleanValue.split("/")[0];
        if (!domainPart.includes(".")) return false;
        new URL(`https://${cleanValue}`);
        return true;
      } catch {
        return false;
      }
    })
    .required("Material source attachment file is required"),
  fileType: Yup.string().required("File extension type mapping is required"),
  fileSize: Yup.string().nullable(),
});

function AddMaterial() {
  const nav = useNavigate();
  const { insert } = useSupabaseTable("unit_materials");
  
  // Master Data Fetching from Supabase
  const { data: universities, loading: loadingUniversities } = useSupabaseTable<University>("universities", { orderBy: "name" });
  const { data: allCourses } = useSupabaseTable<Course>("courses", { orderBy: "name" });
  const { data: allSemesters } = useSupabaseTable<Sem>("semesters"); 
  const { data: allSubjects } = useSupabaseTable<Subject>("subjects", { orderBy: "name" });
  const { data: allUnits } = useSupabaseTable<Unit>("units", { orderBy: "unit_number", ascending: true });
  
  // Dynamic Filtered States
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [filteredSemesters, setFilteredSemesters] = useState<Sem[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<Unit[]>([]);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localFileName, setLocalFileName] = useState("");
  const [sourceTab, setSourceTab] = useState<"upload" | "url">("upload");

  const formik = useFormik({
    initialValues: {
      universityId: "",
      courseId: "",
      semesterId: "", // 🛠️ હવે આપણે સીધું semesterId જ સ્ટોર કરીશું
      subjectId: "",
      unitId: "",
      title: "",
      fileUrl: "",
      fileType: "pdf",
      fileSize: "",
    },
    validationSchema: MaterialSchema,
    onSubmit: async (values) => {
      try {
        setSaving(true);
        let finalFileUrl = values.fileUrl.trim();
        if (finalFileUrl && !/^https?:\/\//i.test(finalFileUrl)) {
          finalFileUrl = `https://${finalFileUrl}`;
        }

        const ok = await insert({
          unit_id: values.unitId,
          title: values.title.trim(),
          file_url: finalFileUrl,
          file_type: values.fileType,
          file_size: values.fileSize || null,
        });

        if (ok) {
          nav({ to: "/admin/materials" });
        }
      } catch (err) {
        console.error("Datastore write failure:", err);
      } finally {
        setSaving(false);
      }
    },
  });

  // 1. University બદલાય ત્યારે કોર્સ ફિલ્ટર કરો
  useEffect(() => {
    if (formik.values.universityId && allCourses) {
      const filtered = allCourses.filter(c => c.university_id === formik.values.universityId);
      setFilteredCourses(filtered);
    } else {
      setFilteredCourses([]);
    }
    formik.setFieldValue("courseId", "");
    formik.setFieldValue("semesterId", "");
    formik.setFieldValue("subjectId", "");
    formik.setFieldValue("unitId", "");
  }, [formik.values.universityId, allCourses]);

  // 2. Course બદલાય ત્યારે તે કોર્સના સેમેસ્ટર ફિલ્ટર કરો
  useEffect(() => {
    if (formik.values.courseId && allSemesters) {
      const filtered = allSemesters
        .filter(s => s.course_id === formik.values.courseId)
        .sort((a, b) => a.semester_number - b.semester_number);
      setFilteredSemesters(filtered);
    } else {
      setFilteredSemesters([]);
    }
    formik.setFieldValue("semesterId", "");
    formik.setFieldValue("subjectId", "");
    formik.setFieldValue("unitId", "");
  }, [formik.values.courseId, allSemesters]);

  // 3. SemesterId બદલાય ત્યારે તેના આધારે સબ્જેક્ટ ફિલ્ટર કરો
  useEffect(() => {
    if (formik.values.semesterId && allSubjects) {
      const filtered = allSubjects.filter(s => s.semester_id === formik.values.semesterId);
      setFilteredSubjects(filtered);
    } else {
      setFilteredSubjects([]);
    }
    formik.setFieldValue("subjectId", "");
    formik.setFieldValue("unitId", "");
  }, [formik.values.semesterId, allSubjects]);

  // 4. Subject બદલાય ત્યારે તેના આધારે યુનિટ્સ ફિલ્ટર કરો
  useEffect(() => {
    if (formik.values.subjectId && allUnits) {
      const filtered = allUnits.filter(u => u.subject_id === formik.values.subjectId);
      setFilteredUnits(filtered);
    } else {
      setFilteredUnits([]);
    }
    formik.setFieldValue("unitId", "");
  }, [formik.values.subjectId, allUnits]);

  const detectFileTypeGroup = (extension: string): string => {
    const maps: Record<string, string> = {
      pdf: "pdf", png: "image", jpg: "image", jpeg: "image", svg: "image", webp: "image",
      doc: "doc", docx: "doc", ppt: "doc", pptx: "doc", xls: "doc", xlsx: "doc", txt: "notes",
    };
    return maps[extension.toLowerCase()] || "doc";
  };

  const uploadMaterialAsset = async (file: File, unitTitle: string): Promise<string | null> => {
    try {
      setUploading(true);
      const fileExt = file.name.split(".").pop() || "pdf";
      const cleanUnitSlug = slugify(unitTitle || "material");
      const fileName = `materials/${cleanUnitSlug}-${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("university-assets")
        .upload(fileName, file, { cacheControl: "3600", upsert: true });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from("university-assets")
        .getPublicUrl(data.path);

      const calculatedSize = (file.size / (1024 * 1024)).toFixed(2) + " MB";
      const identifiedType = detectFileTypeGroup(fileExt);

      formik.setFieldValue("fileSize", calculatedSize);
      formik.setFieldValue("fileType", identifiedType);

      return publicUrlData.publicUrl;
    } catch (err) {
      console.error("Storage upload error:", err);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleFileProcessPipeline = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const targetUnit = filteredUnits.find(u => u.id === formik.values.unitId);

      if (!formik.values.unitId) {
        alert("Please select a valid Unit before uploading.");
        return;
      }

      setLocalFileName(file.name);
      const uploadedCloudUrl = await uploadMaterialAsset(file, `U${targetUnit?.unit_number}-${targetUnit?.title}`);
      if (uploadedCloudUrl) {
        formik.setFieldValue("fileUrl", uploadedCloudUrl);
      }
    }
  };

  const updateUrlMetadata = (urlValue: string) => {
    if (urlValue) {
      let urlWithProtocol = urlValue.trim();
      if (!/^https?:\/\//i.test(urlWithProtocol)) {
        urlWithProtocol = `https://${urlWithProtocol}`;
      }
      try {
        const parsedUrl = new URL(urlWithProtocol);
        const pathName = parsedUrl.pathname;
        const fileExt = pathName.split(".").pop() || "";
        if (fileExt && fileExt.length < 5) {
          const identifiedType = detectFileTypeGroup(fileExt);
          formik.setFieldValue("fileType", identifiedType);
        }
        setLocalFileName(pathName.substring(pathName.lastIndexOf("/") + 1) || "External Resource Link");
      } catch {
        setLocalFileName("External Asset Link");
      }
      if (!formik.values.fileSize) {
        formik.setFieldValue("fileSize", "Remote Stream");
      }
    } else {
      setLocalFileName("");
    }
  };

  const handleUrlInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const urlValue = e.target.value.trim();
    formik.setFieldValue("fileUrl", urlValue);
    updateUrlMetadata(urlValue);
  };

  const clearUploadedFileNode = () => {
    formik.setFieldValue("fileUrl", "");
    formik.setFieldValue("fileSize", "");
    setLocalFileName("");
  };

  const handleTabChange = (tab: "upload" | "url") => {
    setSourceTab(tab);
    clearUploadedFileNode();
  };

  const selectedUnit = filteredUnits.find(u => u.id === formik.values.unitId);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col gap-6 w-full max-w-full px-2 antialiased">
      
      {/* Top Header Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-100 pb-5">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 text-neutral-500 hover:text-neutral-900 pl-0 gap-1">
            <Link to="/admin/materials">
              <ArrowLeft className="h-4 w-4 stroke-[2.5]" /> Back to Archive
            </Link>
          </Button>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900">Upload Study Material</h1>
          <p className="text-xs text-neutral-500 mt-0.5">Publish syllabus references and study logs dynamically.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="sm" className="rounded-xl text-xs font-semibold px-4" asChild>
            <Link to="/admin/materials">Cancel</Link>
          </Button>
          <Button 
            type="button" 
            size="sm"
            onClick={() => formik.handleSubmit()} 
            disabled={saving || uploading || !formik.isValid}
            className="bg-neutral-900 text-white hover:bg-neutral-800 disabled:bg-neutral-100 disabled:text-neutral-400 rounded-xl text-xs font-semibold px-5 shadow-sm transition-all"
          >
            {saving ? "Deploying..." : "Deploy Study Resource"}
          </Button>
        </div>
      </div>

      {/* Workspace Matrix Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1 w-full">
        
        {/* Left Input Forms */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 border-neutral-200 shadow-sm rounded-2xl bg-white">
            <form onSubmit={formik.handleSubmit} className="space-y-5">
              
              {/* STEP 1: University & Course Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-700 flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5 text-neutral-400" />
                    <span>University *</span>
                  </Label>
                  <Select 
                    value={formik.values.universityId} 
                    onValueChange={(val) => formik.setFieldValue("universityId", val)}
                  >
                    <SelectTrigger className="h-10 border-neutral-200 rounded-xl text-xs bg-white">
                      <SelectValue placeholder={loadingUniversities ? "Loading..." : "Select University"} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-white shadow-md">
                      {universities?.map((uni) => (
                        <SelectItem key={uni.id} value={uni.id} className="text-xs cursor-pointer">{uni.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-700 flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5 text-neutral-400" />
                    <span>Course *</span>
                  </Label>
                  <Select 
                    value={formik.values.courseId} 
                    onValueChange={(val) => formik.setFieldValue("courseId", val)}
                    disabled={!formik.values.universityId}
                  >
                    <SelectTrigger className="h-10 border-neutral-200 rounded-xl text-xs bg-white">
                      <SelectValue placeholder="Select Course" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-white shadow-md">
                      {filteredCourses.map((course) => (
                        <SelectItem key={course.id} value={course.id} className="text-xs cursor-pointer">{course.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* STEP 2: DYNAMIC Semester & Subject Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-700 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                    <span>Semester *</span>
                  </Label>
                  <Select 
                    value={formik.values.semesterId} 
                    onValueChange={(val) => formik.setFieldValue("semesterId", val)}
                    disabled={!formik.values.courseId || filteredSemesters.length === 0}
                  >
                    <SelectTrigger className="h-10 border-neutral-200 rounded-xl text-xs bg-white">
                      <SelectValue placeholder="Select Semester" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-white shadow-md">
                      {filteredSemesters.map((sem) => (
                        <SelectItem key={sem.id} value={sem.id} className="text-xs cursor-pointer">
                          Semester {sem.semester_number} {sem.title ? `(${sem.title})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-700 flex items-center gap-1">
                    <BookMarked className="h-3.5 w-3.5 text-neutral-400" />
                    <span>Subject *</span>
                  </Label>
                  <Select 
                    value={formik.values.subjectId} 
                    onValueChange={(val) => formik.setFieldValue("subjectId", val)}
                    disabled={!formik.values.semesterId}
                  >
                    <SelectTrigger className="h-10 border-neutral-200 rounded-xl text-xs bg-white">
                      <SelectValue placeholder="Select Subject" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-white shadow-md">
                      {filteredSubjects.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id} className="text-xs cursor-pointer">{sub.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* STEP 3: Filtered Target Unit */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-700 flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5 text-neutral-400" />
                  <span>Target Unit Chapter *</span>
                </Label>
                <Select 
                  value={formik.values.unitId} 
                  onValueChange={(val) => formik.setFieldValue("unitId", val)}
                  disabled={!formik.values.subjectId}
                >
                  <SelectTrigger className="h-10 border-neutral-200 rounded-xl text-xs bg-white">
                    <SelectValue placeholder="Select filtered unit module" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-white shadow-lg max-h-[220px]">
                    {filteredUnits.map((u) => (
                      <SelectItem key={u.id} value={u.id} className="text-xs py-2 cursor-pointer">
                        Unit {u.unit_number} : {u.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t border-neutral-100 my-2 pt-2" />

              {/* Title Input String */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-700 flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5 text-neutral-400" />
                  <span>Document Resource Title *</span>
                </Label>
                <Input 
                  name="title"
                  value={formik.values.title} 
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="e.g., Chapter 2 Handouts - Database Normalization"
                  className={cn(
                    "h-10 border-neutral-200 rounded-xl text-xs bg-white",
                    formik.touched.title && formik.errors.title && "border-rose-400 focus-visible:border-rose-500"
                  )}
                />
                {formik.touched.title && formik.errors.title && (
                  <p className="text-[11px] font-medium text-rose-500 mt-1">{formik.errors.title}</p>
                )}
              </div>

              {/* Meta Format Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-700">Resource Category Class *</Label>
                  <Select value={formik.values.fileType} onValueChange={(val) => formik.setFieldValue("fileType", val)}>
                    <SelectTrigger className="h-10 border-neutral-200 rounded-xl text-xs bg-white">
                      <SelectValue placeholder="Format descriptor" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-white shadow-md">
                      <SelectItem value="pdf" className="text-xs">PDF Document</SelectItem>
                      <SelectItem value="notes" className="text-xs">Handwritten Notes</SelectItem>
                      <SelectItem value="image" className="text-xs">Graphic Blueprint/Image</SelectItem>
                      <SelectItem value="doc" className="text-xs">Word / PPT Presentation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-700 flex items-center gap-1">
                    <HardDrive className="h-3.5 w-3.5 text-neutral-400" />
                    <span>Calculated Capacity Size</span>
                  </Label>
                  <Input 
                    name="fileSize"
                    value={formik.values.fileSize} 
                    onChange={formik.handleChange}
                    placeholder="e.g., 2.4 MB"
                    className="h-10 border-neutral-200 rounded-xl text-xs bg-white"
                  />
                </div>
              </div>

              {/* File Attachment Tab Elements */}
              <div className="space-y-3 pt-2">
                <div className="flex p-1 bg-neutral-100 rounded-xl w-fit">
                  <button type="button" onClick={() => handleTabChange("upload")} className={cn("px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5", sourceTab === "upload" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500")}>
                    <UploadCloud className="h-3.5 w-3.5" /> Upload File
                  </button>
                  <button type="button" onClick={() => handleTabChange("url")} className={cn("px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5", sourceTab === "url" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500")}>
                    <Link2 className="h-3.5 w-3.5" /> Provide Asset URL
                  </button>
                </div>

                <div className="space-y-1.5">
                  {sourceTab === "upload" ? (
                    !formik.values.fileUrl ? (
                      <label className={cn("flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-neutral-200 rounded-2xl cursor-pointer hover:bg-neutral-50 transition-all group relative", (!formik.values.unitId || uploading) && "opacity-50 cursor-not-allowed pointer-events-none")}>
                        <div className="flex flex-col items-center justify-center text-center px-4">
                          {uploading ? (
                            <>
                              <Loader2 className="h-7 w-7 text-neutral-500 animate-spin mb-2" />
                              <p className="text-xs font-bold">Uploading binary chunks to storage bucket...</p>
                            </>
                          ) : (
                            <>
                              <UploadCloud className="h-7 w-7 text-neutral-400 mb-2" />
                              <p className="text-xs font-bold text-neutral-600">Select Document Asset</p>
                            </>
                          )}
                        </div>
                        <input type="file" className="hidden" onChange={handleFileProcessPipeline} disabled={!formik.values.unitId || uploading} />
                      </label>
                    ) : (
                      <div className="flex items-center justify-between p-4 border border-emerald-200 bg-emerald-50/30 rounded-2xl">
                        <span className="text-xs font-bold truncate pr-4">{localFileName || "File Staged"}</span>
                        <button type="button" onClick={clearUploadedFileNode} className="p-1.5 border rounded-lg text-neutral-400 hover:text-rose-500 bg-white"><X className="h-4 w-4" /></button>
                      </div>
                    )
                  ) : (
                    <div className="space-y-1.5 flex-1">
                      <div className="relative flex items-center">
                        <Link2 className="absolute left-3.5 h-4 w-4 text-neutral-400" />
                        <Input 
                          name="fileUrl" 
                          type="url" 
                          value={formik.values.fileUrl} 
                          onChange={handleUrlInputChange} 
                          onBlur={(e) => {
                            formik.handleBlur(e);
                            let val = e.target.value.trim();
                            if (val) {
                              let formattedUrl = val;
                              if (!/^https?:\/\//i.test(val)) {
                                formattedUrl = `https://${val}`;
                              }
                              formik.setFieldValue("fileUrl", formattedUrl);
                              updateUrlMetadata(formattedUrl);
                            }
                          }}
                          placeholder="https://example.com/file.pdf" 
                          disabled={!formik.values.unitId} 
                          className={cn(
                            "h-11 pl-10 pr-10 border-neutral-200 rounded-xl text-xs bg-white w-full",
                            formik.touched.fileUrl && formik.errors.fileUrl && "border-rose-400 focus-visible:border-rose-500"
                          )} 
                        />
                      </div>
                      {formik.touched.fileUrl && formik.errors.fileUrl && (
                        <p className="text-[11px] font-medium text-rose-500 mt-1">{formik.errors.fileUrl}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

            </form>
          </Card>
        </div>

        {/* Right Preview Pane */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <div className="flex items-center gap-2 text-neutral-400 px-1">
            <Eye className="h-4 w-4" /> <span className="text-xs font-bold uppercase tracking-wider">Live Preview</span>
          </div>

          <Card className="border border-neutral-200 rounded-2xl bg-white p-5 space-y-4">
            <div className="border-b border-neutral-100 pb-3 flex flex-col gap-1">
              <span className="text-[9px] font-mono font-bold uppercase text-neutral-400">Context Node</span>
              <span className="text-xs font-bold text-neutral-800 truncate">
                {selectedUnit ? `Unit {selectedUnit.unit_number} : {selectedUnit.title}` : "Awaiting Selection Steps..."}
              </span>
            </div>

            <div className="p-4 bg-neutral-50 border rounded-2xl">
              <h4 className="text-xs font-bold text-neutral-800 uppercase line-clamp-2">
                {formik.values.title || "Untitled Document"}
              </h4>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}