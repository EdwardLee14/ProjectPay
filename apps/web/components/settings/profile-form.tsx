"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import s from "@/app/(dashboard)/settings/settings.module.css";

interface ProfileFormProps {
  initialName: string;
  initialCompanyName: string | null;
  initialPhone: string | null;
}

export function ProfileForm({
  initialName,
  initialCompanyName,
  initialPhone,
}: ProfileFormProps) {
  const [name, setName] = useState(initialName);
  const [companyName, setCompanyName] = useState(initialCompanyName ?? "");
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          companyName: companyName.trim() || null,
          phone: phone.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to update profile");
      }

      setMessage({ type: "success", text: "Profile updated successfully." });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className={s.fieldGrid}>
        <div className={s.fieldGroup}>
          <Label className={s.fieldLabel} htmlFor="name">
            Name
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            required
          />
        </div>

        <div className={s.fieldGroup}>
          <Label className={s.fieldLabel} htmlFor="companyName">
            Company Name
          </Label>
          <Input
            id="companyName"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Your company name"
          />
        </div>

        <div className={s.fieldGroup}>
          <Label className={s.fieldLabel} htmlFor="phone">
            Phone
          </Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
          />
        </div>
      </div>

      <div className="mt-6">
        <Button variant="pill" type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Changes \u2192"}
        </Button>
      </div>

      {message && (
        <p
          className={
            message.type === "success" ? s.successMessage : s.errorMessage
          }
        >
          {message.text}
        </p>
      )}
    </form>
  );
}
