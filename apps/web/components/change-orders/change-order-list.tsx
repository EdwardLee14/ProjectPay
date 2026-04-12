"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ChangeOrderItem {
  id: string;
  amount: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COUNTERED";
  createdAt: string;
  requester: {
    name: string;
  };
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
  COUNTERED: "outline",
};

export function ChangeOrderList({
  changeOrders,
  userRole,
}: {
  changeOrders: ChangeOrderItem[];
  userRole: "CONTRACTOR" | "CLIENT";
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleAction(id: string, status: "APPROVED" | "REJECTED") {
    setLoadingId(id);
    try {
      await fetch("/api/change-orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  if (changeOrders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Change Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No change orders yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Change Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {changeOrders.map((co) => (
            <div
              key={co.id}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{co.reason}</p>
                  <Badge variant={statusVariant[co.status]}>{co.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(co.amount)} &middot; Requested by{" "}
                  {co.requester.name} &middot;{" "}
                  {new Date(co.createdAt).toLocaleDateString()}
                </p>
              </div>
              {userRole === "CLIENT" && co.status === "PENDING" && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAction(co.id, "APPROVED")}
                    disabled={loadingId === co.id}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleAction(co.id, "REJECTED")}
                    disabled={loadingId === co.id}
                  >
                    Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
