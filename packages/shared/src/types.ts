export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  category: string;
  description: string;
  account: string;
  payment_method: string;
  date: string;
  confidence?: number;
  ai_parsed?: boolean;
  engine_used?: string;
  status?: 'completed' | 'pending' | 'flagged';
  notes?: string;
  tags?: string[];
}

export interface Account {
  id: string;
  name: string;
  type: 'Cash' | 'Bank' | 'Wallet' | 'Credit Card' | 'Debit Card';
  balance: number;
  currency: string;
  accountNumber?: string;
  color: string;
  icon: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'transfer';
  icon: string;
  color: string;
  budgetLimit?: number;
  /** Full hierarchical path, e.g. "Office > Electricity" (leaf) or "Office" (top-level). */
  path?: string;
  /** Top-level group name, e.g. "Office". */
  parent?: string;
  /** AI keywords that should map to this category. */
  keywords?: string[];
}

export interface Budget {
  id: string;
  category: string;
  monthlyLimit: number;
  spent: number;
  period: string;
  alertThreshold: number;
  approachingSent?: boolean;
  exceededSent?: boolean;
}

export type BudgetAlertType = 'approaching' | 'exceeded';

export interface BudgetAlert {
  type: BudgetAlertType;
  category: string;
  spent: number;
  monthlyLimit: number;
  alertThreshold: number;
}

export interface Customer {
  id: string;
  name: string;
  labelName: string;
  labelColor: number;
  baseIncome: number;
  baseExpense: number;
  service: string;
}

export interface AIEngineConfig {
  id: string;
  name: string;
  version: string;
  provider: 'Ollama (Local GPU)';
  latencyMs: number;
  tokensPerSec: number;
  accuracyScore: number;
  jsonCompliance: number;
  memoryFootprintMB: number;
  isDefault?: boolean;
  description: string;
}

export interface AIParseResult {
  type: TransactionType | 'customer_ledger';
  amount: number;
  currency: string;
  category: string;
  description: string;
  account: string;
  payment_method: string;
  date: string;
  confidence: number;
  raw_prompt?: string;
  engine_used: string;
  processing_time_ms: number;
  reasoning_tokens?: number;
  customer?: Customer;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'info' | 'success' | 'alert';
  timestamp: string;
  read: boolean;
}

export type UserRole = 'user' | 'admin' | 'superadmin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  tenantName?: string;
  twoFactorEnabled?: boolean;
  biometricRegistered?: boolean;
  plan?: string;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
}


