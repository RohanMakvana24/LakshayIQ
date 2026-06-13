import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Share2, Copy, Check, Send, Globe } from "lucide-react";
import { FaWhatsapp, FaTwitter, FaLinkedin, FaTelegram } from "react-icons/fa";


interface ShareButtonProps {
  title: string;
  type: string; // e.g. "Course", "Semester", "Subject"
  path: string;  // e.g. "/student/course/123"
}

export function ShareButton({ title, type, path }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}${path}`;
      setShareUrl(url);
      setCanNativeShare(!!navigator.share);
    }
  }, [path]);

  const shareText = `Check out this ${type.toLowerCase()} "${title}" on Lakshay IQ!`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success(`${type} link copied to clipboard!`);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link.");
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: shareText,
          url: shareUrl,
        });
        toast.success("Shared successfully!");
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          toast.error("Could not complete share operation.");
        }
      }
    }
  };

  const shareChannels = [
    {
      name: "WhatsApp",
      icon: FaWhatsapp,
      color: "bg-[#25D366] hover:bg-[#20ba59] text-white",
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + shareUrl)}`,
    },
    {
      name: "Twitter / X",
      icon: FaTwitter,
      color: "bg-[#1DA1F2] hover:bg-[#1a91da] text-white",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "LinkedIn",
      icon: FaLinkedin,
      color: "bg-[#0077B5] hover:bg-[#00669c] text-white",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "Telegram",
      icon: FaTelegram,
      color: "bg-[#0088cc] hover:bg-[#0077b3] text-white",
      href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-250 dark:border-slate-700 text-slate-900 dark:text-slate-100 shadow-sm transition-all duration-300 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <Share2 className="h-3.5 w-3.5" />
          <span>Share</span>
        </button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Share2 className="h-5 w-5 text-emerald-400" />
            Share {type}
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-xs">
            Share <span className="text-emerald-400 font-bold">"{title}"</span> with your classmates and friends to study together.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Link Copy Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {type} Link
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  value={shareUrl}
                  readOnly
                  className="bg-slate-950/60 border-slate-850 text-xs text-slate-350 pr-8 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 h-9 font-mono"
                />
                <Globe className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-600" />
              </div>
              <Button
                size="sm"
                onClick={handleCopy}
                className="h-9 px-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-white" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-white" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Social Share Channels Grid */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Share to social media
            </label>
            <div className="grid grid-cols-2 gap-2">
              {shareChannels.map((channel) => {
                const Icon = channel.icon;
                return (
                  <a
                    key={channel.name}
                    href={channel.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 border border-white/5 shadow-sm ${channel.color}`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                    <span>{channel.name}</span>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Native Share fallback if available */}
          {canNativeShare && (
            <div className="pt-2 border-t border-slate-850">
              <Button
                onClick={handleNativeShare}
                variant="outline"
                className="w-full h-10 border-slate-800 bg-slate-950/20 hover:bg-slate-950 text-slate-300 hover:text-white font-bold text-xs gap-2 transition-all cursor-pointer"
              >
                <Send className="h-3.5 w-3.5 text-emerald-400" />
                Share via device options
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ShareCourseProps {
  courseName: string;
  courseId: string;
}

export function ShareCourse({ courseName, courseId }: ShareCourseProps) {
  return (
    <ShareButton
      title={courseName}
      type="Course"
      path={`/student/course/${courseId}`}
    />
  );
}
