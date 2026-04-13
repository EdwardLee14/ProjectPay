"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

export function RoleSelector({
  supabaseId,
  name,
  email,
}: {
  supabaseId: string;
  name: string;
  email: string;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function selectRole(role: "CONTRACTOR" | "CLIENT") {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supabaseId, name, email, role }),
      });

      if (res.ok) {
        router.push("/dashboard");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome to VisiBill</CardTitle>
        <CardDescription>Select your role to get started</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Button
          variant="outline"
          className="h-24 flex-col gap-2"
          onClick={() => selectRole("CONTRACTOR")}
          disabled={isSubmitting}
        >
          <Icon name="construction" className="text-3xl" />
          <span className="text-lg font-medium">I&apos;m a Contractor</span>
        </Button>
        <Button
          variant="outline"
          className="h-24 flex-col gap-2"
          onClick={() => selectRole("CLIENT")}
          disabled={isSubmitting}
        >
          <Icon name="home" className="text-3xl" />
          <span className="text-lg font-medium">I&apos;m a Client</span>
        </Button>
      </CardContent>
    </Card>
  );
}
