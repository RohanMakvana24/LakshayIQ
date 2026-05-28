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
  const [viewMode, setViewMode] = useState<"dashboard" | "editor">("dashboard");
  const [hasResumeData, setHasResumeData] = useState(false);
  const [resumesList, setResumesList] = useState<any[]>([]);
  const [activeResumeId, setActiveResumeId] = useState<string>("primary");
  const [showAdModal, setShowAdModal] = useState(false);
  const [adPendingResume, setAdPendingResume] = useState<any>(null);

  // Accordion active sections
  const [activeFormTab, setActiveFormTab] = useState<string>("personal");
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<"editor" | "preview">("editor");

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

        let loadedResumes: any[] = [];

        if (data) {
          setIsPublished(data.is_published || false);
          setUsername(data.username || "");

          // Check if sections contains our multi-resume vault
          if (data.sections && typeof data.sections === "object" && (data.sections as any).isVault) {
            loadedResumes = (data.sections as any).resumes || [];
          } else {
            // Convert legacy single resume to vault format
            loadedResumes = [
              {
                id: "primary",
                name: "Primary Professional Resume",
                personalInfo: data.personal_info || DEFAULT_PERSONAL_INFO,
                sections: data.sections || DEFAULT_SECTIONS,
                styleConfig: data.style_config || DEFAULT_STYLE_CONFIG,
                isPublished: data.is_published || false,
                updatedAt: data.updated_at || new Date().toISOString()
              }
            ];
          }
        } else {
          // Check localStorage fallback
          const localVault = localStorage.getItem(`resume_vault_${user.id}`);
          if (localVault) {
            loadedResumes = JSON.parse(localVault);
          } else {
            // Try legacy single resume storage
            const legacyLocal = localStorage.getItem(`resume_${user.id}`);
            if (legacyLocal) {
              const parsed = JSON.parse(legacyLocal);
              loadedResumes = [
                {
                  id: "primary",
                  name: "Primary Professional Resume",
                  personalInfo: parsed.personalInfo,
                  sections: parsed.sections,
                  styleConfig: parsed.styleConfig,
                  isPublished: false,
                  updatedAt: new Date().toISOString()
                }
              ];
            }
          }
        }

        if (loadedResumes.length > 0) {
          setResumesList(loadedResumes);
          setHasResumeData(true);

          // Find the active resume
          const active = loadedResumes[0];
          setActiveResumeId(active.id);
          setPersonalInfo(active.personalInfo);
          setSections(active.sections);
          setStyleConfig(active.styleConfig);
          setIsPublished(active.isPublished);
        } else {
          setHasResumeData(false);
        }
      } catch (err) {
        console.warn("Supabase fetch failed, falling back to LocalStorage:", err);
        const localVault = localStorage.getItem(`resume_vault_${user.id}`);
        if (localVault) {
          const parsed = JSON.parse(localVault);
          setResumesList(parsed);
          setHasResumeData(true);
          const active = parsed[0];
          setActiveResumeId(active.id);
          setPersonalInfo(active.personalInfo);
          setSections(active.sections);
          setStyleConfig(active.styleConfig);
          setIsPublished(active.isPublished);
        }
      } finally {
        setLoading(false);
      }
    }
    loadResumeData();
  }, [user]);

  // Unified Vault Cloud Saving
  const saveVault = async (showToast: boolean = false, customList?: any[]) => {
    if (!user) return;
    const targetList = customList || resumesList;
    if (targetList.length === 0) return;

    setSavingStatus("Saving...");

    // Find active resume
    const activeResume = targetList.find((r) => r.id === activeResumeId) || targetList[0];

    try {
      const vaultPayload = {
        isVault: true,
        resumes: targetList
      };

      await (supabase
        .from("student_resumes" as any)
        .upsert({
          user_id: user.id,
          personal_info: activeResume.personalInfo,
          sections: vaultPayload,
          style_config: activeResume.styleConfig,
          is_published: activeResume.isPublished,
          username: username || `student_${user.id.slice(0, 5)}`,
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id" }) as any);

      // Save to localStorage
      localStorage.setItem(`resume_vault_${user.id}`, JSON.stringify(targetList));

      setSavingStatus("Saved");
      if (showToast) {
        toast.success("🎉 Changes saved to cloud successfully!");
      }
    } catch (err) {
      console.error("Failed to save vault:", err);
      setSavingStatus("Error");
      if (showToast) {
        toast.error("Failed to save to cloud. Saved locally.");
      }
    }
  };

  // Debounced Autosave Trigger
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerAutosave = (
    nextInfo: PersonalInfo,
    nextSections: ResumeSection[],
    nextStyle: StyleConfig
  ) => {
    setSavingStatus("Saving...");
    setHasResumeData(true);

    // Update local state list immediately
    const updatedList = resumesList.map((r) =>
      r.id === activeResumeId
        ? {
          ...r,
          personalInfo: nextInfo,
          sections: nextSections,
          styleConfig: nextStyle,
          updatedAt: new Date().toISOString(),
        }
        : r
    );
    setResumesList(updatedList);

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      saveVault(false, updatedList);
    }, 1500);
  };

  const handleEditResume = (resume: any) => {
    setActiveResumeId(resume.id);
    setPersonalInfo(resume.personalInfo);
    setSections(resume.sections);
    setStyleConfig(resume.styleConfig);
    setIsPublished(resume.isPublished || false);
    setViewMode("editor");
  };

  const handleDuplicateResume = async (resume: any) => {
    const duplicated = {
      ...resume,
      id: `resume_${Date.now()}`,
      name: `${resume.name} (Copy)`,
      isPublished: false,
      updatedAt: new Date().toISOString()
    };
    const newList = [...resumesList, duplicated];
    setResumesList(newList);
    await saveVault(false, newList);
    toast.success("📋 Resume duplicated successfully!");
  };

  const handleDeleteResume = async (resumeId: string) => {
    if (resumesList.length <= 1) {
      toast.error("You must keep at least one resume template.");
      return;
    }
    if (confirm("Are you sure you want to delete this resume?")) {
      const newList = resumesList.filter((r) => r.id !== resumeId);
      setResumesList(newList);

      if (activeResumeId === resumeId) {
        const nextActive = newList[0];
        setActiveResumeId(nextActive.id);
        setPersonalInfo(nextActive.personalInfo);
        setSections(nextActive.sections);
        setStyleConfig(nextActive.styleConfig);
        setIsPublished(nextActive.isPublished);
      }

      await saveVault(false, newList);
      toast.success("❌ Resume deleted successfully!");
    }
  };

  const handleCreateNewResume = async () => {
    const resumeName = prompt("Enter a name for your new resume:", `Resume #${resumesList.length + 1}`);
    if (!resumeName) return;

    const newResume = {
      id: `resume_${Date.now()}`,
      name: resumeName,
      personalInfo: DEFAULT_PERSONAL_INFO,
      sections: DEFAULT_SECTIONS,
      styleConfig: DEFAULT_STYLE_CONFIG,
      isPublished: false,
      updatedAt: new Date().toISOString()
    };

    const newList = [...resumesList, newResume];
    setResumesList(newList);
    setActiveResumeId(newResume.id);
    setPersonalInfo(newResume.personalInfo);
    setSections(newResume.sections);
    setStyleConfig(newResume.styleConfig);
    setIsPublished(newResume.isPublished);
    setHasResumeData(true);
    setViewMode("editor");

    await saveVault(false, newList);
    toast.success("➕ Fresh template created!");
  };

  const downloadSpecificPDF = (resume: any) => {
    setAdPendingResume(resume);
    setShowAdModal(true);
  };

  const executeActualPDFDownload = async (resume: any) => {
    // Temporarily load this resume into active states
    setPersonalInfo(resume.personalInfo);
    setSections(resume.sections);
    setStyleConfig(resume.styleConfig);
    setIsPublished(resume.isPublished || false);

    toast.info("Generating PDF, please wait...");
    setTimeout(async () => {
      await executeActualActivePDFDownload();
    }, 400);
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

  // Direct A4 PDF export trigger
  const downloadPDF = () => {
    setAdPendingResume(null);
    setShowAdModal(true);
  };

  // Actual PDF Generator Engine
  const executeActualActivePDFDownload = async () => {
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

  if (viewMode === "dashboard") {
    return (
      <div className="w-full bg-zinc-50/40 min-h-screen text-zinc-800 antialiased no-print px-4 py-6 md:p-6">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-zinc-200/60 pb-5 mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-950" style={{ fontFamily: "'Sora', sans-serif" }}>
              Premium Resume & Portfolio Hub
            </h1>
            <p className="text-sm text-zinc-500 mt-1 font-medium">
              Create, customize, host and export your job-ready academic portfolio in seconds.
            </p>
          </div>

          <Button
            onClick={handleCreateNewResume}
            className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all active:scale-95 shadow-md shadow-emerald-600/10 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Resume</span>
          </Button>
        </div>

        {/* Main Dashboard View */}
        {!hasResumeData || resumesList.length === 0 ? (
          /* Empty State Dashboard Card */
          <div className="max-w-2xl mx-auto my-12 text-center p-6 sm:p-8 bg-white border border-zinc-200/60 rounded-3xl shadow-sm space-y-6">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center animate-bounce">
              <Sparkles className="h-8 w-8 text-emerald-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-zinc-900" style={{ fontFamily: "'Sora', sans-serif" }}>
                No Premium Resumes Created Yet
              </h2>
              <p className="text-sm text-zinc-500 max-w-md mx-auto leading-relaxed">
                Unlock professional career-ready options! Build a beautiful, live-saving A4 vector resume and digital portfolio hosted directly on Lakshay IQ.
              </p>
            </div>
            <Button
              onClick={handleCreateNewResume}
              size="lg"
              className="h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/20 gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>Get Started in 1-Click</span>
            </Button>
          </div>
        ) : (
          /* Resume List Grid Layout */
          <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400" style={{ fontFamily: "'Sora', sans-serif" }}>
                My Saved Resumes ({resumesList.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resumesList.map((resume) => {
                const isCurrentActive = resume.id === activeResumeId;
                return (
                  <Card key={resume.id} className={`bg-white border rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden ${isCurrentActive ? "border-emerald-500/80 ring-1 ring-emerald-500/10" : "border-zinc-200/60"}`}>

                    {/* Visual Card Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center border ${isCurrentActive ? "bg-emerald-50 border-emerald-100 text-emerald-500" : "bg-zinc-50 border-zinc-100 text-zinc-400"}`}>
                          <FileText className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-zinc-950 text-sm line-clamp-1" title={resume.name}>
                            {resume.name || "Untitled Resume"}
                          </h4>
                          <p className="text-[10px] text-zinc-400 font-medium">
                            Updated {new Date(resume.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Active Indicator or Badges */}
                      <div className="flex items-center gap-1">
                        {isCurrentActive && (
                          <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 font-black text-[9px] uppercase shadow-none tracking-wide rounded-lg px-2 py-0.5">
                            Active
                          </Badge>
                        )}
                        {resume.isPublished ? (
                          <Badge className="bg-blue-50 text-blue-600 border border-blue-100 font-black text-[9px] uppercase shadow-none tracking-wide rounded-lg px-2 py-0.5">
                            Live Portfolio
                          </Badge>
                        ) : (
                          <Badge className="bg-zinc-50 text-zinc-400 border border-zinc-100 font-black text-[9px] uppercase shadow-none tracking-wide rounded-lg px-2 py-0.5">
                            Draft
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Resume Snapshot details */}
                    <div className="bg-zinc-50/50 rounded-2xl p-4 border border-zinc-100/50 mb-5 space-y-2 text-xs">
                      <div className="flex justify-between items-center text-zinc-600">
                        <span className="font-bold text-zinc-900">{resume.personalInfo.fullName || "Name Not Set"}</span>
                      </div>
                      <p className="text-zinc-400 font-medium line-clamp-1">
                        {resume.personalInfo.title || "No Title Specified"}
                      </p>
                      <div className="text-[10px] text-zinc-400 font-medium flex items-center gap-1.5 pt-1 border-t border-zinc-100">
                        <MapPin className="h-3 w-3 shrink-0 text-zinc-300" />
                        <span className="line-clamp-1">{resume.personalInfo.location || "Location Not Set"}</span>
                      </div>
                    </div>

                    {/* Card Actions Footer row */}
                    <div className="flex items-center gap-2 mt-auto">
                      <Button
                        onClick={() => handleEditResume(resume)}
                        className="flex-1 h-9 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </Button>

                      <Button
                        onClick={() => downloadSpecificPDF(resume)}
                        variant="outline"
                        title="Download A4 PDF"
                        className="h-9 w-9 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 flex items-center justify-center cursor-pointer shrink-0"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        onClick={() => handleDuplicateResume(resume)}
                        variant="outline"
                        title="Duplicate Template"
                        className="h-9 w-9 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 flex items-center justify-center cursor-pointer shrink-0"
                      >
                        <Save className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        onClick={() => handleDeleteResume(resume.id)}
                        variant="outline"
                        title="Delete Resume"
                        className="h-9 w-9 rounded-xl border border-zinc-200 text-red-500 hover:bg-red-50 hover:border-red-100 flex items-center justify-center cursor-pointer shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }


  return (
    <div className="w-full bg-white min-h-screen text-zinc-800 antialiased selection:bg-emerald-50 selection:text-emerald-700">

      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-100 pb-4 mb-6 px-4 md:px-6 pt-4 no-print">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode("dashboard")}
            className="hidden md:inline-flex h-9 px-3 rounded-xl border border-zinc-200 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 transition-all active:scale-95 gap-1 font-bold text-xs bg-white cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Exit Editor</span>
          </Button>

          <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <FileText className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight animate-fade-in" style={{ fontFamily: "'Sora', sans-serif" }}>
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

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
          {/* Manual Save button */}
          <Button
            size="sm"
            onClick={() => saveVault(true)}
            className="h-9 px-3 sm:px-4 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md shadow-emerald-600/10"
          >
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">Save Draft</span>
            <span className="inline sm:hidden">Save</span>
          </Button>

          {/* Public Portfolio button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePublishToggle}
            className={`h-9 px-3 sm:px-4 rounded-xl border border-zinc-200 font-semibold gap-1.5 transition-all active:scale-95 cursor-pointer ${isPublished ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-white text-zinc-600"}`}
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">{isPublished ? "Live Hub Active" : "Go Live"}</span>
            <span className="inline sm:hidden">{isPublished ? "Live" : "Go Live"}</span>
          </Button>

          {/* Share/Print fallback button */}
          <Button
            variant="outline"
            size="sm"
            onClick={triggerPrint}
            className="h-9 px-3 rounded-xl border border-zinc-200 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 transition-all active:scale-95 cursor-pointer"
            title="Open standard browser print dialog"
          >
            <Share2 className="h-4 w-4" />
          </Button>

          {/* Download PDF button */}
          <Button
            size="sm"
            onClick={downloadPDF}
            className="h-9 px-3 sm:px-4 rounded-xl bg-zinc-950 text-white font-semibold hover:bg-zinc-800 gap-1.5 transition-all active:scale-95 shadow-md shadow-zinc-950/10 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Direct Download</span>
            <span className="inline sm:hidden">Download</span>
          </Button>
        </div>
      </div>

      {/* Mobile Workspace Tabs Switcher */}
      <div className="flex lg:hidden justify-center px-4 mb-6 no-print">
        <div className="flex w-full max-w-sm bg-zinc-100 p-1 rounded-xl border border-zinc-200/60 shadow-inner">
          <button
            onClick={() => setActiveWorkspaceTab("editor")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition-all ${activeWorkspaceTab === "editor"
              ? "bg-white text-zinc-950 shadow-sm"
              : "text-zinc-500 hover:text-zinc-800"
              }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Editor</span>
          </button>
          <button
            onClick={() => setActiveWorkspaceTab("preview")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition-all ${activeWorkspaceTab === "preview"
              ? "bg-white text-zinc-950 shadow-sm"
              : "text-zinc-500 hover:text-zinc-800"
              }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Preview</span>
          </button>
        </div>
      </div>

      {/* Main Split Screen Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start px-4 md:px-6 pb-12">

        {/* ========================================================
            LEFT COLUMN: THE FORM EDITOR (no-print)
           ======================================================== */}
        <div className={`lg:col-span-5 space-y-5 no-print ${activeWorkspaceTab === "editor" ? "block" : "hidden lg:block"}`}>

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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
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

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
        <div className={`lg:col-span-7 flex flex-col items-center ${activeWorkspaceTab === "preview" ? "block" : "hidden lg:block"}`}>

          {/* Real-time scaling layout container for A4 preview */}
          <div className="w-full overflow-hidden p-4 bg-zinc-100/50 border border-zinc-200/50 rounded-3xl flex justify-center no-print canvas-container">

            {/* The Live A4 Paper Canvas */}
            <div
              className={`resume-canvas w-[210mm] min-h-[297mm] bg-white p-8 shadow-[0_16px_40px_rgba(0,0,0,0.06)] border border-zinc-200/60 rounded-xl relative ${getFontFamilyClass()}`}
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

        {/* Sponsor Adsterra Monetization Modal */}
        {showAdModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md no-print p-4">
            <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">

              {/* Pulsing visual */}
              <div className="h-16 w-16 mx-auto rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center animate-pulse">
                <Download className="h-8 w-8 text-emerald-500" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-zinc-950 font-sans animate-pulse" style={{ fontFamily: "'Sora', sans-serif" }}>
                  Preparing Premium A4 PDF...
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed px-2">
                  To keep Lakshay IQ's premium resume and portfolio builder 100% free for all university students, please proceed through our sponsor network to unlock your download.
                </p>
              </div>

              {/* Sponsor Button */}
              <Button
                onClick={() => {
                  // Open Adsterra link in a new tab
                  window.open("https://www.effectivecpmnetwork.com/n7uqb683?key=ddbf42a7d34cc2cee82b22cef3e125f9", "_blank");

                  // Trigger actual PDF generation
                  if (adPendingResume) {
                    executeActualPDFDownload(adPendingResume);
                  } else {
                    executeActualActivePDFDownload();
                  }

                  // Close modal
                  setShowAdModal(false);
                  setAdPendingResume(null);
                  toast.success("🚀 Download unlocked!");
                }}
                className="w-full h-11 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-extrabold shadow-lg shadow-zinc-950/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <span>Unlock & Download PDF</span>
              </Button>

              <p className="text-[10px] text-zinc-400 font-medium">
                Secure sponsored download powered by Adsterra Network
              </p>
            </div>
          </div>
        )}

      </div>

      {/* ========================================================
          CSS PRINT ENGINE BLOCK (ONLY ACTIVE DURING window.print)
         ======================================================== */}
      <style>{`
        .canvas-container {
          width: 100% !important;
          display: flex !important;
          justify-content: center !important;
          overflow: auto !important; /* Changed from hidden to auto for scrolling */
          padding: 24px 0 !important;
          transition: all 0.2s ease-in-out;
          -webkit-overflow-scrolling: touch;
        }

        .resume-canvas {
          transform-origin: top center !important;
          margin: 0 auto !important;
          width: 794px !important;
          min-height: 1122px !important;
          box-shadow: 0 16px 40px rgba(0,0,0,0.06) !important;
          border-radius: 12px !important;
          transition: transform 0.2s ease-in-out;
          flex-shrink: 0 !important;
        }

        /* Large Desktop (1024px and up) - col-span-7 is ~58.3% of viewport */
        @media (min-width: 1024px) {
          .canvas-container {
            height: calc(min(1122px, calc(1.4142 * ((100vw * 0.58) - 80px))) + 48px) !important;
            overflow: hidden !important; /* Hide scrollbar when fully scaled to fit */
          }
          .resume-canvas {
            transform: scale(min(1, calc(((100vw * 0.58) - 80px) / 794))) !important;
          }
        }

        /* Tablet (640px to 1023px) - Full width layout */
        @media (min-width: 640px) and (max-width: 1023px) {
          .canvas-container {
            height: calc(min(1122px, calc(1.4142 * (100vw - 80px))) + 48px) !important;
            overflow: hidden !important;
          }
          .resume-canvas {
            transform: scale(min(1, calc((100vw - 80px) / 794))) !important;
          }
        }

        /* Mobile (below 640px) - Scrollable container without severe scale down */
        @media (max-width: 639px) {
          .canvas-container {
            padding: 16px !important;
            height: 75vh !important; /* Good height for scrolling */
            justify-content: flex-start !important; /* Fixes left clipping on overflow */
            align-items: flex-start !important;
          }
          .resume-canvas {
            /* Scale it slightly so it's not massive, but still readable and requires scroll */
            transform: scale(0.6) !important;
            transform-origin: top left !important;
            /* Compensate layout size for transform scale(0.6) to prevent extra scroll space */
            margin-right: -317px !important; /* 794 * 0.4 */
            margin-bottom: -448px !important; /* 1122 * 0.4 */
          }
        }

        @media print {
          @page {
            margin: 0mm !important;
            size: A4 portrait;
          }
          
          body {
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: white !important;
          }

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
            padding: 8mm 10mm !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            margin: 0 !important;
            box-sizing: border-box !important;
            transform: none !important;
          }
          
          /* Page break avoidance rules for timelines */
          .page-break {
            page-break-inside: avoid !important;
          }
          
          .page-break-after-always {
            page-break-after: always !important;
            display: block !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
          }
          
          html, body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            height: 100%;
            overflow: hidden;
          }
        }
      `}</style>

    </div>
  );
}
