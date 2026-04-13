"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icon } from "@/components/ui/icon";
import shared from "@/styles/shared.module.css";

type Role = "CONTRACTOR" | "CLIENT";
type Step = "role" | "details" | "check-email";

export default function SignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function selectRole(r: Role) {
    setRole(r);
    setStep("details");
  }

  async function handleGoogleSignUp() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role) return;
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, role },
      },
    });

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? "Failed to create account");
      setLoading(false);
      return;
    }

    // Email confirmation required — session won't exist yet
    if (!data.session) {
      setStep("check-email");
      setLoading(false);
      return;
    }

    // Email confirmation disabled — create DB user immediately
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, role }),
    });

    if (!res.ok) {
      setError("Failed to set up your account. Please try again.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  // Step: check email
  if (step === "check-email") {
    return (
      <main className={shared.authPage}>
        <div className={shared.authCard}>
          <div className={shared.authHeader}>
            <Link href="/" className={shared.authBrand}>VisiBill</Link>
            <h1 className={shared.authTitle}>Check your email</h1>
            <p className={shared.authSubtitle}>
              We sent a confirmation link to <strong>{email}</strong>. Click it
              to activate your account.
            </p>
          </div>
          <div className={shared.authBody}>
            <div className="flex flex-col items-center gap-3 py-4">
              <Icon name="mark_email_unread" className="text-5xl text-primary" />
              <p className="text-xs text-off-black/50 text-center leading-relaxed">
                Once confirmed, you&apos;ll be taken to your dashboard
                automatically.
              </p>
            </div>
          </div>
          <div className={shared.authFooter}>
            <p className={shared.authFooterText}>
              Already confirmed?{" "}
              <Link href="/sign-in" className={shared.authLink}>Sign in</Link>
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Step: role selection
  if (step === "role") {
    return (
      <main className={shared.authPage}>
        <div className={shared.authCard}>
          <div className={shared.authHeader}>
            <Link href="/" className={shared.authBrand}>VisiBill</Link>
            <h1 className={shared.authTitle}>Create your account</h1>
            <p className={shared.authSubtitle}>I am a...</p>
          </div>
          <div className={shared.authBody}>
            <button
              onClick={() => selectRole("CONTRACTOR")}
              className="w-full h-24 flex flex-col items-center justify-center gap-2 border border-off-black/10 rounded-xl hover:border-primary hover:bg-primary/5 transition-all"
            >
              <Icon name="construction" className="text-3xl" />
              <span className="text-base font-semibold">Contractor</span>
            </button>
            <button
              onClick={() => selectRole("CLIENT")}
              className="w-full h-24 flex flex-col items-center justify-center gap-2 border border-off-black/10 rounded-xl hover:border-primary hover:bg-primary/5 transition-all"
            >
              <Icon name="home" className="text-3xl" />
              <span className="text-base font-semibold">Client</span>
            </button>
          </div>
          <div className={shared.authFooter}>
            <p className={shared.authFooterText}>
              Already have an account?{" "}
              <Link href="/sign-in" className={shared.authLink}>Sign in</Link>
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Step: account details
  return (
    <main className={shared.authPage}>
      <div className={shared.authCard}>
        <div className={shared.authHeader}>
          <Link href="/" className={shared.authBrand}>VisiBill</Link>
          <h1 className={shared.authTitle}>Create your account</h1>
          <p className={shared.authSubtitle}>
            {role === "CONTRACTOR" ? "Signing up as a Contractor" : "Signing up as a Client"}
            {" · "}
            <button onClick={() => setStep("role")} className={shared.authLink}>
              Change
            </button>
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={shared.authBody}>
            {error && (
              <div className={shared.errorBanner}>
                <Icon name="error" className="text-destructive text-lg" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <button type="button" onClick={handleGoogleSignUp} className={shared.googleBtn}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 2.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <div className={shared.authDivider}>
              <span className={shared.authDividerLine} />
              <span>or</span>
              <span className={shared.authDividerLine} />
            </div>

            <div className={shared.fieldGroup}>
              <Label htmlFor="name" className={shared.fieldLabel}>Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className={shared.fieldGroup}>
              <Label htmlFor="email" className={shared.fieldLabel}>Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className={shared.fieldGroup}>
              <Label htmlFor="password" className={shared.fieldLabel}>Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>
          <div className={shared.authFooter}>
            <Button variant="pill" type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Sign Up"}
            </Button>
            <p className={shared.authFooterText}>
              Already have an account?{" "}
              <Link href="/sign-in" className={shared.authLink}>Sign in</Link>
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
