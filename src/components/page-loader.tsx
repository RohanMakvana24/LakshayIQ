import { useEffect } from "react";

export function PageLoader({ label = "Loading Workspace" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[35vh] w-full py-10 px-4 animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden select-none">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/[0.02] dark:bg-emerald-500/[0.01] rounded-full blur-3xl pointer-events-none" />
      
      {/* Centered Floating Content */}
      <div className="relative z-10 flex flex-col items-center justify-center max-w-md w-full text-center transition-all duration-300">
        
        {/* Leaf Loader Container */}
        <div className="leaf-loader-con mb-6">
          <div className="leaf-item"></div>
          <div className="leaf-item"></div>
          <div className="leaf-item"></div>
        </div>

        {/* Loading Text */}
        <div className="space-y-1">
          <p className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Loading</p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-85">{label}</p>
        </div>

      </div>

      {/* Embedded local CSS animations */}
      <style>{`
        .leaf-loader-con {
          display: flex;
          gap: 0.5em;
          font-size: 16px; /* controls the scale of the loader */
          justify-content: center;
          align-items: center;
          height: 60px;
        }

        .leaf-item {
          width: 1em;
          height: 3em;
          background-color: rgba(16, 185, 129, 0.15);
          clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 81%);
          transform: rotate(-30deg);
          animation: leaf-color 1200ms infinite;
          animation-delay: 800ms;
          border-radius: 2px;
        }

        .leaf-item:nth-child(2) {
          clip-path: polygon(0% 35%, 100% 35%, 100% 100%, 0% 81%);
          animation-delay: 400ms;
        }

        .leaf-item:nth-child(1) {
          clip-path: polygon(0% 70%, 100% 70%, 100% 100%, 0% 81%);
          animation-delay: 0ms;
        }

        @keyframes leaf-color {
          0% {
            background-color: #10b981;
          }
          100% {
            background-color: rgba(16, 185, 129, 0.15);
          }
        }
      `}</style>
    </div>
  );
}
