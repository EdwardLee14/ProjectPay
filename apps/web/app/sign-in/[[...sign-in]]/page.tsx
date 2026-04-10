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

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className={shared.authPage}>
      <div className={shared.authCard}>
        <div className={shared.authHeader}>
          <Link href="/" className={shared.authBrand}>ProjectPay</Link>
          <h1 className={shared.authTitle}>Sign in</h1>
          <p className={shared.authSubtitle}>
            Enter your email and password to continue
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
