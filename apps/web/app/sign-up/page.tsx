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
            <Link href="/" className={shared.authBrand}>ProjectPay</Link>
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
            <Link href="/" className={shared.authBrand}>ProjectPay</Link>
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
          <Link href="/" className={shared.authBrand}>ProjectPay</Link>
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
