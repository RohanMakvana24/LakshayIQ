import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createPortal } from "react-dom";
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
  Briefcase, GraduationCap, Terminal, ExternalLink, SlidersHorizontal, User,
  Copy, Trash, Layers, ChevronRight, ArrowRight, BookOpen, FolderGit2, FileUser, X,
  List, MoreVertical, Folder, ChevronDown, Filter, RotateCcw, Upload, Search,
  Puzzle, Users
} from "lucide-react";
import { toast } from "sonner";
import { PageLoader } from "@/components/page-loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/_authenticated/student/resume")({
  head: () => ({ meta: [{ title: "Resume Studio — Lakshay IQ" }] }),
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
  showAvatar?: string;
}

const DEFAULT_PERSONAL_INFO: PersonalInfo = {
  fullName: "Aarav Sharma",
  title: "Senior Full Stack Software Engineer",
  email: "aarav.sharma@example.com",
  phone: "+91 98765 43210",
  location: "Ahmedabad, India",
  avatarUrl: "",
  socials: [
    { platform: "Github", url: "https://github.com/aaravsharma" },
    { platform: "Linkedin", url: "https://linkedin.com/in/aaravsharma" }
  ]
};

const DEFAULT_SECTIONS: ResumeSection[] = [
  {
    id: "sec_experience",
    title: "Work Experience",
    type: "timeline",
    isVisible: true,
    items: [
      {
        id: "exp_1",
        primaryHeader: "TechSolutions Cloud Systems",
        secondaryHeader: "Senior Software Engineer",
        dateRange: "2024 - Present",
        location: "Ahmedabad, India",
        metrics: "React, Node.js, AWS",
        description: "Developed and scaled enterprise cloud platforms using React, Node.js, and AWS. Refactored legacy backend to microservices, reducing server latency by 40%."
      },
      {
        id: "exp_2",
        primaryHeader: "WebCraft Development Studio",
        secondaryHeader: "Software Developer",
        dateRange: "2022 - 2024",
        location: "Pune, India",
        metrics: "Next.js, PostgreSQL",
        description: "Built cross-platform client websites using Next.js, TypeScript, and PostgreSQL. Automated CI/CD pipelines, decreasing deployment times by 25%."
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
        tags: ["TypeScript", "JavaScript", "React.js", "Next.js", "Node.js", "Tailwind CSS"]
      },
      {
        name: "Databases & DevOps",
        tags: ["PostgreSQL", "Supabase", "REST APIs", "Git", "Docker", "AWS"]
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
        location: "Ahmedabad, India",
        metrics: "React 19, Supabase",
        description: "Engineered a high-performance web education platform featuring instant A4 document printing, custom loaders, and visual identity updates using Sora typography."
      },
      {
        id: "proj_2",
        primaryHeader: "CloudScale Analytics Dashboard",
        secondaryHeader: "Creator / Architect",
        dateRange: "2025",
        location: "Remote",
        metrics: "Next.js, Redis, Go",
        description: "Created a real-time server metrics dashboard featuring custom WebSockets, dynamic charts, and automated PDF report exports."
      }
    ]
  },
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
        dateRange: "2018 - 2022",
        location: "Ahmedabad, India",
        metrics: "CPI: 9.12 / 10.00",
        description: "Specializing in High-Performance Distributed Systems, DBMS, and Web Technologies. Graduated first-class with distinction."
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
  layoutMode: "split",
  showAvatar: "true"
};

const THEME_COLORS = [
  { name: "Emerald", value: "#10b981" },
  { name: "Sky", value: "#0ea5e9" },
  { name: "Slate", value: "#334155" },
  { name: "Violet", value: "#6366f1" },
  { name: "Amber", value: "#f59e0b" }
];

const FONTS = ["Sora", "Inter", "Playfair Display", "Fira Code"];

const TEMPLATES = [
  {
    id: "tech-pioneer",
    name: "Tech Pioneer",
    badge: "Developer Choice",
    description: "Sleek 2-column layout with high-density skills sidebar. Optimized for technical profiles.",
    themeColor: "#10b981",
    fontFamily: "Sora",
    layoutMode: "split" as const,
    primaryColorName: "Emerald",
    tagLine: "Modern, high-performance & clean layout.",
    colorClass: "bg-emerald-500"
  },
  {
    id: "slate-pro",
    name: "Slate Professional",
    badge: "Recruiter Choice",
    description: "Elegant single-column centered layout with classic serif typography. Best for business & management.",
    themeColor: "#334155",
    fontFamily: "Playfair Display",
    layoutMode: "single" as const,
    primaryColorName: "Slate",
    tagLine: "Sophisticated, formal & highly readable.",
    colorClass: "bg-slate-700"
  },
  {
    id: "minimalist",
    name: "Minimalist Clean",
    badge: "Academic Standard",
    description: "No-nonsense academic and research style featuring clean monospace fonts and thin borders.",
    themeColor: "#0ea5e9",
    fontFamily: "Fira Code",
    layoutMode: "single" as const,
    primaryColorName: "Sky",
    tagLine: "Minimal, raw & code-style aesthetic.",
    colorClass: "bg-sky-500"
  },
  {
    id: "creative-bold",
    name: "Creative Bold",
    badge: "Creative Focus",
    description: "Vibrant violet theme with a beautiful tinted left sidebar block for striking layouts.",
    themeColor: "#6366f1",
    fontFamily: "Inter",
    layoutMode: "split" as const,
    primaryColorName: "Violet",
    tagLine: "Bold, modern & portfolio-driven.",
    colorClass: "bg-indigo-500"
  },
  {
    id: "modern-corporate",
    name: "Modern Corporate",
    badge: "Corporate Classic",
    description: "Clean single-column structure with an elegant left margin accent bar and indigo typography.",
    themeColor: "#4f46e5",
    fontFamily: "Inter",
    layoutMode: "single" as const,
    primaryColorName: "Indigo",
    tagLine: "Corporate-ready, authoritative & structured.",
    colorClass: "bg-indigo-650"
  },
  {
    id: "exec-director",
    name: "Executive Director",
    badge: "Executive Premium",
    description: "Polished layout with a striking colored top header banner and serif typography.",
    themeColor: "#1e3a8a",
    fontFamily: "Playfair Display",
    layoutMode: "single" as const,
    primaryColorName: "Navy",
    tagLine: "Premium top-banner, formal & highly readable.",
    colorClass: "bg-blue-900"
  },
  {
    id: "mkt-specialist",
    name: "Marketing Specialist",
    badge: "Modern Marketing",
    description: "Warm amber accents and a clean split layout with custom tags for metrics and certifications.",
    themeColor: "#d97706",
    fontFamily: "Sora",
    layoutMode: "split" as const,
    primaryColorName: "Amber",
    tagLine: "Modern split with warm accents.",
    colorClass: "bg-amber-600"
  },
  {
    id: "startup-founder",
    name: "Startup Founder",
    badge: "Startup Pick",
    description: "High-impact bold typography with a modern minimalist layout. Optimized for founders & PMs.",
    themeColor: "#1e293b",
    fontFamily: "Inter",
    layoutMode: "single" as const,
    primaryColorName: "Charcoal",
    tagLine: "Minimal, high-impact & bold.",
    colorClass: "bg-slate-800"
  },
  {
    id: "ux-designer",
    name: "UX Designer",
    badge: "Design Portfolio",
    description: "Playful split layout with rose accents, rounded tags, and subtle metadata blocks for portfolios.",
    themeColor: "#e11d48",
    fontFamily: "Sora",
    layoutMode: "split" as const,
    primaryColorName: "Rose",
    tagLine: "Playful, modern & tag-focused.",
    colorClass: "bg-rose-500"
  },
  {
    id: "academic-cv",
    name: "Academic CV",
    badge: "Classic CV",
    description: "A traditional high-density layout using burgundy accents and classic serif font. Ideal for research.",
    themeColor: "#991b1b",
    fontFamily: "Playfair Display",
    layoutMode: "single" as const,
    primaryColorName: "Burgundy",
    tagLine: "Classic high-density academic style.",
    colorClass: "bg-red-800"
  }
];

function ResumeBuilderPage() {
  const { user } = useAuth();

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
  const [editingTags, setEditingTags] = useState<Record<string, string>>({});
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [newResumeName, setNewResumeName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("tech-pioneer");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "name">("date");
  const [viewStyle, setViewStyle] = useState<"grid" | "list">("grid");
  const [deleteResumeTarget, setDeleteResumeTarget] = useState<any | null>(null);

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
          // Auto-create a fully pre-filled demo resume for new user
          const initialResume = {
            id: "primary",
            name: "Primary Professional Resume",
            personalInfo: DEFAULT_PERSONAL_INFO,
            sections: DEFAULT_SECTIONS,
            styleConfig: DEFAULT_STYLE_CONFIG,
            isPublished: false,
            updatedAt: new Date().toISOString()
          };
          const initialList = [initialResume];
          setResumesList(initialList);
          setHasResumeData(true);
          setActiveResumeId("primary");
          setPersonalInfo(DEFAULT_PERSONAL_INFO);
          setSections(DEFAULT_SECTIONS);
          setStyleConfig(DEFAULT_STYLE_CONFIG);
          setIsPublished(false);
          
          // Auto-save so it persists in the cloud and locally
          const vaultPayload = {
            isVault: true,
            resumes: initialList
          };
          supabase
            .from("student_resumes" as any)
            .upsert({
              user_id: user.id,
              personal_info: DEFAULT_PERSONAL_INFO,
              sections: vaultPayload,
              style_config: DEFAULT_STYLE_CONFIG,
              is_published: false,
              username: `student_${user.id.slice(0, 5)}`,
              updated_at: new Date().toISOString()
            }, { onConflict: "user_id" })
            .then(({ error }) => {
              if (error) console.error("Auto-upsert failed:", error);
            });
          localStorage.setItem(`resume_vault_${user.id}`, JSON.stringify(initialList));
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
        } else {
          // If local storage is also empty, create default demo resume
          const initialResume = {
            id: "primary",
            name: "Primary Professional Resume",
            personalInfo: DEFAULT_PERSONAL_INFO,
            sections: DEFAULT_SECTIONS,
            styleConfig: DEFAULT_STYLE_CONFIG,
            isPublished: false,
            updatedAt: new Date().toISOString()
          };
          const initialList = [initialResume];
          setResumesList(initialList);
          setHasResumeData(true);
          setActiveResumeId("primary");
          setPersonalInfo(DEFAULT_PERSONAL_INFO);
          setSections(DEFAULT_SECTIONS);
          setStyleConfig(DEFAULT_STYLE_CONFIG);
          setIsPublished(false);
          localStorage.setItem(`resume_vault_${user.id}`, JSON.stringify(initialList));
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
        toast.success("Changes saved to cloud successfully!");
      }
    } catch (err) {
      console.error("Failed to save vault:", err);
      setSavingStatus("Error");
      if (showToast) {
        toast.error("Failed to save to cloud. Saved locally.");
      }
    }
  };

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
    toast.success("Resume duplicated successfully!");
  };

  const handleDeleteResume = (resume: any) => {
    if (resumesList.length <= 1) {
      toast.error("You must keep at least one resume template.");
      return;
    }
    setDeleteResumeTarget(resume);
  };

  const confirmDeleteResume = async (resumeId: string) => {
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
    toast.success("Resume deleted successfully!");
  };

  const handleCreateNewResume = () => {
    setNewResumeName(`Resume #${resumesList.length + 1}`);
    setSelectedTemplateId("tech-pioneer");
    setIsTemplateModalOpen(true);
  };

  const handleConfirmCreate = async () => {
    if (!newResumeName.trim()) {
      toast.error("Please enter a name for your resume.");
      return;
    }
    const templatePreset = TEMPLATES.find(t => t.id === selectedTemplateId) || TEMPLATES[0];

    const newResume = {
      id: `resume_${Date.now()}`,
      name: newResumeName.trim(),
      personalInfo: DEFAULT_PERSONAL_INFO,
      sections: DEFAULT_SECTIONS,
      styleConfig: {
        ...DEFAULT_STYLE_CONFIG,
        templateId: templatePreset.id,
        themeColor: templatePreset.themeColor,
        fontFamily: templatePreset.fontFamily,
        layoutMode: templatePreset.layoutMode,
      },
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
    setIsTemplateModalOpen(false);
    await saveVault(false, newList);
    toast.success(`${templatePreset.name} template created!`);
  };

  const downloadSpecificPDF = (resume: any) => {
    setPersonalInfo(resume.personalInfo);
    setSections(resume.sections);
    setStyleConfig(resume.styleConfig);
    setIsPublished(resume.isPublished || false);
    toast.info("Opening print dialog, please wait...");
    setTimeout(() => {
      window.print();
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
      title: type === "pagebreak" ? "Page Break" : "New Section",
      type,
      isVisible: true,
      items: type === "timeline" ? [{
        id: `item_${Date.now()}`,
        primaryHeader: "Sample Title",
        secondaryHeader: "Role / Subtitle",
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
    toast.success(type === "pagebreak" ? "Page break added!" : "Custom section added!");
  };

  const addTimelineItem = (sectionId: string) => {
    const next = sections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          items: [
            ...(s.items || []),
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
        return {
          ...s,
          categories: [
            ...(s.categories || []),
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
    window.print();
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
        toast.success(nextPublished ? "Your live portfolio is active!" : "Portfolio unpublished");
      }
    } catch (err) {
      toast.error("Database connection issue. Publication saved locally.");
    }
  };

  if (loading) {
    return <PageLoader label="Opening workspace canvas..." />;
  }

  const getFontFamilyClass = () => {
    if (styleConfig.fontFamily === "Sora") return "font-sans";
    if (styleConfig.fontFamily === "Inter") return "font-sans tracking-tight";
    if (styleConfig.fontFamily === "Playfair Display") return "font-serif";
    return "font-mono text-xs";
  };

  const getHeaderHeight = () => {
    let height = 20; // base margins & padding
    
    // Name + Title block vs Avatar height (Left Side of layout)
    let leftHeight = 0;
    if (personalInfo.fullName) {
      const nameSize = 24; // text-2xl
      leftHeight += nameSize * 1.3;
    }
    if (personalInfo.title) {
      leftHeight += 18; // text-sm
    }
    if (styleConfig.showAvatar !== "false" && personalInfo.avatarUrl) {
      leftHeight = Math.max(leftHeight, 56 + 10); // avatar is h-14 (56px) + margin
    }
    
    // Contact Info lines (Email, Phone, Location) are rendered on the RIGHT side,
    // so they are side-by-side with the left block! We take the max height, not the sum!
    let contactCount = 0;
    if (personalInfo.location) contactCount++;
    if (personalInfo.phone) contactCount++;
    if (personalInfo.email) contactCount++;
    const rightHeight = contactCount * 14;

    height += Math.max(leftHeight, rightHeight);
    
    // Social Links
    if (personalInfo.socials && personalInfo.socials.length > 0) {
      height += 24; // flex wrap line mt-3 pt-2 text-[9px]
    }
    
    // Border bottom & bottom margin
    height += 16 + 20; // pb-4 mb-5
    
    return height;
  };

  const getSpacingClasses = () => {
    const spacing = styleConfig.sectionSpacing || "medium";
    if (spacing === "tight") {
      return {
        sectionGap: "space-y-3",
        itemGap: "mb-2 last:mb-0",
        timelineItemGap: "space-y-0.5",
        categoriesGap: "space-y-2",
        tagsGap: "gap-1 mt-0.5"
      };
    }
    if (spacing === "relaxed") {
      return {
        sectionGap: "space-y-7",
        itemGap: "mb-6 last:mb-0",
        timelineItemGap: "space-y-1.5",
        categoriesGap: "space-y-4",
        tagsGap: "gap-1.5 mt-1.5"
      };
    }
    return {
      sectionGap: "space-y-5",
      itemGap: "mb-4 last:mb-0",
      timelineItemGap: "space-y-1",
      categoriesGap: "space-y-3",
      tagsGap: "gap-1 mt-1"
    };
  };

  const estimateSectionHeight = (section: ResumeSection, layoutMode: "single" | "split") => {
    if (section.type === "pagebreak") return 0;

    // Connect section spacing density
    const spacingCoefficients = { tight: 12, medium: 20, relaxed: 28 };
    const sectionSpacingGap = spacingCoefficients[styleConfig.sectionSpacing as keyof typeof spacingCoefficients] || 20;

    // Header size (26px) + spacing gap
    let height = 26 + sectionSpacingGap; 

    // Active typography calculations
    const fontSizes = { xs: 12, sm: 13, md: 14 };
    const fontSizePx = fontSizes[styleConfig.fontSize as keyof typeof fontSizes] || 13;
    const lineHeights = { tight: 1.2, normal: 1.4, relaxed: 1.6 };
    const lineHeightMultiplier = lineHeights[styleConfig.lineHeight as keyof typeof lineHeights] || 1.4;
    const textLineHeight = fontSizePx * lineHeightMultiplier;

    if (section.type === "timeline" && section.items) {
      const timelineSpacing = { tight: 8, medium: 16, relaxed: 24 };
      const itemGap = timelineSpacing[styleConfig.sectionSpacing as keyof typeof timelineSpacing] || 16;

      section.items.forEach((item, idx) => {
        let itemHeight = 0;
        
        // Primary header line (primaryHeader + dateRange)
        itemHeight += textLineHeight;
        
        // Secondary header line (secondaryHeader + metrics)
        itemHeight += 14; 
        
        // Description wrapping lines (width-calibrated for columns)
        const charsPerLine = layoutMode === "split" ? 90 : 140;
        const descLines = Math.max(1, Math.ceil((item.description || "").length / charsPerLine));
        itemHeight += descLines * 12.5; 
        
        height += itemHeight + (idx === section.items!.length - 1 ? 0 : itemGap);
      });
    } else if (section.type === "tags" && section.categories) {
      section.categories.forEach((cat, idx) => {
        let catHeight = 12; // Category title (10px) + spacing
        
        const columnWidth = layoutMode === "split" ? 230 : 730;
        let totalTagsWidth = 0;
        cat.tags.forEach(tag => {
          totalTagsWidth += (tag.length + 4) * 5.2 + 4; 
        });
        const tagLines = Math.max(1, Math.ceil(totalTagsWidth / columnWidth));
        catHeight += tagLines * 16; // Tag lines are about 16px high
        
        height += catHeight + (idx === section.categories!.length - 1 ? 0 : 8); 
      });
    } else if (section.type === "text" && section.textContent) {
      const charsPerLine = layoutMode === "split" ? 90 : 140;
      const lines = Math.max(1, Math.ceil(section.textContent.length / charsPerLine));
      height += lines * 14 + 6;
    }

    return height;
  };

  const getPages = () => {
    const visibleSections = sections.filter(s => s.isVisible);
    
    // 1. Split sections by explicit "pagebreak" first.
    const segments: ResumeSection[][] = [[]];
    let segmentIndex = 0;
    visibleSections.forEach(sec => {
      if (sec.type === "pagebreak") {
        segments.push([]);
        segmentIndex++;
      } else {
        segments[segmentIndex].push(sec);
      }
    });

    const pages: ResumeSection[][] = [];
    let globalPageIndex = 0;
    const PAGE_1_LIMIT = 1040;
    const PAGE_N_LIMIT = 1040;

    segments.forEach((segment, segmentIdx) => {
      if (segment.length === 0 && segmentIdx > 0) {
        pages.push([]);
        globalPageIndex++;
        return;
      }

      if (styleConfig.layoutMode === "split") {
        // Partition Left and Right columns independently for this segment
        const leftSections = segment.filter(s => s.type === "timeline" || s.type === "text");
        const rightSections = segment.filter(s => s.type === "tags");

        // Partition Left column
        const leftPages: ResumeSection[][] = [[]];
        let currentLeftPageIndex = 0;
        let leftAccumulator = globalPageIndex === 0 ? getHeaderHeight() : 0;

        leftSections.forEach(sec => {
          const secHeight = estimateSectionHeight(sec, "split");
          const limit = (globalPageIndex + currentLeftPageIndex) === 0 ? PAGE_1_LIMIT : PAGE_N_LIMIT;

          if (leftAccumulator + secHeight > limit && leftPages[currentLeftPageIndex].length > 0) {
            leftPages.push([sec]);
            currentLeftPageIndex++;
            leftAccumulator = secHeight;
          } else {
            leftPages[currentLeftPageIndex].push(sec);
            leftAccumulator += secHeight;
          }
        });

        // Partition Right column
        const rightPages: ResumeSection[][] = [[]];
        let currentRightPageIndex = 0;
        let rightAccumulator = globalPageIndex === 0 ? getHeaderHeight() : 0;

        rightSections.forEach(sec => {
          const secHeight = estimateSectionHeight(sec, "split");
          const limit = (globalPageIndex + currentRightPageIndex) === 0 ? PAGE_1_LIMIT : PAGE_N_LIMIT;

          if (rightAccumulator + secHeight > limit && rightPages[currentRightPageIndex].length > 0) {
            rightPages.push([sec]);
            currentRightPageIndex++;
            rightAccumulator = secHeight;
          } else {
            rightPages[currentRightPageIndex].push(sec);
            rightAccumulator += secHeight;
          }
        });

        // Combine left and right pages page-by-page
        const maxPages = Math.max(
          leftSections.length > 0 ? leftPages.length : 1,
          rightSections.length > 0 ? rightPages.length : 1
        );

        for (let i = 0; i < maxPages; i++) {
          const pageContent: ResumeSection[] = [];
          if (leftPages[i]) {
            pageContent.push(...leftPages[i]);
          }
          if (rightPages[i]) {
            pageContent.push(...rightPages[i]);
          }
          pages.push(pageContent);
        }

        globalPageIndex += maxPages;

      } else {
        // Single Column mode: partition sequentially
        let currentLeftHeight = globalPageIndex === 0 ? getHeaderHeight() : 0;
        let currentSegmentPageIndex = 0;
        const segmentPages: ResumeSection[][] = [[]];

        segment.forEach(sec => {
          const secHeight = estimateSectionHeight(sec, "single");
          const limit = (globalPageIndex + currentSegmentPageIndex) === 0 ? PAGE_1_LIMIT : PAGE_N_LIMIT;

          if (currentLeftHeight + secHeight > limit && segmentPages[currentSegmentPageIndex].length > 0) {
            segmentPages.push([sec]);
            currentSegmentPageIndex++;
            currentLeftHeight = secHeight;
          } else {
            segmentPages[currentSegmentPageIndex].push(sec);
            currentLeftHeight += secHeight;
          }
        });

        segmentPages.forEach(p => {
          pages.push(p);
        });

        globalPageIndex += segmentPages.length;
      }
    });

    const filtered = pages.filter((p, idx) => idx === 0 || p.length > 0);
    return filtered.length > 0 ? filtered : [[]];
  };

  const templateModalJSX = isTemplateModalOpen && typeof window !== "undefined" && document.body && createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md no-print animate-in fade-in duration-300 text-slate-800 dark:text-slate-100">
      <div className="bg-card border border-border w-full max-w-4xl rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] md:max-h-[85vh] h-auto md:h-[620px] text-left animate-in zoom-in-95 duration-300">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-foreground flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-emerald-500" />
              Select Your Design Template
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Choose a design layout to start. You can customize colors and typography anytime.</p>
          </div>
          <button 
            onClick={() => setIsTemplateModalOpen(false)}
            className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Content - Template Grid */}
        <div className="flex-1 p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TEMPLATES.map((t) => {
            const isSelected = selectedTemplateId === t.id;
            return (
              <div
                key={t.id}
                onClick={() => setSelectedTemplateId(t.id)}
                className={`group cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-500/[0.02] shadow-[0_4px_20px_-4px_rgba(16,185,129,0.1)]"
                    : "border-border bg-card hover:border-slate-350 hover:bg-slate-50/20"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded ${
                      isSelected ? "bg-emerald-500/10 text-emerald-600" : "bg-secondary text-muted-foreground"
                    }`}>
                      {t.badge}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2.5 w-2.5 rounded-full ${t.colorClass}`} />
                      <span className="text-[10px] text-muted-foreground font-mono">{t.primaryColorName}</span>
                    </div>
                  </div>

                  <h4 className="text-xs font-black text-foreground">{t.name}</h4>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{t.description}</p>
                </div>

                {/* Miniature Layout Graphic Preview */}
                <div className="mt-4 p-3 bg-secondary/30 rounded-lg border border-border/50 space-y-2 relative overflow-hidden h-24 flex flex-col justify-between">
                  {/* Grid representation */}
                  <div className="flex gap-3 items-start h-full">
                    {t.layoutMode === "split" ? (
                      <>
                        <div className="w-2/3 space-y-1">
                          <div className="h-1.5 w-16 bg-slate-300 dark:bg-zinc-700 rounded-full" />
                          <div className="h-1 w-10 bg-slate-250 dark:bg-zinc-850 rounded-full" />
                          <div className="space-y-1 pt-1.5">
                            <div className="h-1 w-full bg-slate-200 dark:bg-zinc-800 rounded-full" />
                            <div className="h-1 w-5/6 bg-slate-200 dark:bg-zinc-800 rounded-full" />
                          </div>
                        </div>
                        <div className="w-1/3 border-l border-border/80 pl-2 space-y-1">
                          <div className="h-1.5 w-full rounded-full" style={{ backgroundColor: t.themeColor }} />
                          <div className="h-1 w-4 bg-slate-350 dark:bg-zinc-700 rounded-full" />
                          <div className="h-1 w-5 bg-slate-350 dark:bg-zinc-700 rounded-full" />
                        </div>
                      </>
                    ) : (
                      <div className="w-full space-y-1">
                        <div className="flex justify-between items-center pb-1 border-b border-border/80">
                          <div className="h-2 w-12 bg-slate-350 dark:bg-zinc-700 rounded-full" style={{ backgroundColor: t.themeColor }} />
                          <div className="h-1.5 w-6 bg-slate-250 dark:bg-zinc-800 rounded-full" />
                        </div>
                        <div className="space-y-1 pt-1">
                          <div className="h-1 w-full bg-slate-200 dark:bg-zinc-850 rounded-full" />
                          <div className="h-1 w-11/12 bg-slate-200 dark:bg-zinc-850 rounded-full" />
                          <div className="h-1 w-5/6 bg-slate-200 dark:bg-zinc-850 rounded-full" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-secondary/30 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="w-full sm:flex-1 sm:max-w-xs">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Resume Name</label>
            <Input
              value={newResumeName}
              onChange={(e) => setNewResumeName(e.target.value)}
              placeholder="E.g., Summer Internship Resume"
              className="h-9 text-xs rounded-lg focus-visible:ring-emerald-500 bg-card"
            />
          </div>
          <div className="flex items-center gap-2 justify-end w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => setIsTemplateModalOpen(false)}
              className="flex-1 sm:flex-none h-9 px-4 rounded-lg border border-border text-xs font-bold text-muted-foreground hover:bg-secondary cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmCreate}
              className="flex-1 sm:flex-none h-9 px-5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-extrabold text-xs uppercase tracking-wider cursor-pointer shadow-md transition-all"
            >
              Start Customizing
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );

  const deleteModalJSX = deleteResumeTarget && typeof window !== "undefined" && document.body && createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md no-print animate-in fade-in duration-200">
      <div className="bg-card border border-border w-full max-w-sm rounded-xl shadow-xl p-6 text-left animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 text-rose-500 mb-3">
          <div className="h-10 w-10 rounded-full bg-rose-500/10 flex items-center justify-center">
            <Trash2 className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-extrabold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>
            Delete Resume?
          </h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Are you sure you want to delete <span className="font-bold text-foreground">"{deleteResumeTarget.name}"</span>? This action cannot be undone.
        </p>
        <div className="flex items-center gap-2.5 mt-5">
          <Button
            variant="outline"
            onClick={() => setDeleteResumeTarget(null)}
            className="flex-1 h-9 rounded-lg border border-border text-xs font-bold text-muted-foreground hover:bg-secondary cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              const targetId = deleteResumeTarget.id;
              setDeleteResumeTarget(null);
              await confirmDeleteResume(targetId);
            }}
            className="flex-1 h-9 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs uppercase tracking-wider cursor-pointer shadow-md"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );

  if (viewMode === "dashboard") {
    const calculateCompleteness = (r: any) => {
      let score = 0;
      let max = 6;
      if (r.personalInfo?.fullName) score++;
      if (r.personalInfo?.email) score++;
      if (r.personalInfo?.phone) score++;
      if (r.personalInfo?.location) score++;
      if (r.personalInfo?.avatarUrl) score++;
      if (r.personalInfo?.socials?.length > 0) score++;
      
      const timelineCount = r.sections?.filter((s: any) => s.type === "timeline" && s.items?.length > 0).length || 0;
      const tagsCount = r.sections?.filter((s: any) => s.type === "tags" && s.categories?.length > 0).length || 0;
      
      score += Math.min(timelineCount, 2);
      score += Math.min(tagsCount, 1);
      max += 3;
      
      return Math.round((score / max) * 100);
    };

    const getRelativeTimeString = (dateStr: string) => {
      try {
        const elapsed = Date.now() - new Date(dateStr).getTime();
        const secs = Math.floor(elapsed / 1000);
        const mins = Math.floor(secs / 60);
        const hours = Math.floor(mins / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (mins > 0) return `${mins}m ago`;
        return "just now";
      } catch (e) {
        return "recently";
      }
    };

    const filteredResumes = resumesList
      .filter((resume) => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
          (resume.name || "").toLowerCase().includes(query) ||
          (resume.personalInfo?.fullName || "").toLowerCase().includes(query) ||
          (resume.personalInfo?.title || "").toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          return (a.name || "").localeCompare(b.name || "");
        } else {
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        }
      });

    return (
      <div className="w-full text-slate-800 dark:text-zinc-200 antialiased no-print flex flex-col gap-6 animate-in fade-in duration-500 py-2">
        
        {/* Clean Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>
                My Resumes
              </h1>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Create, customize, and export professional A4 resume templates.</p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              variant="outline"
              onClick={() => toast.info("Cloud import functionality is under development.")}
              className="h-9 px-3.5 rounded-xl border border-border bg-card text-xs font-bold text-muted-foreground hover:bg-secondary cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Upload className="h-4 w-4" />
              <span>Import</span>
            </Button>
            <Button
              onClick={handleCreateNewResume}
              className="h-9 px-4 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>New Resume</span>
            </Button>
          </div>
        </div>

        {/* Filter and Control Bar */}
        <div className="flex items-center justify-between gap-4 select-none">
          {/* Left: Active count and Search */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-extrabold text-foreground whitespace-nowrap hidden sm:inline">
              {filteredResumes.length} {filteredResumes.length === 1 ? 'Resume' : 'Resumes'}
            </span>
            <div className="relative group w-48 sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-755 transition-colors" />
              <Input
                placeholder="Search resumes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8.5 bg-card border border-border focus-visible:ring-1 focus-visible:ring-indigo-500 rounded-xl text-xs placeholder:text-zinc-400 font-medium transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Right: Sort and View toggles */}
          <div className="flex items-center justify-between sm:justify-end gap-3 self-stretch sm:self-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-border/60">
            {/* Sorting */}
            <div className="relative">
              <button
                onClick={() => setSortBy(sortBy === "date" ? "name" : "date")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-bold text-muted-foreground hover:bg-secondary hover:text-foreground transition-all cursor-pointer shadow-sm"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Sort: {sortBy === "date" ? "Date Created" : "Name"}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>

            {/* Layout Toggles */}
            <div className="flex bg-secondary p-0.5 rounded-lg border border-border">
              <button
                onClick={() => setViewStyle("grid")}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  viewStyle === "grid"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Grid View"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewStyle("list")}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  viewStyle === "list"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="List View"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Templates Feed Section */}
        <div className="pt-2">
          {filteredResumes.length === 0 ? (
            <div className="text-center py-20 bg-card border border-border/80 rounded-xl shadow-sm px-4">
              <div className="h-14 w-14 bg-secondary border border-border rounded-xl flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-extrabold text-foreground text-sm uppercase tracking-wider">No Resume Profiles Found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 leading-normal">
                Build your professional portfolio and download or share your resume instantly.
              </p>
              <Button onClick={handleCreateNewResume} className="mt-5 h-10 px-5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-[#4f46e5] dark:hover:bg-[#4338ca] text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md">
                <Plus className="h-4 w-4 mr-1.5" />
                <span>Create First Resume</span>
              </Button>
            </div>
          ) : viewStyle === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-10 gap-x-6 pt-6">
              {filteredResumes.map((resume) => {
                const cardAccentColor = resume.styleConfig?.themeColor || '#10b981';
                const percent = calculateCompleteness(resume);
                const componentsCount = resume.sections?.length || 0;
                const itemsCount = resume.sections?.reduce((acc: number, s: any) => acc + (s.items?.length || 0), 0) || 0;

                return (
                  <div key={resume.id} className="relative pt-5">
                    <div 
                      onClick={() => handleEditResume(resume)}
                      className="relative group bg-card border border-border/85 text-card-foreground shadow rounded-b-xl rounded-tr-xl rounded-tl-none hover:shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:border-slate-350 dark:hover:border-zinc-700 transition-all duration-300 flex flex-col justify-between cursor-pointer p-5 pt-6 z-10 min-h-[225px]"
                    >
                      {/* Folder Tab SVG Decoration (placed inside the card to align perfectly with its bounding box) */}
                      <div className="absolute -top-[21px] left-[-1px] w-[130px] h-[22px] pointer-events-none select-none z-20">
                        <svg viewBox="0 0 130 22" className="h-full w-full text-card fill-current stroke-border/85" style={{ strokeWidth: '1px' }}>
                          <path d="M 1.5,22 L 1.5,9 C 1.5,4.5 5,1 9.5,1 L 95,1 C 99.5,1 103,4 105.5,8 L 115.5,18 C 117.5,20 120,22 123.5,22" />
                        </svg>
                      </div>

                      {/* Mask to hide Card's top border under the tab area */}
                      <div className="absolute -top-[1px] left-[1px] w-[121px] h-[2px] bg-card z-25" />

                      {/* Dropdown Menu actions - Absolute positioned at top-right */}
                      <div className="absolute top-3 right-3 z-30">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 rounded-xl bg-card border border-border shadow-md" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => handleEditResume(resume)} className="text-xs font-semibold cursor-pointer py-2 px-3 hover:bg-secondary flex items-center gap-2">
                              <SlidersHorizontal className="h-3.5 w-3.5" /> Edit Canvas
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicateResume(resume)} className="text-xs font-semibold cursor-pointer py-2 px-3 hover:bg-secondary flex items-center gap-2">
                              <Copy className="h-3.5 w-3.5" /> Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteResume(resume)} className="text-xs font-semibold cursor-pointer py-2 px-3 hover:bg-secondary text-rose-500 hover:text-rose-600 hover:bg-rose-50/50 flex items-center gap-2">
                              <Trash className="h-3.5 w-3.5" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Card Content */}
                      <div>
                        {/* Top Row: Avatar and State Badge */}
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full overflow-hidden border border-border/80 bg-secondary shrink-0 flex items-center justify-center">
                            {resume.personalInfo?.avatarUrl ? (
                              <img src={resume.personalInfo.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                            ) : (
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </div>

                          {resume.isPublished ? (
                            <span className="inline-flex items-center gap-1 border border-emerald-500/20 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 dark:text-emerald-400 text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-md select-none">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              LIVE
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 border border-zinc-200 text-zinc-500 bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:bg-zinc-900/50 text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-md select-none">
                              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                              DRAFT
                            </span>
                          )}
                        </div>

                        {/* Title: 2 lines max */}
                        <h3 
                          className="font-extrabold text-foreground text-[15px] tracking-tight leading-snug line-clamp-2 mt-3.5 group-hover:text-[#4f46e5] dark:group-hover:text-indigo-400 transition-colors" 
                          style={{ fontFamily: "'Sora', sans-serif" }}
                        >
                          {resume.name || "Untitled Resume"}
                        </h3>

                        {/* Description: 3 lines max */}
                        <p className="text-[11.5px] text-muted-foreground/90 font-medium leading-relaxed line-clamp-3 mt-2">
                          {resume.personalInfo?.fullName || "Your Name"} • {resume.personalInfo?.title || "Professional Title"}
                          {resume.personalInfo?.location ? ` • Based in ${resume.personalInfo.location}` : ""}
                          {". Click to customize this resume, update contact details, experience entries, and list of skills."}
                        </p>

                        {/* Tags Row */}
                        <div className="flex flex-wrap gap-1.5 pt-3">
                          <span className="bg-slate-100 dark:bg-zinc-800 text-[8.5px] font-black text-slate-500 dark:text-zinc-400 tracking-wider uppercase px-2 py-0.5 rounded-md select-none">
                            {resume.styleConfig?.layoutMode === "split" ? "Split" : "Single"}
                          </span>
                          <span className="bg-slate-100 dark:bg-zinc-800 text-[8.5px] font-black text-slate-500 dark:text-zinc-400 tracking-wider uppercase px-2 py-0.5 rounded-md select-none">
                            {THEME_COLORS.find(c => c.value === resume.styleConfig?.themeColor)?.name || "Theme"}
                          </span>
                          <span className="bg-slate-100 dark:bg-zinc-800 text-[8.5px] font-black text-slate-500 dark:text-zinc-400 tracking-wider uppercase px-2 py-0.5 rounded-md select-none">
                            {resume.styleConfig?.fontFamily || "Sora"}
                          </span>
                        </div>
                      </div>

                      {/* Divider Line */}
                      <div className="border-t border-border/40 my-3.5" />

                      {/* Footer Stats Row */}
                      <div className="flex items-center justify-between select-none">
                        <div className="flex items-center gap-1.5" title="Sections count">
                          <Puzzle className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-[11px] text-foreground font-black leading-none">{componentsCount}</span>
                        </div>

                        <div className="flex items-center gap-1.5" title="Total content items">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-[11px] text-foreground font-black leading-none">{itemsCount}</span>
                        </div>

                        <div className="flex items-center gap-1.5" title="Profile completeness">
                          <svg className="h-3.5 w-3.5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="20" x2="18" y2="10"></line>
                            <line x1="12" y1="20" x2="12" y2="4"></line>
                            <line x1="6" y1="20" x2="6" y2="14"></line>
                          </svg>
                          <span className="text-[11px] text-foreground font-black leading-none">{percent}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col space-y-4">
              {filteredResumes.map((resume) => {
                const cardAccentColor = resume.styleConfig?.themeColor || '#10b981';
                const percent = calculateCompleteness(resume);
                return (
                  <Card 
                    key={resume.id} 
                    onClick={() => handleEditResume(resume)}
                    className="group bg-card border border-border/85 rounded-xl overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:border-slate-350 dark:hover:border-zinc-700 transition-all duration-300 flex flex-row items-center justify-between p-4 gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Accent color left bar */}
                      <div className="w-1.5 h-12 rounded-full shrink-0" style={{ backgroundColor: cardAccentColor }} />
                      
                      {/* Name & Updated info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5">
                          <h4 className="font-bold text-foreground text-sm truncate group-hover:text-[#4f46e5] dark:group-hover:text-indigo-400 transition-colors">{resume.name || "Untitled Resume"}</h4>
                          {resume.isPublished ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/15 text-[8px] font-black uppercase rounded px-1.5 py-0.5 tracking-wider shrink-0">
                              Live
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[8px] font-bold uppercase rounded px-1.5 py-0.5 tracking-wider border-border text-muted-foreground shrink-0">
                              Draft
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-medium mt-1 truncate">
                          {resume.personalInfo?.fullName || "Your Name"} • {resume.personalInfo?.title || "Professional Title"}
                        </p>
                      </div>
                    </div>

                    {/* Progress Completeness */}
                    <div className="hidden md:flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1.5 bg-secondary/50 rounded-lg px-2.5 py-1 border border-border/50">
                        <svg className="h-4 w-4 transform -rotate-90 select-none shrink-0" viewBox="0 0 36 36">
                          <path
                            className="text-zinc-150 dark:text-zinc-800"
                            strokeWidth="4"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="text-emerald-500"
                            strokeWidth="4"
                            strokeDasharray={`${percent}, 100`}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <span className="text-[10px] text-foreground font-bold">{percent}% Complete</span>
                      </div>
                    </div>

                    {/* Actions and details */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider hidden sm:inline">
                        Edited {getRelativeTimeString(resume.updatedAt)}
                      </span>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditResume(resume);
                        }}
                        className="h-8 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-[#4f46e5] dark:hover:bg-[#4338ca] text-white text-[10px] font-black uppercase tracking-wider transition-all"
                      >
                        Edit
                      </Button>
                      
                      {/* Three dot actions dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-lg border-border hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 rounded-xl bg-card border border-border shadow-md" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem onClick={() => handleDuplicateResume(resume)} className="text-xs font-semibold cursor-pointer py-2 px-3 hover:bg-secondary flex items-center gap-2">
                            <Copy className="h-3.5 w-3.5" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteResume(resume)} className="text-xs font-semibold cursor-pointer py-2 px-3 hover:bg-secondary text-rose-500 hover:text-rose-600 hover:bg-rose-50/50 flex items-center gap-2">
                            <Trash className="h-3.5 w-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
        {templateModalJSX}
        {deleteModalJSX}
      </div>
    );
  }

  // Editor View
  return (
    <div className="w-full bg-background min-h-screen text-slate-800 dark:text-zinc-100 antialiased selection:bg-emerald-100 selection:text-emerald-800 print:bg-white print:text-slate-900">
      {/* Mobile Tabs */}
      <div className="flex lg:hidden justify-center px-4 mt-6 mb-4 no-print">
        <div className="flex w-full max-w-xs bg-secondary p-0.5 rounded-xl border border-border">
          <button
            onClick={() => setActiveWorkspaceTab("editor")}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${activeWorkspaceTab === "editor" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            Editor
          </button>
          <button
            onClick={() => setActiveWorkspaceTab("preview")}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${activeWorkspaceTab === "preview" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            Preview
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start px-4 md:px-6 pt-6 pb-12 print:block print:p-0 print:m-0">
        {/* Left Panel - Editor */}
        <div className={`lg:col-span-5 space-y-5 mt-2 no-print ${activeWorkspaceTab === "editor" ? "block" : "hidden lg:block"}`}>
          
          {/* Back & Control Actions */}
          <div className="flex items-center justify-between gap-3 px-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("dashboard")}
              className="h-8 px-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-slate-200/50 dark:hover:bg-zinc-800 rounded-md transition-all flex items-center gap-1 cursor-pointer shrink-0"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </Button>
            
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                onClick={() => saveVault(true)}
                variant="outline"
                className="h-8 px-3 rounded-md border border-border bg-card text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer shadow-sm"
              >
                <Save className="h-3.5 w-3.5 mr-1 text-slate-400 dark:text-zinc-500" />
                <span>Save</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadPDF}
                className="h-8 w-8 rounded-md border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer flex items-center justify-center shadow-sm"
                title="Download PDF"
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          
          {/* Title Area */}
          <div className="flex items-center justify-between gap-3 px-1.5">
            <input
              type="text"
              value={resumesList.find(r => r.id === activeResumeId)?.name || ""}
              onChange={(e) => {
                const newName = e.target.value;
                const nextList = resumesList.map(r => r.id === activeResumeId ? { ...r, name: newName } : r);
                setResumesList(nextList);
                triggerAutosave(personalInfo, sections, styleConfig);
              }}
              className="text-base font-extrabold text-foreground bg-transparent border border-transparent hover:border-border/50 focus:bg-white dark:focus:bg-zinc-900 focus:border-border rounded-md px-2 py-1 transition-all flex-1 outline-none font-bold"
              placeholder="Untitled Resume"
            />
            {savingStatus === "Saving..." ? (
              <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/15 rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider select-none shrink-0">
                <span className="h-1 w-1 rounded-full bg-amber-500 animate-ping" />
                Saving
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15 rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider select-none shrink-0">
                <span className="h-1 w-1 rounded-full bg-emerald-500" />
                Saved
              </span>
            )}
          </div>

          <Tabs defaultValue="branding" className="w-full space-y-5">
            <TabsList className="grid grid-cols-2 bg-secondary p-1 rounded-lg h-9.5 border border-border">
              <TabsTrigger value="branding" className="text-xs font-bold uppercase tracking-wider rounded-md data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all text-muted-foreground">
                <User className="h-3.5 w-3.5 mr-1.5" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="content" className="text-xs font-bold uppercase tracking-wider rounded-md data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all text-muted-foreground">
                <Layers className="h-3.5 w-3.5 mr-1.5" />
                Sections
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="branding" className="space-y-4 focus-visible:outline-none">
              <Card className="p-5 border border-border/80 rounded-xl bg-card shadow-[0_8px_30px_rgba(0,0,0,0.01)]">
                <div className="flex items-center gap-2 mb-5 pb-2 border-b border-slate-100">
                  <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Personal Information</h2>
                    <p className="text-[10px] text-slate-400">Your contact and identity details</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg mb-1">
                    <div className="h-12 w-12 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {personalInfo.avatarUrl ? (
                        <img src={personalInfo.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-medium text-slate-500">Avatar URL (Optional)</label>
                        <label className="flex items-center gap-1 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={styleConfig.showAvatar !== "false"}
                            onChange={(e) => updateStyle("showAvatar", e.target.checked ? "true" : "false")}
                            className="h-3 w-3 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                          />
                          <span className="text-[9px] font-medium text-slate-400">Show on Resume</span>
                        </label>
                      </div>
                      <Input
                        value={personalInfo.avatarUrl || ""}
                        onChange={(e) => updatePersonalInfo("avatarUrl", e.target.value)}
                        className="h-8 text-xs rounded-md focus-visible:ring-emerald-500 bg-white"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-medium text-slate-500 block mb-1">Full Name</label>
                      <Input
                        value={personalInfo.fullName}
                        onChange={(e) => updatePersonalInfo("fullName", e.target.value)}
                        className="h-9 text-sm rounded-md focus-visible:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-slate-500 block mb-1">Professional Title</label>
                      <Input
                        value={personalInfo.title}
                        onChange={(e) => updatePersonalInfo("title", e.target.value)}
                        className="h-9 text-sm rounded-md focus-visible:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-medium text-slate-500 block mb-1">Email</label>
                      <Input
                        value={personalInfo.email}
                        onChange={(e) => updatePersonalInfo("email", e.target.value)}
                        className="h-9 text-sm rounded-md focus-visible:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-slate-500 block mb-1">Phone</label>
                      <Input
                        value={personalInfo.phone}
                        onChange={(e) => updatePersonalInfo("phone", e.target.value)}
                        className="h-9 text-sm rounded-md focus-visible:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-medium text-slate-500 block mb-1">Location</label>
                      <Input
                        value={personalInfo.location || ""}
                        onChange={(e) => updatePersonalInfo("location", e.target.value)}
                        className="h-9 text-sm rounded-md focus-visible:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-slate-500 block mb-1">GitHub</label>
                      <Input
                        value={personalInfo.socials.find(s => s.platform === "Github")?.url || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          const nextSocials = personalInfo.socials.filter(s => s.platform !== "Github");
                          if (val.trim()) nextSocials.push({ platform: "Github", url: val.trim() });
                          updatePersonalInfo("socials", nextSocials);
                        }}
                        className="h-9 text-sm rounded-md focus-visible:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-slate-500 block mb-1">LinkedIn</label>
                    <Input
                      value={personalInfo.socials.find(s => s.platform === "Linkedin")?.url || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        const nextSocials = personalInfo.socials.filter(s => s.platform !== "Linkedin");
                        if (val.trim()) nextSocials.push({ platform: "Linkedin", url: val.trim() });
                        updatePersonalInfo("socials", nextSocials);
                      }}
                      className="h-9 text-sm rounded-md focus-visible:ring-emerald-500"
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Sections Tab */}
            <TabsContent value="content" className="space-y-4 focus-visible:outline-none">
              <div className="space-y-3">
                {sections.map((section) => {
                  const isActive = activeFormTab === section.id;
                  let sectionIcon = "📄";
                  if (section.type === "tags") sectionIcon = "🏷️";
                  if (section.type === "text") sectionIcon = "📝";
                  if (section.type === "pagebreak") sectionIcon = "📄";

                  return (
                    <Card key={section.id} className={`border rounded-xl shadow-sm overflow-hidden transition-all ${isActive ? "border-emerald-500/30 ring-1 ring-emerald-500/10" : "border-slate-200"}`}>
                      <div className="w-full flex items-center justify-between p-3 bg-slate-50/50 border-b border-slate-100">
                        <button
                          onClick={() => setActiveFormTab(isActive ? "" : section.id)}
                          className="flex-1 flex items-center gap-2.5 text-sm font-medium text-left focus:outline-none text-slate-800"
                        >
                          <span className="h-6 w-6 rounded-md bg-white border border-slate-200 shadow-sm flex items-center justify-center text-xs">
                            {sectionIcon}
                          </span>
                          <span className="truncate">{section.title}</span>
                          {!section.isVisible && (
                            <Badge variant="outline" className="text-[9px] px-1.5 h-4 bg-white text-slate-400 border-slate-200 rounded">Hidden</Badge>
                          )}
                        </button>
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => toggleSectionVisibility(section.id)}
                            className="h-7 w-7 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {section.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => deleteSection(section.id)}
                            className="h-7 w-7 rounded-md hover:bg-red-50 flex items-center justify-center text-slate-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {isActive && (
                        <div className="p-4 space-y-4 animate-fade-in">
                          <div className="pb-3 border-b border-slate-100">
                            <label className="text-[10px] font-medium text-slate-500 block mb-1">Section Title</label>
                            <Input
                              value={section.title}
                              onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                              className="h-8 text-sm rounded-md focus-visible:ring-emerald-500"
                            />
                          </div>

                          {section.type === "timeline" && (
                            <div className="space-y-4">
                              {(section.items || []).map((item, idx) => (
                                <div key={item.id} className="p-3 rounded-lg border border-slate-200 bg-white relative space-y-3">
                                  <button
                                    onClick={() => deleteTimelineItem(section.id, item.id)}
                                    className="absolute top-2 right-2 text-slate-400 hover:text-red-500 h-6 w-6 flex items-center justify-center rounded-md hover:bg-red-50"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-6">
                                    <div>
                                      <label className="text-[9px] font-medium text-slate-500 block">Organization</label>
                                      <Input
                                        value={item.primaryHeader}
                                        onChange={(e) => updateTimelineItem(section.id, item.id, "primaryHeader", e.target.value)}
                                        className="h-8 text-xs rounded-md"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[9px] font-medium text-slate-500 block">Role</label>
                                      <Input
                                        value={item.secondaryHeader}
                                        onChange={(e) => updateTimelineItem(section.id, item.id, "secondaryHeader", e.target.value)}
                                        className="h-8 text-xs rounded-md"
                                      />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                      <label className="text-[9px] font-medium text-slate-500 block">Date Range</label>
                                      <Input
                                        value={item.dateRange}
                                        onChange={(e) => updateTimelineItem(section.id, item.id, "dateRange", e.target.value)}
                                        className="h-8 text-xs rounded-md"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[9px] font-medium text-slate-500 block">Metric (GPA, etc.)</label>
                                      <Input
                                        value={item.metrics}
                                        onChange={(e) => updateTimelineItem(section.id, item.id, "metrics", e.target.value)}
                                        className="h-8 text-xs rounded-md"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-[9px] font-medium text-slate-500 block">Description</label>
                                    <Textarea
                                      value={item.description}
                                      onChange={(e) => updateTimelineItem(section.id, item.id, "description", e.target.value)}
                                      className="text-xs min-h-[70px] rounded-md focus-visible:ring-emerald-500"
                                    />
                                  </div>
                                </div>
                              ))}
                              <Button
                                onClick={() => addTimelineItem(section.id)}
                                variant="outline"
                                className="w-full h-9 text-xs font-medium border-dashed rounded-md gap-1"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                Add Entry
                              </Button>
                            </div>
                          )}

                          {section.type === "tags" && (
                            <div className="space-y-4">
                              {(section.categories || []).map((cat, catIdx) => (
                                <div key={catIdx} className="p-3 rounded-lg border border-slate-200 bg-white space-y-3">
                                  <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-medium text-slate-500">Category Name</label>
                                    <button
                                      onClick={() => deleteTagCategory(section.id, catIdx)}
                                      className="text-slate-400 hover:text-red-500 h-6 w-6 flex items-center justify-center rounded-md hover:bg-red-50"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                  <Input
                                    value={cat.name}
                                    onChange={(e) => updateTagCategoryName(section.id, catIdx, e.target.value)}
                                    className="h-8 text-sm rounded-md"
                                  />
                                  <div>
                                    <label className="text-[10px] font-medium text-slate-500 block mb-1">Skills (comma separated)</label>
                                    <Input
                                      value={editingTags[`${section.id}-${catIdx}`] !== undefined ? editingTags[`${section.id}-${catIdx}`] : cat.tags.join(", ")}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setEditingTags(prev => ({ ...prev, [`${section.id}-${catIdx}`]: val }));
                                        updateTagCategoryTags(section.id, catIdx, val);
                                      }}
                                      onBlur={() => {
                                        setEditingTags(prev => {
                                          const next = { ...prev };
                                          delete next[`${section.id}-${catIdx}`];
                                          return next;
                                        });
                                      }}
                                      className="h-8 text-sm rounded-md"
                                    />
                                  </div>
                                </div>
                              ))}
                              <Button
                                onClick={() => addTagCategory(section.id)}
                                variant="outline"
                                className="w-full h-9 text-xs font-medium border-dashed rounded-md gap-1"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                Add Category
                              </Button>
                            </div>
                          )}

                          {section.type === "text" && (
                            <div>
                              <label className="text-[10px] font-medium text-slate-500 block mb-1">Text Content</label>
                              <Textarea
                                value={section.textContent || ""}
                                onChange={(e) => updateTextContent(section.id, e.target.value)}
                                className="text-xs min-h-[120px] rounded-md focus-visible:ring-emerald-500"
                                placeholder="Enter your custom text here..."
                              />
                            </div>
                          )}

                          {section.type === "pagebreak" && (
                            <div className="text-slate-500 text-xs p-3 bg-slate-50 rounded-md border border-slate-200 flex items-center gap-2">
                              <span>📄</span>
                              <span>Page break - forces a new page in PDF export.</span>
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>

              <Card className="p-4 border border-dashed border-slate-300 rounded-xl bg-slate-50/30">
                <h3 className="text-xs font-semibold text-slate-600 mb-3 flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                  Add Custom Block
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => addCustomSection("timeline")} variant="outline" size="sm" className="h-9 text-xs rounded-lg gap-1 bg-white">
                    <Briefcase className="h-3.5 w-3.5" /> Timeline
                  </Button>
                  <Button onClick={() => addCustomSection("tags")} variant="outline" size="sm" className="h-9 text-xs rounded-lg gap-1 bg-white">
                    <Terminal className="h-3.5 w-3.5" /> Skills
                  </Button>
                  <Button onClick={() => addCustomSection("text")} variant="outline" size="sm" className="h-9 text-xs rounded-lg gap-1 bg-white">
                    <FileText className="h-3.5 w-3.5" /> Text Block
                  </Button>
                  <Button onClick={() => addCustomSection("pagebreak")} variant="outline" size="sm" className="h-9 text-xs rounded-lg gap-1 bg-white">
                    <span>📄 Page Break</span>
                  </Button>
                </div>
              </Card>
            </TabsContent>

          </Tabs>
        </div>

        {/* Right Panel - Preview Canvas */}
        <div className={`lg:col-span-7 flex flex-col items-center print:block print:w-full ${activeWorkspaceTab === "preview" ? "block" : "hidden lg:block"}`}>
          <div className="w-full overflow-auto rounded-2xl canvas-container print:p-0 print:bg-white print:rounded-none">
            {getPages().map((pageSections, pageIdx) => {
              const spacing = getSpacingClasses();
              return (
                <div
                  key={pageIdx}
                  data-page-index={pageIdx}
                  className={`resume-page w-[210mm] h-[297mm] bg-white p-8 relative overflow-hidden shrink-0 lining-nums ${getFontFamilyClass()}`}
                  style={{
                    fontSize: styleConfig.fontSize === "xs" ? "12px" : styleConfig.fontSize === "sm" ? "13px" : "14px",
                    lineHeight: styleConfig.lineHeight === "tight" ? "1.2" : styleConfig.lineHeight === "relaxed" ? "1.6" : "1.4"
                  }}
                >
                  {/* Header - Only on Page 1 */}
                  {pageIdx === 0 && styleConfig.templateId === "slate-pro" && (
                    <div className="border-b-2 pb-5 mb-6 text-center space-y-3" style={{ borderColor: styleConfig.themeColor }}>
                      {styleConfig.showAvatar !== "false" && personalInfo.avatarUrl && (
                        <div className="h-16 w-16 rounded-full overflow-hidden border-2 shadow-sm mx-auto" style={{ borderColor: styleConfig.themeColor }}>
                          <img src={personalInfo.avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                        </div>
                      )}
                      <div>
                        <h1 className="text-3xl font-extrabold font-serif tracking-tight" style={{ color: styleConfig.themeColor }}>
                          {personalInfo.fullName}
                        </h1>
                        <p className="text-[10px] uppercase tracking-[0.2em] font-sans font-black text-slate-400 mt-1">{personalInfo.title}</p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[10px] text-slate-500 font-medium">
                        {personalInfo.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" style={{ color: styleConfig.themeColor }} />
                            <span>{personalInfo.location}</span>
                          </span>
                        )}
                        {personalInfo.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" style={{ color: styleConfig.themeColor }} />
                            <a href={`tel:${personalInfo.phone}`} className="hover:underline text-slate-600">{personalInfo.phone}</a>
                          </span>
                        )}
                        {personalInfo.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" style={{ color: styleConfig.themeColor }} />
                            <a href={`mailto:${personalInfo.email}`} className="hover:underline text-slate-600">{personalInfo.email}</a>
                          </span>
                        )}
                      </div>
                      {personalInfo.socials.length > 0 && (
                        <div className="flex items-center justify-center gap-4 text-[9px] font-medium pt-0.5">
                          {personalInfo.socials.map((social, idx) => {
                            const cleanUrl = social.url.startsWith("http") ? social.url : `https://${social.url}`;
                            return (
                              <a 
                                key={idx} 
                                href={cleanUrl}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 hover:underline text-slate-500"
                              >
                                {social.platform === "Github" ? <Github className="h-3 w-3" style={{ color: styleConfig.themeColor }} /> : <Linkedin className="h-3 w-3" style={{ color: styleConfig.themeColor }} />}
                                <span>{social.url.replace("https://", "").replace("http://", "")}</span>
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {pageIdx === 0 && styleConfig.templateId === "minimalist" && (
                    <div className="pb-4 mb-5 space-y-2" style={{ borderBottom: `1px solid ${styleConfig.themeColor}20` }}>
                      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                        <h1 className="text-2xl font-black font-mono tracking-tight" style={{ color: styleConfig.themeColor }}>
                          {personalInfo.fullName}
                        </h1>
                        <p className="text-xs font-mono font-bold text-slate-400">{personalInfo.title}</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-dashed border-slate-100 text-[10px] text-slate-500 font-mono">
                        <div className="space-y-1">
                          {personalInfo.location && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-300">&gt;</span>
                              <span>{personalInfo.location}</span>
                            </div>
                          )}
                          {personalInfo.phone && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-300">&gt;</span>
                              <a href={`tel:${personalInfo.phone}`} className="hover:underline">{personalInfo.phone}</a>
                            </div>
                          )}
                        </div>
                        <div className="space-y-1 text-left sm:text-right">
                          {personalInfo.email && (
                            <div className="flex items-center sm:justify-end gap-1.5">
                              <a href={`mailto:${personalInfo.email}`} className="hover:underline">{personalInfo.email}</a>
                              <span className="text-slate-300">&lt;</span>
                            </div>
                          )}
                          {personalInfo.socials.map((social, idx) => {
                            const cleanUrl = social.url.startsWith("http") ? social.url : `https://${social.url}`;
                            return (
                              <div key={idx} className="flex items-center sm:justify-end gap-1.5">
                                <a href={cleanUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                  {social.url.replace("https://", "").replace("http://", "")}
                                </a>
                                <span className="text-slate-300">&lt;</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {pageIdx === 0 && styleConfig.templateId === "creative-bold" && (
                    <div className="relative rounded-2xl overflow-hidden mb-6 border p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-br from-slate-50 to-white" style={{ borderColor: `${styleConfig.themeColor}30` }}>
                      <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ backgroundColor: styleConfig.themeColor }} />
                      <div className="flex items-center gap-4 relative z-10">
                        {styleConfig.showAvatar !== "false" && personalInfo.avatarUrl && (
                          <div className="h-16 w-16 rounded-2xl overflow-hidden border-2 shadow-md shrink-0" style={{ borderColor: styleConfig.themeColor }}>
                            <img src={personalInfo.avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                          </div>
                        )}
                        <div>
                          <h1 className="text-2xl font-black tracking-tight" style={{ color: styleConfig.themeColor }}>
                            {personalInfo.fullName}
                          </h1>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">{personalInfo.title}</p>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-500 space-y-1 relative z-10 text-left sm:text-right shrink-0">
                        {personalInfo.location && <div className="flex items-center sm:justify-end gap-1"><span>{personalInfo.location}</span><MapPin className="h-3 w-3 text-slate-400" /></div>}
                        {personalInfo.phone && <div className="flex items-center sm:justify-end gap-1"><a href={`tel:${personalInfo.phone}`} className="hover:underline font-semibold text-slate-750">{personalInfo.phone}</a><Phone className="h-3 w-3 text-slate-400" /></div>}
                        {personalInfo.email && <div className="flex items-center sm:justify-end gap-1"><a href={`mailto:${personalInfo.email}`} className="hover:underline font-semibold text-slate-750">{personalInfo.email}</a><Mail className="h-3 w-3 text-slate-400" /></div>}
                      </div>
                    </div>
                  )}

                  {pageIdx === 0 && styleConfig.templateId === "exec-director" && (
                    <div className="-mx-8 -mt-8 mb-6 p-8 text-white flex flex-col sm:flex-row justify-between items-center gap-4" style={{ backgroundColor: styleConfig.themeColor }}>
                      <div className="text-center sm:text-left">
                        <h1 className="text-3xl font-extrabold tracking-tight font-serif">
                          {personalInfo.fullName}
                        </h1>
                        <p className="text-xs font-bold uppercase tracking-widest text-white/80 mt-1">{personalInfo.title}</p>
                      </div>
                      <div className="text-[10px] text-white/90 space-y-1 text-center sm:text-right font-medium">
                        {personalInfo.location && <div className="flex items-center justify-center sm:justify-end gap-1"><span>{personalInfo.location}</span><MapPin className="h-3 w-3 text-white/70" /></div>}
                        {personalInfo.phone && <div className="flex items-center justify-center sm:justify-end gap-1"><a href={`tel:${personalInfo.phone}`} className="hover:underline">{personalInfo.phone}</a><Phone className="h-3 w-3 text-white/70" /></div>}
                        {personalInfo.email && <div className="flex items-center justify-center sm:justify-end gap-1"><a href={`mailto:${personalInfo.email}`} className="hover:underline">{personalInfo.email}</a><Mail className="h-3 w-3 text-white/70" /></div>}
                        {personalInfo.socials.map((social, idx) => (
                          <div key={idx} className="flex items-center justify-center sm:justify-end gap-1">
                            <a href={social.url.startsWith("http") ? social.url : `https://${social.url}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              {social.url.replace("https://", "").replace("http://", "")}
                            </a>
                            {social.platform === "Github" ? <Github className="h-3 w-3 text-white/70" /> : <Linkedin className="h-3 w-3 text-white/70" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {pageIdx === 0 && styleConfig.templateId === "modern-corporate" && (
                    <div className="border-l-4 pl-4 mb-6 flex justify-between items-start gap-4" style={{ borderColor: styleConfig.themeColor }}>
                      <div>
                        <h1 className="text-2xl font-black uppercase tracking-tight text-slate-800">
                          {personalInfo.fullName}
                        </h1>
                        <p className="text-xs font-bold uppercase tracking-wider mt-1" style={{ color: styleConfig.themeColor }}>{personalInfo.title}</p>
                      </div>
                      <div className="text-[10px] text-slate-500 space-y-1 text-right font-medium">
                        {personalInfo.location && <div className="flex items-center justify-end gap-1"><span>{personalInfo.location}</span><MapPin className="h-3 w-3" style={{ color: styleConfig.themeColor }} /></div>}
                        {personalInfo.phone && <div className="flex items-center justify-end gap-1"><a href={`tel:${personalInfo.phone}`} className="hover:underline text-slate-650 font-semibold">{personalInfo.phone}</a><Phone className="h-3 w-3" style={{ color: styleConfig.themeColor }} /></div>}
                        {personalInfo.email && <div className="flex items-center justify-end gap-1"><a href={`mailto:${personalInfo.email}`} className="hover:underline text-slate-650 font-semibold">{personalInfo.email}</a><Mail className="h-3 w-3" style={{ color: styleConfig.themeColor }} /></div>}
                        {personalInfo.socials.map((social, idx) => (
                          <div key={idx} className="flex items-center justify-end gap-1">
                            <a href={social.url.startsWith("http") ? social.url : `https://${social.url}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-slate-650 font-semibold">
                              {social.url.replace("https://", "").replace("http://", "")}
                            </a>
                            {social.platform === "Github" ? <Github className="h-3 w-3" style={{ color: styleConfig.themeColor }} /> : <Linkedin className="h-3 w-3" style={{ color: styleConfig.themeColor }} />}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {pageIdx === 0 && 
                   styleConfig.templateId !== "slate-pro" && 
                   styleConfig.templateId !== "minimalist" && 
                   styleConfig.templateId !== "creative-bold" && 
                   styleConfig.templateId !== "exec-director" && 
                   styleConfig.templateId !== "modern-corporate" && (
                    <div className="border-b pb-4 mb-5" style={{ borderColor: `${styleConfig.themeColor}40` }}>
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-4">
                          {styleConfig.showAvatar !== "false" && personalInfo.avatarUrl && (
                            <div className="h-14 w-14 rounded-full overflow-hidden border shadow-sm" style={{ borderColor: styleConfig.themeColor }}>
                              <img src={personalInfo.avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                            </div>
                          )}
                          <div>
                            <h1 className="text-2xl font-bold tracking-tight" style={{ color: styleConfig.themeColor }}>
                              {personalInfo.fullName}
                            </h1>
                            <p className="text-sm font-medium text-slate-500">{personalInfo.title}</p>
                          </div>
                        </div>
                        <div className="text-[10px] text-slate-500 space-y-1 text-right">
                          {personalInfo.location && (
                            <div className="flex items-center justify-end gap-1">
                              <span>{personalInfo.location}</span>
                              <MapPin className="h-3 w-3" style={{ color: styleConfig.themeColor }} />
                            </div>
                          )}
                          {personalInfo.phone && (
                            <div className="flex items-center justify-end gap-1">
                              <a href={`tel:${personalInfo.phone}`} className="text-blue-600 hover:text-blue-800 hover:underline transition-colors font-medium">
                                {personalInfo.phone}
                              </a>
                              <Phone className="h-3 w-3 text-blue-600" />
                            </div>
                          )}
                          {personalInfo.email && (
                            <div className="flex items-center justify-end gap-1">
                              <a href={`mailto:${personalInfo.email}`} className="text-blue-600 hover:text-blue-800 hover:underline transition-colors font-medium">
                                {personalInfo.email}
                              </a>
                              <Mail className="h-3 w-3 text-blue-600" />
                            </div>
                          )}
                        </div>
                      </div>
                      {personalInfo.socials.length > 0 && (
                        <div className="flex items-center gap-4 mt-3 pt-2 text-[9px] text-slate-400 font-medium">
                          {personalInfo.socials.map((social, idx) => {
                            const cleanUrl = social.url.startsWith("http") ? social.url : `https://${social.url}`;
                            return (
                              <a 
                                key={idx} 
                                href={cleanUrl}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer font-medium"
                              >
                                {social.platform === "Github" ? <Github className="h-3 w-3 text-blue-600" /> : <Linkedin className="h-3 w-3 text-blue-600" />}
                                <span>{social.url.replace("https://", "").replace("http://", "")}</span>
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Page Number Indicator */}
                  <div className="absolute bottom-3 right-4 text-[9px] text-slate-300 font-mono select-none no-print">
                    Page {pageIdx + 1} of {getPages().length}
                  </div>

                  {/* Sections Render */}
                  <div className={`grid gap-5 ${styleConfig.layoutMode === "split" ? "grid-cols-12" : "grid-cols-1"}`}>
                    {styleConfig.layoutMode === "split" ? (
                      <>
                        <div className={`col-span-8 ${spacing.sectionGap}`}>
                          {pageSections.filter(s => s.type === "timeline" || s.type === "text").map(section => (
                            <div key={section.id} className="space-y-2">
                              <h2 className="text-xs font-bold uppercase tracking-wider border-b pb-1" style={{ color: styleConfig.themeColor, borderColor: `${styleConfig.themeColor}30` }}>
                                {section.title}
                              </h2>
                              {section.type === "timeline" && (
                                <div className="relative pl-5 border-l border-dashed ml-2" style={{ borderColor: `${styleConfig.themeColor}40` }}>
                                  {(section.items || []).map(item => (
                                    <div key={item.id} className={`relative ${spacing.timelineItemGap} text-xs ${spacing.itemGap}`}>
                                      {/* Premium Concentric Halo Timeline Node */}
                                      <div 
                                        className="absolute rounded-full z-10 flex items-center justify-center pointer-events-none"
                                        style={{ 
                                          left: "-27px", 
                                          top: "3px",
                                          width: "14px",
                                          height: "14px",
                                          backgroundColor: `${styleConfig.themeColor}20`
                                        }}
                                      >
                                        <div 
                                          className="h-1.5 w-1.5 rounded-full" 
                                          style={{ backgroundColor: styleConfig.themeColor }}
                                        />
                                      </div>
                                      <div className="flex justify-between items-start gap-3">
                                        <h3 className="font-bold text-slate-800">{item.primaryHeader}</h3>
                                        <span className="text-[10px] font-medium text-slate-400">{item.dateRange}</span>
                                      </div>
                                      <div className="flex justify-between items-baseline gap-3 text-[10px] font-medium text-slate-500">
                                        <span>{item.secondaryHeader}</span>
                                        {item.metrics && <span className="bg-slate-50 px-1.5 py-0.5 rounded text-[9px]">{item.metrics}</span>}
                                      </div>
                                      <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{item.description}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {section.type === "text" && <p className="text-[10px] text-slate-500 leading-relaxed">{section.textContent}</p>}
                            </div>
                          ))}
                        </div>
                        <div 
                          className={`col-span-4 ${spacing.sectionGap} ${
                            (styleConfig.templateId === "creative-bold" || styleConfig.templateId === "ux-designer" || styleConfig.templateId === "mkt-specialist")
                              ? "border border-slate-100 p-4 rounded-2xl shadow-sm" 
                              : "border-l border-slate-100 pl-4"
                          }`}
                          style={
                            (styleConfig.templateId === "creative-bold" || styleConfig.templateId === "ux-designer" || styleConfig.templateId === "mkt-specialist")
                              ? { backgroundColor: `${styleConfig.themeColor}0a`, borderColor: `${styleConfig.themeColor}20` }
                              : {}
                          }
                        >
                          {pageSections.filter(s => s.type === "tags").map(section => (
                            <div key={section.id} className="space-y-2">
                              <h2 className="text-xs font-bold uppercase tracking-wider border-b pb-1" style={{ color: styleConfig.themeColor, borderColor: `${styleConfig.themeColor}30` }}>
                                {section.title}
                              </h2>
                              <div className={spacing.categoriesGap}>
                                {(section.categories || []).map((cat, idx) => (
                                  <div key={idx}>
                                    <h4 className="text-[9px] font-bold uppercase text-slate-500">{cat.name}</h4>
                                    <div className={`flex flex-wrap ${spacing.tagsGap}`}>
                                      {cat.tags.map((tag, tagIdx) => (
                                        <span key={tagIdx} className="text-[8px] font-medium px-1.5 py-0.5 rounded border" style={{ backgroundColor: `${styleConfig.themeColor}10`, borderColor: `${styleConfig.themeColor}30`, color: styleConfig.themeColor }}>
                                          {tag}
                                        </span>
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
                      <div className={`col-span-1 ${spacing.sectionGap}`}>
                        {pageSections.map(section => (
                          <div key={section.id} className="space-y-2">
                            <h2 className="text-xs font-bold uppercase tracking-wider border-b pb-1" style={{ color: styleConfig.themeColor, borderColor: `${styleConfig.themeColor}30` }}>
                              {section.title}
                            </h2>
                            {section.type === "timeline" && (
                              <div className="relative pl-5 border-l border-dashed ml-2" style={{ borderColor: `${styleConfig.themeColor}40` }}>
                                {(section.items || []).map(item => (
                                  <div key={item.id} className={`relative ${spacing.timelineItemGap} text-xs ${spacing.itemGap}`}>
                                    {/* Premium Concentric Halo Timeline Node */}
                                    <div 
                                      className="absolute rounded-full z-10 flex items-center justify-center pointer-events-none"
                                      style={{ 
                                        left: "-27px", 
                                        top: "3px",
                                        width: "14px",
                                        height: "14px",
                                        backgroundColor: `${styleConfig.themeColor}20`
                                      }}
                                    >
                                      <div 
                                        className="h-1.5 w-1.5 rounded-full" 
                                        style={{ backgroundColor: styleConfig.themeColor }}
                                      />
                                    </div>
                                    <div className="flex justify-between items-start gap-3">
                                      <h3 className="font-bold text-slate-800">{item.primaryHeader}</h3>
                                      <span className="text-[10px] font-medium text-slate-400">{item.dateRange}</span>
                                    </div>
                                    <div className="flex justify-between items-baseline gap-3 text-[10px] font-medium text-slate-500">
                                      <span>{item.secondaryHeader}</span>
                                      {item.metrics && <span className="bg-slate-50 px-1.5 py-0.5 rounded text-[9px]">{item.metrics}</span>}
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{item.description}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                            {section.type === "tags" && (
                              <div className={`grid grid-cols-1 sm:grid-cols-2 ${spacing.categoriesGap}`}>
                                {(section.categories || []).map((cat, idx) => (
                                  <div key={idx}>
                                    <h4 className="text-[9px] font-bold uppercase text-slate-500">{cat.name}</h4>
                                    <div className={`flex flex-wrap ${spacing.tagsGap}`}>
                                      {cat.tags.map((tag, tagIdx) => (
                                        <span key={tagIdx} className="text-[8px] font-medium px-1.5 py-0.5 rounded border" style={{ backgroundColor: `${styleConfig.themeColor}10`, borderColor: `${styleConfig.themeColor}30`, color: styleConfig.themeColor }}>
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            {section.type === "text" && <p className="text-[10px] text-slate-500 leading-relaxed">{section.textContent}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {isPublished && pageIdx === 0 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[7px] text-slate-300 font-medium no-print">
                      <Sparkles className="h-2 w-2 text-emerald-400" />
                      <span>Live on Lakshay IQ</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        .canvas-container {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 32px;
          overflow-y: auto;
          padding: 32px 16px;
          background-color: rgba(0, 0, 0, 0.02);
          background-image: radial-gradient(#cbd5e1 1.5px, transparent 1.5px);
          background-size: 24px 24px;
        }
        .resume-page, .resume-page * {
          --background: #ffffff !important;
          --foreground: #0f172a !important;
          --surface: #f8fafc !important;
          --surface-foreground: #0f172a !important;
          --card: #ffffff !important;
          --card-foreground: #0f172a !important;
          --popover: #ffffff !important;
          --popover-foreground: #0f172a !important;
          --primary: #10b981 !important;
          --primary-foreground: #ffffff !important;
          --primary-glow: rgba(16, 185, 129, 0.15) !important;
          --secondary: #f1f5f9 !important;
          --secondary-foreground: #0f172a !important;
          --muted: #f8fafc !important;
          --muted-foreground: #64748b !important;
          --accent: #f1f5f9 !important;
          --accent-foreground: #0f172a !important;
          --destructive: #ef4444 !important;
          --destructive-foreground: #ffffff !important;
          --success: #10b981 !important;
          --success-foreground: #ffffff !important;
          --warning: #f59e0b !important;
          --warning-foreground: #ffffff !important;
          --border: #e2e8f0 !important;
          --input: #e2e8f0 !important;
          --ring: #10b981 !important;
        }
        .resume-page {
          transform-origin: top center;
          margin: 0 auto;
          width: 794px;
          height: 1122px;
          box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.08);
          border: 1px solid rgba(0, 0, 0, 0.03);
          border-radius: 4px;
          flex-shrink: 0;
          position: relative;
          background-color: white;
          overflow: hidden;
        }
        @media (min-width: 1024px) {
          .canvas-container {
            height: calc(min(1122px, calc(1.4142 * ((100vw * 0.58) - 80px))) + 48px);
            overflow-y: auto;
          }
          .resume-page {
            transform: scale(min(1, calc(((100vw * 0.58) - 80px) / 794)));
            margin-bottom: calc(-1122px * (1 - min(1, calc(((100vw * 0.58) - 80px) / 794))));
          }
        }
        @media (min-width: 640px) and (max-width: 1023px) {
          .canvas-container {
            height: calc(min(1122px, calc(1.4142 * (100vw - 80px))) + 48px);
            overflow-y: auto;
          }
          .resume-page {
            transform: scale(min(1, calc((100vw - 80px) / 794)));
            margin-bottom: calc(-1122px * (1 - min(1, calc((100vw - 80px) / 794))));
          }
        }
        @media (max-width: 639px) {
          .canvas-container {
            padding: 16px;
            height: 75vh;
            justify-content: flex-start;
            align-items: flex-start;
            overflow-y: auto;
          }
          .resume-page {
            transform: scale(0.6);
            transform-origin: top left;
            margin-right: -317px;
            margin-bottom: -448px;
          }
        }
        @media print {
          @page { margin: 0mm; size: A4 portrait; }
          .no-print, [data-sonner-toaster] { display: none !important; }
          html, body { background: white; margin: 0; padding: 0; height: auto; overflow: visible; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .canvas-container { display: block; overflow: visible; padding: 0; border: none; height: auto; background: white; }
          .resume-page { width: 210mm; height: 297mm; padding: 10mm 15mm; border: none; box-shadow: none; background: white; margin: 0 auto; transform: none; overflow: hidden; }
          .resume-page:not(:last-of-type) { page-break-after: always !important; break-after: page !important; }
          .resume-page:last-of-type { page-break-after: avoid !important; break-after: avoid !important; }
        }
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Canva-style Template Selector Modal */}
      {templateModalJSX}
    </div>
  );
}