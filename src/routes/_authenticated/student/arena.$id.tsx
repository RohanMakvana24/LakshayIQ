import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import {
  HelpCircle,
  ArrowLeft,
  BookOpen,
  Sparkles,
  Star,
  Trophy,
  Zap,
  Target,
  Brain,
  Award,
  ChevronRight,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/student/arena/$id")({
  loader: async ({ params }) => {
    const { data: unit, error } = await supabase
      .from("units")
      .select(`*, important_questions(*)`)
      .eq("id", params.id)
      .single();

    if (error || !unit) throw notFound();
    return { unit };
  },
  component: ArenaPage,
});

interface ArenaQuestion {
  id: string;
  question: string;
}

const QUESTION_BANK: Record<number, ArenaQuestion[]> = {
  1: [
    { id: "q1-1", question: "What is the primary objective of Encapsulation in OOP?" },
    { id: "q1-2", question: "Define the term 'Abstract Class'." },
  ],
  2: [
    { id: "q2-1", question: "Compare Method Overloading and Method Overriding with respect to polymorphism lookup." },
    { id: "q2-2", question: "What is the 'super' keyword? Explain its two primary usages in inheritance structures." },
  ],
  3: [
    { id: "q3-1", question: "Explain the concept of Dynamic Binding with a suitable OOP programming scenario." },
    { id: "q3-2", question: "Why is Multiple Inheritance not supported in Java classes? How is it achieved?" },
  ],
  5: [
    { id: "q5-1", question: "Elaborate on the Four Pillars of OOP with concrete real-world software engineering examples." },
    { id: "q5-2", question: "Design an Abstract Schema representing University Course Structure using Object-Oriented principles." },
  ],
};

function ArenaPage() {
  const { unit } = Route.useLoaderData();
  const [activeMarksTab, setActiveMarksTab] = useState<number>(1);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);

  const activeQuestions = QUESTION_BANK[activeMarksTab] || [];

  const totalQuestions = Object.values(QUESTION_BANK).reduce(
    (acc, qs) => acc + qs.length,
    0
  );

  const marksOptions = [
    { value: 1, label: "Beginner", emoji: "🌱", color: "emerald", icon: Star, questionCount: QUESTION_BANK[1]?.length || 0 },
    { value: 2, label: "Intermediate", emoji: "⚡", color: "blue", icon: Zap, questionCount: QUESTION_BANK[2]?.length || 0 },
    { value: 3, label: "Advanced", emoji: "🎯", color: "purple", icon: Target, questionCount: QUESTION_BANK[3]?.length || 0 },
    { value: 5, label: "Expert", emoji: "🏆", color: "amber", icon: Trophy, questionCount: QUESTION_BANK[5]?.length || 0 },
  ];

  const getActiveColorStyles = (color: string, isActive: boolean) => {
    if (!isActive) return {};
    const styles: Record<string, string> = {};
    if (color === "emerald") {
      styles.borderColor = "#10b981";
      styles.backgroundColor = "#ecfdf5";
    } else if (color === "blue") {
      styles.borderColor = "#3b82f6";
      styles.backgroundColor = "#eff6ff";
    } else if (color === "purple") {
      styles.borderColor = "#8b5cf6";
      styles.backgroundColor = "#f5f3ff";
    } else if (color === "amber") {
      styles.borderColor = "#f59e0b";
      styles.backgroundColor = "#fffbeb";
    }
    return styles;
  };

  const getTextColorClass = (color: string, isActive: boolean) => {
    if (!isActive) return "text-slate-600";
    if (color === "emerald") return "text-emerald-600";
    if (color === "blue") return "text-blue-600";
    if (color === "purple") return "text-purple-600";
    if (color === "amber") return "text-amber-600";
    return "text-slate-600";
  };

  const getBadgeColorClass = (color: string, isActive: boolean) => {
    if (!isActive) return "bg-slate-100 text-slate-500";
    if (color === "emerald") return "bg-emerald-100 text-emerald-700";
    if (color === "blue") return "bg-blue-100 text-blue-700";
    if (color === "purple") return "bg-purple-100 text-purple-700";
    if (color === "amber") return "bg-amber-100 text-amber-700";
    return "bg-slate-100 text-slate-500";
  };

  const getBorderColorClass = (color: string, isActive: boolean) => {
    if (!isActive) return "border-slate-200";
    if (color === "emerald") return "border-emerald-500";
    if (color === "blue") return "border-blue-500";
    if (color === "purple") return "border-purple-500";
    if (color === "amber") return "border-amber-500";
    return "border-slate-200";
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="w-full px-4 py-4 md:px-6 lg:px-8">

        {/* Header with Navigation */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <Link
              to="/student/unit/$id"
              params={{ id: unit.id }}
              className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <BreadcrumbNav
              items={[
                { label: "Dashboard", to: "/student" },
                { label: unit.title || `Unit ${unit.unit_number}` },
              ]}
            />
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden mb-6 shadow-lg">
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute top-0 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-2xl" />
          <div className="absolute bottom-0 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-2xl" />

          <div className="absolute top-4 right-4 text-white/5">
            <Trophy className="h-32 w-32 stroke-[0.5]" />
          </div>

          <div className="relative z-10 px-5 py-5 md:px-7 md:py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 rounded-full px-2.5 py-0.5 border border-emerald-500/30">
                  <Flame className="h-3 w-3 text-emerald-300" />
                  <span className="text-[10px] font-semibold tracking-wide text-emerald-200">
                    EXAM ARENA
                  </span>
                </div>
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">
                  {unit.title}
                </h1>
                <p className="text-slate-300 text-xs md:text-sm max-w-lg">
                  Test your knowledge with our curated question bank. Select a difficulty level below to begin your practice.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20 shrink-0">
                <Brain className="h-4 w-4 text-emerald-300" />
                <span className="text-xs font-medium text-white">{totalQuestions} Total Questions</span>
              </div>
            </div>
          </div>
        </div>

        {/* Difficulty Level Cards - Responsive Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {marksOptions.map((option) => {
            const isActive = activeMarksTab === option.value;
            const Icon = option.icon;

            return (
              <button
                key={option.value}
                onClick={() => setActiveMarksTab(option.value)}
                className={cn(
                  "relative p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 text-center group",
                  getBorderColorClass(option.color, isActive),
                  isActive ? "shadow-lg scale-[1.02]" : "bg-white hover:shadow-md"
                )}
                style={getActiveColorStyles(option.color, isActive)}
              >
                {isActive && (
                  <div className={cn(
                    "absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full",
                    option.color === "emerald" ? "bg-emerald-500" :
                      option.color === "blue" ? "bg-blue-500" :
                        option.color === "purple" ? "bg-purple-500" : "bg-amber-500"
                  )} />
                )}

                <div className={cn(
                  "text-xl sm:text-2xl mb-1 transition-transform group-hover:scale-110 inline-block",
                  isActive ? "scale-110" : ""
                )}>
                  {option.emoji}
                </div>

                <h3 className={cn(
                  "text-base sm:text-lg font-bold",
                  getTextColorClass(option.color, isActive)
                )}>
                  {option.value}
                </h3>

                <p className={cn(
                  "text-[10px] sm:text-xs font-medium mt-0.5",
                  isActive ? `text-${option.color}-500` : "text-slate-400"
                )}>
                  {option.label}
                </p>

                <Badge
                  variant="secondary"
                  className={cn(
                    "mt-2 text-[9px] sm:text-[10px]",
                    getBadgeColorClass(option.color, isActive)
                  )}
                >
                  {option.questionCount} {option.questionCount === 1 ? "Question" : "Questions"}
                </Badge>
              </button>
            );
          })}
        </div>

        {/* Questions Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-emerald-600" />
              </div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                Practice Questions
              </h2>
              <Badge variant="secondary" className="text-[10px] bg-slate-100">
                {activeMarksTab} Marks Each
              </Badge>
            </div>
          </div>

          {activeQuestions.length > 0 ? (
            <div className="grid gap-3">
              {activeQuestions.map((q, idx) => (
                <Card
                  key={q.id}
                  className={cn(
                    "border border-slate-200 rounded-xl transition-all duration-300 overflow-hidden bg-white cursor-pointer",
                    selectedQuestion === q.id
                      ? "ring-2 ring-emerald-500/20 border-emerald-500 shadow-lg"
                      : "hover:shadow-md hover:-translate-y-0.5"
                  )}
                  onClick={() => setSelectedQuestion(selectedQuestion === q.id ? null : q.id)}
                >
                  <div className="p-3 sm:p-4">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "h-7 w-7 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                        selectedQuestion === q.id
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-500"
                      )}>
                        <span className="text-[11px] sm:text-xs font-bold">{idx + 1}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[8px] sm:text-[9px] font-mono",
                              selectedQuestion === q.id
                                ? "border-emerald-500 text-emerald-600"
                                : "border-slate-200 text-slate-400"
                            )}
                          >
                            {activeMarksTab} {activeMarksTab === 1 ? "Mark" : "Marks"}
                          </Badge>
                        </div>
                        <p className="font-semibold text-slate-800 text-xs sm:text-sm leading-relaxed">
                          {q.question}
                        </p>

                        {selectedQuestion === q.id && (
                          <div className="mt-3 pt-3 border-t border-slate-100">
                            <div className="flex items-start gap-2">
                              <Award className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                              <p className="text-[10px] sm:text-xs text-slate-500">
                                <span className="font-semibold text-emerald-600">Hint:</span>{" "}
                                Think about core OOP concepts and their practical applications.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <ChevronRight
                        className={cn(
                          "h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400 transition-transform shrink-0 mt-1",
                          selectedQuestion === q.id ? "rotate-90" : ""
                        )}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 sm:py-16 bg-white rounded-xl border border-slate-200">
              <div className="inline-flex p-2.5 sm:p-3 bg-slate-100 rounded-full mb-2 sm:mb-3">
                <HelpCircle className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400" />
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-slate-800 mb-1">
                No questions available
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto px-4">
                Questions for {activeMarksTab} marks haven't been added yet. Try selecting a different difficulty level.
              </p>
            </div>
          )}
        </div>

        {/* Motivational Footer */}
        {activeQuestions.length > 0 && (
          <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs font-bold text-emerald-800 uppercase tracking-wide">Pro Tip</p>
                <p className="text-[10px] sm:text-xs text-emerald-700">
                  Practice these questions thoroughly. Understanding concepts at each level will help you excel in your exams.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}