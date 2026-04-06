import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">ProjectPay</h1>
        <p className="text-lg text-muted-foreground max-w-md">
          Financial transparency for residential home renovations. Track
          budgets, transactions, and change orders in real time.
        </p>
      </div>
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/sign-in">Sign In</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/sign-up">Sign Up</Link>
        </Button>
      </div>
    </div>
  );
}
