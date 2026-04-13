"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icon } from "@/components/ui/icon";
import shared from "@/styles/shared.module.css";

type Role = "CONTRACTOR" | "CLIENT";

export default function SignInPage() {
  const router = useRouter();
  const [step, setStep] = useState<"role" | "credentials">("role");
  const [role, setRole] = useState<Role | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function selectRole(r: Role) {
    setRole(r);
    setStep("credentials");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (step === "role") {
    return (
      <main className={shared.authPage}>
        <div className={shared.authCard}>
          <div className={shared.authHeader}>
            <Link href="/" className={shared.authBrand}>Visibill</Link>
            <h1 className={shared.authTitle}>Sign in</h1>
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
              Don&apos;t have an account?{" "}
              <Link href="/sign-up" className={shared.authLink}>Sign up</Link>
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={shared.authPage}>
      <div className={shared.authCard}>
        <div className={shared.authHeader}>
          <Link href="/" className={shared.authBrand}>Visibill</Link>
          <h1 className={shared.authTitle}>Sign in</h1>
          <p className={shared.authSubtitle}>
            {role === "CONTRACTOR" ? "Signing in as a Contractor" : "Signing in as a Client"}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          <div className={shared.authFooter}>
            <Button variant="pill" type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            <p className={shared.authFooterText}>
              Don&apos;t have an account?{" "}
              <Link href="/sign-up" className={shared.authLink}>Sign up</Link>
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
