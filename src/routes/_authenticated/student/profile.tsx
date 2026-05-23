import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Camera, Check, Loader2, Save, User, Mail, Calendar, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/student/profile")({
  component: StudentProfilePage,
});

function StudentProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync when profile loads from context
  const displayName = fullName || profile?.full_name || "";
  const currentAvatar = avatarPreview ?? profile?.avatar_url ?? null;
  const initials = (displayName || user?.email || "U")[0].toUpperCase();

  /* ─── Handle avatar file pick ─── */
  function handleAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError(null);
  }

  /* ─── Upload avatar to Supabase Storage ─── */
  async function uploadAvatar(userId: string): Promise<string | null> {
    if (!avatarFile) return null;
    setUploadingAvatar(true);
    const ext = avatarFile.name.split(".").pop() ?? "jpg";
    const path = `avatars/${userId}/avatar.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("university-assets")
      .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });

    setUploadingAvatar(false);

    if (upErr) {
      setError("Failed to upload image: " + upErr.message);
      return null;
    }

    const { data } = supabase.storage.from("university-assets").getPublicUrl(path);
    // Append cache-buster to force image refresh
    return data.publicUrl + `?t=${Date.now()}`;
  }

  /* ─── Save profile ─── */
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) return;
    setSaving(true);
    setError(null);

    let newAvatarUrl: string | null | undefined = undefined;

    if (avatarFile) {
      newAvatarUrl = await uploadAvatar(user.id);
      if (newAvatarUrl === null) {
        setSaving(false);
        return;
      }
    }

    const updates: { full_name: string; avatar_url?: string } = { full_name: fullName };
    if (newAvatarUrl !== undefined) updates.avatar_url = newAvatarUrl;

    const { error: dbErr } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);

    setSaving(false);

    if (dbErr) {
      setError("Failed to save profile: " + dbErr.message);
      return;
    }

    // Refresh auth context so sidebar & header update
    await refreshProfile();
    setAvatarFile(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your personal information and profile picture
        </p>
      </div>

      {/* ── Profile Card ── */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Avatar Section */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Decorative banner */}
          <div className="h-28 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15)_0%,_transparent_60%)]" />
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white/10 to-transparent" />
          </div>

          <div className="px-6 pb-6 -mt-14 flex flex-col sm:flex-row sm:items-end gap-4">
            {/* Avatar */}
            <div className="relative shrink-0 group">
              <div className="h-24 w-24 rounded-2xl overflow-hidden ring-4 ring-white shadow-lg bg-slate-100">
                {currentAvatar ? (
                  <img
                    src={currentAvatar}
                    alt={displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-emerald-400 text-3xl font-black">
                    {initials}
                  </div>
                )}
              </div>

              {/* Camera overlay */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                ) : (
                  <Camera className="h-6 w-6 text-white drop-shadow" />
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarPick}
                className="hidden"
                id="avatar-upload"
              />
            </div>

            {/* Name + email preview */}
            <div className="flex-1 mt-2 sm:mt-0 sm:mb-1">
              <p className="text-lg font-bold text-slate-900">{displayName || "Your Name"}</p>
              <p className="text-sm text-slate-500">{user?.email}</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                <Camera className="h-3 w-3" />
                Change photo
              </button>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <User className="h-4 w-4 text-emerald-500" />
            Personal Information
          </h2>

          {/* Full Name */}
          <div className="space-y-1.5">
            <label htmlFor="full-name" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Full Name
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="full-name"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); setSaved(false); }}
                placeholder="Enter your full name"
                className="pl-10 h-11 rounded-xl border-slate-200 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 bg-slate-50/40"
              />
            </div>
          </div>

          {/* Email (read-only) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={user?.email ?? ""}
                readOnly
                disabled
                className="pl-10 h-11 rounded-xl border-slate-200 bg-slate-100/60 text-slate-500 cursor-not-allowed"
              />
            </div>
            <p className="text-[11px] text-slate-400">Email address cannot be changed</p>
          </div>

          {/* Account info row */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Member Since</span>
              </div>
              <p className="text-sm font-semibold text-slate-700">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
                  : "—"}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Role</span>
              </div>
              <p className="text-sm font-semibold text-slate-700 capitalize">Student</p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-600 font-medium">
            {error}
          </div>
        )}

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium animate-in fade-in duration-300">
              <Check className="h-4 w-4" />
              Profile saved!
            </span>
          )}
          <Button
            type="submit"
            disabled={saving || uploadingAvatar}
            className={cn(
              "h-10 px-6 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm",
              saved
                ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                : "bg-slate-900 hover:bg-slate-800 text-white"
            )}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : saved ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Saved!
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
