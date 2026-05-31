import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Send, MessageSquare, Wifi, WifiOff, Clock, User, Search, CheckCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/chat")({
  head: () => ({ meta: [{ title: "Messages — Admin · Lakshay IQ" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    userId: typeof search.userId === "string" ? search.userId : undefined,
  }),
  component: AdminChatPage,
});

// Default Gujarati outreach message
const DEFAULT_MESSAGE = "🎓 શું તમારે Final Year નો Project જોઈએ છે? Documents સાથે! 📄✨";

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  expires_at: string;
  is_read: boolean;
}

interface StudentConvo {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  lastMessage?: string;
  lastAt?: string;
  unreadCount: number;
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
    <div className={`flex items-end gap-2 mb-3 ${isOwn ? "flex-row-reverse" : "flex-row"}`} style={{ opacity }}>
      {!isOwn && (
        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shrink-0">
          <User className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      <div className={`max-w-[72%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
        <div className={`px-3.5 py-2.5 rounded-2xl text-sm font-medium leading-relaxed shadow-sm ${
          isOwn
            ? "bg-gradient-to-br from-violet-600 to-purple-700 text-white rounded-br-sm"
            : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
        }`}>
          {msg.content}
        </div>
        <div className={`flex items-center gap-1 mt-1 text-[10px] font-medium ${isOwn ? "flex-row-reverse" : ""} ${isUrgent ? "text-rose-500" : "text-slate-400"}`}>
          <Clock className="w-2.5 h-2.5" />
          <span>{isUrgent ? `Deletes in ${timeStr}` : timeStr}</span>
          {isOwn && <CheckCheck className="w-3 h-3 text-violet-400" />}
        </div>
      </div>
    </div>
  );
}

function AdminChatPage() {
  const { user } = useAuth();
  const { userId: initialUserId } = useSearch({ from: "/_authenticated/admin/chat" });

  const [students, setStudents] = useState<StudentConvo[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(initialUserId ?? null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [searchQ, setSearchQ] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // Push notifications for incoming student messages
  usePushNotifications((senderId, content, senderName) => {
    if (senderId !== selectedStudentId) {
      toast.message(`💬 ${senderName ?? "Student"}`, { description: content });
      setStudents((prev) =>
        prev.map((s) =>
          s.id === senderId
            ? { ...s, unreadCount: s.unreadCount + 1, lastMessage: content, lastAt: new Date().toISOString() }
            : s
        )
      );
    }
  });

  // Load all students via SECURITY DEFINER RPC (bypasses RLS)
  const loadStudents = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Use RPC function to get all students (avoids RLS recursion)
      const { data: studentProfiles, error } = await supabase.rpc("get_students");

      if (error) {
        console.error("Failed to load students:", error);
        return;
      }

      const profiles = (studentProfiles ?? []) as { id: string; full_name: string | null; email: string | null; avatar_url: string | null }[];

      // Get unread message counts
      const { data: unreadMsgs } = await supabase
        .from("chat_messages")
        .select("sender_id")
        .eq("receiver_id", user.id)
        .eq("is_read", false)
        .gte("expires_at", new Date().toISOString());

      // Get last message per student
      const { data: latestMsgs } = await supabase
        .from("chat_messages")
        .select("sender_id, receiver_id, content, created_at")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      const unreadMap: Record<string, number> = {};
      (unreadMsgs ?? []).forEach((m) => {
        unreadMap[m.sender_id] = (unreadMap[m.sender_id] ?? 0) + 1;
      });

      const lastMsgMap: Record<string, { content: string; at: string }> = {};
      (latestMsgs ?? []).forEach((m) => {
        const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
        if (!lastMsgMap[otherId]) lastMsgMap[otherId] = { content: m.content, at: m.created_at };
      });

      // --- AUTO-REPAIR MISSING STUDENT ROLES ---
      // If there are participants with active chats who aren't returned by get_students()
      // (e.g. they registered before trigger was active or their role row is missing),
      // auto-assign them the 'student' role so they automatically show up.
      const profileIds = new Set(profiles.map((p) => p.id));
      const missingStudentIds: string[] = [];

      (latestMsgs ?? []).forEach((m) => {
        const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
        if (otherId !== user.id && !profileIds.has(otherId) && !missingStudentIds.includes(otherId)) {
          missingStudentIds.push(otherId);
        }
      });

      (unreadMsgs ?? []).forEach((m) => {
        const otherId = m.sender_id;
        if (otherId !== user.id && !profileIds.has(otherId) && !missingStudentIds.includes(otherId)) {
          missingStudentIds.push(otherId);
        }
      });

      if (missingStudentIds.length > 0) {
        await Promise.all(
          missingStudentIds.map(async (id) => {
            try {
              await supabase.from("user_roles").insert({
                user_id: id,
                role: "student",
              });
            } catch (e) {
              console.error("Failed to auto-assign student role for ID:", id, e);
            }
          })
        );
        // Re-trigger loadStudents to include newly roles-assigned users
        setTimeout(() => {
          loadStudents();
        }, 100);
        return;
      }
      // --- END OF AUTO-REPAIR LOGIC ---

      const convos: StudentConvo[] = profiles.map((p) => ({
        ...p,
        lastMessage: lastMsgMap[p.id]?.content,
        lastAt: lastMsgMap[p.id]?.at,
        unreadCount: unreadMap[p.id] ?? 0,
      }));

      // Sort: students with messages first, then alphabetical
      convos.sort((a, b) => {
        if (a.lastAt && b.lastAt) return new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime();
        if (a.lastAt) return -1;
        if (b.lastAt) return 1;
        return (a.full_name ?? "").localeCompare(b.full_name ?? "");
      });

      setStudents(convos);
      setTotalUnread(Object.values(unreadMap).reduce((a, b) => a + b, 0));
    } finally {
      setLoadingStudents(false);
    }
  }, [user?.id]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  // Fallback: if admin comes from a notification and the student
  // is not in the registered list (e.g. no student role row),
  // auto-assign role and load them into the sidebar.
  useEffect(() => {
    if (!initialUserId || loadingStudents) return;
    const alreadyInList = students.find((s) => s.id === initialUserId);
    if (alreadyInList) return;

    (async () => {
      try {
        await supabase.from("user_roles").insert({
          user_id: initialUserId,
          role: "student",
        });
      } catch (e) {
        // Ignore duplicate role inserts
      }
      loadStudents();
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUserId, loadingStudents]);

  // Load messages for selected student
  const loadMessages = useCallback(async () => {
    if (!user?.id || !selectedStudentId) return;
    setLoadingMsgs(true);
    try {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${selectedStudentId}),and(sender_id.eq.${selectedStudentId},receiver_id.eq.${user.id})`
        )
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: true });

      setMessages((data ?? []) as ChatMessage[]);

      // Mark student messages as read
      const unread = (data ?? []).filter((m) => m.sender_id === selectedStudentId && !m.is_read);
      if (unread.length > 0) {
        await supabase
          .from("chat_messages")
          .update({ is_read: true })
          .eq("receiver_id", user.id)
          .eq("sender_id", selectedStudentId)
          .eq("is_read", false);
        setStudents((prev) =>
          prev.map((s) => s.id === selectedStudentId ? { ...s, unreadCount: 0 } : s)
        );
      }
    } finally {
      setLoadingMsgs(false);
    }
  }, [user?.id, selectedStudentId]);

  useEffect(() => { if (selectedStudentId) loadMessages(); }, [selectedStudentId, loadMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const uniqueId = Math.random().toString(36).substring(2, 11);
    const channel = supabase
      .channel(`admin-chat-${user.id}-${uniqueId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const msg = payload.new as ChatMessage;
          if (msg.receiver_id === user.id || msg.sender_id === user.id) {
            const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
            if (otherId === selectedStudentId) {
              setMessages((prev) => {
                if (prev.find((m) => m.id === msg.id)) return prev;
                return [...prev, msg];
              });
              if (msg.sender_id !== user.id) {
                supabase.from("chat_messages").update({ is_read: true }).eq("id", msg.id);
              }
            }
            loadStudents();
          }
        }
      )
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "chat_messages" },
        (payload) => {
          const old = payload.old as { id: string };
          setMessages((prev) => prev.filter((m) => m.id !== old.id));
        }
      )
      .subscribe((status) => setIsConnected(status === "SUBSCRIBED"));

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); channelRef.current = null; };
  }, [user?.id, selectedStudentId, loadStudents]);

  // Auto-scroll
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Client-side expiry cleanup
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setMessages((prev) => prev.filter((m) => new Date(m.expires_at).getTime() > now));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || !user?.id || !selectedStudentId || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);
    const { error } = await supabase.from("chat_messages").insert({
      sender_id: user.id,
      receiver_id: selectedStudentId,
      content,
    });
    if (error) { toast.error("Failed to send message."); setInput(content); }
    setSending(false);
    inputRef.current?.focus();
  };

  const filteredStudents = students.filter((s) =>
    !searchQ ||
    s.full_name?.toLowerCase().includes(searchQ.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchQ.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">

      {/* Left Sidebar — Student List */}
      <div className="w-72 shrink-0 flex flex-col border-r border-slate-100 bg-slate-50/50">
        {/* Sidebar Header */}
        <div className="px-4 py-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-extrabold text-slate-900" style={{ fontFamily: "'Sora', sans-serif" }}>Students</h2>
            {totalUnread > 0 && (
              <Badge className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">{totalUnread}</Badge>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <Input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search students..."
              className="pl-9 h-8 text-xs bg-white border-slate-200 rounded-xl focus-visible:ring-0"
            />
          </div>
        </div>

        {/* Student List */}
        <div className="flex-1 overflow-y-auto py-1 [scrollbar-width:thin]">
          {loadingStudents ? (
            <div className="flex items-center justify-center h-20">
              <div className="h-5 w-5 rounded-full border-2 border-violet-300 border-t-violet-600 animate-spin" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center px-4">
              <User className="h-8 w-8 text-slate-200 mb-2" />
              <p className="text-xs text-slate-400 font-medium">
                {searchQ ? "No students match search" : "No students registered yet"}
              </p>
            </div>
          ) : (
            filteredStudents.map((s) => {
              const initial = (s.full_name || s.email || "S").charAt(0).toUpperCase();
              const isSelected = s.id === selectedStudentId;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedStudentId(s.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150 hover:bg-white/80 border-b border-slate-100/60 last:border-0",
                    isSelected ? "bg-white shadow-sm" : ""
                  )}
                >
                  <div className="relative shrink-0">
                    <div className={cn(
                      "h-9 w-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm",
                      isSelected ? "bg-gradient-to-br from-violet-500 to-purple-600" : "bg-gradient-to-br from-sky-400 to-blue-500"
                    )}>
                      {initial || "S"}
                    </div>
                    {s.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 text-white text-[8px] font-extrabold flex items-center justify-center border border-white">
                        {s.unreadCount > 9 ? "9+" : s.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-xs font-bold truncate", isSelected ? "text-violet-700" : "text-slate-800")}>
                      {s.full_name ?? s.email ?? "Unknown"}
                    </p>
                    {s.lastMessage ? (
                      <p className="text-[10px] text-slate-400 truncate font-medium mt-0.5">{s.lastMessage}</p>
                    ) : (
                      <p className="text-[10px] text-slate-300 font-medium mt-0.5">No messages yet</p>
                    )}
                  </div>
                  {s.unreadCount > 0 && (
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right — Conversation Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selectedStudentId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/30">
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center mx-auto mb-5 shadow-sm">
              <MessageSquare className="h-10 w-10 text-violet-500" />
            </div>
            <h3 className="text-base font-extrabold text-slate-700 mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>Select a Student</h3>
            <p className="text-xs text-slate-400 font-medium max-w-xs">Choose a student from the left panel to view and respond to their messages.</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 px-5 py-4 bg-white border-b border-slate-100 shrink-0">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                {(selectedStudent?.full_name || selectedStudent?.email || "S").charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900" style={{ fontFamily: "'Sora', sans-serif" }}>
                  {selectedStudent?.full_name ?? selectedStudent?.email ?? "Student"}
                </h3>
                <p className="text-[10px] font-medium text-slate-400">{selectedStudent?.email}</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                  <Clock className="h-3 w-3 text-amber-500" />
                  <span className="text-[10px] font-bold text-amber-600">2-min expiry</span>
                </div>
                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                  isConnected ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-slate-50 text-slate-400 border border-slate-200"
                }`}>
                  {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                  <span className="hidden sm:inline">{isConnected ? "Live" : "..."}</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-5 bg-slate-50/30 [scrollbar-width:thin]">
              {loadingMsgs ? (
                <div className="flex items-center justify-center h-full">
                  <div className="h-5 w-5 rounded-full border-2 border-violet-300 border-t-violet-600 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                  <MessageSquare className="h-8 w-8 text-slate-200" />
                  <p className="text-xs text-slate-400 font-medium">No active messages. Start the conversation!</p>
                  {/* Default message suggestion */}
                  <button
                    onClick={() => setInput(DEFAULT_MESSAGE)}
                    className="flex items-center gap-2 mt-2 bg-violet-50 border border-violet-200 hover:bg-violet-100 text-violet-700 text-[11px] font-bold px-4 py-2.5 rounded-xl transition-all active:scale-95 max-w-xs text-center"
                  >
                    <Sparkles className="h-3.5 w-3.5 shrink-0 text-violet-500" />
                    <span>Send Default Message</span>
                  </button>
                </div>
              ) : (
                messages.map((msg) => (
                  <MessageBubble key={msg.id} msg={msg} isOwn={msg.sender_id === user?.id} />
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-5 py-4 bg-white border-t border-slate-100 shrink-0">
              {/* Default message quick-send chip */}
              <div className="mb-2">
                <button
                  onClick={() => setInput(DEFAULT_MESSAGE)}
                  className="inline-flex items-center gap-1.5 bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 hover:border-violet-400 text-violet-700 text-[10px] font-bold px-3 py-1.5 rounded-full transition-all active:scale-95 group"
                >
                  <Sparkles className="h-3 w-3 text-violet-400 group-hover:text-violet-600" />
                  🎓 Project Message (Gujarati)
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder={`Reply to ${selectedStudent?.full_name?.split(" ")[0] ?? "student"}...`}
                  maxLength={2000}
                  className="h-11 rounded-xl border-slate-200 bg-slate-50 focus-visible:ring-violet-500/30 focus-visible:border-violet-400 text-sm font-medium placeholder:text-slate-400"
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  size="icon"
                  className="h-11 w-11 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 disabled:opacity-40 text-white shadow-md shadow-violet-500/20 shrink-0 transition-all active:scale-95"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[9px] text-slate-400 text-center mt-2">Messages auto-delete after 2 minutes · Ephemeral Chat System</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
