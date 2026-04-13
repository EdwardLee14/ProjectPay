// Domain types used across web and mobile.
// These mirror the Prisma schema but are framework-agnostic (no Prisma dependency).

export type Role = "CONTRACTOR" | "CLIENT";

export type ProjectStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "PENDING_FUNDING"
  | "ACTIVE"
  | "COMPLETE"
  | "CANCELLED";

export type ChangeOrderStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "COUNTERED";
export type TopUpRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
export type AlertType = "CATEGORY_90_PCT" | "CATEGORY_100_PCT" | "PROJECT_90_PCT";

export interface User {
  id: string;
  supabaseId: string;
  role: Role;
  name: string;
  email: string;
  phone: string | null;
  companyName: string | null;
  stripeAccountId: string | null;
  stripeCardholderId: string | null;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  contractorId: string;
  clientId: string | null;
  clientEmail: string | null;
  totalBudget: number;
  fundedAmount: number;
  stripeCardId: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  budgetCategories?: BudgetCategory[];
  transactions?: Transaction[];
  changeOrders?: ChangeOrder[];
}

export interface BudgetCategory {
  id: string;
  projectId: string;
  name: string;
  allocatedAmount: number;
  spentAmount: number;
  merchantCategoryCodes: string[];
}

export interface Transaction {
  id: string;
  projectId: string;
  budgetCategoryId: string | null;
  merchantName: string;
  amount: number;
  categoryCode: string;
  status: string;
  note: string | null;
  stripeTransactionId: string;
  stripeAuthorizationId: string | null;
  createdAt: string;
}

export interface ChangeOrder {
  id: string;
  projectId: string;
  budgetCategoryId: string | null;
  requestedBy: string;
  amount: number;
  reason: string;
  status: ChangeOrderStatus;
  createdAt: string;
  resolvedAt: string | null;
}

export interface TopUpRequest {
  id: string;
  projectId: string;
  budgetCategoryId: string;
  requestedAmount: number;
  reason: string;
  status: TopUpRequestStatus;
  requestedBy: string;
  createdAt: string;
  resolvedAt: string | null;
}

export interface BudgetAlert {
  id: string;
  projectId: string;
  budgetCategoryId: string | null;
  alertType: AlertType;
  triggeredAt: string;
  acknowledgedAt: string | null;
}

export interface ClientAccessToken {
  id: string;
  projectId: string;
  token: string;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface Receipt {
  id: string;
  transactionId: string;
  storagePath: string;
  fileName: string;
  mimeType: string;
  uploadedBy: string;
  createdAt: string;
}
