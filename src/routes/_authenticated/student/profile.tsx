
import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, useEffect } from "react";
import { Camera, Check, Loader2, Save, User, Mail, Calendar, Shield, AlertCircle } from "lucide-react";
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
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">

      {/* Toast Notifications */}
      <div className="fixed top-5 right-5 z-50 space-y-2 max-w-sm w-full">
        {successMessage && (
          <div className="bg-slate-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-xl border border-slate-800 flex items-center gap-2.5 animate-in slide-in-from-top-4">
            <div className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="h-3 w-3 stroke-[3]" />
            </div>
            <span>{successMessage}</span>
          </div>
        )}
        {error && (
          <div className="bg-rose-50 text-rose-700 text-sm font-semibold px-4 py-3 rounded-xl shadow-xl border border-rose-100 flex items-center gap-2.5 animate-in slide-in-from-top-4">
            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your digital student profile and credentials.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">

        {/* Left Card: Photo Management */}
        <div className="bg-white border border-slate-200/70 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
          <div className="relative">
            {/* Avatar Container */}
            <div className="h-24 w-24 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-inner flex items-center justify-center">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-slate-900 to-slate-800 text-emerald-400 text-3xl font-bold flex items-center justify-center">
                  {initials}
                </div>
              )}
            </div>

            {/* Spinner Overlay during Direct Upload */}
            {uploadingAvatar && (
              <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center backdrop-blur-[1px]">
                <Loader2 className="h-5 w-5 text-emerald-600 animate-spin" />
              </div>
            )}

            {/* Micro Floating Camera Action Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1.5 -right-1.5 h-7 w-7 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              title="Upload new image"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />

          <div className="mt-4">
            <h3 className="text-base font-bold text-slate-800 truncate max-w-[200px]">{displayName || "Student"}</h3>
            <p className="text-xs text-slate-400 truncate max-w-[200px] mt-0.5">{user?.email}</p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploadingAvatar}
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 w-full h-9 rounded-xl text-xs font-semibold text-slate-700 border-slate-200 bg-slate-50/50 hover:bg-slate-50"
          >
            {uploadingAvatar ? "Uploading..." : "Upload Photo"}
          </Button>
          <p className="text-[10px] text-slate-400 mt-2">JPEG or PNG under 5MB. Uploads instantly.</p>
        </div>

        {/* Right Card: Main Profile Forms */}
        <div className="md:col-span-2 space-y-6">

          {/* Personal Info Form */}
          <div className="bg-white border border-slate-200/70 rounded-2xl p-6 shadow-sm">
            <form onSubmit={handleSaveName} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="full-name" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="full-name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="pl-10 h-11 rounded-xl border-slate-200 focus-visible:ring-slate-900/5 focus-visible:border-slate-900 text-sm font-medium bg-slate-50/30"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={savingName || fullName === profile?.full_name}
                    className="h-11 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all shrink-0 shadow-sm"
                  >
                    {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                  </Button>
                </div>
              </div>
            </form>

            {/* Read-only System Fields */}
            <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    value={user?.email ?? ""}
                    readOnly
                    disabled
                    className="pl-10 h-11 rounded-xl border-slate-200 bg-slate-50/60 text-slate-400 font-medium cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Account Badges */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-slate-50/60 border border-slate-100 p-3 rounded-xl flex items-center gap-2.5">
                  <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">Joined</span>
                    <span className="text-xs font-bold text-slate-700 mt-1 block">
                      {profile?.created_at
                        ? new Date(profile.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
                        : "—"}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50/60 border border-slate-100 p-3 rounded-xl flex items-center gap-2.5">
                  <Shield className="h-4 w-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">Role</span>
                    <span className="text-xs font-bold text-slate-700 mt-1 block capitalize">Student</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}