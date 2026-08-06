import {
  Account,
  AIParseResult,
  AdminTelemetryResponse,
  AuditLogEntry,
  AuthSession,
  AuthUser,
  Budget,
  BudgetAlert,
  Category,
  SuperAdminTelemetryResponse,
  Transaction,
  UserRole,
} from './types';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

const TOKEN_KEY = 'flowledger_auth_token';
const USER_KEY = 'flowledger_auth_user';
const EXPIRES_KEY = 'flowledger_auth_expires';

export function getStoredSession(): AuthSession | null {
  try {
    const expiresRaw = localStorage.getItem(EXPIRES_KEY);
    if (expiresRaw && Date.now() > parseInt(expiresRaw, 10)) {
      storeSession(null); // Clear expired session
      return null;
    }

    const token = localStorage.getItem(TOKEN_KEY);
    const userRaw = localStorage.getItem(USER_KEY);
    if (!token || !userRaw) return null;
    return { token, user: JSON.parse(userRaw) as AuthUser };
  } catch {
    return null;
  }
}

export function storeSession(session: AuthSession | null): void {
  if (session) {
    localStorage.setItem(TOKEN_KEY, session.token);
    localStorage.setItem(USER_KEY, JSON.stringify(session.user));
    localStorage.setItem(EXPIRES_KEY, (Date.now() + 60 * 60 * 1000).toString()); // 1 hour expiry
  } else {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(EXPIRES_KEY);
  }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  const session = getStoredSession();
  if (session) headers['Authorization'] = `Bearer ${session.token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `Request failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ---- Auth ----
export async function login(email: string, role: UserRole): Promise<AuthSession> {
  const session = await apiFetch<AuthSession>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, role }),
  });
  storeSession(session);
  return session;
}

export function logout(): void {
  storeSession(null);
}

// ---- App AI endpoints ----
export async function parseTransaction(text: string, engineId: string): Promise<AIParseResult> {
  return apiFetch<AIParseResult>('/ai/parse', {
    method: 'POST',
    body: JSON.stringify({ text, engine: engineId }),
  });
}

export async function getBenchmark(): Promise<any> {
  return apiFetch('/ai/benchmark');
}

// ---- Data endpoints (role: user+) ----
export async function getTransactions(filters?: { month?: string; type?: string; category?: string }): Promise<Transaction[]> {
  const query = new URLSearchParams();
  if (filters?.month) query.set('month', filters.month);
  if (filters?.type) query.set('type', filters.type);
  if (filters?.category) query.set('category', filters.category);
  const qs = query.toString();
  const res = await apiFetch<{ transactions: Transaction[] }>(`/transactions${qs ? `?${qs}` : ''}`);
  return res.transactions;
}

export async function createTransaction(input: Omit<Transaction, 'id'>): Promise<{ transaction: Transaction; alert: BudgetAlert | null }> {
  const res = await apiFetch<{ transaction: Transaction; alert: BudgetAlert | null }>('/transactions', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res;
}

export async function deleteTransaction(id: string): Promise<void> {
  await apiFetch(`/transactions/${id}`, { method: 'DELETE' });
}

export async function getAccounts(): Promise<Account[]> {
  const res = await apiFetch<{ accounts: Account[] }>('/accounts');
  return res.accounts;
}

export async function createAccount(input: Omit<Account, 'id'>): Promise<Account> {
  const res = await apiFetch<{ account: Account }>('/accounts', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.account;
}

export async function getBudgets(): Promise<Budget[]> {
  const res = await apiFetch<{ budgets: Budget[] }>('/budgets');
  return res.budgets;
}

export async function createBudget(input: Omit<Budget, 'id'>): Promise<Budget> {
  const res = await apiFetch<{ budget: Budget }>('/budgets', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.budget;
}

export async function updateBudget(id: string, patch: Partial<Omit<Budget, 'id'>>): Promise<Budget> {
  const res = await apiFetch<{ budget: Budget }>(`/budgets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(patch),
  });
  return res.budget;
}

export async function deleteBudget(id: string): Promise<void> {
  await apiFetch(`/budgets/${id}`, { method: 'DELETE' });
}

export async function getCategories(): Promise<Category[]> {
  const res = await apiFetch<{ categories: Category[] }>('/categories');
  return res.categories;
}

export async function createCategory(input: Omit<Category, 'id'>): Promise<Category> {
  const res = await apiFetch<{ category: Category }>('/categories', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.category;
}

export async function updateCategory(id: string, patch: Partial<Omit<Category, 'id'>>): Promise<Category> {
  const res = await apiFetch<{ category: Category }>(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(patch),
  });
  return res.category;
}

export async function deleteCategory(id: string): Promise<void> {
  await apiFetch(`/categories/${id}`, { method: 'DELETE' });
}

// ---- Live updates (Server-Sent Events) ----
export function subscribeChanges(
  onChange: () => void,
  onBudgetAlert?: (alert: BudgetAlert) => void,
  onError?: (err: Event) => void
): () => void {
  const session = getStoredSession();
  if (!session) return () => {};

  const url = `${API_BASE}/events?token=${encodeURIComponent(session.token)}`;
  const es = new EventSource(url);
  es.onmessage = onChange;
  if (onBudgetAlert) {
    es.addEventListener('budget-alert', (e) => {
      try {
        onBudgetAlert(JSON.parse((e as MessageEvent).data) as BudgetAlert);
      } catch {
        // ignore malformed alert
      }
    });
  }
  if (onError) es.onerror = onError;
  return () => es.close();
}

// ---- Admin endpoints (role: admin+) ----
export async function getAdminTelemetry(): Promise<AdminTelemetryResponse> {
  return apiFetch<AdminTelemetryResponse>('/admin/telemetry');
}

// ---- Super Admin endpoints (role: superadmin) ----
export async function getSuperAdminTelemetry(): Promise<SuperAdminTelemetryResponse> {
  return apiFetch<SuperAdminTelemetryResponse>('/superadmin/telemetry');
}

export async function createTenant(tenantName: string): Promise<{ success: boolean; message: string }> {
  return apiFetch('/superadmin/tenants', {
    method: 'POST',
    body: JSON.stringify({ tenantName }),
  });
}

export async function rotateApiKeys(): Promise<{ success: boolean; message: string }> {
  return apiFetch('/superadmin/rotate-keys', { method: 'POST' });
}

export async function triggerBackup(): Promise<{ success: boolean; message: string }> {
  return apiFetch('/superadmin/backup', { method: 'POST' });
}

export async function getAuditLogs(): Promise<AuditLogEntry[]> {
  return apiFetch<AuditLogEntry[]>('/superadmin/audit');
}
