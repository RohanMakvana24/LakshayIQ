import { useEffect, useState } from "react";
import { BiSolidBookHeart } from "react-icons/bi";
import { Sparkles } from "lucide-react";

export function PageLoader({ label = "Loading Workspace" }: { label?: string }) {
  const [funSubtext, setFunSubtext] = useState("Calibrating student matrix...");

  useEffect(() => {
    const subtexts = [
      "Calibrating intelligence matrix...",
      "Synthesizing unit concepts...",
      "Structuring syllabus coordinates...",
      "Syncing with campus learning nodes...",
      "Unlocking conceptual pathways...",
      "Calibrating testing arena...",
      "Assembling study frameworks..."
    ];
    
    // Choose a custom context-aware subtext based on the label
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes("semester")) {
      setFunSubtext("Assembling semester coordinates & structures...");
    } else if (lowerLabel.includes("course")) {
      setFunSubtext("Compiling degree pathways & core syllabus...");
    } else if (lowerLabel.includes("university") || lowerLabel.includes("campus")) {
      setFunSubtext("Opening gate to campus universe nodes...");
    } else if (lowerLabel.includes("unit")) {
      setFunSubtext("Synthesizing concept modules & topic trees...");
    } else if (lowerLabel.includes("subject")) {
      setFunSubtext("Loading knowledge structures & mock tests...");
    } else if (lowerLabel.includes("fullscreen") || lowerLabel.includes("lab")) {
      setFunSubtext("Securing reader workspace sandbox...");
    } else {
      const randomIndex = Math.floor(Math.random() * subtexts.length);
      setFunSubtext(subtexts[randomIndex]);
    }
  }, [label]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] w-full py-16 px-4 animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden select-none">
      {/* Dynamic Futuristic Glowing Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl animate-[pulse_3s_infinite_ease-in-out]" />
      
      {/* Centered Floating Content (No Box/Card Background) */}
      <div className="relative z-10 flex flex-col items-center max-w-xs w-full text-center transition-all duration-300">
        
        {/* Futuristic Orbital Logo Core */}
        <div className="relative flex h-20 w-20 items-center justify-center mb-5">
          {/* Spin outer glowing ring */}
          <div className="absolute inset-0 rounded-full border-2 border-t-emerald-500 border-r-transparent border-b-teal-500 border-l-transparent animate-[spin_2s_linear_infinite]" />
          
          {/* Inner pulsating glow shadow */}
          <div className="absolute inset-2 rounded-2xl bg-emerald-500/10 animate-ping duration-1500 opacity-75" />
          
          {/* Core original Book Heart Icon in a solid glowing base */}
          <div className="absolute inset-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg flex items-center justify-center transform transition-transform duration-500 hover:rotate-12">
            <BiSolidBookHeart className="h-9 w-9 text-white animate-[pulse_2s_infinite_ease-in-out]" />
            
            {/* Mini notification active radar dot */}
            <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-white shadow-sm animate-pulse" />
          </div>

          {/* Orbiting particle */}
          <div className="absolute -top-1 left-1/2 h-2.5 w-2.5 rounded-full bg-teal-400 border border-white shadow-md animate-[ping_1.5s_infinite]" />
        </div>

        {/* Brand Header */}
        <div className="flex items-center gap-1 mb-1 justify-center">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">Lakshay</span>
          <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white px-1 py-0.2 rounded-md leading-none scale-90">IQ</span>
        </div>

        {/* Dynamic primary label */}
        <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1.5 justify-center mt-1">
          <Sparkles className="h-3.5 w-3.5 text-emerald-500 animate-[bounce_1.5s_infinite]" />
          <span>{label}</span>
        </h3>

        {/* Dynamic subtext */}
        <p className="text-[11px] font-semibold text-slate-400 mt-2 min-h-[16px] animate-[pulse_2.2s_infinite_ease-in-out] tracking-wide">
          {funSubtext}
        </p>

        {/* Premium infinite loader indicator bar */}
        <div className="w-48 bg-slate-200/60 rounded-full h-1 mt-5 overflow-hidden relative border border-slate-200/20">
          <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 rounded-full animate-loader-slide" />
        </div>

        {/* Secure Platform Watermark */}
        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-4 block">
          Secure Portal Core
        </span>
      </div>

      {/* Embedded local keyframe animations */}
      <style>{`
        @keyframes loaderSlide {
          0% {
            left: -40%;
            width: 30%;
          }
          50% {
            width: 40%;
          }
          100% {
            left: 110%;
            width: 30%;
          }
        }
        .animate-loader-slide {
          position: absolute;
          animation: loaderSlide 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}
