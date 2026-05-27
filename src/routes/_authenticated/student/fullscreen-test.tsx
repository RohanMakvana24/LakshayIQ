import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { PageLoader } from "@/components/page-loader";
import { ExternalLink, Maximize, MonitorPlay, Shield, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/student/fullscreen-test")({
  head: () => ({ meta: [{ title: "Fullscreen Test — Lakshay IQ" }] }),
  pendingMs: 0,
  pendingComponent: () => <PageLoader label="Preparing Fullscreen Lab" />,
  component: FullscreenTestPage,
});

const sampleEmbedHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Fullscreen Test</title><style>body{margin:0;font-family:system-ui, sans-serif;background:#0f172a;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;}.panel{max-width:720px;padding:32px;border:2px solid rgba(255,255,255,.12);border-radius:24px;background:rgba(15,23,42,.9);box-shadow:0 20px 80px rgba(15,23,42,.35);} h1{font-size:clamp(2rem,4vw,3rem);margin:0 0 16px;} p{color:rgba(226,232,240,.85);line-height:1.6;}</style></head><body><div class="panel"><h1>Fullscreen Test Frame</h1><p>Use the button above to enter fullscreen mode. This iframe is designed to help verify whether fullscreen content expands properly without the half-black screen bug.</p></div></body></html>`;

function FullscreenTestPage() {
  const [isFullscreenSecure, setIsFullscreenSecure] = useState(false);
  const [isFullscreenEntering, setIsFullscreenEntering] = useState(false);
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const workspaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = document.fullscreenElement === workspaceRef.current;
      setIsFullscreenSecure(isCurrentlyFullscreen);
      setIsFullscreenEntering(false);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleMaximize = async () => {
    try {
      if (workspaceRef.current) {
        setIsFullscreenEntering(true);
        await workspaceRef.current.requestFullscreen();
      }
    } catch (err) {
      console.error("Failed to enter fullscreen:", err);
    }
  };

  const handleMinimize = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Failed to exit fullscreen:", err);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="w-full px-4 py-4 md:px-6 lg:px-8">
        <div className="mb-4">
          <BreadcrumbNav
            items={[
              { label: "Dashboard", to: "/student" },
              { label: "Fullscreen Test" },
            ]}
          />
        </div>

        <div className="mb-6 rounded-3xl border border-slate-200 bg-white shadow-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Fullscreen Debug Lab</h1>
              <p className="mt-2 text-sm text-slate-600 max-w-2xl">
                Use this page to verify fullscreen behavior for secure embeds. Click the maximize button and confirm the frame fills the entire viewport cleanly.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleMaximize}
                className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-500"
              >
                <Maximize className="mr-2 h-4 w-4" /> Enter Fullscreen
              </Button>
              <Button
                onClick={handleMinimize}
                variant="outline"
                className="rounded-xl border-slate-300 text-slate-700 hover:bg-slate-100"
              >
                <X className="mr-2 h-4 w-4" /> Exit Fullscreen
              </Button>
              <Link
                to="/student"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                <ExternalLink className="h-4 w-4" /> Back to dashboard
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card className="rounded-3xl border border-slate-200 overflow-hidden shadow-md">
            <div
              ref={workspaceRef}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onTouchStart={() => setIsHovered(true)}
              className={cn(
                "relative flex h-[420px] flex-col overflow-hidden bg-slate-950",
                isFullscreenSecure && "h-full"
              )}
            >
              <div className="flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/95 px-4 py-3">
                <div className="flex items-center gap-2 text-white">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-semibold">Secure Preview</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300 text-[11px] uppercase tracking-[0.18em]">
                  {isFullscreenSecure ? "Fullscreen Active" : "Window Mode"}
                </div>
              </div>

              {isIframeLoading && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-slate-950/85 text-center text-slate-200">
                  <MonitorPlay className="h-10 w-10 animate-pulse text-emerald-400" />
                  <p className="text-sm font-semibold">Loading preview...</p>
                </div>
              )}

              <iframe
                title="Fullscreen test preview"
                srcDoc={sampleEmbedHtml}
                onLoad={() => setIsIframeLoading(false)}
                className="absolute inset-0 h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />

              {!isHovered && !isFullscreenSecure && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/80 text-center text-slate-200 px-8">
                  <div>
                    <Shield className="mx-auto mb-3 h-10 w-10 text-emerald-400" />
                    <p className="text-sm font-semibold">Hover over this frame to interact with the embed.</p>
                    <p className="mt-2 text-xs text-slate-400">This overlay helps you confirm that the preview area is being rendered and resized correctly.</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="text-sm font-bold text-slate-900">Fullscreen Validation Notes</p>
                  <p className="text-xs text-slate-500">Use this panel to test and reproduce the bug without page state from the unit preview.</p>
                </div>
              </div>

              <ul className="space-y-3 text-sm text-slate-600">
                <li>• Click <strong>Enter Fullscreen</strong> to verify the preview expands cleanly.</li>
                <li>• If the screen still appears cut or black, the bug is inside the fullscreen container styling.</li>
                <li>• This page uses a direct iframe so it is easier to test without external route state.</li>
              </ul>
              <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4 text-slate-700 text-sm">
                <p className="font-semibold">Tip:</p>
                <p className="mt-1">If this works, the same fix should apply to the unit preview fullscreen container.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <style>{`
        :fullscreen, :-webkit-full-screen, :-moz-full-screen, :-ms-fullscreen, .fullscreen-workspace:fullscreen {
          position: fixed !important;
          inset: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          z-index: 99999 !important;
          background: #0f172a !important;
        }
        :fullscreen iframe, :-webkit-full-screen iframe, :-moz-full-screen iframe, :-ms-fullscreen iframe {
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
    </div>
  );
}
