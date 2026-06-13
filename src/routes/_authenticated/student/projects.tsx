import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  ArrowLeft,
  Sparkles, 
  Code, 
  FileText, 
  BarChart3, 
  GraduationCap, 
  Laptop, 
  ChevronRight, 
  CheckCircle2, 
  Cpu, 
  ShieldCheck, 
  Zap 
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/projects")({
  head: () => ({ meta: [{ title: "Project Helper — Lakshay IQ" }] }),
  component: StudentProjectsPage,
});

type Language = "en" | "hi" | "gu";

const DICTIONARY = {
  header: {
    en: {
      title: "Project Consultation Hub",
      subtitle: "Secure high grades with premium final-semester project guidance 🎓💻",
      liveStatus: "Experts Online",
    },
    hi: {
      title: "प्रोजेक्ट परामर्श हब",
      subtitle: "प्रीमियम अंतिम-सेमेस्टर प्रोजेक्ट मार्गदर्शन के साथ अच्छे ग्रेड सुरक्षित करें 🎓💻",
      liveStatus: "सलाहकार ऑनलाइन",
    },
    gu: {
      title: "પ્રોજેક્ટ કન્સલ્ટેશન હબ",
      subtitle: "પ્રીમિયમ છેલ્લા-સેમેસ્ટર પ્રોજેક્ટ ગાઈડન્સ સાથે ઉત્તમ ગ્રેડ મેળવો 🎓💻",
      liveStatus: "હેલ્પર્સ ઓનલાઇન",
    }
  },
  hero: {
    en: {
      badge: "Premium Quality Assurance",
      title: "Need a Working Project + Complete Documentation?",
      desc: "Get everything you need to score a perfect 10 SPI: fully functional source code, IEEE format synopsis, final report files, PPT presentations, and direct viva-voce coaching.",
      button: "Connect on WhatsApp",
      caption: "Instant response • Zero setup hassle • Free project installation support",
      whatsappText: "Hello! I am a student at Lakshay IQ and I am looking for assistance with my final semester academic project along with complete documentation. Please guide me! 🎓💻"
    },
    hi: {
      badge: "प्रीमियम गुणवत्ता आश्वासन",
      title: "क्या आपको डाक्यूमेंट्स के साथ कम्पलीट वर्किंग प्रोजेक्ट चाहिए?",
      desc: "एकदम परफेक्ट 10 SPI स्कोर करने के लिए सब कुछ प्राप्त करें: पूरी तरह से काम करने वाला सोर्स कोड, IEEE फॉर्मेट सिनोप्सिस, फाइनल रिपोर्ट फाइलें, PPT प्रेजेंटेशन और सीधी वाइवा तैयारी कोचिंग।",
      button: "व्हाट्सएप पर कनेक्ट करें",
      caption: "तुरंत जवाब • कोई सेटअप झंझट नहीं • मुफ़्त प्रोजेक्ट इंस्टॉलेशन सपोर्ट",
      whatsappText: "नमस्ते! मैं लक्ष्य आईक्यू का छात्र हूं और मुझे अपने अंतिम सेमेस्टर के शैक्षणिक प्रोजेक्ट और संपूर्ण डॉक्यूमेंटेशन में मदद चाहिए। कृपया मेरा मार्गदर्शन करें! 🎓💻"
    },
    gu: {
      badge: "પ્રીમિયમ ક્વાલિટી એસ્યોરન્સ",
      title: "પ્રોજેક્ટની સાથે કમ્પ્લીટ ડોક્યુમેન્ટેશન પણ જોઈએ છે?",
      desc: "પરફેક્ટ 10 SPI મેળવો: ફૂલી ફંક્શનલ સોર્સ કોડ, IEEE ફોર્મેટ સિનોપ્સિસ, બ્લેક બુક ફાઇલ, PPT પ્રેઝન્ટેશન અને ડાયરેક્ટ વાઈવા ગાઈડન્સ સાથે.",
      button: "વોટ્સએપ પર સપોર્ટ મેળવો",
      caption: "ત્વરિત પ્રત્યુત્તર • કોઈ સેટઅપ ઝંઝટ નહીં • ફ્રી પ્રોજેક્ટ ઇન્સ્ટોલેશન સપોર્ટ",
      whatsappText: "નમસ્તે! હું લક્ષ્ય આઈક્યુ નો સ્ટુડન્ટ છું અને મારે છેલ્લા સેમેસ્ટરના એકેડેમિક પ્રોજેક્ટ માટે કમ્પ્લીટ ડોક્યુમેન્ટેશન સાથે હેલ્પ જોઈએ છે. કૃપા કરીને સપોર્ટ આપો! 🎓💻"
    }
  },
  roadmap: {
    en: {
      title: "Our 3-Step Success Roadmap",
      subtitle: "How we guide you from planning to final evaluation",
      steps: [
        { title: "1. Scope & Tech Selection", desc: "Select from our curated list of topics or share your custom ideas. We lock down requirements and tech stack." },
        { title: "2. Milestone Previews", desc: "Receive weekly updates on database design, backend API setup, and frontend screens to stay in control." },
        { title: "3. Setup & Viva Preparation", desc: "We host/install the project on your machine, explain the code block-by-block, and coach you for external viva exams." }
      ]
    },
    hi: {
      title: "हमारा 3-चरण सफलता रोडमैप",
      subtitle: "योजना से अंतिम मूल्यांकन तक हम आपका मार्गदर्शन कैसे करते हैं",
      steps: [
        { title: "1. स्कोप और टेक चयन", desc: "हमारे चुने हुए विषयों में से चुनें या अपने कस्टम विचार साझा करें। हम आवश्यकताओं और टेक स्टैक को फाइनल करते हैं।" },
        { title: "2. माइलस्टोन पूर्वावलोकन", desc: "नियंत्रण में रहने के लिए डेटाबेस डिज़ाइन, बैकएंड एपीआई सेटअप और फ्रंटएंड स्क्रीन पर साप्ताहिक अपडेट प्राप्त करें।" },
        { title: "3. सेटअप और वाइवा की तैयारी", desc: "हम आपके सिस्टम पर प्रोजेक्ट इंस्टॉल करते हैं, कोड को लाइन-बाय-लाइन समझाते हैं, और बाहरी वाइवा के लिए प्रशिक्षित करते हैं।" }
      ]
    },
    gu: {
      title: "અમારો ૩-સ્ટેપ સક્સેસ રોડમેપ",
      subtitle: "પ્લાનિંગથી લઈને ફાઈનલ એક્ઝામ સુધી અમે કઈ રીતે હેલ્પ કરીશું",
      steps: [
        { title: "1. પ્રોજેક્ટ અને ટેક સિલેક્શન", desc: "અમારા લિસ્ટમાંથી ટોપિક પસંદ કરો અથવા તમારો નવો આઈડિયા આપો. અમે બધી રિક્વાયરમેન્ટ અને ટેક નક્કી કરીશું." },
        { title: "2. રેગ્યુલર પ્રોગ્રેસ પ્રિવ્યૂ", desc: "ડેટાબેઝ ડિઝાઇન, બેકએન્ડ API અને ફ્રન્ટએન્ડ સ્ક્રીન પર વીકલી અપડેટ્સ મેળવો જેથી પ્રોજેક્ટમાં સંપૂર્ણ કંટ્રોલ રહે." },
        { title: "3. સેટઅપ અને વાઈવા ગાઈડન્સ", desc: "અમે પ્રોજેક્ટ તમારા લેપટોપમાં રન કરાવીશું, લાઈન-બાય-લાઈન કોડ સમજાવીશું અને વાઈવા માટે સંપૂર્ણ તૈયાર કરાવીશું." }
      ]
    }
  },
  features: {
    en: {
      title: "Core Support Pillars",
      items: [
        { icon: Code, title: "Custom Code Dev", desc: "React, Next.js, Android, Python, ML, Java, & IoT codebases." },
        { icon: FileText, title: "Thesis & Reports", desc: "Complete IEEE documentation, synopsis, & final black-book files." },
        { icon: BarChart3, title: "Viva Presentation", desc: "Stunning PPT presentations & detailed viva-voce question tutoring." }
      ]
    },
    hi: {
      title: "मुख्य सहायता स्तंभ",
      items: [
        { icon: Code, title: "कस्टम कोड डेवलपमेंट", desc: "React, Next.js, Android, Python, ML, Java और IoT कोडबेसेस।" },
        { icon: FileText, title: "थीसिस और रिपोर्ट्स", desc: "कम्पलीट IEEE डाक्यूमेंट्स, सिनोप्सिस और अंतिम ब्लैक-बुक फ़ाइलें।" },
        { icon: BarChart3, title: "वाइवा प्रेजेंटेशन", desc: "शानदार PPT प्रेजेंटेशन और विस्तृत वाइवा-वोस प्रश्न ट्यूशन।" }
      ]
    },
    gu: {
      title: "પ્રીમિયમ ફીચર્સ",
      items: [
        { icon: Code, title: "કસ્ટમ ડેવલપમેન્ટ", desc: "React, Next.js, Android, Python, ML, Java કે IoT માં ક્લીન સોર્સ કોડ." },
        { icon: FileText, title: "સિનોપ્સિસ અને રિપોર્ટ", desc: "આખું IEEE ડોક્યુમેન્ટેશન, બ્લેક બુક અને રિપોર્ટ સપોર્ટ." },
        { icon: BarChart3, title: "વાઈવા ગાઈડન્સ", desc: "આકર્ષક PPT પ્રેઝન્ટેશન અને વાઈવા માટે કમ્પ્લીટ ક્વેશ્ચન ગાઈડન્સ." }
      ]
    }
  },
  techTitle: {
    en: "Popular Tech Stacks We Support",
    hi: "लोकप्रिय समर्थित टेक स्टैक्स",
    gu: "અમે સપોર્ટ કરીએ છીએ તે ટેકનોલોજી"
  },
  trust: {
    en: {
      title: "100% Viva explanation",
      desc: "Our senior developers will run the project on your laptop via AnyDesk/Zoom and explain how all queries, routes, and databases function. You don't just get a project; you master it."
    },
    hi: {
      title: "100% वाइवा स्पष्टीकरण",
      desc: "हमारे सीनियर डेवलपर्स एनीडेस्क/ज़ूम के माध्यम से आपके लैपटॉप पर प्रोजेक्ट चलाएंगे और समझाएंगे कि सभी क्वेरी, रूट और डेटाबेस कैसे काम करते हैं। आप केवल प्रोजेक्ट नहीं पाते; आप उसे सीखते हैं।"
    },
    gu: {
      title: "૧૦૦% વાઈવા તૈયારી",
      desc: "અમારા સિનિયર ડેવલપર્સ AnyDesk/Zoom થી તમારા લેપટોપમાં પ્રોજેક્ટ રન કરી આપશે અને કોડ કઈ રીતે ચાલે છે તે સમજાવશે જેથી વાઈવા માં ફૂલ કોન્ફિડન્સ રહે."
    }
  }
};

const SUPPORTED_TECHS = [
  "React.js", "Next.js", "Python / Django", "Machine Learning", 
  "Flutter / Android", "Node.js / Express", "IoT & Arduino", "Java / Spring Boot",
  "HTML5 / Tailwind CSS", "Firebase", "SQL / MongoDB", "FastAPI"
];

function StudentProjectsPage() {
  const [lang, setLang] = useState<Language>("en");
  const [showModal, setShowModal] = useState(true);

  // Set default language and close selector
  const selectLanguage = (selectedLang: Language) => {
    setLang(selectedLang);
    setShowModal(false);
  };

  const activeHeader = DICTIONARY.header[lang];
  const activeHero = DICTIONARY.hero[lang];
  const activeRoadmap = DICTIONARY.roadmap[lang];
  const activeFeatures = DICTIONARY.features[lang];
  const activeTrust = DICTIONARY.trust[lang];

  return (
    <div className="w-full text-foreground antialiased relative py-2 flex flex-col justify-start items-center overflow-x-hidden">
      
      {/* Premium Language Selection Modal */}
      {showModal && typeof window !== "undefined" && document.body && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in text-slate-800 dark:text-zinc-200">
          <Card className="w-full max-w-md bg-card border border-border shadow-2xl p-6 md:p-8 rounded-[28px] space-y-6 animate-bubble-slide-in relative overflow-hidden text-left">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-sky-500" />
            
            <div className="text-center space-y-3 pt-2">
              <div className="h-14 w-14 mx-auto rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center text-emerald-600 shadow-sm shadow-emerald-500/5">
                <Sparkles className="h-6 w-6 text-emerald-500 animate-pulse" />
              </div>
              <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight leading-snug" style={{ fontFamily: "'Sora', sans-serif" }}>
                Select Language<br/>
                <span className="text-base font-semibold text-muted-foreground">भाषा चुनें / ભાષા પસંદ કરો</span>
              </h2>
              <p className="text-muted-foreground text-xs font-semibold leading-relaxed">
                Choose your language to start your premium project consultation
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3.5 pt-2">
              <button
                onClick={() => selectLanguage("en")}
                className="w-full text-left p-4 rounded-2xl border border-border bg-card hover:border-emerald-500 hover:bg-emerald-50/20 hover:shadow-md transition-all duration-300 cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <h4 className="font-bold text-sm text-foreground group-hover:text-emerald-650 dark:group-hover:text-emerald-450">English 🇬🇧</h4>
                  <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">Explore premium guidance in English</p>
                </div>
                <ChevronRight className="h-4.5 w-4.5 text-muted-foreground group-hover:translate-x-1 group-hover:text-emerald-600 transition-all" />
              </button>

              <button
                onClick={() => selectLanguage("hi")}
                className="w-full text-left p-4 rounded-2xl border border-border bg-card hover:border-emerald-500 hover:bg-emerald-50/20 hover:shadow-md transition-all duration-300 cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <h4 className="font-bold text-sm text-foreground group-hover:text-emerald-650 dark:group-hover:text-emerald-450">हिन्दी (Hindi) 🇮🇳</h4>
                  <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">हिंदी में प्रोजेक्ट मार्गदर्शन प्राप्त करें</p>
                </div>
                <ChevronRight className="h-4.5 w-4.5 text-muted-foreground group-hover:translate-x-1 group-hover:text-emerald-600 transition-all" />
              </button>

              <button
                onClick={() => selectLanguage("gu")}
                className="w-full text-left p-4 rounded-2xl border border-border bg-card hover:border-emerald-500 hover:bg-emerald-50/20 hover:shadow-md transition-all duration-300 cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <h4 className="font-bold text-sm text-foreground group-hover:text-emerald-650 dark:group-hover:text-emerald-450">ગુજરાતી (Gujarati) 🌾</h4>
                  <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">ગુજરાતી ભાષામાં સહાય મેળવવા માટે પસંદ કરો</p>
                </div>
                <ChevronRight className="h-4.5 w-4.5 text-muted-foreground group-hover:translate-x-1 group-hover:text-emerald-600 transition-all" />
              </button>
            </div>
          </Card>
        </div>,
        document.body
      )}

      {/* Aesthetic Background Depth Blobs */}
      <div className="absolute top-[-5%] right-[-5%] w-[450px] h-[450px] rounded-full bg-emerald-300/10 blur-[100px] -z-10 animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[500px] h-[500px] rounded-full bg-sky-300/15 blur-[100px] -z-10 animate-pulse pointer-events-none" style={{ animationDelay: "2.5s" }} />

      {/* Main Structural Layout Container */}
      <div className="w-full max-w-6xl space-y-6 z-10 flex-1 flex flex-col h-full">
        
        {/* Fullscreen Premium Workspace Header */}
        <div className="relative overflow-hidden w-full flex flex-col sm:flex-row items-center justify-between gap-4 py-2 shrink-0 border-b border-border/60 pb-4">
          <div className="flex items-center gap-3.5 w-full sm:w-auto text-left">
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.history.back()}
              className="h-10 w-10 rounded-full border border-border bg-card shadow-sm hover:bg-muted shrink-0 cursor-pointer transition-all duration-200 hover:-translate-x-0.5 active:scale-95"
              title="Return Dashboard"
            >
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </Button>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-extrabold tracking-tight text-foreground leading-normal" style={{ fontFamily: "'Sora', sans-serif" }}>
                  {activeHeader.title}
                </h1>
                <Badge variant="outline" className="text-[9px] font-bold bg-emerald-500/10 px-2 py-0.5 uppercase tracking-wider border-emerald-500/25 text-emerald-600 dark:text-emerald-450 animate-pulse flex items-center gap-1.5 shrink-0">
                  <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full shrink-0" />
                  <span>{activeHeader.liveStatus}</span>
                </Badge>
              </div>
              <p className="text-muted-foreground text-[11px] sm:text-xs font-semibold leading-relaxed">
                {activeHeader.subtitle}
              </p>
            </div>
          </div>

          {/* Inline Localization Bar */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-xl border border-border shadow-inner shrink-0 w-full sm:w-auto justify-center sm:justify-start">
            {(["en", "hi", "gu"] as Language[]).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`h-8 px-4 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${lang === l ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:bg-card/45 hover:text-foreground"}`}
              >
                {l === "en" ? "EN 🇬🇧" : l === "hi" ? "हिन्दी 🇮🇳" : "ગુજરાતી 🌾"}
              </button>
            ))}
          </div>
        </div>

        {/* Hero WhatsApp CTA Card */}
        <Card className="relative overflow-hidden border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.08] via-teal-500/[0.04] to-indigo-500/[0.04] dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-indigo-950/10 rounded-3xl p-6 md:p-10 shadow-[0_12px_40px_rgba(16,185,129,0.04)] flex flex-col lg:flex-row items-center justify-between gap-8 group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none -z-10 group-hover:scale-110 transition-transform duration-700" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-500/10 rounded-full blur-[60px] pointer-events-none -z-10" />

          <div className="space-y-4 max-w-2xl text-left">
            <Badge className="bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/20 text-emerald-600 dark:text-emerald-450 font-bold uppercase tracking-wider text-[10px] px-3 py-1 rounded-full w-fit flex items-center gap-1.5 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-emerald-500" />
              {activeHero.badge}
            </Badge>
            
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight leading-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
              {activeHero.title}
            </h2>
            
            <p className="text-sm md:text-base text-muted-foreground font-semibold leading-relaxed">
              {activeHero.desc}
            </p>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 pt-1.5">
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle2 className="h-4 w-4" /> Ready-to-run Code
              </span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle2 className="h-4 w-4" /> Synopsis & PPT
              </span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle2 className="h-4 w-4" /> Complete Thesis Report
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center sm:items-stretch lg:items-center justify-center gap-3 w-full lg:w-auto shrink-0 max-w-sm">
            <Button
              onClick={() => window.open(`https://wa.me/917043853092?text=${encodeURIComponent(activeHero.whatsappText)}`, "_blank")}
              className="w-full sm:w-auto lg:w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-base shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-98 transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer relative overflow-hidden group/btn px-8"
            >
              <div className="absolute inset-0 bg-white/15 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000" />
              <svg className="h-6 w-6 fill-white shrink-0" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.488 1.459 5.407 1.461 5.61.003 10.174-4.515 10.177-10.119.002-2.715-1.05-5.267-2.962-7.182C17.35 1.398 14.8 1.345 12.01 1.345c-5.61 0-10.175 4.514-10.179 10.118-.001 1.838.497 3.633 1.442 5.213L2.24 21.05l4.407-1.157zm11.554-7.067c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.013-.374-1.93-1.192-.713-.637-1.196-1.425-1.336-1.665-.14-.24-.015-.37.105-.49.108-.108.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.195-.47-.393-.406-.54-.414-.14-.007-.3-.008-.46-.008-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2.01 0 1.19.87 2.33.99 2.49.12.16 1.71 2.61 4.14 3.66.58.25 1.03.4 1.385.513.58.184 1.11.158 1.53.095.465-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z"/>
              </svg>
              <span>{activeHero.button}</span>
              <ChevronRight className="h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
            <span className="text-[11px] text-muted-foreground font-semibold text-center leading-relaxed">
              {activeHero.caption}
            </span>
          </div>
        </Card>

        {/* Dynamic Responsive Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
          
          {/* Left Column - Success Roadmap & Trust */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Roadmap timeline card */}
            <Card className="p-6 md:p-8 border border-border bg-card/60 backdrop-blur-md rounded-3xl shadow-sm text-left flex flex-col justify-start gap-6">
              <div className="space-y-1 mb-6">
                <h3 className="text-lg font-extrabold text-foreground tracking-tight flex items-center gap-2" style={{ fontFamily: "'Sora', sans-serif" }}>
                  <Zap className="h-5 w-5 text-emerald-500 fill-emerald-500/10" />
                  {activeRoadmap.title}
                </h3>
                <p className="text-xs text-muted-foreground font-medium">
                  {activeRoadmap.subtitle}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
                {/* Connector lines for desktop screen sizes */}
                <div className="hidden md:block absolute top-10 left-[15%] right-[15%] h-[1.5px] bg-gradient-to-r from-emerald-500/30 via-teal-500/30 to-sky-500/30 -z-10" />
                
                {activeRoadmap.steps.map((step, idx) => {
                  return (
                    <div key={idx} className="flex flex-col items-start gap-4 p-5 rounded-2xl bg-muted/20 border border-border/80 hover:bg-card hover:shadow-md hover:border-emerald-500/20 transition-all duration-300 group">
                      <div className="h-9 w-9 rounded-xl bg-card border border-border shadow-sm flex items-center justify-center text-muted-foreground group-hover:text-emerald-500 group-hover:border-emerald-500/20 transition-all shrink-0">
                        <span className="font-extrabold text-xs">{idx + 1}</span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-xs sm:text-sm text-foreground group-hover:text-emerald-500 transition-colors">
                          {step.title}
                        </h4>
                        <p className="text-[11px] sm:text-xs text-muted-foreground font-medium leading-relaxed">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Bottom Micro Advisory Card / Trust Panel */}
            <Card className="p-5 bg-gradient-to-r from-emerald-500/[0.04] to-teal-500/[0.04] border border-emerald-500/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4 text-left shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-emerald-600 dark:text-emerald-450 flex items-center gap-1.5">
                  {activeTrust.title}
                </h4>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  {activeTrust.desc}
                </p>
              </div>
            </Card>
          </div>

          {/* Right Column - Service Pillars & Tech Stacks */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Service Pillars Card */}
            <Card className="p-6 border border-border bg-card/60 backdrop-blur-md rounded-3xl shadow-sm text-left space-y-6 flex-1">
              <div>
                <h3 className="text-base font-extrabold text-foreground tracking-tight flex items-center gap-2" style={{ fontFamily: "'Sora', sans-serif" }}>
                  <GraduationCap className="h-5 w-5 text-emerald-500" />
                  {activeFeatures.title}
                </h3>
                <div className="h-0.5 w-12 bg-emerald-500 rounded-full mt-2" />
              </div>

              <div className="space-y-4">
                {activeFeatures.items.map((item, idx) => {
                  const FeatureIcon = item.icon;
                  return (
                    <div
                      key={idx}
                      className="group p-4 bg-muted/20 hover:bg-card rounded-2xl border border-border hover:border-emerald-500/25 hover:shadow-md transition-all duration-300 flex items-start gap-4"
                    >
                      <div className="h-10 w-10 rounded-xl bg-card border border-border shadow-sm flex items-center justify-center text-muted-foreground group-hover:text-emerald-500 group-hover:border-emerald-500/20 group-hover:bg-emerald-500/5 transition-all shrink-0">
                        <FeatureIcon className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-foreground text-xs sm:text-sm group-hover:text-emerald-550 dark:group-hover:text-emerald-450 transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-[11px] sm:text-xs text-muted-foreground font-semibold leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Supported Tech Stacks Card */}
            <Card className="p-6 border border-border bg-card/60 backdrop-blur-md rounded-3xl shadow-sm text-left space-y-5">
              <div>
                <h3 className="text-sm font-bold text-foreground tracking-wider uppercase flex items-center gap-2">
                  <Cpu className="h-4.5 w-4.5 text-emerald-500" />
                  <span>{DICTIONARY.techTitle[lang]}</span>
                </h3>
                <div className="h-0.5 w-8 bg-emerald-500 rounded-full mt-1.5" />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {SUPPORTED_TECHS.map(tech => (
                  <span 
                    key={tech} 
                    className="text-[10px] md:text-xs font-bold text-muted-foreground bg-muted/50 hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/25 border border-border px-3 py-1.5 rounded-xl transition-all duration-200 cursor-default select-none shadow-sm"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </Card>
          </div>

        </div>

      </div>

      <style>{`
        .animate-bubble-slide-in {
          animation: bubbleSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes bubbleSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}