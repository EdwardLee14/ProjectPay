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

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/onboarding");
    router.refresh();
  }

  return (
    <main className={shared.authPage}>
      <div className={shared.authCard}>
        <div className={shared.authHeader}>
          <Link href="/" className={shared.authBrand}>ProjectPay</Link>
          <h1 className={shared.authTitle}>Create your account</h1>
          <p className={shared.authSubtitle}>Get started with ProjectPay</p>
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
