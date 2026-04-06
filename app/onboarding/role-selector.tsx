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
import { HardHat, Home } from "lucide-react";

export function RoleSelector({
  clerkId,
  name,
  email,
}: {
  clerkId: string;
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
        body: JSON.stringify({ clerkId, name, email, role }),
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
        <CardTitle className="text-2xl">Welcome to ProjectPay</CardTitle>
        <CardDescription>Select your role to get started</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Button
          variant="outline"
          className="h-24 flex-col gap-2"
          onClick={() => selectRole("CONTRACTOR")}
          disabled={isSubmitting}
        >
          <HardHat className="h-8 w-8" />
          <span className="text-lg font-medium">I&apos;m a Contractor</span>
        </Button>
        <Button
          variant="outline"
          className="h-24 flex-col gap-2"
          onClick={() => selectRole("CLIENT")}
          disabled={isSubmitting}
        >
          <Home className="h-8 w-8" />
          <span className="text-lg font-medium">I&apos;m a Homeowner</span>
        </Button>
      </CardContent>
    </Card>
  );
}
