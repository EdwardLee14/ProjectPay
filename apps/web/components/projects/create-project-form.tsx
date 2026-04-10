"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

interface CategoryInput {
  name: string;
  allocatedAmount: string;
}

export function CreateProjectForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [totalBudget, setTotalBudget] = useState("");
  const [categories, setCategories] = useState<CategoryInput[]>([
    { name: "", allocatedAmount: "" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function addCategory() {
    setCategories([...categories, { name: "", allocatedAmount: "" }]);
  }

  function removeCategory(index: number) {
    if (categories.length <= 1) return;
    setCategories(categories.filter((_, i) => i !== index));
  }

  function updateCategory(
    index: number,
    field: keyof CategoryInput,
    value: string
  ) {
    const updated = [...categories];
    updated[index] = { ...updated[index], [field]: value };
    setCategories(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          totalBudget: parseFloat(totalBudget),
          categories: categories.map((cat) => ({
            name: cat.name,
            allocatedAmount: parseFloat(cat.allocatedAmount),
          })),
        }),
      });

      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kitchen Renovation"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget">Total Budget ($)</Label>
            <Input
              id="budget"
              type="number"
              step="0.01"
              min="0"
              value={totalBudget}
              onChange={(e) => setTotalBudget(e.target.value)}
              placeholder="50000"
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Budget Categories</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addCategory}>
              <Plus className="mr-1 h-4 w-4" />
              Add Category
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {categories.map((cat, i) => (
            <div key={i} className="flex gap-3 items-end">
              <div className="flex-1 space-y-2">
                <Label>Category Name</Label>
                <Input
                  value={cat.name}
                  onChange={(e) => updateCategory(i, "name", e.target.value)}
                  placeholder="e.g. Materials"
                  required
                />
              </div>
              <div className="w-40 space-y-2">
                <Label>Amount ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={cat.allocatedAmount}
                  onChange={(e) =>
                    updateCategory(i, "allocatedAmount", e.target.value)
                  }
                  placeholder="10000"
                  required
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeCategory(i)}
                disabled={categories.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Project"}
      </Button>
    </form>
  );
}
