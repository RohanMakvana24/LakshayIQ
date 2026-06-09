import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, useEffect } from "react";
import { Camera, Check, Loader2, User, Mail, Calendar, Shield, AlertCircle, Eye, EyeOff, Lock, Sparkles, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/student/profile")({
  component: StudentProfilePage,
});

function StudentProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Password change states
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const isEmailUser = user?.app_metadata?.provider === "email";

  // Sync state when profile loads
  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
  }, [profile]);

  const displayName = fullName || profile?.full_name || "";
  const initials = (displayName || user?.email || "U")[0].toUpperCase();

  /* ─── ⚡ INSTANT AVATAR UPLOAD FLOW ─── */
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    // Validation
    if (file.size > 5 * 1024 * 1024) {
      showStatus("Error: Image must be under 5 MB", true);
      return;
    }

    try {
      setUploadingAvatar(true);
      setError(null);

      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `avatars/${user.id}/avatar.${ext}`;

      // 1. Upload direct to Supabase Storage
      const { error: upErr } = await supabase.storage
        .from("university-assets")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (upErr) throw new Error("Storage error: " + upErr.message);

      // 2. Get Public URL with cache buster
      const { data } = supabase.storage.from("university-assets").getPublicUrl(path);
      const directPublicUrl = `${data.publicUrl}?t=${Date.now()}`;

      // 3. Immediately update the profiles table
      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ avatar_url: directPublicUrl })
        .eq("id", user.id);

      if (dbErr) throw new Error("Database error: " + dbErr.message);

      // 4. Refresh Context to update Sidebar & Header instantly
      await refreshProfile();
      showStatus("Profile picture updated instantly!");
    } catch (err: any) {
      showStatus(err.message || "Failed to update photo", true);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = ""; // Reset input
    }
  }

  /* ─── SAVE NAME FLOW ─── */
  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) return;

    try {
      setSavingName(true);
      setError(null);

      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", user.id);

      if (dbErr) throw new Error(dbErr.message);

      await refreshProfile();
      showStatus("Name updated successfully!");
    } catch (err: any) {
      showStatus(err.message || "Failed to save name", true);
    } finally {
      setSavingName(false);
    }
  }

  /* ─── CHANGE PASSWORD FLOW ─── */
  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) return;

    if (newPassword.length < 6) {
      showStatus("Password must be at least 6 characters long", true);
      return;
    }

    if (newPassword !== confirmPassword) {
      showStatus("Passwords do not match", true);
      return;
    }

    try {
      setUpdatingPassword(true);
      setError(null);

      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateErr) throw new Error(updateErr.message);

      showStatus("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      showStatus(err.message || "Failed to update password", true);
    } finally {
      setUpdatingPassword(false);
    }
  }

  // Helper to trigger autohide messages
  function showStatus(msg: string, isError = false) {
    if (isError) {
      setError(msg);
      setTimeout(() => setError(null), 4000);
    } else {
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  }

  return (
    <div className="w-full py-2 space-y-6 animate-in fade-in duration-300">

      {/* Floating Status Toast Notifications */}
      <div className="fixed top-6 right-6 z-50 space-y-2 max-w-sm w-full">
        {successMessage && (
          <div className="bg-slate-900 border border-slate-800 text-white text-xs font-bold px-4 py-3.5 rounded-xl shadow-xl flex items-center gap-2.5 animate-in slide-in-from-top-4">
            <div className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="h-3 w-3 stroke-[3]" />
            </div>
            <span>{successMessage}</span>
          </div>
        )}
        {error && (
          <div className="bg-rose-50 text-rose-700 text-xs font-bold px-4 py-3.5 rounded-xl shadow-xl border border-rose-100 flex items-center gap-2.5 animate-in slide-in-from-top-4">
            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Premium Profile Cover Header */}
      <div className="relative rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm">
        {/* Cover Banner */}
        <div className="relative h-32 md:h-44 w-full bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl" />
        </div>

        {/* Profile Details Bar */}
        <div className="px-6 pb-6 pt-16 relative flex flex-col md:flex-row md:items-end justify-between gap-4">
          
          {/* Avatar Placement (Overlaps Banner) */}
          <div className="absolute -top-12 left-6 h-24 w-24 rounded-2xl overflow-hidden bg-card border-4 border-card shadow-md flex items-center justify-center group">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-slate-900 to-slate-800 text-emerald-400 text-3xl font-extrabold flex items-center justify-center">
                {initials}
              </div>
            )}
            
            {uploadingAvatar && (
              <div className="absolute inset-0 bg-card/85 flex items-center justify-center backdrop-blur-[1px]">
                <Loader2 className="h-5 w-5 text-emerald-500 animate-spin" />
              </div>
            )}

            {/* Hover Trigger for Avatar Update */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200 text-white cursor-pointer"
            >
              <Camera className="h-5 w-5" />
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />

          {/* User Meta */}
          <div className="space-y-1">
            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
              {displayName || "Student"}
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/15 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                Active
              </span>
            </h2>
            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              {user?.email}
            </p>
          </div>

          {/* Upload Button Shortcut */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploadingAvatar}
            onClick={() => fileInputRef.current?.click()}
            className="h-9 rounded-xl text-xs font-bold text-foreground border-border bg-secondary hover:bg-secondary/80 self-start md:self-auto"
          >
            <Camera className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            Change Avatar
          </Button>

        </div>
      </div>

      {/* Main Grid Options */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left column: Academic Details Card */}
        <div className="space-y-6">
          <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.01)] space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5 text-emerald-500" />
              Academic Status
            </h3>

            <div className="space-y-3">
              <div className="bg-secondary/40 border border-border/40 p-3.5 rounded-xl flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Joined On</span>
                  <span className="text-xs font-extrabold text-foreground mt-1 block">
                    {profile?.created_at
                      ? new Date(profile.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                      : "—"}
                  </span>
                </div>
              </div>

              <div className="bg-secondary/40 border border-border/40 p-3.5 rounded-xl flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Account Role</span>
                  <span className="text-xs font-extrabold text-foreground mt-1 block capitalize">
                    {profile?.role ?? "Student"}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground text-center pt-2 leading-relaxed">
              Account status is verified. To change your registered email, contact campus administration.
            </p>
          </div>
        </div>

        {/* Right column: Form Editors */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Personal Name Form Card */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.01)] space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-emerald-500" />
              Personal Profile
            </h3>

            <form onSubmit={handleSaveName} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="full-name" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Full Name
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="full-name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="pl-10 h-10 rounded-xl border-border focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 text-sm font-bold bg-secondary/35"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={savingName || fullName === profile?.full_name}
                    className="h-10 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-extrabold text-xs uppercase tracking-wider transition-all shrink-0 shadow-md"
                  >
                    {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                  </Button>
                </div>
              </div>
            </form>
          </div>

          {/* Password Change Form Card */}
          {isEmailUser && (
            <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.01)] space-y-4">
              <div className="border-b border-border/50 pb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-emerald-500" />
                  Credentials Security
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-bold uppercase tracking-wider">Update security password keys</p>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="new-password" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="pl-10 pr-10 h-10 rounded-xl border-border focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 text-sm font-bold bg-secondary/35"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirm-password" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="pl-10 pr-10 h-10 rounded-xl border-border focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 text-sm font-bold bg-secondary/35"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    disabled={updatingPassword || !newPassword || !confirmPassword}
                    className="h-10 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2"
                  >
                    {updatingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Update Password</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}