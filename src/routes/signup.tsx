import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { GraduationCap, Loader2 } from "lucide-react";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — Lakshay IQ" }] }),
  component: Signup,
});

function Signup() {
  const { user, role, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user && role) {
      nav({ to: role === "admin" ? "/admin" : "/student" });
    }
  }, [user, role, authLoading, nav]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName },
      },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Account created! Please check your email to confirm, then log in.", { duration: 6000 });
    nav({ to: "/login" });
  };

  const onGoogle = async () => {
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res.error) toast.error("Could not sign in with Google");
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-elegant">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-bold">Lakshay IQ</span>
          </Link>
          <h1 className="font-display text-3xl font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Free forever for students.</p>

          <Button onClick={onGoogle} variant="outline" className="mt-6 w-full">Continue with Google</Button>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> OR <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Lakshay Sharma" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@university.edu" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="At least 6 characters" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="font-medium text-primary hover:underline">Log in</Link>
          </p>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Want admin access? Sign up first, then ask an existing admin to upgrade your role.
          </p>
        </div>
      </div>

      <div className="hidden bg-gradient-primary p-12 md:flex md:flex-col md:justify-between">
        <div />
        <div className="text-primary-foreground">
          <h2 className="font-display text-4xl font-bold leading-tight">Your semester, sorted.</h2>
          <p className="mt-3 max-w-md text-primary-foreground/85">
            Notes, PYQs and important questions — beautifully organised by university, semester, and subject.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/70">© {new Date().getFullYear()} Lakshay IQ</p>
      </div>
    </div>
  );
}
