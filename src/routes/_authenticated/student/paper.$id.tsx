import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { PageLoader } from "@/components/page-loader";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  ArrowLeft, 
  Loader2, 
  FileText, 
  AlertCircle, 
  Plus, 
  Minus, 
  ShieldAlert
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/student/paper/$id")({
  loader: async ({ params }) => {
    const { data: paper, error } = await supabase
      .from("previous_year_papers")
      .select("id, title, year, file_url, subject_id")
      .eq("id", params.id)
      .single();

    if (error || !paper) {
      throw notFound();
    }

    // Fetch subject to display subject name
    const { data: subject } = await supabase
      .from("subjects")
      .select("id, name, semester_id")
      .eq("id", paper.subject_id)
      .single();

    return { paper, subject };
  },
  pendingMs: 0,
  pendingComponent: () => <PageLoader label="Loading Document Viewer" />,
  component: PaperViewerPage,
});

function PaperViewerPage() {
  const { paper, subject } = Route.useLoaderData();
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfjsLoaded, setPdfjsLoaded] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pages, setPages] = useState<number[]>([]);
  
  // Custom interactive scale and progress tracking (responsive default scale)
  const [scale, setScale] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 640 ? 0.9 : 1.4;
    }
    return 1.4;
  });
  const [currentPage, setCurrentPage] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Load PDF.js locally
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "/pdf.min.js";
    script.async = true;
    script.onload = () => {
      // Configure local worker
      // @ts-ignore
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
      setPdfjsLoaded(true);
    };
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // 2. Fetch PDF blob securely
  useEffect(() => {
    let active = true;
    const loadFile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if the file is in Supabase storage to download securely
        if (paper.file_url.includes("/storage/v1/object/public/university-assets/")) {
          const path = paper.file_url.split("/storage/v1/object/public/university-assets/")[1];
          if (path) {
            const { data, error: storageError } = await supabase.storage
              .from("university-assets")
              .download(path);
            
            if (storageError) throw storageError;
            if (!active) return;
            
            const pdfBlob = new Blob([data], { type: "application/pdf" });
            const url = URL.createObjectURL(pdfBlob);
            setBlobUrl(url);
            return;
          }
        }
        
        // Fallback to direct fetch (e.g. for GitHub URLs)
        const response = await fetch(paper.file_url);
        if (!response.ok) {
          throw new Error("Failed to fetch document content");
        }
        
        const blob = await response.blob();
        if (!active) return;
        
        const pdfBlob = new Blob([blob], { type: "application/pdf" });
        const url = URL.createObjectURL(pdfBlob);
        setBlobUrl(url);
      } catch (err: any) {
        console.error("Error loading secure document:", err);
        if (active) {
          setError("Failed to load document preview. You can try downloading it directly using the button above.");
          setLoading(false);
        }
      }
    };

    loadFile();

    return () => {
      active = false;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [paper.file_url]);

  // 3. Render PDF document pages when PDF.js is loaded and blobUrl is ready
  useEffect(() => {
    if (!pdfjsLoaded || !blobUrl) return;
    let active = true;

    const loadPdfDoc = async () => {
      try {
        // @ts-ignore
        const loadingTask = window.pdfjsLib.getDocument(blobUrl);
        const pdf = await loadingTask.promise;
        if (!active) return;
        setPdfDoc(pdf);
        const pagesArray = Array.from({ length: pdf.numPages }, (_, i) => i + 1);
        setPages(pagesArray);
        setLoading(false);
      } catch (err) {
        console.error("Error rendering PDF via PDF.js:", err);
        if (active) {
          setError("Could not parse PDF content securely.");
          setLoading(false);
        }
      }
    };

    loadPdfDoc();
    return () => {
      active = false;
    };
  }, [pdfjsLoaded, blobUrl]);

  // 4. Track scroll position to update current page indicator
  useEffect(() => {
    if (pages.length === 0 || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageNum = parseInt(entry.target.getAttribute("data-page") || "1");
            setCurrentPage(pageNum);
          }
        });
      },
      {
        root: containerRef.current,
        threshold: 0.3,
      }
    );

    const childElements = containerRef.current.querySelectorAll("[data-page]");
    childElements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [pages, loading]);

  const handleDownload = () => {
    if (!blobUrl) {
      toast.error("Document is not loaded yet");
      return;
    }
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `${paper.title.replace(/[^a-zA-Z0-9]/g, "_")}_${paper.year}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Download started");
  };

  return (
    <div className="w-full h-[calc(100vh-80px)] flex flex-col space-y-2.5 py-0.5 sm:py-1 antialiased">
      {/* 1. Header Panel with Clean Medium Rounding */}
      <div className="flex items-center justify-between gap-3 bg-card p-3 rounded-lg shadow-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            to="/student/subject/$id"
            params={{ id: paper.subject_id }}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border/80 bg-white hover:bg-neutral-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition-all active:scale-95 shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/15">
                <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                Secure
              </span>
              <span className="text-[9px] font-medium text-muted-foreground truncate max-w-[130px] sm:max-w-none">
                {subject?.name || "Subject Details"}
              </span>
            </div>
            <h1 className="text-xs font-extrabold text-foreground truncate mt-0.5">
              {paper.title} ({paper.year})
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Zoom Panel - Hidden on Mobile */}
          <div className="hidden sm:flex items-center bg-muted/65 dark:bg-zinc-900 border border-border/60 rounded-md p-0.5">
            <Button
              variant="ghost"
              size="icon"
              disabled={loading || !!error}
              onClick={() => setScale(s => Math.max(0.6, s - 0.2))}
              className="h-6 w-6 rounded text-muted-foreground hover:text-foreground"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-[9px] font-mono font-bold text-muted-foreground min-w-[34px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              disabled={loading || !!error}
              onClick={() => setScale(s => Math.min(2.0, s + 0.2))}
              className="h-6 w-6 rounded text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {/* Secure Download Button - Icon-only on mobile */}
          <Button
            onClick={handleDownload}
            disabled={loading || !!error}
            size="sm"
            className="bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-zinc-150 rounded-md h-7.5 w-7.5 sm:w-auto px-0 sm:px-3 shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline text-[11px] font-bold">Download</span>
          </Button>
        </div>
      </div>

      {/* 2. Main Workstation Panel (Split Screen) */}
      <div className="flex-1 flex gap-3 min-h-0 relative">
        
        {/* Left Side Navigator (Thumbnails/Index list) - Hidden on Mobile */}
        {!loading && !error && pages.length > 0 && (
          <div className="hidden md:flex w-40 flex-col bg-card rounded-lg p-2.5 shrink-0 max-h-full overflow-y-auto shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground px-2 mb-2">
              Pages
            </h3>
            <div className="space-y-1">
              {pages.map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => {
                    const el = document.getElementById(`page-card-${pageNum}`);
                    el?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-bold rounded-md text-left border transition-all",
                    currentPage === pageNum
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 shadow-sm"
                      : "text-muted-foreground hover:bg-neutral-100 dark:hover:bg-zinc-900 border-transparent"
                  )}
                >
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  <span>Page {pageNum}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Right Side Main Document Scrollable Canvas Tracker */}
        <div 
          ref={containerRef}
          className="flex-1 bg-background rounded-lg overflow-y-auto relative p-2 sm:p-4 flex flex-col items-center min-h-0 scroll-smooth"
        >
          {loading ? (
            <div className="flex flex-col items-center gap-2 my-auto text-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
              <div>
                <p className="text-xs font-bold text-foreground uppercase tracking-widest animate-pulse">
                  Unlocking Secure Document...
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Loading HTML5 canvas pages
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center p-6 max-w-sm flex flex-col items-center my-auto bg-card border border-border/70 rounded-lg shadow-sm">
              <ShieldAlert className="h-8 w-8 text-rose-500 mb-2.5" />
              <h3 className="text-xs font-black text-foreground mb-1">Preview Blocked</h3>
              <p className="text-[11px] text-muted-foreground mb-4 leading-normal">{error}</p>
              {paper.file_url && (
                <a href={paper.file_url} target="_blank" rel="noreferrer" download className="w-full">
                  <Button size="sm" variant="outline" className="w-full rounded-md text-[11px] font-bold">
                    Use Direct Link
                  </Button>
                </a>
              )}
            </div>
          ) : (
            <div className="w-full flex flex-col items-center space-y-4">
              {pages.map((pageNum) => (
                <div
                  key={pageNum}
                  id={`page-card-${pageNum}`}
                  data-page={pageNum}
                  className="w-full flex flex-col items-center"
                >
                  <PDFPage 
                    pageNum={pageNum} 
                    pdfDoc={pdfDoc} 
                    scale={scale} 
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* 3. Bottom Progress Bar */}
      {!loading && !error && (
        <div className="flex justify-between items-center bg-card px-3 py-1.5 rounded-lg text-[9px] font-bold text-muted-foreground select-none">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Protected Connection
          </span>
          <span className="font-mono">
            Page {currentPage} of {pages.length}
          </span>
        </div>
      )}
    </div>
  );
}

interface PDFPageProps {
  pageNum: number;
  pdfDoc: any;
  scale: number;
}

function PDFPage({ pageNum, pdfDoc, scale }: PDFPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let renderTask: any = null;
    let active = true;

    const renderPage = async () => {
      try {
        setLoading(true);
        const page = await pdfDoc.getPage(pageNum);
        if (!active) return;
        
        // Re-calculate viewport dynamically based on state scale
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        
        renderTask = page.render(renderContext);
        await renderTask.promise;
        
        if (active) {
          setLoading(false);
        }
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          console.error("Error rendering page:", err);
        }
      }
    };

    renderPage();
    
    return () => {
      active = false;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pageNum, pdfDoc, scale]);

  return (
    <div className="bg-white dark:bg-zinc-900 p-1.5 md:p-3 rounded-lg shadow-sm max-w-full overflow-hidden flex flex-col items-center relative min-h-[180px] justify-center transition-all duration-300">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-zinc-900 z-10 rounded-lg">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
      <canvas 
        ref={canvasRef} 
        className="max-w-full h-auto rounded-sm" 
      />
      <div className="mt-2 text-[9px] font-bold text-muted-foreground select-none uppercase tracking-wider">
        Page {pageNum} of {pdfDoc.numPages}
      </div>
    </div>
  );
}
