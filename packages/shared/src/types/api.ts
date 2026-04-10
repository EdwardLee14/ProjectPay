// API input types (what clients send to the server)

export interface BudgetCategoryInput {
  name: string;
  allocatedAmount: number;
  merchantCategoryCodes?: string[];
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  clientEmail?: string;
  totalBudget: number;
  categories: BudgetCategoryInput[];
}

export interface FundProjectInput {
  paymentMethodId?: string;
}

export interface CreateChangeOrderInput {
  projectId: string;
  budgetCategoryId?: string;
  amount: number;
  reason: string;
}

export interface CreateTopUpRequestInput {
  reason: string;
  requestedAmount: number;
}

export interface ApproveRejectInput {
  status: "APPROVED" | "REJECTED";
}

export interface ShareProjectInput {
  expiresInDays?: number;
}
