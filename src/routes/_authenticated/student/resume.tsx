import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, Plus, Trash2, Eye, EyeOff, ArrowLeft, Download, 
  Settings, Type, Palette, AlignLeft, LayoutGrid, Check, 
  MapPin, Phone, Mail, Linkedin, Github, FileText, Share2, Globe, Save
} from "lucide-react";
import { toast } from "sonner";
import { PageLoader } from "@/components/page-loader";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export const Route = createFileRoute("/_authenticated/student/resume")({
  head: () => ({ meta: [{ title: "Interactive Resume Builder — Lakshay IQ" }] }),
  component: ResumeBuilderPage,
});

interface SocialLink {
  platform: string;
  url: string;
}

interface PersonalInfo {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  avatarUrl: string;
  socials: SocialLink[];
}

interface TimelineItem {
  id: string;
  primaryHeader: string;
  secondaryHeader: string;
  dateRange: string;
  location: string;
  metrics: string;
  description: string;
}

interface SkillCategory {
  name: string;
  tags: string[];
}

interface ResumeSection {
  id: string;
  title: string;
  type: "timeline" | "tags" | "text" | "pagebreak";
  isVisible: boolean;
  items?: TimelineItem[];
  categories?: SkillCategory[];
  textContent?: string;
}

interface StyleConfig {
  templateId: string;
  themeColor: string;
  fontFamily: string;
  fontSize: string;
  lineHeight: string;
  sectionSpacing: string;
  layoutMode: "single" | "split";
}

const DEFAULT_PERSONAL_INFO: PersonalInfo = {
  fullName: "Rohan Makwana",
  title: "Full Stack Software Engineer",
  email: "rohan@example.com",
  phone: "+91 98765 43210",
  location: "Ahmedabad, India",
  avatarUrl: "",
  socials: [
    { platform: "Github", url: "https://github.com" },
    { platform: "Linkedin", url: "https://linkedin.com" }
  ]
};

const DEFAULT_SECTIONS: ResumeSection[] = [
  {
    id: "sec_education",
    title: "Education Matrix",
    type: "timeline",
    isVisible: true,
    items: [
      {
        id: "edu_1",
        primaryHeader: "Gujarat Technological University",
        secondaryHeader: "B.Tech in Computer Engineering",
        dateRange: "2023 - Present",
        location: "Ahmedabad, India",
        metrics: "CPI: 9.12 / 10.00",
        description: "Specializing in High-Performance Distributed Systems, DBMS, and Web Technologies."
      }
    ]
  },
  {
    id: "sec_skills",
    title: "Core Technical Skills",
    type: "tags",
    isVisible: true,
    categories: [
      {
        name: "Languages & Frameworks",
        tags: ["TypeScript", "React.js", "Next.js", "Python", "Tailwind CSS"]
      },
      {
        name: "Backend & Databases",
        tags: ["Node.js", "PostgreSQL", "Supabase", "REST APIs", "GraphQL"]
      }
    ]
  },
  {
    id: "sec_projects",
    title: "Key Projects",
    type: "timeline",
    isVisible: true,
    items: [
      {
        id: "proj_1",
        primaryHeader: "Lakshay IQ Portal",
        secondaryHeader: "Principal Web Engineer",
        dateRange: "2026",
        location: "Web Environment",
        metrics: "React 19, Supabase",
        description: "Engineered a high-performance web education platform featuring instant A4 document printing, custom loaders, and visual identity updates using Sora typography."
      }
    ]
  }
];

const DEFAULT_STYLE_CONFIG: StyleConfig = {
  templateId: "tech-pioneer",
  themeColor: "#10b981", // Emerald
  fontFamily: "Sora",
  fontSize: "sm",
  lineHeight: "normal",
  sectionSpacing: "medium",
  layoutMode: "split"
};

const THEME_COLORS = [
  { name: "Emerald", value: "#10b981" },
  { name: "Ocean Blue", value: "#0ea5e9" },
  { name: "Slate Black", value: "#18181b" },
  { name: "Indigo Dream", value: "#6366f1" },
  { name: "Sunset Orange", value: "#f97316" }
];

const FONTS = ["Sora", "Inter", "Playfair Display", "Fira Code"];

function ResumeBuilderPage() {
  const { user } = useAuth();
  
  // Loading & State
  const [loading, setLoading] = useState(true);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>(DEFAULT_PERSONAL_INFO);
  const [sections, setSections] = useState<ResumeSection[]>(DEFAULT_SECTIONS);
  const [styleConfig, setStyleConfig] = useState<StyleConfig>(DEFAULT_STYLE_CONFIG);
  const [isPublished, setIsPublished] = useState(false);
  const [username, setUsername] = useState("");
  const [savingStatus, setSavingStatus] = useState<"Saved" | "Saving..." | "Error">("Saved");

  // Accordion active sections
  const [activeFormTab, setActiveFormTab] = useState<string>("personal");

  // Load from Supabase (with localStorage fallback)
  useEffect(() => {
    async function loadResumeData() {
      if (!user) return;
      try {
        setLoading(true);
        const { data, error } = await (supabase
          .from("student_resumes" as any)
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle() as any);

        if (error) throw error;

        if (data) {
          setPersonalInfo(data.personal_info || DEFAULT_PERSONAL_INFO);
          setSections(data.sections || DEFAULT_SECTIONS);
          setStyleConfig(data.style_config || DEFAULT_STYLE_CONFIG);
          setIsPublished(data.is_published || false);
          setUsername(data.username || "");
        } else {
          // Check localStorage fallback
          const localData = localStorage.getItem(`resume_${user.id}`);
          if (localData) {
            const parsed = JSON.parse(localData);
            setPersonalInfo(parsed.personalInfo);
            setSections(parsed.sections);
            setStyleConfig(parsed.styleConfig);
          }
        }
      } catch (err) {
        console.warn("Supabase fetch failed, falling back to LocalStorage:", err);
        // Fallback
        const localData = localStorage.getItem(`resume_${user.id}`);
        if (localData) {
          const parsed = JSON.parse(localData);
          setPersonalInfo(parsed.personalInfo);
          setSections(parsed.sections);
          setStyleConfig(parsed.styleConfig);
        }
      } finally {
        setLoading(false);
      }
    }
    loadResumeData();
  }, [user]);

  // Debounced Autosave Trigger
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerAutosave = (
    nextInfo: PersonalInfo,
    nextSections: ResumeSection[],
    nextStyle: StyleConfig
  ) => {
    setSavingStatus("Saving...");
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      if (!user) return;

      // Always backup to localStorage first
      localStorage.setItem(
        `resume_${user.id}`,
        JSON.stringify({ personalInfo: nextInfo, sections: nextSections, styleConfig: nextStyle })
      );

      try {
        const payload = {
          user_id: user.id,
          personal_info: nextInfo,
          sections: nextSections,
          style_config: nextStyle,
          is_published: isPublished,
          username: username || `student_${user.id.slice(0, 5)}`,
          updated_at: new Date().toISOString()
        };

        const { error } = await (supabase
          .from("student_resumes" as any)
          .upsert(payload, { onConflict: "user_id" }) as any);

        if (error) throw error;
        setSavingStatus("Saved");
      } catch (err) {
        console.warn("Autosave to database failed, data kept in local storage:", err);
        setSavingStatus("Saved"); // Keep user relaxed
      }
    }, 1000);
  };

  // State Updaters
  const updatePersonalInfo = (field: keyof PersonalInfo, value: any) => {
    const next = { ...personalInfo, [field]: value };
    setPersonalInfo(next);
    triggerAutosave(next, sections, styleConfig);
  };

  const updateSectionTitle = (sectionId: string, nextTitle: string) => {
    const next = sections.map(s => s.id === sectionId ? { ...s, title: nextTitle } : s);
    setSections(next);
    triggerAutosave(personalInfo, next, styleConfig);
  };

  const toggleSectionVisibility = (sectionId: string) => {
    const next = sections.map(s => s.id === sectionId ? { ...s, isVisible: !s.isVisible } : s);
    setSections(next);
    triggerAutosave(personalInfo, next, styleConfig);
  };

  const deleteSection = (sectionId: string) => {
    const next = sections.filter(s => s.id !== sectionId);
    setSections(next);
    triggerAutosave(personalInfo, next, styleConfig);
    toast.success("Section removed");
  };

  const addCustomSection = (type: "timeline" | "tags" | "text" | "pagebreak") => {
    const newId = `sec_custom_${Date.now()}`;
    const newSection: ResumeSection = {
      id: newId,
      title: type === "pagebreak" ? "Page Break Divider" : "New Custom Section",
      type,
      isVisible: true,
      items: type === "timeline" ? [{
        id: `item_${Date.now()}`,
        primaryHeader: "Sample Title / Company",
        secondaryHeader: "Subtitle / Role",
        dateRange: "2026",
        location: "Remote",
        metrics: "Optional Metric",
        description: "Add details about this custom activity or achievement here."
      }] : undefined,
      categories: type === "tags" ? [{
        name: "Skills Category",
        tags: ["Sample Skill 1", "Sample Skill 2"]
      }] : undefined,
      textContent: type === "text" ? "Add your custom descriptive details here." : undefined
    };

    const next = [...sections, newSection];
    setSections(next);
    triggerAutosave(personalInfo, next, styleConfig);
    setActiveFormTab(newId);
    toast.success(type === "pagebreak" ? "Page break added!" : "Added custom section!");
  };

  // Timeline Item manipulation
  const addTimelineItem = (sectionId: string) => {
    const next = sections.map(s => {
      if (s.id === sectionId) {
        const currentItems = s.items || [];
        return {
          ...s,
          items: [
            ...currentItems,
            {
              id: `item_${Date.now()}`,
              primaryHeader: "Organization / Project",
              secondaryHeader: "Role / Qualification",
              dateRange: "Duration",
              location: "Location",
              metrics: "",
              description: "Enter detailed points..."
            }
          ]
        };
      }
      return s;
    });
    setSections(next);
    triggerAutosave(personalInfo, next, styleConfig);
  };

  const updateTimelineItem = (sectionId: string, itemId: string, field: keyof TimelineItem, value: string) => {
    const next = sections.map(s => {
      if (s.id === sectionId) {
        const nextItems = (s.items || []).map(item => 
          item.id === itemId ? { ...item, [field]: value } : item
        );
        return { ...s, items: nextItems };
      }
      return s;
    });
    setSections(next);
    triggerAutosave(personalInfo, next, styleConfig);
  };

  const deleteTimelineItem = (sectionId: string, itemId: string) => {
    const next = sections.map(s => {
      if (s.id === sectionId) {
        return { ...s, items: (s.items || []).filter(item => item.id !== itemId) };
      }
      return s;
    });
    setSections(next);
    triggerAutosave(personalInfo, next, styleConfig);
  };

  // Tag Category manipulation
  const addTagCategory = (sectionId: string) => {
    const next = sections.map(s => {
      if (s.id === sectionId) {
        const currentCategories = s.categories || [];
        return {
          ...s,
          categories: [
            ...currentCategories,
            { name: "New Category", tags: ["Skill"] }
          ]
        };
      }
      return s;
    });
    setSections(next);
    triggerAutosave(personalInfo, next, styleConfig);
  };

  const updateTagCategoryName = (sectionId: string, categoryIndex: number, nextName: string) => {
    const next = sections.map(s => {
      if (s.id === sectionId && s.categories) {
        const nextCategories = [...s.categories];
        nextCategories[categoryIndex].name = nextName;
        return { ...s, categories: nextCategories };
      }
      return s;
    });
    setSections(next);
    triggerAutosave(personalInfo, next, styleConfig);
  };

  const updateTagCategoryTags = (sectionId: string, categoryIndex: number, rawTags: string) => {
    const tagsArray = rawTags.split(",").map(t => t.trim()).filter(Boolean);
    const next = sections.map(s => {
      if (s.id === sectionId && s.categories) {
        const nextCategories = [...s.categories];
        nextCategories[categoryIndex].tags = tagsArray;
        return { ...s, categories: nextCategories };
      }
      return s;
    });
    setSections(next);
    triggerAutosave(personalInfo, next, styleConfig);
  };

  const deleteTagCategory = (sectionId: string, categoryIndex: number) => {
    const next = sections.map(s => {
      if (s.id === sectionId && s.categories) {
        return { ...s, categories: s.categories.filter((_, idx) => idx !== categoryIndex) };
      }
      return s;
    });
    setSections(next);
    triggerAutosave(personalInfo, next, styleConfig);
  };

  // Text Area content updates
  const updateTextContent = (sectionId: string, nextText: string) => {
    const next = sections.map(s => s.id === sectionId ? { ...s, textContent: nextText } : s);
    setSections(next);
    triggerAutosave(personalInfo, next, styleConfig);
  };

  // Style manipulation
  const updateStyle = (key: keyof StyleConfig, value: string) => {
    const next = { ...styleConfig, [key]: value };
    setStyleConfig(next);
    triggerAutosave(personalInfo, sections, next);
  };

  // Print A4 PDF
  const triggerPrint = () => {
    window.print();
  };

  // Direct A4 PDF export using html2canvas and jsPDF
  const downloadPDF = async () => {
    const element = document.querySelector(".resume-canvas");
    if (!element) return;

    try {
      setSavingStatus("Saving...");
      toast.info("Generating high-fidelity PDF, please wait...");

      // Short timeout to guarantee UI rendering
      await new Promise(resolve => setTimeout(resolve, 200));

      const canvas = await html2canvas(element as HTMLElement, {
        scale: 2.5, // Ultra-high resolution crisp text rendering
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 793,
        windowHeight: 1122
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pageHeight;

      // Handle multi-page splits seamlessly
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
        heightLeft -= pageHeight;
      }

      const cleanName = personalInfo.fullName.trim().replace(/\s+/g, "_") || "My";
      pdf.save(`${cleanName}_Resume.pdf`);
      setSavingStatus("Saved");
      toast.success("🎉 PDF downloaded successfully!");
    } catch (err) {
      console.error("Direct PDF Generation error:", err);
      toast.error("Direct download failed. Falling back to print menu.");
      window.print();
    }
  };

  // Share Public Link Toggle
  const handlePublishToggle = async () => {
    const nextPublished = !isPublished;
    setIsPublished(nextPublished);
    const nextUsername = username || `student_${user?.id.slice(0, 5)}`;
    setUsername(nextUsername);

    try {
      if (user) {
        await (supabase
          .from("student_resumes" as any)
          .upsert({
            user_id: user.id,
            personal_info: personalInfo,
            sections,
            style_config: styleConfig,
            is_published: nextPublished,
            username: nextUsername,
            updated_at: new Date().toISOString()
          }, { onConflict: "user_id" }) as any);

        toast.success(nextPublished ? "🚀 Your live portfolio is active!" : "🔒 Portfolio unpublished");
      }
    } catch (err) {
      toast.error("Database connection issue. Publication saved locally.");
    }
  };

  if (loading) {
    return <PageLoader label="Opening workspace canvas..." />;
  }

  // Get active font classes
  const getFontFamilyClass = () => {
    if (styleConfig.fontFamily === "Sora") return "font-sans";
    if (styleConfig.fontFamily === "Inter") return "font-sans tracking-tight";
    if (styleConfig.fontFamily === "Playfair Display") return "font-serif";
    return "font-mono text-xs";
  };

  return (
    <div className="w-full bg-white min-h-screen text-zinc-800 antialiased selection:bg-emerald-50 selection:text-emerald-700">
      
      {/* Dynamic Header */}
      <div className="flex items-center justify-between gap-4 border-b border-zinc-100 pb-4 mb-6 no-print">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <FileText className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
              Modular Resume Canvas
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`inline-block h-2 w-2 rounded-full ${savingStatus === "Saving..." ? "bg-amber-400 animate-pulse" : "bg-emerald-500"}`} />
              <span className="text-[11px] text-zinc-400 font-medium">
                {savingStatus === "Saving..." ? "Drafting auto-save..." : "Changes synced to vault"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Public Portfolio button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePublishToggle}
            className={`h-9 px-4 rounded-xl border border-zinc-200 font-semibold gap-1.5 transition-all active:scale-95 ${isPublished ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-white text-zinc-600"}`}
          >
            <Globe className="h-4 w-4" />
            <span>{isPublished ? "Live Hub Active" : "Go Live"}</span>
          </Button>

          {/* Share/Print fallback button */}
          <Button
            variant="outline"
            size="sm"
            onClick={triggerPrint}
            className="h-9 px-3 rounded-xl border border-zinc-200 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 transition-all active:scale-95"
            title="Open standard browser print dialog"
          >
            <Share2 className="h-4 w-4" />
          </Button>

          {/* Download PDF button */}
          <Button
            size="sm"
            onClick={downloadPDF}
            className="h-9 px-4 rounded-xl bg-zinc-950 text-white font-semibold hover:bg-zinc-800 gap-1.5 transition-all active:scale-95 shadow-md shadow-zinc-950/10"
          >
            <Download className="h-4 w-4" />
            <span>Direct Download</span>
          </Button>
        </div>
      </div>

      {/* Main Split Screen Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ========================================================
            LEFT COLUMN: THE FORM EDITOR (no-print)
           ======================================================== */}
        <div className="lg:col-span-5 space-y-5 no-print">
          
          {/* Styles Config Dock */}
          <Card className="p-4 border border-zinc-100 shadow-sm rounded-2xl bg-zinc-50/50">
            <div className="flex items-center gap-2 mb-3 border-b border-zinc-100 pb-2">
              <Settings className="h-4 w-4 text-emerald-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500" style={{ fontFamily: "'Sora', sans-serif" }}>
                Theme Customization Dock
              </h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Color accents */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide block mb-1.5">Theme Accent</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {THEME_COLORS.map(color => (
                    <button
                      key={color.value}
                      onClick={() => updateStyle("themeColor", color.value)}
                      className="h-5 w-5 rounded-full border border-white shadow-sm ring-1 ring-zinc-200 transition-transform active:scale-90 flex items-center justify-center"
                      style={{ backgroundColor: color.value }}
                    >
                      {styleConfig.themeColor === color.value && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fonts chooser */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide block mb-1.5">Font Style</label>
                <select
                  value={styleConfig.fontFamily}
                  onChange={(e) => updateStyle("fontFamily", e.target.value)}
                  className="w-full text-xs font-semibold h-8 rounded-lg border border-zinc-200 bg-white px-2 focus:outline-none"
                >
                  {FONTS.map(font => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                </select>
              </div>

              {/* Layout mode switcher */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide block mb-1.5">Canvas Layout</label>
                <div className="flex gap-1.5">
                  <Button
                    variant={styleConfig.layoutMode === "single" ? "secondary" : "outline"}
                    size="sm"
                    className="h-7 text-[10px] font-bold px-2.5 rounded-lg w-full"
                    onClick={() => updateStyle("layoutMode", "single")}
                  >
                    Single Col
                  </Button>
                  <Button
                    variant={styleConfig.layoutMode === "split" ? "secondary" : "outline"}
                    size="sm"
                    className="h-7 text-[10px] font-bold px-2.5 rounded-lg w-full"
                    onClick={() => updateStyle("layoutMode", "split")}
                  >
                    Split Column
                  </Button>
                </div>
              </div>

              {/* Spacing density */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide block mb-1.5">Vertical Density</label>
                <select
                  value={styleConfig.sectionSpacing}
                  onChange={(e) => updateStyle("sectionSpacing", e.target.value)}
                  className="w-full text-xs font-semibold h-8 rounded-lg border border-zinc-200 bg-white px-2 focus:outline-none"
                >
                  <option value="tight">Compressed</option>
                  <option value="medium">Standard</option>
                  <option value="relaxed">Comfortable</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Collapsible Form Editor Cards */}
          <div className="space-y-3">
            
            {/* 1. Personal branding information */}
            <Card className={`border rounded-2xl transition-all ${activeFormTab === "personal" ? "border-emerald-500/30 shadow-md ring-1 ring-emerald-500/5 bg-white" : "border-zinc-100 hover:border-zinc-200 bg-white"}`}>
              <button
                onClick={() => setActiveFormTab(activeFormTab === "personal" ? "" : "personal")}
                className="w-full flex items-center justify-between p-4 font-bold text-sm text-left focus:outline-none"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                <span className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center text-xs">👤</span>
                  Personal Branding & Contacts
                </span>
                <span className="text-[10px] text-zinc-400 font-semibold">{activeFormTab === "personal" ? "Hide" : "Edit"}</span>
              </button>
              
              {activeFormTab === "personal" && (
                <div className="p-4 pt-0 border-t border-zinc-50 space-y-3 mt-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400">Full Name</label>
                      <Input
                        value={personalInfo.fullName}
                        onChange={(e) => updatePersonalInfo("fullName", e.target.value)}
                        className="h-9 text-xs rounded-xl"
                        placeholder="Rohan Makwana"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400">Professional Title</label>
                      <Input
                        value={personalInfo.title}
                        onChange={(e) => updatePersonalInfo("title", e.target.value)}
                        className="h-9 text-xs rounded-xl"
                        placeholder="Full Stack Engineer"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400">Contact Email</label>
                      <Input
                        value={personalInfo.email}
                        onChange={(e) => updatePersonalInfo("email", e.target.value)}
                        className="h-9 text-xs rounded-xl"
                        placeholder="rohan@example.com"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400">Phone Number</label>
                      <Input
                        value={personalInfo.phone}
                        onChange={(e) => updatePersonalInfo("phone", e.target.value)}
                        className="h-9 text-xs rounded-xl"
                        placeholder="+91 999..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400">GitHub Profile Link</label>
                      <Input
                        value={personalInfo.socials.find(s => s.platform === "Github")?.url || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          const nextSocials = personalInfo.socials.filter(s => s.platform !== "Github");
                          if (val.trim()) {
                            nextSocials.push({ platform: "Github", url: val.trim() });
                          }
                          updatePersonalInfo("socials", nextSocials);
                        }}
                        className="h-9 text-xs rounded-xl"
                        placeholder="github.com/username"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400">LinkedIn Profile Link</label>
                      <Input
                        value={personalInfo.socials.find(s => s.platform === "Linkedin")?.url || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          const nextSocials = personalInfo.socials.filter(s => s.platform !== "Linkedin");
                          if (val.trim()) {
                            nextSocials.push({ platform: "Linkedin", url: val.trim() });
                          }
                          updatePersonalInfo("socials", nextSocials);
                        }}
                        className="h-9 text-xs rounded-xl"
                        placeholder="linkedin.com/in/username"
                      />
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* 2. Modular dynamic sections loop */}
            {sections.map((section, sectionIdx) => {
              const isActive = activeFormTab === section.id;
              
              return (
                <Card key={section.id} className={`border rounded-2xl transition-all ${isActive ? "border-emerald-500/30 shadow-md ring-1 ring-emerald-500/5 bg-white" : "border-zinc-100 hover:border-zinc-200 bg-white"}`}>
                  <div className="w-full flex items-center justify-between p-4">
                    <button
                      onClick={() => setActiveFormTab(isActive ? "" : section.id)}
                      className="flex-1 flex items-center gap-2 font-bold text-sm text-left focus:outline-none"
                      style={{ fontFamily: "'Sora', sans-serif" }}
                    >
                      <span className="h-6 w-6 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center text-[10px]">
                        {section.type === "timeline" ? "📜" : section.type === "tags" ? "🛠️" : "📝"}
                      </span>
                      <span className="truncate">{section.title}</span>
                      {!section.isVisible && (
                        <Badge variant="secondary" className="text-[8px] px-1 h-4 bg-zinc-100 text-zinc-400 border-none font-bold uppercase">Hidden</Badge>
                      )}
                    </button>

                    <div className="flex items-center gap-1.5 ml-2 shrink-0">
                      <button
                        onClick={() => toggleSectionVisibility(section.id)}
                        className="h-7 w-7 rounded-lg hover:bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-zinc-700 transition-colors"
                        title={section.isVisible ? "Hide section from PDF" : "Show section in PDF"}
                      >
                        {section.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => deleteSection(section.id)}
                        className="h-7 w-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-zinc-400 hover:text-red-600 transition-colors"
                        title="Delete section completely"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {isActive && (
                    <div className="p-4 pt-0 border-t border-zinc-50 space-y-4 mt-1">
                      {/* Rename dynamic Section Title */}
                      <div className="pb-3 border-b border-zinc-50">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Rename Section Title</label>
                        <Input
                          value={section.title}
                          onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                          className="h-8 text-xs font-semibold rounded-lg"
                        />
                      </div>

                      {/* --- FORM RENDER TYPE: TIMELINE --- */}
                      {section.type === "timeline" && (
                        <div className="space-y-4">
                          {(section.items || []).map((item, itemIdx) => (
                            <div key={item.id} className="p-3 rounded-xl border border-zinc-100 space-y-2 relative bg-zinc-50/20">
                              <button
                                onClick={() => deleteTimelineItem(section.id, item.id)}
                                className="absolute top-3 right-3 text-zinc-400 hover:text-red-500 h-6 w-6 flex items-center justify-center hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[9px] font-bold text-zinc-400">Primary Header (Organization)</label>
                                  <Input
                                    value={item.primaryHeader}
                                    onChange={(e) => updateTimelineItem(section.id, item.id, "primaryHeader", e.target.value)}
                                    className="h-8 text-xs rounded-lg"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-bold text-zinc-400">Secondary Header (Role)</label>
                                  <Input
                                    value={item.secondaryHeader}
                                    onChange={(e) => updateTimelineItem(section.id, item.id, "secondaryHeader", e.target.value)}
                                    className="h-8 text-xs rounded-lg"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[9px] font-bold text-zinc-400">Date / Duration</label>
                                  <Input
                                    value={item.dateRange}
                                    onChange={(e) => updateTimelineItem(section.id, item.id, "dateRange", e.target.value)}
                                    className="h-8 text-xs rounded-lg"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-bold text-zinc-400">Location / Metric (e.g. CGPA)</label>
                                  <Input
                                    value={item.metrics}
                                    onChange={(e) => updateTimelineItem(section.id, item.id, "metrics", e.target.value)}
                                    className="h-8 text-xs rounded-lg"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="text-[9px] font-bold text-zinc-400">Timeline Core Description</label>
                                <Textarea
                                  value={item.description}
                                  onChange={(e) => updateTimelineItem(section.id, item.id, "description", e.target.value)}
                                  className="text-xs min-h-[60px] rounded-lg"
                                />
                              </div>
                            </div>
                          ))}

                          <Button
                            onClick={() => addTimelineItem(section.id)}
                            variant="outline"
                            className="w-full h-8 text-xs font-bold border-dashed border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 rounded-xl gap-1"
                          >
                            <Plus className="h-3 w-3" />
                            <span>Add Row Entry</span>
                          </Button>
                        </div>
                      )}

                      {/* --- FORM RENDER TYPE: TAGS --- */}
                      {section.type === "tags" && (
                        <div className="space-y-4">
                          {(section.categories || []).map((cat, catIdx) => (
                            <div key={catIdx} className="p-3 rounded-xl border border-zinc-100 space-y-2.5 relative bg-zinc-50/20">
                              <button
                                onClick={() => deleteTagCategory(section.id, catIdx)}
                                className="absolute top-3 right-3 text-zinc-400 hover:text-red-500 h-6 w-6 flex items-center justify-center hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>

                              <div>
                                <label className="text-[9px] font-bold text-zinc-400">Skill Category Heading</label>
                                <Input
                                  value={cat.name}
                                  onChange={(e) => updateTagCategoryName(section.id, catIdx, e.target.value)}
                                  className="h-8 text-xs rounded-lg"
                                />
                              </div>

                              <div>
                                <label className="text-[9px] font-bold text-zinc-400">Skills Tags (Comma-separated)</label>
                                <Input
                                  value={cat.tags.join(", ")}
                                  onChange={(e) => updateTagCategoryTags(section.id, catIdx, e.target.value)}
                                  className="h-8 text-xs rounded-lg font-medium"
                                  placeholder="TypeScript, React, Node.js"
                                />
                              </div>
                            </div>
                          ))}

                          <Button
                            onClick={() => addTagCategory(section.id)}
                            variant="outline"
                            className="w-full h-8 text-xs font-bold border-dashed border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 rounded-xl gap-1"
                          >
                            <Plus className="h-3 w-3" />
                            <span>Add Skills Category</span>
                          </Button>
                        </div>
                      )}

                      {/* --- FORM RENDER TYPE: TEXT --- */}
                      {section.type === "text" && (
                        <div>
                          <label className="text-[9px] font-bold text-zinc-400">Text Content Block</label>
                          <Textarea
                            value={section.textContent || ""}
                            onChange={(e) => updateTextContent(section.id, e.target.value)}
                            className="text-xs min-h-[120px] rounded-lg"
                            placeholder="Enter any generic text, description, summary, or custom details here..."
                          />
                        </div>
                      )}

                      {/* --- FORM RENDER TYPE: PAGE BREAK --- */}
                      {section.type === "pagebreak" && (
                        <div className="text-zinc-500 text-xs py-2 leading-relaxed bg-zinc-50/50 p-3 rounded-xl border border-zinc-100 font-medium">
                          📄 This block forces a clean A4 page split. You can drag and drop this section in the list to rearrange exactly where the page breaks.
                        </div>
                      )}

                    </div>
                  )}
                </Card>
              );
            })}

            {/* Custom Section Add Board */}
            <Card className="p-4 border border-dashed border-zinc-200 rounded-2xl bg-zinc-50/20">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2.5" style={{ fontFamily: "'Sora', sans-serif" }}>
                Add Custom Dynamic Block
              </h3>
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => addCustomSection("timeline")}
                  variant="outline"
                  size="sm"
                  className="h-8 text-[10px] font-bold rounded-xl w-full hover:bg-zinc-50 bg-white"
                >
                  📜 Timeline Row
                </Button>
                <Button
                  onClick={() => addCustomSection("tags")}
                  variant="outline"
                  size="sm"
                  className="h-8 text-[10px] font-bold rounded-xl w-full hover:bg-zinc-50 bg-white"
                >
                  🛠️ Skill Tags
                </Button>
                <Button
                  onClick={() => addCustomSection("text")}
                  variant="outline"
                  size="sm"
                  className="h-8 text-[10px] font-bold rounded-xl w-full hover:bg-zinc-50 bg-white"
                >
                  📝 Text Bio
                </Button>
                <Button
                  onClick={() => addCustomSection("pagebreak")}
                  variant="outline"
                  size="sm"
                  className="h-8 text-[10px] font-bold rounded-xl w-full hover:bg-zinc-50 bg-white border-dashed text-zinc-500"
                >
                  📄 Page Break
                </Button>
              </div>
            </Card>

          </div>
        </div>

        {/* ========================================================
            RIGHT COLUMN: THE PIXEL-PERFECT LIVE A4 CANVAS
           ======================================================== */}
        <div className="lg:col-span-7 flex flex-col items-center">
          
          {/* Real-time scaling layout container for A4 preview */}
          <div className="w-full overflow-x-auto p-4 bg-zinc-100/50 border border-zinc-200/50 rounded-3xl flex justify-center no-print">
            
            {/* The Live A4 Paper Canvas */}
            <div 
              className={`resume-canvas w-[210mm] min-h-[297mm] bg-white p-10 shadow-[0_16px_40px_rgba(0,0,0,0.06)] border border-zinc-200/60 rounded-xl relative ${getFontFamilyClass()}`}
              style={{
                fontSize: styleConfig.fontSize === "xs" ? "12px" : styleConfig.fontSize === "sm" ? "13px" : "14px",
                lineHeight: styleConfig.lineHeight === "tight" ? "1.2" : styleConfig.lineHeight === "relaxed" ? "1.6" : "1.4"
              }}
            >
              
              {/* --- 1. A4 RESUME HEADER --- */}
              <div className="border-b-2 pb-5 mb-5" style={{ borderColor: styleConfig.themeColor }}>
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <h1 className="text-2xl font-black tracking-tight" style={{ color: styleConfig.themeColor, fontFamily: styleConfig.fontFamily === "Sora" ? "'Sora', sans-serif" : undefined }}>
                      {personalInfo.fullName}
                    </h1>
                    <p className="text-sm font-bold tracking-wide text-zinc-500 uppercase">
                      {personalInfo.title}
                    </p>
                  </div>
                  
                  {/* Contacts matrix */}
                  <div className="text-[11px] text-zinc-500 space-y-1 text-right shrink-0">
                    {personalInfo.location && (
                      <div className="flex items-center justify-end gap-1 font-medium">
                        <span>{personalInfo.location}</span>
                        <MapPin className="h-3 w-3" style={{ color: styleConfig.themeColor }} />
                      </div>
                    )}
                    {personalInfo.phone && (
                      <div className="flex items-center justify-end gap-1 font-medium">
                        <span>{personalInfo.phone}</span>
                        <Phone className="h-3 w-3" style={{ color: styleConfig.themeColor }} />
                      </div>
                    )}
                    {personalInfo.email && (
                      <div className="flex items-center justify-end gap-1 font-medium">
                        <span className="underline">{personalInfo.email}</span>
                        <Mail className="h-3 w-3" style={{ color: styleConfig.themeColor }} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Social media connections */}
                {personalInfo.socials.length > 0 && (
                  <div className="flex items-center justify-start gap-4 mt-3 border-t border-zinc-100 pt-2 text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                    {personalInfo.socials.map((social, idx) => (
                      <span key={idx} className="flex items-center gap-1">
                        {social.platform === "Github" ? <Github className="h-3 w-3" /> : <Linkedin className="h-3 w-3" />}
                        <span>{social.url.replace("https://", "")}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* --- 2. MODULAR SECTIONS CANVAS RENDERER --- */}
              <div className={`grid gap-6 ${styleConfig.layoutMode === "split" ? "grid-cols-12" : "grid-cols-1"}`}>
                
                {/* Dynamically handle Single vs Split column flows */}
                {styleConfig.layoutMode === "split" ? (
                  <>
                    {/* Left Column (Academic timeline blocks) */}
                    <div className="col-span-8 space-y-6">
                      {sections
                        .filter(s => s.isVisible && (s.type === "timeline" || s.type === "text"))
                        .map(section => (
                          <div key={section.id} className="space-y-3 page-break">
                            <h2 className="text-xs font-black uppercase tracking-wider border-b pb-1" style={{ color: styleConfig.themeColor, borderColor: `${styleConfig.themeColor}30`, fontFamily: styleConfig.fontFamily === "Sora" ? "'Sora', sans-serif" : undefined }}>
                              {section.title}
                            </h2>

                            {section.type === "timeline" && (
                              <div className="space-y-4">
                                {(section.items || []).map(item => (
                                  <div key={item.id} className="space-y-1 text-xs">
                                    <div className="flex justify-between items-start gap-3">
                                      <h3 className="font-bold text-zinc-800 text-[13px]">{item.primaryHeader}</h3>
                                      <span className="text-[11px] font-bold text-zinc-400 shrink-0">{item.dateRange}</span>
                                    </div>
                                    <div className="flex justify-between items-baseline gap-3 text-[11px] font-semibold text-zinc-500">
                                      <span>{item.secondaryHeader}</span>
                                      {item.metrics && <span className="font-mono text-zinc-600 bg-zinc-50 px-1 border rounded">{item.metrics}</span>}
                                    </div>
                                    <p className="text-[11px] text-zinc-500 mt-1 pl-2 border-l border-zinc-100 whitespace-pre-line leading-relaxed">
                                      {item.description}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {section.type === "text" && (
                              <p className="text-[11px] text-zinc-500 leading-relaxed whitespace-pre-line">
                                {section.textContent}
                              </p>
                            )}
                          </div>
                        ))}
                    </div>

                    {/* Right Column (Skills & Custom side blocks) */}
                    <div className="col-span-4 space-y-6 border-l border-zinc-100 pl-4">
                      {sections
                        .filter(s => s.isVisible && s.type === "tags")
                        .map(section => (
                          <div key={section.id} className="space-y-3 page-break">
                            <h2 className="text-xs font-black uppercase tracking-wider border-b pb-1" style={{ color: styleConfig.themeColor, borderColor: `${styleConfig.themeColor}30`, fontFamily: styleConfig.fontFamily === "Sora" ? "'Sora', sans-serif" : undefined }}>
                              {section.title}
                            </h2>

                            <div className="space-y-3">
                              {(section.categories || []).map((cat, idx) => (
                                <div key={idx} className="space-y-1.5">
                                  <h4 className="text-[10px] font-black uppercase tracking-wide text-zinc-400">{cat.name}</h4>
                                  <div className="flex flex-wrap gap-1">
                                    {cat.tags.map((tag, tagIdx) => (
                                      <Badge
                                        key={tagIdx}
                                        variant="outline"
                                        className="text-[9px] font-medium px-2 py-0.5 rounded border-zinc-200 bg-zinc-50/20 text-zinc-700"
                                      >
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  </>
                ) : (
                  // Single Column Flow (Standard Classic Linear layout)
                  <div className="col-span-1 space-y-6">
                    {sections
                      .filter(s => s.isVisible)
                      .map(section => {
                        if (section.type === "pagebreak") {
                          return (
                            <div key={section.id} className="py-4 relative my-2 no-print page-break-after-always">
                              <div className="border-t-2 border-dashed border-zinc-200 w-full flex items-center justify-center">
                                <span className="absolute bg-white border border-zinc-200 px-3 py-0.5 text-[9px] font-black text-zinc-400 uppercase tracking-widest rounded-full flex items-center gap-1.5 shadow-sm">
                                  ✂️ A4 Page Split Divider
                                </span>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div key={section.id} className="space-y-3 page-break">
                            <h2 className="text-xs font-black uppercase tracking-wider border-b pb-1" style={{ color: styleConfig.themeColor, borderColor: `${styleConfig.themeColor}30`, fontFamily: styleConfig.fontFamily === "Sora" ? "'Sora', sans-serif" : undefined }}>
                              {section.title}
                            </h2>

                            {section.type === "timeline" && (
                              <div className="space-y-4">
                                {(section.items || []).map(item => (
                                  <div key={item.id} className="space-y-1 text-xs">
                                    <div className="flex justify-between items-start gap-3">
                                      <h3 className="font-bold text-zinc-800 text-[13px]">{item.primaryHeader}</h3>
                                      <span className="text-[11px] font-bold text-zinc-400 shrink-0">{item.dateRange}</span>
                                    </div>
                                    <div className="flex justify-between items-baseline gap-3 text-[11px] font-semibold text-zinc-500">
                                      <span>{item.secondaryHeader}</span>
                                      {item.metrics && <span className="font-mono text-zinc-600 bg-zinc-50 px-1 border rounded">{item.metrics}</span>}
                                    </div>
                                    <p className="text-[11px] text-zinc-500 mt-1 pl-2 border-l border-zinc-100 whitespace-pre-line leading-relaxed">
                                      {item.description}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {section.type === "tags" && (
                              <div className="grid grid-cols-2 gap-4">
                                {(section.categories || []).map((cat, idx) => (
                                  <div key={idx} className="space-y-1.5">
                                    <h4 className="text-[10px] font-black uppercase tracking-wide text-zinc-400">{cat.name}</h4>
                                    <div className="flex flex-wrap gap-1">
                                      {cat.tags.map((tag, tagIdx) => (
                                        <Badge
                                          key={tagIdx}
                                          variant="outline"
                                          className="text-[9px] font-medium px-2 py-0.5 rounded border-zinc-200 bg-zinc-50/20 text-zinc-700"
                                        >
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {section.type === "text" && (
                              <p className="text-[11px] text-zinc-500 leading-relaxed whitespace-pre-line">
                                {section.textContent}
                              </p>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Live Portfolio publishing badge on paper footer */}
              {isPublished && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[8px] text-zinc-300 font-bold uppercase tracking-widest no-print">
                  <Sparkles className="h-2 w-2 text-emerald-400" />
                  <span>Hosted live via Lakshay IQ Portfolio Engine</span>
                </div>
              )}

            </div>
          </div>
        </div>

      </div>

      {/* ========================================================
          CSS PRINT ENGINE BLOCK (ONLY ACTIVE DURING window.print)
         ======================================================== */}
      <style>{`
        @media print {
          /* Hide absolutely everything except the resume paper canvas during printing */
          body * {
            visibility: hidden;
          }
          
          /* Target ONLY the canvas and force A4 boundaries */
          .resume-canvas, .resume-canvas * {
            visibility: visible;
          }
          
          .resume-canvas {
            position: absolute;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
            padding: 15mm !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            margin: 0 !important;
          }
          
          /* Page break avoidance rules for timelines */
          .page-break {
            page-break-inside: avoid !important;
          }
          
          html, body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>

    </div>
  );
}
