import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, ShieldBan, ShieldCheck, UserCog, Trash2, Edit3, Loader2, ShieldAlert, Mail, Calendar, Activity, Radio, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Row { 
  id: string; 
  full_name: string | null; 
  email: string | null; 
  role: "admin" | "student"; 
  created_at: string 
}

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({ meta: [{ title: "Users Console — Lakshay IQ" }] }),
  component: UsersPage,
});

function UsersPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  
  // Realtime Active Logged In Users State Storage
  const [activeUserIds, setActiveUserIds] = useState<string[]>([]);

  // Modal Control States
  const [selectedUser, setSelectedUser] = useState<Row | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const nav = useNavigate();

  // Edit Buffer Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  // 1. Core Data Hydration Engine
  const load = async () => {
    try {
      setLoading(true);
      const { data: profiles, error: pError } = await supabase
        .from("profiles")
        .select("id, full_name, email, created_at")
        .order("created_at", { ascending: false });

      if (pError) throw pError;

      const { data: roles, error: rError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rError) throw rError;

      const map = new Map(roles?.map(r => [r.user_id, r.role]));
      
      setRows((profiles ?? []).map(p => ({ 
        ...p, 
        role: (map.get(p.id) as "admin" | "student") ?? "student" 
      })));
    } catch (err: any) {
      toast.error(err.message || "Failed to load directory telemetry.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Supabase Realtime Presence Synchronizer System
  useEffect(() => {
    load();

    // Initialize global presence synchronization stream channel
    const presenceChannel = supabase.channel("online-users", {
      config: { presence: { key: "user_session" } }
    });

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        const detectedIds: string[] = [];
        
        // Loop through current socket bundles and collect active profile keys
        Object.keys(state).forEach((key) => {
          const sessions = state[key] as any[];
          sessions.forEach((session) => {
            if (session.user_id) detectedIds.push(session.user_id);
          });
        });
        
        // Update live tracking node states
        setActiveUserIds(Array.from(new Set(detectedIds)));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // Extract logged in user credentials context to announce availability
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await presenceChannel.track({
              user_id: user.id,
              online_at: new Date().toISOString(),
            });
          }
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, []);

  // 3. Dynamic RBAC Role Alternator Pipeline (Promote / Demote)
  const handleToggleRole = async (r: Row) => {
    const nextRole = r.role === "admin" ? "student" : "admin";
    if (!confirm(`Are you sure you want to change clearance for "${r.full_name || r.email}" to ${nextRole.toUpperCase()}?`)) return;

    try {
      await supabase.from("user_roles").delete().eq("user_id", r.id);
      const { error } = await supabase.from("user_roles").insert({ user_id: r.id, role: nextRole });
      if (error) throw error;

      toast.success(`Account clearance mapped to ${nextRole.toUpperCase()}`);
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // 4. User Identity Modification Layer
  const handleInitializeEdit = (user: Row) => {
    setSelectedUser(user);
    setFullName(user.full_name || "");
    setEmail(user.email || "");
    setIsEditOpen(true);
  };

  const handleCommitProfileChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !email.trim()) return;

    try {
      setUpdating(true);
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim() || null, email: email.trim() })
        .eq("id", selectedUser.id);

      if (error) throw error;

      toast.success("Profile records synchronized successfully.");
      setIsEditOpen(false);
      load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  };

  // 5. Critical Cascade Entry Eraser (Delete Action)
  const handlePurgeUserRecord = async (user: Row) => {
    if (!confirm(`CRITICAL:\nAre you sure you want to delete user: "${user.full_name || user.email}"?`)) return;

    try {
      await supabase.from("user_roles").delete().eq("user_id", user.id);
      const { error } = await supabase.from("profiles").delete().eq("id", user.id);
      if (error) throw error;

      toast.success("Account logs wiped cleanly from core databases.");
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filtered = rows.filter(r =>
    !q || 
    r.email?.toLowerCase().includes(q.toLowerCase()) || 
    r.full_name?.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="w-full space-y-5 pb-6 max-w-full antialiased">
      
      {/* Top Header Layout Block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-neutral-100 pb-5 gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 mb-0.5">
            <div className="h-4 w-4 rounded bg-neutral-900 flex items-center justify-center text-[9px] text-white font-bold font-mono">U</div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Security Control</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">User Control Center</h1>
          <p className="text-xs text-neutral-400">Manage directory records and audit realtime active sessions.</p>
        </div>

        {/* Live Counters Micro Bento-Widget */}
        <div className="flex flex-wrap items-center gap-2 bg-neutral-50 border border-neutral-200/60 p-1.5 rounded-xl text-[11px] font-medium font-mono text-neutral-500">
          <span className="px-2 py-0.5 bg-white border border-neutral-100 shadow-sm rounded-lg text-neutral-800 font-bold">
            Total: {rows.length}
          </span>
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg font-bold flex items-center gap-1 animate-pulse">
            <Radio className="h-3 w-3 text-emerald-600" /> Active: {activeUserIds.length}
          </span>
        </div>
      </div>

      {/* Primary Data Card Grid Frame */}
      <Card className="p-4 border-slate-200 dark:border-zinc-800 shadow-sm rounded-lg bg-white dark:bg-zinc-900 space-y-4">
        
        {/* Dynamic Filter Search Box Input */}
        <div className="relative max-w-md w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-zinc-550 stroke-[2.2]" />
          <Input 
            value={q} 
            onChange={(e) => setQ(e.target.value)} 
            placeholder="Search credentials by identity name or email address..." 
            className="pl-9 h-9 border-slate-200 dark:border-zinc-800 rounded-lg text-xs focus-visible:ring-0 bg-white dark:bg-zinc-900 dark:text-white"
          />
        </div>

        {/* High Precision Desktop Identity Ledger Frame */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-zinc-800 -mx-1">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-zinc-900/50 border-b border-slate-200 dark:border-zinc-800 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">
                  <th className="py-3 px-4 font-bold">User Identity Profile</th>
                  <th className="py-3 px-4 font-bold">Electronic Mail Box</th>
                  <th className="py-3 px-4 font-bold">Platform Status</th>
                  <th className="py-3 px-4 font-bold">System Clearance</th>
                  <th className="py-3 px-4 font-bold">Registration Timestamp</th>
                  <th className="py-3 px-4 text-right font-bold">Operations Matrix</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-850/85 text-xs">
                {filtered.map((r) => {
                  const isUserOnline = activeUserIds.includes(r.id);

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/45 dark:hover:bg-zinc-850/30 transition-colors group">
                      
                      {/* User Avatar & Identity Details Block */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-900 dark:bg-zinc-850 text-[11px] font-extrabold font-mono text-white shadow-sm">
                              {(r.full_name || r.email || "U").charAt(0).toUpperCase()}
                            </div>
                            {/* Realtime Live Broadcast Green Signal Indicator Ring Overlay */}
                            {isUserOnline && (
                              <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-white"></span>
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col text-left">
                            <span className="font-extrabold text-slate-900 dark:text-white tracking-tight">{r.full_name ?? "—"}</span>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {r.id.substring(0, 8)}</span>
                          </div>
                        </div>
                      </td>

                      {/* Mailing Credentials String */}
                      <td className="py-3.5 px-4 text-slate-500 dark:text-zinc-400 whitespace-nowrap font-semibold text-left">
                        {r.email}
                      </td>

                      {/* Live Streaming Presence Track Session Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-left">
                        {isUserOnline ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-0.5">
                            <Activity className="h-2.5 w-2.5" /> Online Now
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-450 dark:text-zinc-500 font-bold uppercase tracking-wider">
                            Offline
                          </span>
                        )}
                      </td>

                      {/* Authorization Role Clearance Matrix */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-left">
                        <Badge 
                          variant="outline"
                          className={cn(
                            "text-[9px] font-mono font-black uppercase tracking-widest rounded-lg px-2.5 py-0.5 border shadow-none",
                            r.role === "admin" 
                              ? "text-violet-750 bg-violet-100 dark:bg-violet-950/40 dark:text-violet-400 border-violet-200/20" 
                              : "text-slate-500 bg-slate-50 dark:bg-zinc-950 dark:text-zinc-400 border-slate-200 dark:border-zinc-800"
                          )}
                        >
                          {r.role}
                        </Badge>
                      </td>

                      {/* Core Registration Metric Date */}
                      <td className="py-3.5 px-4 text-slate-450 dark:text-zinc-450 whitespace-nowrap font-mono text-[11px] text-left">
                        {new Date(r.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </td>

                      {/* Management Trigger Action Call Matrix Controls */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className={cn(
                              "h-7 text-[10px] font-black uppercase tracking-wider rounded-lg gap-1 transition-all border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950",
                              r.role === "admin" ? "text-amber-600 hover:bg-amber-100/50" : "text-slate-700 dark:text-zinc-300 hover:bg-slate-105"
                            )}
                            onClick={() => handleToggleRole(r)}
                          >
                            {r.role === "admin" ? (
                              <><ShieldBan className="h-3 w-3 stroke-[2.5]" /> Demote</>
                            ) : (
                              <><ShieldCheck className="h-3 w-3 stroke-[2.5]" /> Promote</>
                            )}
                          </Button>

                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-7 w-7 text-slate-400 hover:text-slate-900 rounded-lg transition-colors border border-slate-200 dark:border-zinc-800"
                            onClick={() => handleInitializeEdit(r)}
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>

                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-7 w-7 text-slate-400 hover:text-rose-600 rounded-lg transition-colors border border-slate-200 dark:border-zinc-800"
                            onClick={() => handlePurgeUserRecord(r)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>

                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center p-6 bg-white dark:bg-zinc-900 rounded-lg">
                      <div className="flex flex-col items-center justify-center">
                        <ShieldAlert className="h-5 w-5 text-slate-300 dark:text-zinc-650 mb-2" />
                        <h4 className="text-xs font-semibold text-slate-400 dark:text-zinc-500">No identity matches filtered lookup fields.</h4>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Edit Profile Schema Form Drawer Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[440px] w-[95vw] rounded-2xl border-neutral-200 bg-white p-5 shadow-2xl focus:outline-none overflow-hidden">
          <DialogHeader className="space-y-1 pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-1.5 text-neutral-400 mb-0.5">
              <UserCog className="h-3.5 w-3.5" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Identity Records Schema</span>
            </div>
            <DialogTitle className="text-base font-bold text-neutral-900 tracking-tight">Modify Identity Properties</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCommitProfileChanges} className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-neutral-700">User Profile Full Name</Label>
              <Input 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
                className="h-9 border-neutral-200 rounded-xl text-xs focus-visible:ring-0 bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-neutral-700 flex items-center gap-1">
                <Mail className="h-3 w-3 text-neutral-400" />
                <span>Primary Electronic Mail Address *</span>
              </Label>
              <Input 
                type="email" required value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="h-9 border-neutral-200 rounded-xl text-xs focus-visible:ring-0 bg-white"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-neutral-100 flex flex-row items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="rounded-xl text-xs font-semibold h-9 px-4">
                Cancel
              </Button>
              <Button type="submit" disabled={updating || !email.trim()} className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-xl text-xs font-semibold h-9 px-5 shadow-sm">
                {updating ? "Synchronizing..." : "Update Identity"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}