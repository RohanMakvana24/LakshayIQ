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
  Briefcase, GraduationCap, Terminal, ExternalLink, SlidersHorizontal, User,
  Copy, Trash, Layers, ChevronRight, ArrowRight, BookOpen, FolderGit2, FileUser, X
} from "lucide-react";
import { toast } from "sonner";
import { PageLoader } from "@/components/page-loader";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
        metrics: "CPI: 9.12 / 10.00",
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
      toast.success("Resume deleted successfully!");
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
    toast.success("New resume template created!");
  };

  const downloadSpecificPDF = (resume: any) => {
    setPersonalInfo(resume.personalInfo);
    setSections(resume.sections);
    setStyleConfig(resume.styleConfig);
    setIsPublished(resume.isPublished || false);
    toast.info("Generating PDF, please wait...");
    setTimeout(async () => {
      await executeActualActivePDFDownload();
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
    executeActualActivePDFDownload();
  };

  const executeActualActivePDFDownload = async () => {
    const pageElements = document.querySelectorAll(".resume-page");
    if (pageElements.length === 0) return;

    try {
      setSavingStatus("Saving...");
      toast.info("Generating professional multi-page PDF, please wait...");
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const imgHeight = 297;

      for (let i = 0; i < pageElements.length; i++) {
        const element = pageElements[i];
        const canvas = await html2canvas(element as HTMLElement, {
          scale: 4,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: "#ffffff",
          windowWidth: 793,
          windowHeight: 1122,
          imageTimeout: 0
        });
        const imgData = canvas.toDataURL("image/png");

        if (i > 0) {
          pdf.addPage();
        }
        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight, undefined, "NONE");
      }

      const cleanName = personalInfo.fullName.trim().replace(/\s+/g, "_") || "My";
      pdf.save(`${cleanName}_Resume.pdf`);
      setSavingStatus("Saved");
      toast.success("PDF downloaded successfully!");
    } catch (err) {
      console.error("Direct PDF Generation error:", err);
      toast.error("Direct download failed. Falling back to print menu.");
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
    
    // Name + Title block
    if (personalInfo.fullName) {
      const nameSize = 24; // text-2xl
      height += nameSize * 1.3;
    }
    if (personalInfo.title) {
      height += 18; // text-sm
    }
    
    // Avatar vs Name/Title height
    if (styleConfig.showAvatar !== "false" && personalInfo.avatarUrl) {
      height = Math.max(height, 56 + 10); // avatar is h-14 (56px) + margin
    }
    
    // Contact Info lines (Email, Phone, Location)
    let contactCount = 0;
    if (personalInfo.location) contactCount++;
    if (personalInfo.phone) contactCount++;
    if (personalInfo.email) contactCount++;
    height += contactCount * 14;
    
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
        const charsPerLine = layoutMode === "split" ? 85 : 135;
        const descLines = Math.max(1, Math.ceil((item.description || "").length / charsPerLine));
        itemHeight += descLines * 13.5; 
        
        height += itemHeight + (idx === section.items!.length - 1 ? 0 : itemGap);
      });
    } else if (section.type === "tags" && section.categories) {
      section.categories.forEach(cat => {
        let catHeight = 12; 
        
        const columnWidth = layoutMode === "split" ? 230 : 730;
        let totalTagsWidth = 0;
        cat.tags.forEach(tag => {
          totalTagsWidth += (tag.length + 4) * 5.2 + 4; 
        });
        const tagLines = Math.max(1, Math.ceil(totalTagsWidth / columnWidth));
        catHeight += 4 + tagLines * 18; 
        
        height += catHeight + 8; 
      });
    } else if (section.type === "text" && section.textContent) {
      const charsPerLine = layoutMode === "split" ? 85 : 135;
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

  if (viewMode === "dashboard") {
    const totalPublished = resumesList.filter(r => r.isPublished).length;

    return (
      <div className="w-full bg-slate-50/40 min-h-screen text-slate-800 antialiased no-print px-4 py-6 md:px-8 md:py-10">
        <div className="max-w-7xl mx-auto">
          {/* Hero Header */}
          <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 md:p-8 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Professional Portfolio Suite</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                  Resume Vault
                </h1>
                <p className="text-slate-500 text-sm max-w-2xl">
                  Create, manage, and export polished A4 resumes. Design custom portfolios that impress recruiters.
                </p>
              </div>
              <Button
                onClick={handleCreateNewResume}
                className="h-10 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-all active:scale-95 flex items-center gap-2 cursor-pointer self-start md:self-auto"
              >
                <Plus className="h-4 w-4" />
                <span>New Resume</span>
              </Button>
            </div>

            {/* Stats */}
            {resumesList.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                  <div className="h-9 w-9 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-500">
                    <Layers className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Total Templates</div>
                    <div className="text-lg font-bold text-slate-900">{resumesList.length} Resumes</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                  <div className="h-9 w-9 rounded-lg bg-white shadow-sm flex items-center justify-center text-emerald-600">
                    <Palette className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Active Theme</div>
                    <div className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full inline-block" style={{ backgroundColor: resumesList[0]?.styleConfig?.themeColor || '#10b981' }} />
                      <span className="text-xs text-slate-500 font-medium">
                        {THEME_COLORS.find(c => c.value === resumesList[0]?.styleConfig?.themeColor)?.name || "Custom"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                  <div className="h-9 w-9 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-500">
                    <Globe className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Live Portfolios</div>
                    <div className="text-lg font-bold text-slate-900">{totalPublished > 0 ? `${totalPublished} Active` : "Offline"}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          {!hasResumeData || resumesList.length === 0 ? (
            <div className="max-w-md mx-auto my-12 text-center p-8 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-5">
              <div className="h-16 w-16 mx-auto rounded-xl bg-emerald-50 flex items-center justify-center">
                <FileText className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-slate-900">No Resumes Yet</h2>
                <p className="text-sm text-slate-500">Create your first professional resume template to get started.</p>
              </div>
              <Button onClick={handleCreateNewResume} className="h-10 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm gap-2">
                <Sparkles className="h-4 w-4" />
                <span>Create First Resume</span>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resumesList.map((resume) => {
                const cardAccentColor = resume.styleConfig?.themeColor || '#10b981';
                return (
                  <Card 
                    key={resume.id} 
                    className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-all duration-200"
                  >
                    {/* Accent Header */}
                    <div className="h-1.5 w-full" style={{ backgroundColor: cardAccentColor }} />
                    
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                            <FileUser className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="font-medium text-slate-900 text-sm line-clamp-1">{resume.name || "Untitled Resume"}</h4>
                            <p className="text-[10px] text-slate-400 font-medium">
                              Updated {new Date(resume.updatedAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {resume.isPublished ? (
                            <Badge className="bg-sky-50 text-sky-600 border-sky-100 text-[9px] font-medium rounded-md px-2 py-0">
                              Live
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[9px] font-medium rounded-md px-2 py-0">
                              Draft
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Mini Preview */}
                      <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm text-slate-800">{resume.personalInfo?.fullName || "Your Name"}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{resume.personalInfo?.title || "Professional Title"}</p>
                          </div>
                          <div className="text-[9px] text-slate-400 font-mono">{resume.styleConfig?.layoutMode === 'split' ? '2-col' : '1-col'}</div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1">
                          <div className="h-1 w-12 bg-slate-200 rounded-full"></div>
                          <div className="h-1 w-8 bg-slate-200 rounded-full"></div>
                          <div className="h-1 w-10 bg-slate-200 rounded-full"></div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleEditResume(resume)}
                          className="flex-1 h-9 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-all"
                        >
                          <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
                          Edit
                        </Button>
                        <Button
                          onClick={() => downloadSpecificPDF(resume)}
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDuplicateResume(resume)}
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteResume(resume.id)}
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 rounded-lg border-slate-200 text-red-500 hover:bg-red-50 hover:border-red-100"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Editor View
  return (
    <div className="w-full bg-slate-50/30 min-h-screen text-slate-800 antialiased selection:bg-emerald-100 selection:text-emerald-800 print:bg-white print:text-slate-900">
      {/* Sticky Header - Ultra-Modern & Premium */}
      <div className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-100 px-3 sm:px-6 md:px-8 py-3 no-print flex flex-row items-center justify-between gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.01),0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode("dashboard")}
            className="h-9 px-4 rounded-xl border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 transition-all duration-150 hidden md:flex items-center gap-1.5 text-xs font-semibold bg-white cursor-pointer shadow-sm shrink-0"
          >
            <ArrowLeft className="h-4 w-4 stroke-[2]" />
            <span>Back</span>
          </Button>
          
          <div className="h-9 w-9 rounded-xl bg-[#10b981] flex items-center justify-center text-white shrink-0 shadow-sm shadow-emerald-500/5">
            <FileText className="h-5 w-5 stroke-[2]" />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-sm font-semibold text-slate-800 tracking-tight leading-none" style={{ fontFamily: "'Sora', sans-serif" }}>
              {resumesList.find(r => r.id === activeResumeId)?.name || "Resume Editor"}
            </h1>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`inline-block h-1.5 w-1.5 rounded-full transition-all duration-300 ${savingStatus === "Saving..." ? "bg-amber-400 ring-2 ring-amber-400/20 animate-pulse" : "bg-emerald-500 ring-2 ring-emerald-500/20"}`} />
              <span className="text-[11px] text-slate-400 font-medium tracking-normal">
                {savingStatus === "Saving..." ? "Saving..." : "Saved"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Manual Save button */}
          <Button
            size="sm"
            onClick={() => saveVault(true)}
            variant="outline"
            className="h-9 px-3 sm:px-4 rounded-xl border border-slate-200/80 text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-all duration-150 flex items-center gap-1.5 text-xs font-semibold cursor-pointer bg-white shadow-sm"
          >
            <Save className="h-4 w-4 text-slate-500 stroke-[2]" />
            <span className="hidden sm:inline">Save</span>
          </Button>

          {/* Share/Print fallback button */}
          <Button
            variant="outline"
            size="sm"
            onClick={triggerPrint}
            className="h-9 w-9 rounded-xl border border-slate-200/80 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all duration-150 cursor-pointer flex items-center justify-center bg-white shadow-sm"
            title="Print"
          >
            <Share2 className="h-4 w-4 stroke-[2]" />
          </Button>

          {/* Download PDF button */}
          <Button
            size="sm"
            onClick={downloadPDF}
            className="h-9 px-3 sm:px-4.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all duration-150 flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-sm hover:shadow active:scale-95 flex items-center justify-center"
          >
            <Download className="h-4 w-4 stroke-[2.2]" />
            <span className="hidden sm:inline">Export PDF</span>
          </Button>
        </div>
      </div>

      {/* Mobile Tabs */}
      <div className="flex lg:hidden justify-center px-4 mt-4 mb-4 no-print">
        <div className="flex w-full max-w-xs bg-slate-100 p-0.5 rounded-lg">
          <button
            onClick={() => setActiveWorkspaceTab("editor")}
            className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${activeWorkspaceTab === "editor" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
          >
            Editor
          </button>
          <button
            onClick={() => setActiveWorkspaceTab("preview")}
            className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${activeWorkspaceTab === "preview" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
          >
            Preview
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start px-4 md:px-6 pb-12 print:block print:p-0 print:m-0">
        {/* Left Panel - Editor */}
        <div className={`lg:col-span-5 space-y-5 mt-5 no-print ${activeWorkspaceTab === "editor" ? "block" : "hidden lg:block"}`}>
          <Tabs defaultValue="branding" className="w-full space-y-5">
            <TabsList className="grid grid-cols-3 bg-slate-100 p-1 rounded-xl h-10">
              <TabsTrigger value="branding" className="text-xs font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all text-slate-500">
                <User className="h-3.5 w-3.5 mr-1.5" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="content" className="text-xs font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all text-slate-500">
                <Layers className="h-3.5 w-3.5 mr-1.5" />
                Sections
              </TabsTrigger>
              <TabsTrigger value="aesthetics" className="text-xs font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all text-slate-500">
                <Palette className="h-3.5 w-3.5 mr-1.5" />
                Style
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="branding" className="space-y-4 focus-visible:outline-none">
              <Card className="p-5 border border-slate-200 rounded-xl bg-white shadow-sm">
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
                  <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl mb-1">
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
                        className="h-8 text-xs rounded-lg focus-visible:ring-emerald-500 bg-white"
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
                        className="h-9 text-sm rounded-lg focus-visible:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-slate-500 block mb-1">Professional Title</label>
                      <Input
                        value={personalInfo.title}
                        onChange={(e) => updatePersonalInfo("title", e.target.value)}
                        className="h-9 text-sm rounded-lg focus-visible:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-medium text-slate-500 block mb-1">Email</label>
                      <Input
                        value={personalInfo.email}
                        onChange={(e) => updatePersonalInfo("email", e.target.value)}
                        className="h-9 text-sm rounded-lg focus-visible:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-slate-500 block mb-1">Phone</label>
                      <Input
                        value={personalInfo.phone}
                        onChange={(e) => updatePersonalInfo("phone", e.target.value)}
                        className="h-9 text-sm rounded-lg focus-visible:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-medium text-slate-500 block mb-1">Location</label>
                      <Input
                        value={personalInfo.location || ""}
                        onChange={(e) => updatePersonalInfo("location", e.target.value)}
                        className="h-9 text-sm rounded-lg focus-visible:ring-emerald-500"
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
                        className="h-9 text-sm rounded-lg focus-visible:ring-emerald-500"
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
                      className="h-9 text-sm rounded-lg focus-visible:ring-emerald-500"
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
                              className="h-8 text-sm rounded-lg focus-visible:ring-emerald-500"
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
                                        className="h-8 text-xs rounded-lg"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[9px] font-medium text-slate-500 block">Role</label>
                                      <Input
                                        value={item.secondaryHeader}
                                        onChange={(e) => updateTimelineItem(section.id, item.id, "secondaryHeader", e.target.value)}
                                        className="h-8 text-xs rounded-lg"
                                      />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                      <label className="text-[9px] font-medium text-slate-500 block">Date Range</label>
                                      <Input
                                        value={item.dateRange}
                                        onChange={(e) => updateTimelineItem(section.id, item.id, "dateRange", e.target.value)}
                                        className="h-8 text-xs rounded-lg"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[9px] font-medium text-slate-500 block">Metric (GPA, etc.)</label>
                                      <Input
                                        value={item.metrics}
                                        onChange={(e) => updateTimelineItem(section.id, item.id, "metrics", e.target.value)}
                                        className="h-8 text-xs rounded-lg"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-[9px] font-medium text-slate-500 block">Description</label>
                                    <Textarea
                                      value={item.description}
                                      onChange={(e) => updateTimelineItem(section.id, item.id, "description", e.target.value)}
                                      className="text-xs min-h-[70px] rounded-lg focus-visible:ring-emerald-500"
                                    />
                                  </div>
                                </div>
                              ))}
                              <Button
                                onClick={() => addTimelineItem(section.id)}
                                variant="outline"
                                className="w-full h-9 text-xs font-medium border-dashed rounded-lg gap-1"
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
                                    className="h-8 text-sm rounded-lg"
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
                                      className="h-8 text-sm rounded-lg"
                                    />
                                  </div>
                                </div>
                              ))}
                              <Button
                                onClick={() => addTagCategory(section.id)}
                                variant="outline"
                                className="w-full h-9 text-xs font-medium border-dashed rounded-lg gap-1"
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
                                className="text-xs min-h-[120px] rounded-lg focus-visible:ring-emerald-500"
                                placeholder="Enter your custom text here..."
                              />
                            </div>
                          )}

                          {section.type === "pagebreak" && (
                            <div className="text-slate-500 text-xs p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-2">
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

            {/* Style Tab */}
            <TabsContent value="aesthetics" className="space-y-4 focus-visible:outline-none">
              <Card className="p-5 border border-slate-200 rounded-xl bg-white shadow-sm space-y-6">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-3">Theme Color</label>
                  <div className="flex items-center gap-3 flex-wrap">
                    {THEME_COLORS.map(color => {
                      const isSelected = styleConfig.themeColor === color.value;
                      return (
                        <button
                          key={color.value}
                          onClick={() => updateStyle("themeColor", color.value)}
                          className={`h-8 w-8 rounded-full border-2 border-white shadow-sm transition-all active:scale-95 flex items-center justify-center ${isSelected ? "ring-2 ring-slate-400 scale-110" : ""}`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        >
                          {isSelected && <Check className="h-4 w-4 text-white stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-3">Font Family</label>
                  <div className="grid grid-cols-2 gap-2">
                    {FONTS.map(font => {
                      const isSelected = styleConfig.fontFamily === font;
                      let fontStyleClass = "font-sans";
                      if (font === "Playfair Display") fontStyleClass = "font-serif";
                      if (font === "Fira Code") fontStyleClass = "font-mono";
                      return (
                        <button
                          key={font}
                          onClick={() => updateStyle("fontFamily", font)}
                          className={`h-10 px-3 rounded-lg border text-xs font-medium text-left transition-all ${isSelected ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"}`}
                        >
                          <span className={`block ${fontStyleClass}`}>{font}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-3">Layout</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-lg">
                    <button
                      onClick={() => updateStyle("layoutMode", "single")}
                      className={`h-9 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${styleConfig.layoutMode === "single" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                    >
                      <AlignLeft className="h-4 w-4" /> Single Column
                    </button>
                    <button
                      onClick={() => updateStyle("layoutMode", "split")}
                      className={`h-9 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${styleConfig.layoutMode === "split" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                    >
                      <LayoutGrid className="h-4 w-4" /> Split Column
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-3">Spacing Density</label>
                  <div className="grid grid-cols-3 gap-1 bg-slate-50 p-1 rounded-lg">
                    {["tight", "medium", "relaxed"].map((spacing) => (
                      <button
                        key={spacing}
                        onClick={() => updateStyle("sectionSpacing", spacing)}
                        className={`h-9 text-xs font-medium rounded-md transition-all ${styleConfig.sectionSpacing === spacing ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                      >
                        {spacing === "tight" ? "Compact" : spacing === "medium" ? "Standard" : "Relaxed"}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel - Preview Canvas */}
        <div className={`lg:col-span-7 flex flex-col items-center print:block print:w-full ${activeWorkspaceTab === "preview" ? "block" : "hidden lg:block"}`}>
          <div className="w-full overflow-auto p-4 bg-slate-100/50 rounded-2xl flex flex-col items-center gap-6 canvas-container print:p-0 print:bg-white print:rounded-none">
            {getPages().map((pageSections, pageIdx) => {
              const spacing = getSpacingClasses();
              return (
                <div
                  key={pageIdx}
                  data-page-index={pageIdx}
                  className={`resume-page w-[210mm] h-[297mm] bg-white p-8 shadow-xl rounded-xl relative overflow-hidden shrink-0 ${getFontFamilyClass()}`}
                  style={{
                    fontSize: styleConfig.fontSize === "xs" ? "12px" : styleConfig.fontSize === "sm" ? "13px" : "14px",
                    lineHeight: styleConfig.lineHeight === "tight" ? "1.2" : styleConfig.lineHeight === "relaxed" ? "1.6" : "1.4"
                  }}
                >
                  {/* Header - Only on Page 1 */}
                  {pageIdx === 0 && (
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
                                <div className="relative pl-4 border-l-2 ml-1" style={{ borderColor: `${styleConfig.themeColor}20` }}>
                                  {(section.items || []).map(item => (
                                    <div key={item.id} className={`relative ${spacing.timelineItemGap} text-xs ${spacing.itemGap}`}>
                                      <div className="absolute -left-[22px] top-1.5 h-2 w-2 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: styleConfig.themeColor }} />
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
                        <div className={`col-span-4 ${spacing.sectionGap} border-l border-slate-100 pl-4`}>
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
                              <div className="relative pl-4 border-l-2 ml-1" style={{ borderColor: `${styleConfig.themeColor}20` }}>
                                {(section.items || []).map(item => (
                                  <div key={item.id} className={`relative ${spacing.timelineItemGap} text-xs ${spacing.itemGap}`}>
                                    <div className="absolute -left-[22px] top-1.5 h-2 w-2 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: styleConfig.themeColor }} />
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
          gap: 24px;
          overflow-y: auto;
          padding: 24px 0;
        }
        .resume-page {
          transform-origin: top center;
          margin: 0 auto;
          width: 794px;
          height: 1122px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.08);
          border-radius: 12px;
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
          .resume-page { width: 210mm; height: 297mm; padding: 10mm 15mm; border: none; box-shadow: none; background: white; margin: 0 auto; transform: none; page-break-after: always; break-after: page; }
        }
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}