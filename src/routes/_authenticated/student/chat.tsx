import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Send, ArrowLeft, MessageSquare, Wifi, WifiOff, Shield, Clock, CheckCheck, Bell, BellOff } from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/chat")({
  head: () => ({ meta: [{ title: "Chat with Admin — Lakshay IQ" }] }),
  component: StudentChatPage,
});

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  expires_at: string;
  is_read: boolean;
}

interface AdminProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

function getTimeLeft(expiresAt: string): number {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 1000));
}

function MessageBubble({ msg, isOwn }: { msg: ChatMessage; isOwn: boolean }) {
  const [secondsLeft, setSecondsLeft] = useState(() => getTimeLeft(msg.expires_at));

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft(getTimeLeft(msg.expires_at));
    }, 1000);
    return () => clearInterval(interval);
  }, [msg.expires_at]);

  const opacity = secondsLeft <= 30 ? Math.max(0.2, secondsLeft / 30) : 1;
  if (secondsLeft <= 0) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeStr = `${minutes}:${String(seconds).padStart(2, "0")}`;
  const isUrgent = secondsLeft <= 30;

  return (
    <div
      className={`flex items-end gap-2 mb-3 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
      style={{ opacity }}
    >
      {!isOwn && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm">
          <Shield className="w-4 h-4 text-white" />
        </div>
      )}
      <div className={`max-w-[72%] space-y-1 ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed shadow-sm ${
            isOwn
              ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-br-sm"
              : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
          }`}
        >
          {msg.content}
        </div>
        <div className={`flex items-center gap-1 text-[10px] font-medium ${isOwn ? "flex-row-reverse" : "flex-row"} ${isUrgent ? "text-rose-500" : "text-slate-400"}`}>
          <Clock className="w-2.5 h-2.5" />
          <span>{isUrgent ? `Deleting in ${timeStr}` : `Auto-deletes in ${timeStr}`}</span>
          {isOwn && <CheckCheck className="w-3 h-3 ml-1 text-emerald-400" />}
        </div>
      </div>
    </div>
  );
}

// Static pinned welcome message — shown always, not stored in DB
function WelcomeMessageBubble({ adminName }: { adminName: string }) {
  return (
    <div className="flex items-end gap-2 mb-4">
      {/* Admin avatar */}
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm">
        <Shield className="w-4 h-4 text-white" />
      </div>
      <div className="max-w-[78%] flex flex-col items-start gap-1">
        {/* Sender label */}
        <span className="text-[10px] font-bold text-violet-600 px-1">{adminName} · Lakshay IQ</span>
        {/* Message bubble */}
        <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 shadow-sm">
          <p className="text-sm font-semibold text-slate-800 leading-relaxed">
            🎓 શું તમારે Final Year નો Project જોઈએ છે?
          </p>
          <p className="text-sm font-semibold text-slate-800 leading-relaxed">
            Documents સાથે! 📄✨
          </p>
        </div>
        {/* Pinned label */}
        <span className="text-[9px] font-bold text-violet-400 px-1 flex items-center gap-1">
          📌 Pinned message from Admin
        </span>
      </div>
    </div>
  );
}

function StudentChatPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [adminFetched, setAdminFetched] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Push notifications for incoming admin messages
  usePushNotifications((senderId, content, senderName) => {
    if (senderId === adminProfile?.id) {
      toast.message(`💬 ${senderName ?? "Admin"}`, { description: content });
    }
  });

  // Fetch admin profile using a secure RPC function (bypasses RLS restrictions)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Use RPC to get admin profile — works for both students and admins
        const { data, error } = await supabase.rpc("get_admin_profile");
        if (cancelled) return;

        if (!error && data && Array.isArray(data) && data.length > 0) {
          setAdminProfile(data[0] as AdminProfile);
        } else if (!error && data && !Array.isArray(data)) {
          // Single row response
          setAdminProfile(data as AdminProfile);
        } else {
          // Fallback: try direct query (works if admin is querying)
          const { data: roles } = await supabase
            .from("user_roles")
            .select("user_id")
            .eq("role", "admin")
            .limit(1);
          if (!cancelled && roles && roles.length > 0) {
            const adminId = roles[0].user_id;
            const { data: profile } = await supabase
              .from("profiles")
              .select("id, full_name, email, avatar_url")
              .eq("id", adminId)
              .maybeSingle();
            if (!cancelled && profile) setAdminProfile(profile as AdminProfile);
          }
        }
      } catch {
        // ignore — adminFetched will still be set below
      } finally {
        if (!cancelled) setAdminFetched(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);


  // Load messages — only called after adminFetched=true
  const loadMessages = useCallback(async (adminId: string, userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .or(
          `and(sender_id.eq.${userId},receiver_id.eq.${adminId}),and(sender_id.eq.${adminId},receiver_id.eq.${userId})`
        )
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Chat load error:", error);
        return;
      }
      setMessages((data ?? []) as ChatMessage[]);

      // Mark admin messages as read and set expiration to 5 minutes from now
      const unread = (data ?? []).filter(
        (m) => m.sender_id === adminId && !m.is_read
      );
      if (unread.length > 0) {
        const deleteTime = new Date(Date.now() + 5 * 60 * 1000).toISOString();
        await supabase
          .from("chat_messages")
          .update({ 
            is_read: true,
            expires_at: deleteTime
          })
          .eq("receiver_id", userId)
          .eq("sender_id", adminId)
          .eq("is_read", false);
      }
    } finally {
      setLoading(false); // always clear loading, even on error
    }
  }, []);

  // Trigger message load once admin is fetched
  useEffect(() => {
    if (adminFetched && adminProfile?.id && user?.id) {
      loadMessages(adminProfile.id, user.id);
    }
  }, [adminFetched, adminProfile?.id, user?.id, loadMessages]);

  // Realtime subscription — set up as soon as we have both IDs
  useEffect(() => {
    if (!user?.id || !adminProfile?.id) return;

    const userId = user.id;
    const adminId = adminProfile.id;

    // Remove any existing channel first to avoid duplicates
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const uniqueId = Math.random().toString(36).substring(2, 11);
    const channel = supabase
      .channel(`student-chat-${userId}-${adminId}-${uniqueId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const msg = payload.new as ChatMessage;
          const isRelevant =
            (msg.sender_id === userId && msg.receiver_id === adminId) ||
            (msg.sender_id === adminId && msg.receiver_id === userId);
          if (isRelevant) {
            setMessages((prev) => {
              if (prev.find((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
            // Mark as read if from admin and set expiration to 5 minutes from now
            if (msg.sender_id === adminId) {
              const deleteTime = new Date(Date.now() + 5 * 60 * 1000).toISOString();
              supabase
                .from("chat_messages")
                .update({ 
                  is_read: true,
                  expires_at: deleteTime
                })
                .eq("id", msg.id);
            }
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "chat_messages" },
        (payload) => {
          const old = payload.old as { id: string };
          setMessages((prev) => prev.filter((m) => m.id !== old.id));
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [user?.id, adminProfile?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Client-side expiry cleanup every 5s
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setMessages((prev) => prev.filter((m) => new Date(m.expires_at).getTime() > now));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || !user?.id || !adminProfile?.id || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);

    // Initial message has far future expires_at date (won't expire until read)
    const farFuture = new Date();
    farFuture.setFullYear(farFuture.getFullYear() + 50);

    const { error } = await supabase.from("chat_messages").insert({
      sender_id: user.id,
      receiver_id: adminProfile.id,
      content,
      expires_at: farFuture.toISOString(),
    });

    if (error) {
      toast.error("Failed to send message.");
      setInput(content);
    }
    setSending(false);
    inputRef.current?.focus();
  };

  const adminName = adminProfile?.full_name || adminProfile?.email || "Admin";
  const adminInitial = adminName.charAt(0).toUpperCase() || "A";

  // Determine what to show in the message area
  const renderMessages = () => {
    // Still fetching admin profile
    if (!adminFetched) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="space-y-3 text-center">
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center mx-auto animate-pulse">
              <MessageSquare className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="text-xs text-slate-400 font-medium">Connecting to admin...</p>
          </div>
        </div>
      );
    }

    // Admin not found
    if (adminFetched && !adminProfile) {
      return (
        <div className="flex flex-col items-center justify-center h-full space-y-3 text-center">
          <MessageSquare className="h-10 w-10 text-slate-200" />
          <p className="text-xs text-slate-400 font-medium">Admin is not available right now.</p>
        </div>
      );
    }

    // Loading messages
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="space-y-3 text-center">
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center mx-auto animate-pulse">
              <MessageSquare className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="text-xs text-slate-400 font-medium">Loading messages...</p>
          </div>
        </div>
      );
    }

    // Empty state — show welcome message + start prompt
    if (messages.length === 0) {
      return (
        <div className="flex flex-col h-full">
          {/* Static pinned welcome message */}
          <div className="pt-4 px-1">
            <WelcomeMessageBubble adminName={adminName} />
          </div>
          {/* Start conversation prompt */}
          <div className="flex flex-col items-center justify-center flex-1 space-y-3 pb-6">
            <div className="flex items-center justify-center gap-1.5">
              <Clock className="h-3 w-3 text-amber-500" />
              <span className="text-[10px] font-bold text-amber-500">Auto-deletes 5 min after seen</span>
            </div>
            <p className="text-xs text-slate-400 font-medium text-center max-w-xs">
              Reply to the admin or ask your own question below.
            </p>
          </div>
        </div>
      );
    }

    // Messages list — always show welcome message first
    return (
      <>
        {/* Static pinned welcome message — always visible */}
        <WelcomeMessageBubble adminName={adminName} />
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} isOwn={msg.sender_id === user?.id} />
        ))}
      </>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-4 px-5 py-4 bg-white/80 backdrop-blur-md border-b border-slate-100 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => nav({ to: "/student/projects" })}
          className="h-9 w-9 rounded-xl hover:bg-slate-100 text-slate-500"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {adminInitial}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900" style={{ fontFamily: "'Sora', sans-serif" }}>
              {adminName}
            </h2>
            <span className="text-[10px] font-bold text-emerald-600">Admin · Lakshay IQ</span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
            <Clock className="h-3 w-3 text-amber-500" />
            <span className="text-[10px] font-bold text-amber-600">Auto-deletes 5 min after seen</span>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold ${
            isConnected
              ? "bg-emerald-50 border border-emerald-200 text-emerald-600"
              : "bg-slate-50 border border-slate-200 text-slate-400"
          }`}>
            {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            <span className="hidden sm:inline">{isConnected ? "Live" : "Connecting..."}</span>
          </div>
        </div>
      </div>

      {/* Notification Permission Banner */}
      {notifPerm !== "granted" && notifPerm !== "denied" && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-50 border-b border-amber-200 shrink-0">
          <Bell className="h-4 w-4 text-amber-500 shrink-0" />
          <p className="text-xs font-medium text-amber-700 flex-1">
            Enable notifications to get alerted when admin replies
          </p>
          <button
            onClick={async () => {
              if ("Notification" in window) {
                const perm = await Notification.requestPermission();
                setNotifPerm(perm);
                if (perm === "granted") toast.success("Notifications enabled! 🔔");
              }
            }}
            className="text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded-lg transition-all shrink-0"
          >
            Enable
          </button>
        </div>
      )}
      {notifPerm === "denied" && (
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-100 shrink-0">
          <BellOff className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <p className="text-[10px] font-medium text-slate-400">
            Notifications blocked. Enable them in browser settings to get alerts.
          </p>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1 [scrollbar-width:thin] [scrollbar-color:rgba(0,0,0,0.1)_transparent]">
        {renderMessages()}
        <div ref={bottomRef} />
      </div>


      {/* Input Area */}
      <div className="px-4 py-4 bg-white/90 backdrop-blur-md border-t border-slate-100 shrink-0">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your message..."
            maxLength={2000}
            className="h-11 rounded-xl border-slate-200 bg-slate-50 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-400 text-sm pr-4 pl-4 font-medium placeholder:text-slate-400 transition-all"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || sending || !adminProfile?.id}
            className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-40 text-white shadow-md shadow-emerald-500/20 shrink-0 transition-all active:scale-95"
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[9px] text-slate-400 font-medium mt-2 text-center">
          🔒 Messages auto-delete 5 minutes after being seen
        </p>
      </div>
    </div>
  );
}
