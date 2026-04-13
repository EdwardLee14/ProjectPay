"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import shared from "@/styles/shared.module.css";

interface EditProjectFormProps {
  project: {
    id: string;
    name: string;
    description: string | null;
    clientEmail: string | null;
    status: string;
  };
}

export function EditProjectForm({ project }: EditProjectFormProps) {
  const router = useRouter();

  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [clientEmail, setClientEmail] = useState(project.clientEmail ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasChanges =
    name !== project.name ||
    description !== (project.description ?? "") ||
    clientEmail !== (project.clientEmail ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          clientEmail: clientEmail || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to update project.");
        return;
      }

      router.push(`/projects/${project.id}`);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  const canCancel = ["DRAFT", "PENDING_APPROVAL", "PENDING_FUNDING"].includes(
    project.status
  );

  async function handleCancel() {
    setError(null);
    setIsCancelling(true);

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to cancel project.");
        setShowCancelConfirm(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <div className="max-w-[900px] mx-auto px-5 py-8 lg:px-10 lg:py-12 space-y-8">
      {/* Back */}
      <Link
        href={`/projects/${project.id}`}
        className={cn(shared.backLink, "group")}
      >
        <Icon
          name="arrow_back"
          className="text-lg group-hover:-translate-x-1 transition-transform"
        />
        <span className="text-sm font-medium">Back to Project</span>
      </Link>

      <div>
        <h1 className={shared.pageTitle}>Edit Project</h1>
        <p className="text-sm text-off-black/50 mt-1">
          Update the project details below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project details */}
        <div className="bg-white rounded-2xl shadow-elevation-1 p-6 space-y-5">
          <h2 className="text-sm font-bold text-off-black">Project Details</h2>

          <div className={shared.fieldGroup}>
            <Label htmlFor="name" className={shared.fieldLabel}>
              Project Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g. Kitchen Renovation — 123 Main St"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className={shared.fieldGroup}>
            <Label htmlFor="description" className={shared.fieldLabel}>
              Description
            </Label>
            <textarea
              id="description"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              rows={3}
              placeholder="Brief overview of scope and work to be done..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className={shared.fieldGroup}>
            <Label htmlFor="clientEmail" className={shared.fieldLabel}>
              Client Email
            </Label>
            <Input
              id="clientEmail"
              type="email"
              placeholder="client@example.com"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
            />
            <p className="text-xs text-off-black/40 mt-1">
              The client will be linked to this project when they sign up with
              this email.
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className={shared.errorBanner}>
            <Icon name="error" className="text-destructive text-lg shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href={`/projects/${project.id}`}
            className="text-sm font-semibold text-off-black/50 hover:text-off-black transition-colors"
          >
            Cancel
          </Link>
          <Button
            type="submit"
            variant="pill"
            disabled={!name || !hasChanges || isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>

      {/* Cancel project — only for cancellable statuses */}
      {canCancel && (
        <div className="bg-white rounded-2xl shadow-elevation-1 p-6 space-y-4">
          <h2 className="text-sm font-bold text-off-black">Cancel Project</h2>
          <p className="text-sm text-off-black/50">
            This will permanently cancel the project. This action cannot be
            undone.
          </p>

          {!showCancelConfirm ? (
            <Button
              type="button"
              variant="pill-destructive"
              onClick={() => setShowCancelConfirm(true)}
            >
              Cancel Project
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="pill-destructive"
                disabled={isCancelling}
                onClick={handleCancel}
              >
                {isCancelling ? "Cancelling..." : "Yes, Cancel Project"}
              </Button>
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                className="text-sm font-semibold text-off-black/50 hover:text-off-black transition-colors"
              >
                Never mind
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
