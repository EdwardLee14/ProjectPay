"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import shared from "@/styles/shared.module.css";

interface EditProjectFormProps {
  project: {
    id: string;
    name: string;
    description: string | null;
    clientEmail: string | null;
    status: string;
    clientName: string | null;
    clientPhone: string | null;
  };
}

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "ACTIVE", label: "Active" },
  { value: "COMPLETE", label: "Complete" },
];

export function EditProjectForm({ project }: EditProjectFormProps) {
  const router = useRouter();

  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [clientEmail, setClientEmail] = useState(project.clientEmail ?? "");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState(project.status);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const hasChanges =
    name !== project.name ||
    description !== (project.description ?? "") ||
    clientEmail !== (project.clientEmail ?? "") ||
    address !== "" ||
    status !== project.status;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
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

      setSuccess(true);
      setTimeout(() => {
        router.push(`/projects/${project.id}`);
        router.refresh();
      }, 500);
    } finally {
      setIsSubmitting(false);
    }
  }

  const canDelete = ["DRAFT", "PENDING_APPROVAL", "PENDING_FUNDING"].includes(project.status);

  async function handleDelete() {
    setError(null);
    setIsCancelling(true);

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to delete project.");
        setShowDeleteConfirm(false);
        return;
      }

      router.push("/projects");
      router.refresh();
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <div className="pl-8 pr-6 py-6 max-w-3xl">
      {/* Back */}
      <Link
        href={`/projects/${project.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-off-black/50 hover:text-off-black transition-colors mb-4"
      >
        <Icon name="arrow_back" className="text-base" />
        <span>Back to Project</span>
      </Link>

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-headline text-lg font-bold text-off-black">Edit Project</h1>
          <p className="text-sm text-off-black/40 mt-0.5">Update project details</p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={!name || !hasChanges || isSubmitting}
          className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40"
        >
          {isSubmitting ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-2 text-sm text-primary bg-peach-50 border border-primary/20 rounded-lg px-3 py-2 mb-4">
          <Icon name="check_circle" className="text-base" />
          Saved successfully
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2 mb-4">
          <Icon name="error" className="text-base" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Row 1: Project Details + Client Info side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Project Details */}
          <div className="bg-white border border-border rounded-lg p-5 space-y-4">
            <p className="text-sm font-bold text-off-black">Project Details</p>

            <div className={shared.fieldGroup}>
              <Label htmlFor="name" className="text-xs font-medium text-off-black">
                Project Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g. Kitchen Renovation"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="text-sm"
              />
            </div>

            <div className={shared.fieldGroup}>
              <Label htmlFor="description" className="text-xs font-medium text-off-black">
                Description
              </Label>
              <textarea
                id="description"
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm placeholder:text-off-black/30 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                rows={2}
                placeholder="Brief scope of work..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className={shared.fieldGroup}>
              <Label htmlFor="address" className="text-xs font-medium text-off-black">
                Project Address
              </Label>
              <Input
                id="address"
                placeholder="123 Main St, City, State"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          {/* Client Info */}
          <div className="bg-white border border-border rounded-lg p-5 space-y-4">
            <p className="text-sm font-bold text-off-black">Client Information</p>

            <div className={shared.fieldGroup}>
              <Label htmlFor="clientEmail" className="text-xs font-medium text-off-black">
                Client Email
              </Label>
              <Input
                id="clientEmail"
                type="email"
                placeholder="client@example.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="text-sm"
              />
              <p className="text-[10px] text-off-black/30 mt-0.5">
                Linked when they sign up with this email
              </p>
            </div>

            {project.clientName && (
              <div>
                <p className="text-xs font-medium text-off-black">Client Name</p>
                <p className="text-sm text-off-black/60 mt-0.5">{project.clientName}</p>
              </div>
            )}

            {project.clientPhone && (
              <div>
                <p className="text-xs font-medium text-off-black">Client Phone</p>
                <p className="text-sm text-off-black/60 mt-0.5">{project.clientPhone}</p>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Status + Danger Zone side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Status */}
          <div className="bg-white border border-border rounded-lg p-5 space-y-3">
            <p className="text-sm font-bold text-off-black">Project Status</p>

            <div className="flex gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors",
                    status === opt.value
                      ? "border-primary bg-peach-50 text-off-black"
                      : "border-border text-off-black/40 hover:border-off-black/20"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <p className="text-[10px] text-off-black/30">
              Current: <span className="font-medium text-off-black/50">{project.status}</span>
            </p>
          </div>

          {/* Danger Zone */}
          {canDelete && (
            <div className="bg-white border border-destructive/20 rounded-lg p-5">
              <p className="text-sm font-bold text-destructive">Danger Zone</p>
              <p className="text-[11px] text-off-black/40 mt-1 mb-3">
                Permanently cancel this project. Cannot be undone.
              </p>

              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-1.5 text-xs font-semibold text-destructive border border-destructive/30 rounded-lg hover:bg-destructive/5 transition-colors"
                >
                  Delete Project
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isCancelling}
                    onClick={handleDelete}
                    className="px-4 py-1.5 text-xs font-semibold bg-destructive text-white rounded-lg hover:bg-destructive/90 disabled:opacity-50"
                  >
                    {isCancelling ? "Deleting..." : "Confirm Delete"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="text-xs font-medium text-off-black/40 hover:text-off-black transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom actions — mobile only, desktop has save in header */}
        <div className="flex items-center justify-between mt-5 lg:hidden">
          <Link
            href={`/projects/${project.id}`}
            className="text-sm font-medium text-off-black/40 hover:text-off-black transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={!name || !hasChanges || isSubmitting}
            className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
