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
  MapPin, Phone, Mail, Linkedin, Github, FileText, Share2, Globe, Save,
  ChevronDown, ChevronUp, Layers, User, Briefcase, Code, Award
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
    title: "Education",
    type: "timeline",
    isVisible: true,
    items: [
      {
        id: "edu_1",
        primaryHeader: "Gujarat Technological University",
        secondaryHeader: "B.Tech in Computer Engineering",
        dateRange: "2023 - Present",
        location: "Ahmedabad, India",
        metrics: "CPI: 9.12",
        description: "Specializing in High-Performance Distributed Systems, DBMS, and Web Technologies."
      }
    ]
  },
  {
    id: "sec_skills",
    title: "Technical Skills",
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
    title: "Featured Projects",
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
  themeColor: "#10b981",
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
  { name: "Indigo", value: "#6366f1" },
  { name: "Sunset", value: "#f97316" },
  { name: "Rose", value: "#f43f5e" }
];

const FONTS = ["Sora", "Inter", "Playfair Display", "Fira Code", "Poppins"];

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
  const [activeFormTab, setActiveFormTab] = useState<string>("personal");
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<"editor" | "preview">("editor");
  const [showStylePanel, setShowStylePanel] = useState(true);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

          if (data.sections && typeof data.sections === "object" && (data.sections as any).isVault) {
            loadedResumes = (data.sections as any).resumes || [];
          } else {
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
          const localVault = localStorage.getItem(`resume_vault_${user.id}`);
          if (localVault) {
            loadedResumes = JSON.parse(localVault);
          } else {
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

  const saveVault = async (showToast: boolean = false, customList?: any[]) => {
    if (!user) return;
    const targetList = customList || resumesList;
    if (targetList.length === 0) return;

    setSavingStatus("Saving...");

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

  const triggerAutosave = (
    nextInfo: PersonalInfo,
    nextSections: ResumeSection[],
    nextStyle: StyleConfig
  ) => {
    setSavingStatus("Saving...");
    setHasResumeData(true);

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
    toast.success("📋 Resume duplicated!");
  };

  const handleDeleteResume = async (resumeId: string) => {
    if (resumesList.length <= 1) {
      toast.error("You must keep at least one resume template.");
      return;
    }
    if (confirm("Delete this resume?")) {
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
      toast.success("Resume deleted!");
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
    toast.success("Fresh template created!");
  };

  const downloadSpecificPDF = (resume: any) => {
    setPersonalInfo(resume.personalInfo);
    setSections(resume.sections);
    setStyleConfig(resume.styleConfig);
    setIsPublished(resume.isPublished || false);
    toast.info("Generating PDF...");
    setTimeout(() => {
      executeActualActivePDFDownload();
    }, 400);
  };

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
      title: type === "pagebreak" ? "Page Break" : "Custom Section",
      type,
      isVisible: true,
      items: type === "timeline" ? [{
        id: `item_${Date.now()}`,
        primaryHeader: "Sample Title",
        secondaryHeader: "Subtitle / Role",
        dateRange: "2026",
        location: "Remote",
        metrics: "Optional Metric",
        description: "Add details about this custom activity here."
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
    toast.success("Added custom section!");
  };

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

  const updateTextContent = (sectionId: string, nextText: string) => {
    const next = sections.map(s => s.id === sectionId ? { ...s, textContent: nextText } : s);
    setSections(next);
    triggerAutosave(personalInfo, next, styleConfig);
  };

  const updateStyle = (key: keyof StyleConfig, value: string) => {
    const next = { ...styleConfig, [key]: value };
    setStyleConfig(next);
    triggerAutosave(personalInfo, sections, next);
  };

  const triggerPrint = () => {
    window.print();
  };

  const downloadPDF = () => {
    executeActualActivePDFDownload();
  };

  const executeActualActivePDFDownload = async () => {
    const element = document.querySelector(".resume-canvas");
    if (!element) return;

    try {
      setSavingStatus("Saving...");
      toast.info("Generating high-fidelity PDF...");
      await new Promise(resolve => setTimeout(resolve, 200));

      const canvas = await html2canvas(element as HTMLElement, {
        scale: 2.5,
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

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
        heightLeft -= pageHeight;
      }

      const cleanName = personalInfo.fullName.trim().replace(/\s+/g, "_") || "My";
      pdf.save(`${cleanName}_Resume.pdf`);
      setSavingStatus("Saved");
      toast.success("PDF downloaded successfully!");
    } catch (err) {
      console.error("PDF Generation error:", err);
      toast.error("Download failed. Trying print menu.");
      window.print();
    }
  };

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
        toast.success(nextPublished ? "Live portfolio active!" : "Portfolio unpublished");
      }
    } catch (err) {
      toast.error("Publication saved locally.");
    }
  };

  if (loading) {
    return <PageLoader label="Opening workspace canvas..." />;
  }

  const getFontFamilyClass = () => {
    switch (styleConfig.fontFamily) {
      case "Sora": return "font-['Sora']";
      case "Inter": return "font-['Inter']";
      case "Playfair Display": return "font-['Playfair_Display']";
      case "Poppins": return "font-['Poppins']";
      default: return "font-mono";
    }
  };

  // Dashboard View
  if (viewMode === "dashboard") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 md:mb-10">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
                Resume Studio
              </h1>
              <p className="text-sm text-zinc-500 mt-1">Create, customize, and export professional resumes</p>
            </div>
            <Button
              onClick={handleCreateNewResume}
              className="h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>New Resume</span>
            </Button>
          </div>

          {/* Empty State */}
          {!hasResumeData || resumesList.length === 0 ? (
            <div className="max-w-md mx-auto my-12 text-center p-8 bg-white rounded-2xl border border-zinc-200 shadow-sm">
              <div className="h-16 w-16 mx-auto rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-zinc-900 mb-2">No Resumes Yet</h2>
              <p className="text-sm text-zinc-500 mb-6">Create your first professional resume in minutes</p>
              <Button onClick={handleCreateNewResume} className="bg-emerald-600 hover:bg-emerald-700">
                Get Started
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {resumesList.map((resume) => (
                <Card key={resume.id} className="group border border-zinc-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-zinc-900 line-clamp-1">{resume.name}</h3>
                          <p className="text-xs text-zinc-400">
                            Updated {new Date(resume.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {resume.isPublished && (
                        <Badge className="bg-blue-50 text-blue-600 border-blue-200 text-[10px]">Live</Badge>
                      )}
                    </div>

                    <div className="bg-zinc-50 rounded-xl p-3 mb-4">
                      <p className="font-medium text-zinc-800 text-sm truncate">{resume.personalInfo.fullName}</p>
                      <p className="text-xs text-zinc-500 truncate">{resume.personalInfo.title}</p>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={() => handleEditResume(resume)} className="flex-1 h-9 bg-zinc-900 hover:bg-zinc-800 text-white text-sm rounded-xl">
                        Edit
                      </Button>
                      <Button onClick={() => downloadSpecificPDF(resume)} variant="outline" size="icon" className="h-9 w-9 rounded-xl border-zinc-200">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button onClick={() => handleDuplicateResume(resume)} variant="outline" size="icon" className="h-9 w-9 rounded-xl border-zinc-200">
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button onClick={() => handleDeleteResume(resume.id)} variant="outline" size="icon" className="h-9 w-9 rounded-xl border-zinc-200 text-red-500 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Editor View
  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header Bar */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-zinc-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("dashboard")}
            className="h-9 px-3 rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
            <FileText className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <h1 className="font-bold text-zinc-900">Resume Editor</h1>
            <p className="text-[10px] text-zinc-400 flex items-center gap-1">
              <span className={`h-1.5 w-1.5 rounded-full ${savingStatus === "Saving..." ? "bg-amber-400 animate-pulse" : "bg-emerald-500"}`} />
              {savingStatus === "Saving..." ? "Auto-saving..." : "All changes saved"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => saveVault(true)} variant="outline" size="sm" className="h-9 px-3 rounded-xl border-zinc-200">
            <Save className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Save</span>
          </Button>
          <Button onClick={handlePublishToggle} variant="outline" size="sm" className={`h-9 px-3 rounded-xl ${isPublished ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "border-zinc-200"}`}>
            <Globe className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">{isPublished ? "Live" : "Publish"}</span>
          </Button>
          <Button onClick={triggerPrint} variant="outline" size="sm" className="h-9 px-3 rounded-xl border-zinc-200">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button onClick={downloadPDF} size="sm" className="h-9 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white">
            <Download className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">PDF</span>
          </Button>
        </div>
      </div>

      {/* Mobile Tabs */}
      <div className="lg:hidden flex justify-center px-4 py-3 bg-white border-b border-zinc-100">
        <div className="flex bg-zinc-100 p-1 rounded-xl w-full max-w-xs">
          <button
            onClick={() => setActiveWorkspaceTab("editor")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${activeWorkspaceTab === "editor" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"}`}
          >
            <FileText className="h-4 w-4" />
            <span>Edit</span>
          </button>
          <button
            onClick={() => setActiveWorkspaceTab("preview")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${activeWorkspaceTab === "preview" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"}`}
          >
            <Eye className="h-4 w-4" />
            <span>Preview</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Editor Panel */}
          <div className={`lg:col-span-5 space-y-4 ${activeWorkspaceTab === "editor" ? "block" : "hidden lg:block"}`}>

            {/* Style Panel - Collapsible */}
            <Card className="border border-zinc-200 rounded-2xl overflow-hidden">
              <button
                onClick={() => setShowStylePanel(!showStylePanel)}
                className="w-full flex items-center justify-between p-4 bg-white hover:bg-zinc-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-emerald-500" />
                  <span className="font-semibold text-zinc-900">Style Settings</span>
                </div>
                {showStylePanel ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
              </button>

              {showStylePanel && (
                <div className="p-4 pt-0 border-t border-zinc-100 space-y-4">
                  <div>
                    <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Theme Color</label>
                    <div className="flex gap-2 flex-wrap">
                      {THEME_COLORS.map(color => (
                        <button
                          key={color.value}
                          onClick={() => updateStyle("themeColor", color.value)}
                          className={`h-8 w-8 rounded-full transition-all ${styleConfig.themeColor === color.value ? "ring-2 ring-offset-2 ring-zinc-400 scale-110" : "ring-1 ring-zinc-200"}`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-zinc-500 mb-1 block">Font</label>
                      <select
                        value={styleConfig.fontFamily}
                        onChange={(e) => updateStyle("fontFamily", e.target.value)}
                        className="w-full text-sm h-9 rounded-lg border border-zinc-200 bg-white px-3 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        {FONTS.map(font => <option key={font} value={font}>{font}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-zinc-500 mb-1 block">Layout</label>
                      <div className="flex gap-2">
                        <Button variant={styleConfig.layoutMode === "single" ? "default" : "outline"} size="sm" onClick={() => updateStyle("layoutMode", "single")} className="flex-1 h-9 text-xs">
                          Single
                        </Button>
                        <Button variant={styleConfig.layoutMode === "split" ? "default" : "outline"} size="sm" onClick={() => updateStyle("layoutMode", "split")} className="flex-1 h-9 text-xs">
                          Split
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Personal Info Card */}
            <Card className={`border rounded-2xl overflow-hidden transition-all ${activeFormTab === "personal" ? "ring-1 ring-emerald-500/30" : ""}`}>
              <button
                onClick={() => setActiveFormTab(activeFormTab === "personal" ? "" : "personal")}
                className="w-full flex items-center justify-between p-4 bg-white hover:bg-zinc-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-emerald-500" />
                  <span className="font-semibold text-zinc-900">Personal Information</span>
                </div>
                {activeFormTab === "personal" ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
              </button>

              {activeFormTab === "personal" && (
                <div className="p-4 pt-0 border-t border-zinc-100 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-zinc-500">Full Name</label>
                      <Input value={personalInfo.fullName} onChange={(e) => updatePersonalInfo("fullName", e.target.value)} className="h-9 text-sm rounded-lg mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-zinc-500">Title</label>
                      <Input value={personalInfo.title} onChange={(e) => updatePersonalInfo("title", e.target.value)} className="h-9 text-sm rounded-lg mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-zinc-500">Email</label>
                      <Input value={personalInfo.email} onChange={(e) => updatePersonalInfo("email", e.target.value)} className="h-9 text-sm rounded-lg mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-zinc-500">Phone</label>
                      <Input value={personalInfo.phone} onChange={(e) => updatePersonalInfo("phone", e.target.value)} className="h-9 text-sm rounded-lg mt-1" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-zinc-500">Location</label>
                      <Input value={personalInfo.location} onChange={(e) => updatePersonalInfo("location", e.target.value)} className="h-9 text-sm rounded-lg mt-1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-zinc-500">GitHub</label>
                      <Input value={personalInfo.socials.find(s => s.platform === "Github")?.url || ""} onChange={(e) => {
                        const val = e.target.value;
                        const nextSocials = personalInfo.socials.filter(s => s.platform !== "Github");
                        if (val.trim()) nextSocials.push({ platform: "Github", url: val.trim() });
                        updatePersonalInfo("socials", nextSocials);
                      }} className="h-9 text-sm rounded-lg mt-1" placeholder="github.com/username" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-zinc-500">LinkedIn</label>
                      <Input value={personalInfo.socials.find(s => s.platform === "Linkedin")?.url || ""} onChange={(e) => {
                        const val = e.target.value;
                        const nextSocials = personalInfo.socials.filter(s => s.platform !== "Linkedin");
                        if (val.trim()) nextSocials.push({ platform: "Linkedin", url: val.trim() });
                        updatePersonalInfo("socials", nextSocials);
                      }} className="h-9 text-sm rounded-lg mt-1" placeholder="linkedin.com/in/username" />
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Dynamic Sections */}
            {sections.map((section) => (
              <Card key={section.id} className={`border rounded-2xl overflow-hidden transition-all ${activeFormTab === section.id ? "ring-1 ring-emerald-500/30" : ""}`}>
                <div className="flex items-center justify-between p-4 bg-white">
                  <button onClick={() => setActiveFormTab(activeFormTab === section.id ? "" : section.id)} className="flex items-center gap-2 flex-1 text-left">
                    {section.type === "timeline" && <Briefcase className="h-4 w-4 text-emerald-500" />}
                    {section.type === "tags" && <Code className="h-4 w-4 text-emerald-500" />}
                    {section.type === "text" && <FileText className="h-4 w-4 text-emerald-500" />}
                    {section.type === "pagebreak" && <Layers className="h-4 w-4 text-emerald-500" />}
                    <span className="font-semibold text-zinc-900">{section.title}</span>
                    {!section.isVisible && <Badge variant="secondary" className="text-[9px] h-4 bg-zinc-100">Hidden</Badge>}
                  </button>
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleSectionVisibility(section.id)} className="h-7 w-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100">
                      {section.isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={() => deleteSection(section.id)} className="h-7 w-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {activeFormTab === section.id && (
                  <div className="p-4 pt-0 border-t border-zinc-100 space-y-4">
                    <div>
                      <label className="text-xs font-medium text-zinc-500">Section Title</label>
                      <Input value={section.title} onChange={(e) => updateSectionTitle(section.id, e.target.value)} className="h-9 text-sm rounded-lg mt-1" />
                    </div>

                    {section.type === "timeline" && (
                      <div className="space-y-3">
                        {(section.items || []).map((item, idx) => (
                          <div key={item.id} className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 space-y-2 relative">
                            <button onClick={() => deleteTimelineItem(section.id, item.id)} className="absolute top-2 right-2 text-zinc-400 hover:text-red-500 p-1">
                              <Trash2 className="h-3 w-3" />
                            </button>
                            <Input value={item.primaryHeader} onChange={(e) => updateTimelineItem(section.id, item.id, "primaryHeader", e.target.value)} placeholder="Organization" className="h-8 text-sm rounded-lg" />
                            <Input value={item.secondaryHeader} onChange={(e) => updateTimelineItem(section.id, item.id, "secondaryHeader", e.target.value)} placeholder="Role" className="h-8 text-sm rounded-lg" />
                            <div className="grid grid-cols-2 gap-2">
                              <Input value={item.dateRange} onChange={(e) => updateTimelineItem(section.id, item.id, "dateRange", e.target.value)} placeholder="Date" className="h-8 text-sm rounded-lg" />
                              <Input value={item.metrics} onChange={(e) => updateTimelineItem(section.id, item.id, "metrics", e.target.value)} placeholder="Metrics" className="h-8 text-sm rounded-lg" />
                            </div>
                            <Textarea value={item.description} onChange={(e) => updateTimelineItem(section.id, item.id, "description", e.target.value)} placeholder="Description" className="text-sm min-h-[60px] rounded-lg" />
                          </div>
                        ))}
                        <Button onClick={() => addTimelineItem(section.id)} variant="outline" className="w-full h-9 text-sm border-dashed">
                          <Plus className="h-3 w-3 mr-1" /> Add Item
                        </Button>
                      </div>
                    )}

                    {section.type === "tags" && (
                      <div className="space-y-3">
                        {(section.categories || []).map((cat, idx) => (
                          <div key={idx} className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 space-y-2 relative">
                            <button onClick={() => deleteTagCategory(section.id, idx)} className="absolute top-2 right-2 text-zinc-400 hover:text-red-500 p-1">
                              <Trash2 className="h-3 w-3" />
                            </button>
                            <Input value={cat.name} onChange={(e) => updateTagCategoryName(section.id, idx, e.target.value)} placeholder="Category Name" className="h-8 text-sm rounded-lg" />
                            <Input value={cat.tags.join(", ")} onChange={(e) => updateTagCategoryTags(section.id, idx, e.target.value)} placeholder="Tags (comma separated)" className="h-8 text-sm rounded-lg" />
                          </div>
                        ))}
                        <Button onClick={() => addTagCategory(section.id)} variant="outline" className="w-full h-9 text-sm border-dashed">
                          <Plus className="h-3 w-3 mr-1" /> Add Category
                        </Button>
                      </div>
                    )}

                    {section.type === "text" && (
                      <Textarea value={section.textContent || ""} onChange={(e) => updateTextContent(section.id, e.target.value)} className="text-sm min-h-[100px] rounded-lg" placeholder="Enter your text content here..." />
                    )}

                    {section.type === "pagebreak" && (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 text-sm">Page break will force a new page in PDF output.</div>
                    )}
                  </div>
                )}
              </Card>
            ))}

            {/* Add Section Button */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Button onClick={() => addCustomSection("timeline")} variant="outline" className="h-10 text-sm rounded-xl border-dashed">📜 Timeline</Button>
              <Button onClick={() => addCustomSection("tags")} variant="outline" className="h-10 text-sm rounded-xl border-dashed">🏷️ Skills</Button>
              <Button onClick={() => addCustomSection("text")} variant="outline" className="h-10 text-sm rounded-xl border-dashed">📝 Text</Button>
              <Button onClick={() => addCustomSection("pagebreak")} variant="outline" className="h-10 text-sm rounded-xl border-dashed">📄 Page Break</Button>
            </div>
          </div>

          {/* Preview Panel */}
          <div className={`lg:col-span-7 ${activeWorkspaceTab === "preview" ? "block" : "hidden lg:block"}`}>
            <div className="sticky top-20">
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-lg overflow-hidden">
                <div className="bg-zinc-50 px-4 py-2 border-b border-zinc-200 flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500">Live Preview</span>
                  <span className="text-[10px] text-zinc-400">A4 Size</span>
                </div>
                <div className="p-4 flex justify-center bg-zinc-100 overflow-auto max-h-[80vh]">
                  <div
                    className={`resume-canvas w-[210mm] min-h-[297mm] bg-white p-6 shadow-xl rounded-lg ${getFontFamilyClass()}`}
                    style={{
                      fontSize: styleConfig.fontSize === "xs" ? "11px" : styleConfig.fontSize === "sm" ? "12px" : "13px",
                      lineHeight: styleConfig.lineHeight === "tight" ? "1.3" : styleConfig.lineHeight === "relaxed" ? "1.6" : "1.5"
                    }}
                  >
                    {/* Header */}
                    <div className="border-b pb-4 mb-5" style={{ borderColor: `${styleConfig.themeColor}40` }}>
                      <div className="flex flex-wrap justify-between items-start gap-4">
                        <div>
                          <h1 className="text-2xl font-bold tracking-tight" style={{ color: styleConfig.themeColor }}>{personalInfo.fullName}</h1>
                          <p className="text-sm font-medium text-zinc-500 mt-1">{personalInfo.title}</p>
                        </div>
                        <div className="text-xs text-zinc-500 space-y-1 text-right">
                          {personalInfo.location && <div className="flex items-center gap-1 justify-end"><span>{personalInfo.location}</span><MapPin className="h-3 w-3" style={{ color: styleConfig.themeColor }} /></div>}
                          {personalInfo.phone && <div className="flex items-center gap-1 justify-end"><span>{personalInfo.phone}</span><Phone className="h-3 w-3" style={{ color: styleConfig.themeColor }} /></div>}
                          {personalInfo.email && <div className="flex items-center gap-1 justify-end"><span className="underline">{personalInfo.email}</span><Mail className="h-3 w-3" style={{ color: styleConfig.themeColor }} /></div>}
                        </div>
                      </div>
                      {personalInfo.socials.length > 0 && (
                        <div className="flex gap-4 mt-3 pt-2 border-t border-zinc-100 text-[10px] text-zinc-400">
                          {personalInfo.socials.map(s => (
                            <span key={s.platform} className="flex items-center gap-1">
                              {s.platform === "Github" ? <Github className="h-3 w-3" /> : <Linkedin className="h-3 w-3" />}
                              {s.url.replace("https://", "")}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className={`grid gap-5 ${styleConfig.layoutMode === "split" ? "grid-cols-12" : "grid-cols-1"}`}>
                      {styleConfig.layoutMode === "split" ? (
                        <>
                          <div className="col-span-8 space-y-5">
                            {sections.filter(s => s.isVisible && (s.type === "timeline" || s.type === "text")).map(section => (
                              <div key={section.id}>
                                <h2 className="text-xs font-bold uppercase tracking-wider border-b pb-1 mb-3" style={{ color: styleConfig.themeColor, borderColor: `${styleConfig.themeColor}30` }}>{section.title}</h2>
                                {section.type === "timeline" && (
                                  <div className="space-y-3">
                                    {(section.items || []).map(item => (
                                      <div key={item.id}>
                                        <div className="flex justify-between items-start"><h3 className="font-bold text-zinc-800 text-sm">{item.primaryHeader}</h3><span className="text-[10px] text-zinc-400">{item.dateRange}</span></div>
                                        <div className="flex justify-between text-xs text-zinc-500 mt-0.5"><span>{item.secondaryHeader}</span>{item.metrics && <span className="text-[10px]">{item.metrics}</span>}</div>
                                        <p className="text-xs text-zinc-500 mt-1">{item.description}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {section.type === "text" && <p className="text-xs text-zinc-500">{section.textContent}</p>}
                              </div>
                            ))}
                          </div>
                          <div className="col-span-4 space-y-5">
                            {sections.filter(s => s.isVisible && s.type === "tags").map(section => (
                              <div key={section.id}>
                                <h2 className="text-xs font-bold uppercase tracking-wider border-b pb-1 mb-3" style={{ color: styleConfig.themeColor, borderColor: `${styleConfig.themeColor}30` }}>{section.title}</h2>
                                {(section.categories || []).map(cat => (
                                  <div key={cat.name} className="mb-3">
                                    <h4 className="text-[10px] font-bold uppercase text-zinc-400 mb-1">{cat.name}</h4>
                                    <div className="flex flex-wrap gap-1">
                                      {cat.tags.map(tag => <Badge key={tag} variant="outline" className="text-[9px] px-2 py-0">{tag}</Badge>)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="space-y-5">
                          {sections.filter(s => s.isVisible).map(section => {
                            if (section.type === "pagebreak") return <div key={section.id} className="h-px bg-zinc-200 my-4" />;
                            return (
                              <div key={section.id}>
                                <h2 className="text-xs font-bold uppercase tracking-wider border-b pb-1 mb-3" style={{ color: styleConfig.themeColor, borderColor: `${styleConfig.themeColor}30` }}>{section.title}</h2>
                                {section.type === "timeline" && (
                                  <div className="space-y-3">
                                    {(section.items || []).map(item => (
                                      <div key={item.id}>
                                        <div className="flex justify-between items-start"><h3 className="font-bold text-zinc-800 text-sm">{item.primaryHeader}</h3><span className="text-[10px] text-zinc-400">{item.dateRange}</span></div>
                                        <div className="flex justify-between text-xs text-zinc-500 mt-0.5"><span>{item.secondaryHeader}</span>{item.metrics && <span className="text-[10px]">{item.metrics}</span>}</div>
                                        <p className="text-xs text-zinc-500 mt-1">{item.description}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {section.type === "tags" && (
                                  <div className="grid grid-cols-2 gap-3">
                                    {(section.categories || []).map(cat => (
                                      <div key={cat.name}>
                                        <h4 className="text-[10px] font-bold uppercase text-zinc-400 mb-1">{cat.name}</h4>
                                        <div className="flex flex-wrap gap-1">{cat.tags.map(tag => <Badge key={tag} variant="outline" className="text-[9px] px-2 py-0">{tag}</Badge>)}</div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {section.type === "text" && <p className="text-xs text-zinc-500">{section.textContent}</p>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print, .sticky, .lg\\:col-span-5, .lg\\:col-span-7 > div > div:first-child {
            display: none !important;
          }
          .resume-canvas {
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            width: 100% !important;
          }
          body, .min-h-screen, .bg-zinc-50, .lg\\:col-span-7 {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
        
        @media (max-width: 640px) {
          .resume-canvas {
            transform: scale(0.45);
            transform-origin: top left;
            margin-right: -116% !important;
          }
        }
      `}</style>
    </div>
  );
}