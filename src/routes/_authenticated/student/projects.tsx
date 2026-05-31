import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Sparkles, Code, FileText, BarChart3, GraduationCap, Laptop, ChevronRight, CheckCircle2, Cpu, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/projects")({
  head: () => ({ meta: [{ title: "Project Helper — Lakshay IQ" }] }),
  component: StudentProjectsPage,
});

type Language = "en" | "hi" | "gu";

interface ChatMessage {
  id: number;
  icon: string;
  en: string;
  hi: string;
  gu: string;
}

const DICTIONARY = {
  header: {
    en: {
      title: "Academic Project Workspace",
      subtitle: "Secure your high GPA with premium final-semester project guidance 🎓💻",
      featuresTitle: "Elite Project Support",
      chatTitle: "Interactive Guidance Assistant"
    },
    hi: {
      title: "शैक्षणिक प्रोजेक्ट वर्कस्पेस",
      subtitle: "प्रीमियम अंतिम-सेमेस्टर प्रोजेक्ट मार्गदर्शन के साथ अपना उच्च GPA सुरक्षित करें 🎓💻",
      featuresTitle: "उत्कृष्ट प्रोजेक्ट सहायता",
      chatTitle: "इंटरएक्टिव मार्गदर्शन सहायक"
    },
    gu: {
      title: "એકેડેમિક પ્રોજેક્ટ વર્કસ્પેસ",
      subtitle: "પ્રીમિયમ છેલ્લા-સેમેસ્ટર પ્રોજેક્ટ ગાઈડન્સ સાથે તમારા હાઈ GPA કન્ફર્મ કરો 🎓💻",
      featuresTitle: "પ્રીમિયમ પ્રોજેક્ટ સપોર્ટ",
      chatTitle: "આસિસ્ટન્ટ ચેટ બોક્સ"
    }
  },
  features: {
    en: [
      { icon: Code, title: "Custom Development", desc: "Clean, working code in React/Next.js, Android, Python, ML, & IoT." },
      { icon: FileText, title: "Synopsis & Reports", desc: "Complete IEEE format documentation, synopsis, & final black-book thesis." },
      { icon: BarChart3, title: "Viva Preparation", desc: "Stunning PPT presentations & detailed viva-voce question tutoring." }
    ],
    hi: [
      { icon: Code, title: "कस्टम डेवलपमेंट", desc: "रिएक्ट/नेक्स्ट.जेएस, एंड्रॉइड, पायथन, एमएल और IoT में साफ और वर्किंग कोड।" },
      { icon: FileText, title: "सिनोप्सिस और रिपोर्ट", desc: "कम्पलीट IEEE फॉर्मेट डॉक्यूमेंटेशन, सिनोप्सिस और फाइनल ब्लैक-बुक थीसिस।" },
      { icon: BarChart3, title: "वाइवा की तैयारी", desc: "शानदार पीपीटी प्रेजेंटेशन और विस्तृत वाइवा-वोस प्रश्न ट्यूशन।" }
    ],
    gu: [
      { icon: Code, title: "કસ્ટમ ડેવલપમેન્ટ", desc: "React/Next.js, એન્ડ્રોઇડ, પાયથન, ML અને IoT માં વર્કિંગ અને ક્લીન સોર્સ કોડ." },
      { icon: FileText, title: "સિનોપ્સિસ અને રિપોર્ટ", desc: "IEEE ફોર્મેટમાં આખું ડોક્યુમેન્ટેશન, બ્લેક બુક અને રિપોર્ટ સપોર્ટ." },
      { icon: BarChart3, title: "વાઈવા ગાઈડન્સ", desc: "આકર્ષક PPT પ્રેઝન્ટેશન અને વાઈવા માટે કમ્પ્લીટ ક્વેશ્ચન ગાઈડન્સ." }
    ]
  },
  chat: {
    buttonLabel: {
      en: "Connect on WhatsApp",
      hi: "व्हाट्सएप पर संपर्क करें",
      gu: "વોટ્સએપ પર સપોર્ટ મેળવો"
    },
    whatsappText: {
      en: "Hello! I am a student at Lakshay IQ and I am looking for assistance with my final semester academic project. Please guide me! 🎓💻",
      hi: "नमस्ते! मैं लक्ष्य आईक्यू का छात्र हूं और मुझे अपने अंतिम सेमेस्टर के शैक्षणिक प्रोजेक्ट में मदद चाहिए। कृपया मेरा मार्गदर्शन करें! 🎓💻",
      gu: "નમસ્તે! હું લક્ષ્ય આઈક્યુ નો સ્ટુડન્ટ છું અને મારે છેલ્લા સેમેસ્ટરના એકેડેમિક પ્રોજેક્ટ માટે ગાઈડન્સ અને હેલ્પ જોઈએ છે. કૃપા કરીને સપોર્ટ આપો! 🎓💻"
    }
  }
};

const CHAT_STREAM: ChatMessage[] = [
  {
    id: 1,
    icon: "👋",
    en: "Hey there! Looking for a final semester academic project or thesis assistance? 🎓💡",
    hi: "नमस्ते! क्या आप अंतिम सेमेस्टर के शैक्षणिक प्रोजेक्ट या थीसिस सहायता की तलाश में हैं? 🎓💡",
    gu: "હેલો દોસ્ત! શું તમે છેલ્લા સેમેસ્ટરના એકેડેમિક પ્રોજેક્ટ અથવા થીસીસ ગાઈડન્સની શોધમાં છો? 🎓💡"
  },
  {
    id: 2,
    icon: "🤯",
    en: "We know how challenging it can be to design, code, document, and present a complete project under tight deadlines. 💻⏱️",
    hi: "हम जानते हैं कि कम समय में एक संपूर्ण प्रोजेक्ट को डिज़ाइन, कोड, दस्तावेज़ (document) और प्रस्तुत करना कितना कठिन हो सकता है। 💻⏱️",
    gu: "અમે જાણીએ છીએ કે ટૂંકી સમયમર્યાદામાં કોડ લખવો, સિનોપ્સિસ રેડી કરવું અને આખો પ્રોજેક્ટ પ્રેઝન્ટ કરવો કેટલો મુશ્કેલ છે! 💻⏱️"
  },
  {
    id: 3,
    icon: "🚀",
    en: "Don't stress! Our expert Project Helper is here to handle everything—from full code development to synopsis writing, black-book reporting, and PPT creation! 📄✨",
    hi: "चिंता न करें! हमारे प्रोजेक्ट विशेषज्ञ आपके लिए सब कुछ संभाल लेंगे—फुल कोड डेवलपमेंट से लेकर सिनोप्सिस राइटिंग, ब्लैक-बुक रिपोर्टिंग और पीपीटी बनाने तक! 📄✨",
    gu: "ટેન્શન ન લો દોસ્ત! અમારા પ્રોજેક્ટ એક્સપર્ટ તમારા માટે બધું જ સંભાળી લેશે—ફુલ કોડ ડેવલપમેન્ટથી લઈને સિનોપ્સિસ રાઇટિંગ, રિપોર્ટ અને PPT સપોર્ટ સુધી બધું જ! 📄✨"
  },
  {
    id: 4,
    icon: "🎓",
    en: "Get professional 1-on-1 guidance, complete system explanation, and high-quality work to secure your maximum GPA easily. 📈🥇",
    hi: "आसानी से अपने अधिकतम जीपीए सुरक्षित करने के लिए पेशेवर मार्गदर्शन, संपूर्ण सिस्टम विवरण और उच्च गुणवत्ता वाले कार्य प्राप्त करें। 📈🥇",
    gu: "સરળતાથી તમારા મેક્સિમમ GPA મેળવવા માટે એકદમ પ્રોફેશનલ ગાઈડન્સ, સિસ્ટમ ડેમોસ્ટ્રેશન અને હાઈ-ક્વોલિટી પ્રોજેક્ટ મેળવો. 📈🥇"
  },
  {
    id: 5,
    icon: "💬",
    en: "Click the button below to directly chat with our senior helper on WhatsApp. They will guide you with details, document samples, and pricing! 👇🔥",
    hi: "व्हाट्सएप पर हमारे वरिष्ठ सहायक से सीधे चैट करने के लिए नीचे दिए गए बटन पर क्लिक करें। वे आपको विवरण, दस्तावेज़ और मूल्य निर्धारण के साथ मार्गदर्शन करेंगे! 👇🔥",
    gu: "વોટ્સએપ પર અમારા સિનિયર હેલ્પર સાથે સીધી ચેટ કરવા માટે નીચેના બટન પર ક્લિક કરો. તેઓ તમને પ્રોજેક્ટની ડિટેઈલ્સ અને ડોક્યુમેન્ટ્સ સાથે પૂરો સપોર્ટ આપશે! 👇🔥"
  }
];

const SUPPORTED_TECHS = [
  "React.js", "Next.js", "Python / Django", "Machine Learning", 
  "Flutter / Android", "Node.js / Express", "IoT & Arduino", "Java / Spring Boot",
  "HTML5 / Tailwind CSS", "Firebase", "SQL / MongoDB", "FastAPI"
];

function StudentProjectsPage() {
  const [lang, setLang] = useState<Language>("en");
  const [showModal, setShowModal] = useState(true);
  const [visibleMessages, setVisibleMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const nav = useNavigate();
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);

  // Reset chat sequence when modal is closed
  useEffect(() => {
    if (!showModal) {
      setVisibleMessages([]);
      setCurrentStep(0);
      setIsTyping(true);
      shouldAutoScrollRef.current = true;
    }
  }, [showModal]);

  // Handle chat message sequencing
  useEffect(() => {
    if (showModal || currentStep >= CHAT_STREAM.length) {
      setIsTyping(false);
      return;
    }

    const typingTimer = setTimeout(() => {
      setIsTyping(false);
      setVisibleMessages(prev => [...prev, CHAT_STREAM[currentStep]]);
      
      const nextStepTimer = setTimeout(() => {
        if (currentStep + 1 < CHAT_STREAM.length) {
          setIsTyping(true);
          setCurrentStep(prev => prev + 1);
        } else {
          setCurrentStep(prev => prev + 1);
        }
      }, 900);

      return () => clearTimeout(nextStepTimer);
    }, 1300);

    return () => clearTimeout(typingTimer);
  }, [currentStep, showModal]);

  // Auto-scroll only the chat container, and only if user hasn't scrolled up manually
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // If user scrolls up more than 50px from bottom, disable auto-scroll
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
      shouldAutoScrollRef.current = isNearBottom;
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      const container = chatContainerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [visibleMessages, isTyping]);

  const activeHeader = DICTIONARY.header[lang];
  const activeFeatures = DICTIONARY.features[lang];
  const activeChat = {
    buttonLabel: DICTIONARY.chat.buttonLabel[lang],
    whatsappText: DICTIONARY.chat.whatsappText[lang],
  };



  const selectLanguage = (selectedLang: Language) => {
    setLang(selectedLang);
    setShowModal(false);
  };

  return (
    <div className="w-full bg-gradient-to-tr from-slate-50 via-emerald-50/20 to-sky-50/20 text-slate-800 antialiased relative rounded-3xl p-4 md:p-6 pt-2 md:pt-6 min-h-screen md:h-[calc(100vh-120px)] flex flex-col justify-start items-center border border-slate-200/50 shadow-sm overflow-x-hidden">
      
      {/* Premium Language Selection Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in">
          <Card className="w-full max-w-md bg-white/90 border border-slate-100/80 shadow-2xl p-6 md:p-8 rounded-[28px] space-y-6 animate-bubble-slide-in relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-sky-500" />
            
            <div className="text-center space-y-3 pt-2">
              <div className="h-14 w-14 mx-auto rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm shadow-emerald-500/5">
                <Sparkles className="h-6 w-6 text-emerald-500 animate-pulse" />
              </div>
              <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug" style={{ fontFamily: "'Sora', sans-serif" }}>
                Select Language<br/>
                <span className="text-base font-semibold text-slate-500">भाषा चुनें / ભાષા પસંદ કરો</span>
              </h2>
              <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                Choose your language to start your premium project consultation
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3.5 pt-2">
              <button
                onClick={() => selectLanguage("en")}
                className="w-full text-left p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/20 hover:shadow-md transition-all duration-300 cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <h4 className="font-bold text-sm text-slate-800 group-hover:text-emerald-950">English 🇬🇧</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Explore premium guidance in English</p>
                </div>
                <ChevronRight className="h-4.5 w-4.5 text-slate-400 group-hover:translate-x-1 group-hover:text-emerald-600 transition-all" />
              </button>

              <button
                onClick={() => selectLanguage("hi")}
                className="w-full text-left p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/20 hover:shadow-md transition-all duration-300 cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <h4 className="font-bold text-sm text-slate-800 group-hover:text-emerald-950">हिन्दी (Hindi) 🇮🇳</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">हिंदी में प्रोजेक्ट मार्गदर्शन प्राप्त करें</p>
                </div>
                <ChevronRight className="h-4.5 w-4.5 text-slate-400 group-hover:translate-x-1 group-hover:text-emerald-600 transition-all" />
              </button>

              <button
                onClick={() => selectLanguage("gu")}
                className="w-full text-left p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/20 hover:shadow-md transition-all duration-300 cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <h4 className="font-bold text-sm text-slate-800 group-hover:text-emerald-950">ગુજરાતી (Gujarati) 🌾</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">ગુજરાતી ભાષામાં સહાય મેળવવા માટે પસંદ કરો</p>
                </div>
                <ChevronRight className="h-4.5 w-4.5 text-slate-400 group-hover:translate-x-1 group-hover:text-emerald-600 transition-all" />
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Aesthetic Parallax Depth Blobs */}
      <div className="absolute top-[-5%] right-[-5%] w-[450px] h-[450px] rounded-full bg-emerald-300/10 blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[500px] h-[500px] rounded-full bg-sky-300/15 blur-3xl -z-10 animate-pulse" style={{ animationDelay: "2.5s" }} />

      {/* Floating Interactive 3D Parallax Emojis */}
      <div className="absolute top-[15%] left-[8%] text-4xl opacity-20 animate-float-slow hidden md:block pointer-events-none -z-10">🎓</div>
      <div className="absolute top-[48%] right-[10%] text-4xl opacity-20 animate-float-medium hidden md:block pointer-events-none -z-10">💻</div>
      <div className="absolute bottom-[22%] left-[12%] text-4xl opacity-20 animate-float-fast hidden md:block pointer-events-none -z-10">🚀</div>
      <div className="absolute bottom-[16%] right-[14%] text-4xl opacity-20 animate-float-slow hidden md:block pointer-events-none -z-10">📄</div>
      <div className="absolute top-[32%] left-[82%] text-4xl opacity-20 animate-float-medium hidden md:block pointer-events-none -z-10">💬</div>

      {/* Main Structural Layout Container */}
      <div className="w-full max-w-6xl space-y-4 z-10 flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Fullscreen Premium Workspace Header - Reduced top margin */}
        <div className="relative overflow-hidden w-full flex flex-col sm:flex-row items-center justify-between gap-4 py-2 shrink-0 border-b border-slate-200/80 pb-4">
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.history.back()}
              className="h-10 w-10 rounded-full border border-slate-200 bg-white shadow-sm hover:bg-slate-50 shrink-0 cursor-pointer transition-all duration-200 hover:-translate-x-0.5 active:scale-95"
              title="Return Dashboard"
            >
              <X className="h-5 w-5 text-slate-500" />
            </Button>
            <div className="space-y-1.5 text-left">
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-extrabold tracking-tight text-slate-900 leading-normal" style={{ fontFamily: "'Sora', sans-serif" }}>
                  {activeHeader.title}
                </h1>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse hidden sm:inline-block" />
              </div>
              <p className="text-slate-500 text-[11px] sm:text-xs font-semibold leading-relaxed">
                {activeHeader.subtitle}
              </p>
            </div>
          </div>

          {/* Inline Localization Bar */}
          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-[14px] border border-slate-200 shadow-inner shrink-0 w-full sm:w-auto justify-center sm:justify-start">
            {(["en", "hi", "gu"] as Language[]).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`h-8 px-4 rounded-[10px] text-xs font-bold transition-all duration-200 cursor-pointer ${lang === l ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-800"}`}
              >
                {l === "en" ? "EN 🇬🇧" : l === "hi" ? "हिन्दी 🇮🇳" : "ગુજરાતી 🌾"}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Responsive Split-Pane Workspace - Increased chat height on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch flex-1 overflow-hidden min-h-0">
          
          {/* Left Column - Chat Terminal Console (taller on mobile) */}
          <div className="lg:col-span-7 flex flex-col overflow-hidden min-h-0 lg:min-h-0 min-h-[60vh]">
            <Card className="bg-white border border-slate-200/90 shadow-[0_12px_40px_rgba(0,0,0,0.03)] rounded-[24px] overflow-hidden flex flex-col h-full">
              
              {/* Agent status strip */}
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/40 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-[14px] bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-sm">
                      <GraduationCap className="h-5 w-5 stroke-[2.2]" />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-500/10 animate-ping" />
                    <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 leading-none" style={{ fontFamily: "'Sora', sans-serif" }}>
                      {activeHeader.chatTitle}
                    </h3>
                    <span className="text-[10px] font-bold text-emerald-600 mt-1 block">Live Project Assistant</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px] font-bold bg-emerald-50/50 px-2.5 py-0.8 uppercase tracking-wider border-emerald-100 text-emerald-600">
                  Verified Guide
                </Badge>
              </div>

              {/* Chat Scrollable Stream Log - Increased height, auto-scroll only inside */}
              <div 
                ref={chatContainerRef}
                className="flex-1 p-5 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-200/80 bg-slate-50/30 min-h-[300px] md:min-h-0"
              >
                {visibleMessages.map((message) => (
                  <div key={message.id} className="flex items-start gap-3.5 animate-bubble-slide-in">
                    <div className="h-9 w-9 rounded-xl bg-emerald-50 border border-emerald-100/60 flex items-center justify-center shrink-0 shadow-sm text-base">
                      {message.icon}
                    </div>
                    <div className="max-w-[85%] bg-white border border-slate-100/80 text-slate-800 rounded-2xl rounded-tl-none p-4 shadow-[0_4px_24px_rgba(0,0,0,0.015)] relative overflow-hidden">
                      <p className="text-sm sm:text-base font-semibold leading-relaxed animate-text-reveal">
                        {message[lang]}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Pulsing typewriter loading block */}
                {isTyping && (
                  <div className="flex items-start gap-3.5 animate-bubble-slide-in">
                    <div className="h-9 w-9 rounded-xl bg-emerald-50 border border-emerald-100/60 flex items-center justify-center shrink-0 shadow-sm text-base">
                      🤖
                    </div>
                    <div className="bg-white border border-slate-100/80 rounded-2xl rounded-tl-none px-4 py-3 shadow-[0_4px_24px_rgba(0,0,0,0.015)]">
                      <div className="flex items-center gap-1.5 py-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "0s" }} />
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "0.2s" }} />
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "0.4s" }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat action console */}
              <div className="px-5 py-4 border-t border-slate-100 bg-white shrink-0 flex flex-col items-center justify-center">
                {currentStep >= CHAT_STREAM.length && !isTyping ? (
                  <div className="w-full space-y-2">
                    <Button
                      onClick={() => nav({ to: "/student/chat" })}
                      className="w-full h-13 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm shadow-md shadow-emerald-600/10 hover:scale-[1.01] active:scale-98 transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer relative overflow-hidden group py-3.5 border border-emerald-500/10"
                    >
                      <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                      <MessageSquare className="h-5 w-5 fill-white stroke-none animate-pulse" />
                      <span>Chat with Admin</span>
                      <ChevronRight className="h-4.5 w-4.5 ml-0.5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    <p className="text-[10px] text-slate-400 text-center font-semibold">
                      💬 Chat directly with admin — messages auto-delete in 2 minutes
                    </p>
                  </div>
                ) : (
                  <div className="text-[11px] text-emerald-600/80 font-bold tracking-wider uppercase animate-pulse flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" />
                    <span>Project Assistant is composing message...</span>
                  </div>
                )}
              </div>

            </Card>
          </div>

          {/* Right Column - Premium Features & Stack Panel */}
          <div className="lg:col-span-5 flex flex-col overflow-y-auto space-y-4 min-h-0">
            <Card className="p-6 border border-slate-200 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.03)] rounded-[24px] flex flex-col justify-between gap-6">
              
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5" style={{ fontFamily: "'Sora', sans-serif" }}>
                    <Sparkles className="h-5 w-5 text-emerald-500 fill-emerald-500/10" />
                    {activeHeader.featuresTitle}
                  </h2>
                  <div className="h-1 w-12 bg-emerald-500 rounded-full mt-2" />
                </div>

                {/* Vertical Features Stack */}
                <div className="space-y-3.5">
                  {activeFeatures.map((f, idx) => {
                    const FeatureIcon = f.icon;
                    return (
                      <div
                        key={idx}
                        className="group p-4 bg-slate-50/30 hover:bg-white rounded-xl border border-slate-200/60 hover:border-emerald-500/20 hover:shadow-md transition-all duration-300 flex items-start gap-4"
                      >
                        <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 group-hover:text-emerald-600 group-hover:border-emerald-500/20 group-hover:shadow group-hover:bg-emerald-50/20 transition-all shrink-0">
                          <FeatureIcon className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm group-hover:text-slate-900 transition-colors">
                            {f.title}
                          </h4>
                          <p className="text-[11px] sm:text-xs text-slate-500 font-semibold leading-relaxed">
                            {f.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Supported Tech Stacks */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-slate-800 tracking-wider uppercase flex items-center gap-1.5">
                    <Cpu className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Popular Stacks We Support</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {SUPPORTED_TECHS.map(tech => (
                      <span 
                        key={tech} 
                        className="text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-500/20 border border-slate-200 px-2.5 py-1 rounded-lg transition-all cursor-default"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Micro Advisory Card */}
              <Card className="p-4 bg-emerald-50/30 border border-emerald-500/10 rounded-xl flex items-start gap-3">
                <Laptop className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-emerald-800">
                    {lang === "en" ? "100% Viva explanation" : lang === "hi" ? "100% वाइवा स्पष्टीकरण" : "૧૦૦% વાઈવા તૈયારી"}
                  </h4>
                  <p className="text-[10px] text-emerald-700/80 font-semibold leading-relaxed">
                    {lang === "en" ? "We explain every file, database query, and route so you score top GPA and face viva with full confidence!" : lang === "hi" ? "हम हर फ़ाइल, डेटाबेस क्वेरी और रूट को समझाते हैं ताकि आप शीर्ष जीपीए स्कोर करें और पूरे आत्मविश्वास के साथ वाइवा का सामना करें!" : "અમે દરેક ફાઇલ, ડેટાબેઝ ક્વેરી અને રાઉટીંગ ડિટેઈલમાં સમજાવીશું જેથી તમે ટોપ GPA સ્કોર કરો અને પૂરા આત્મવિશ્વાસ સાથે વાઈવા આપો!"}
                  </p>
                </div>
              </Card>

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
        .animate-text-reveal {
          animation: textReveal 0.75s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes textReveal {
          0% {
            color: rgba(148, 163, 184, 0.6);
            filter: blur(2.5px);
            opacity: 0.3;
          }
          40% {
            color: rgba(51, 65, 85, 0.9);
            filter: blur(1px);
            opacity: 0.8;
          }
          100% {
            color: #0f172a;
            filter: blur(0px);
            opacity: 1;
          }
        }
        .animate-float-slow {
          animation: floatSlow 8s ease-in-out infinite;
        }
        .animate-float-medium {
          animation: floatMedium 6s ease-in-out infinite;
        }
        .animate-float-fast {
          animation: floatFast 4s ease-in-out infinite;
        }
        @keyframes floatSlow {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-16px) rotate(4deg);
          }
        }
        @keyframes floatMedium {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-12px) rotate(-3deg);
          }
        }
        @keyframes floatFast {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-8px) rotate(2deg);
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