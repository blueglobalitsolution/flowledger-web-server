import { DatabaseSync } from 'node:sqlite';
import { dirname, join, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';
import type { Account, Budget, BudgetAlert, Category, Transaction, TransactionType } from '@shared/types';

export const DEFAULT_ALERT_THRESHOLD = 90;

// Store data outside dist/ so clean/rebuild never wipes user data.
// Resolve the entry module's dir (dev: api/server.ts; prod: dist/server.cjs) so
// the DB always lands in <repo root>/data regardless of cwd or esbuild's CJS shim.
const moduleDir = dirname(resolve(process.argv[1] ?? '.'));
const dataDir = join(moduleDir, '..', 'data');
mkdirSync(dataDir, { recursive: true });
const db = new DatabaseSync(join(dataDir, 'flowledger.db'));

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    balance REAL NOT NULL,
    currency TEXT NOT NULL,
    accountNumber TEXT,
    color TEXT NOT NULL,
    icon TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    account TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    date TEXT NOT NULL,
    confidence REAL,
    ai_parsed INTEGER,
    engine_used TEXT,
    status TEXT,
    notes TEXT,
    tags TEXT
  );

  CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    monthlyLimit REAL NOT NULL,
    spent REAL NOT NULL,
    period TEXT NOT NULL,
    alertThreshold REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    path TEXT NOT NULL UNIQUE,
    parent TEXT,
    type TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    budgetLimit REAL,
    keywords TEXT
  );
`);

// Lightweight migrations: add budget trigger-flag columns if missing.
const budgetCols = new Set((db.prepare('PRAGMA table_info(budgets)').all() as { name: string }[]).map((c) => c.name));
if (!budgetCols.has('approachingSent')) {
  db.exec('ALTER TABLE budgets ADD COLUMN approachingSent INTEGER NOT NULL DEFAULT 0');
}
if (!budgetCols.has('exceededSent')) {
  db.exec('ALTER TABLE budgets ADD COLUMN exceededSent INTEGER NOT NULL DEFAULT 0');
}

// Migrations for the category tree + tags.
const catCols = new Set((db.prepare('PRAGMA table_info(categories)').all() as { name: string }[]).map((c) => c.name));
if (!catCols.has('path')) db.exec('ALTER TABLE categories ADD COLUMN path TEXT');
if (!catCols.has('parent')) db.exec('ALTER TABLE categories ADD COLUMN parent TEXT');
if (!catCols.has('keywords')) db.exec('ALTER TABLE categories ADD COLUMN keywords TEXT');
const txCols = new Set((db.prepare('PRAGMA table_info(transactions)').all() as { name: string }[]).map((c) => c.name));
if (!txCols.has('tags')) db.exec('ALTER TABLE transactions ADD COLUMN tags TEXT');


interface TxRow {
  id: string;
  type: string;
  amount: number;
  currency: string;
  category: string;
  description: string;
  account: string;
  payment_method: string;
  date: string;
  confidence: number | null;
  ai_parsed: number | null;
  engine_used: string | null;
  status: string | null;
  notes: string | null;
  tags: string | null;
}

function toTransaction(row: TxRow): Transaction {
  return {
    id: row.id,
    type: row.type as TransactionType,
    amount: row.amount,
    currency: row.currency,
    category: row.category,
    description: row.description,
    account: row.account,
    payment_method: row.payment_method,
    date: row.date,
    confidence: row.confidence ?? undefined,
    ai_parsed: row.ai_parsed ? true : undefined,
    engine_used: row.engine_used ?? undefined,
    status: (row.status as Transaction['status']) ?? undefined,
    notes: row.notes ?? undefined,
    tags: row.tags ? (JSON.parse(row.tags) as string[]) : undefined,
  };
}

function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

interface BudgetRow {
  id: string;
  category: string;
  monthlyLimit: number;
  spent: number;
  period: string;
  alertThreshold: number;
  approachingSent: number;
  exceededSent: number;
}

const selectBudgetStmt = db.prepare('SELECT * FROM budgets WHERE category = ?');
const selectAllBudgetsStmt = db.prepare('SELECT * FROM budgets');
const updateBudgetSpentStmt = db.prepare(
  'UPDATE budgets SET spent = ?, approachingSent = ?, exceededSent = ? WHERE id = ?'
);

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Budgets may be set at the top-level ("Transportation") or the subcategory
 * level ("Transportation > Petrol"). A transaction whose category path is
 * "Transportation > Petrol" rolls up into a top-level budget "Transportation",
 * and matches a subcategory budget "Transportation > Petrol" exactly.
 */
function budgetsForCategory(txCategory: string): BudgetRow[] {
  const all = selectAllBudgetsStmt.all() as unknown as BudgetRow[];
  const topLevel = txCategory.split(SEPARATOR)[0] ?? txCategory;
  return all.filter((b) => {
    if (b.category === txCategory) return true;
    return !b.category.includes(SEPARATOR) && b.category === topLevel;
  });
}

function applyBudgetDeltaToRow(budget: BudgetRow, delta: number): BudgetAlert | null {
  const newSpent = round2(budget.spent + delta);
  const limit = budget.monthlyLimit;
  const threshold = round2(limit * (budget.alertThreshold / 100));

  let { approachingSent, exceededSent } = budget;
  let alert: BudgetAlert | null = null;

  if (delta > 0 && limit > 0) {
    if (!approachingSent && newSpent >= threshold) {
      approachingSent = 1;
      alert = { type: 'approaching', category: budget.category, spent: newSpent, monthlyLimit: limit, alertThreshold: budget.alertThreshold };
    }
    if (!exceededSent && newSpent >= limit) {
      exceededSent = 1;
      alert = { type: 'exceeded', category: budget.category, spent: newSpent, monthlyLimit: limit, alertThreshold: budget.alertThreshold };
    }
  } else if (delta < 0 && limit > 0) {
    if (approachingSent && newSpent < threshold) approachingSent = 0;
    if (exceededSent && newSpent < limit) exceededSent = 0;
  }

  updateBudgetSpentStmt.run(newSpent, approachingSent, exceededSent, budget.id);
  return alert;
}

/**
 * Applies an amount delta to every budget that this category belongs to
 * (top-level roll-up and/or exact subcategory), firing (or re-arming) the
 * approach/exceed trigger flags. Returns the most severe newly-crossed alert.
 */
function applyBudgetDelta(category: string, delta: number): BudgetAlert | null {
  const rows = budgetsForCategory(category);
  if (rows.length === 0) return null;
  let mostSevere: BudgetAlert | null = null;
  for (const row of rows) {
    const alert = applyBudgetDeltaToRow(row, delta);
    if (alert && (!mostSevere || (alert.type === 'exceeded' && mostSevere.type !== 'exceeded'))) {
      mostSevere = alert;
    }
  }
  return mostSevere;
}

const listTxStmt = db.prepare('SELECT * FROM transactions ORDER BY date DESC');
const listTxFilteredStmt = db.prepare(
  `SELECT * FROM transactions
   WHERE (? IS NULL OR date LIKE ?)
     AND (? IS NULL OR type = ?)
     AND (? IS NULL OR category = ?)
   ORDER BY date DESC`
);

export function listTransactions(filters?: { month?: string; type?: string; category?: string }): Transaction[] {
  const month = filters?.month;
  const type = filters?.type;
  const category = filters?.category;
  if (!month && !type && !category) {
    return (listTxStmt.all() as unknown as TxRow[]).map(toTransaction);
  }
  return (
    listTxFilteredStmt.all(
      month ?? null,
      month ? `${month}%` : null,
      type ?? null,
      type ?? null,
      category ?? null,
      category ?? null
    ) as unknown as TxRow[]
  ).map(toTransaction);
}

export function addTransaction(input: Omit<Transaction, 'id'>): { transaction: Transaction; alert?: BudgetAlert } {
  const tx: Transaction = { ...input, id: nextId('tx') };
  let alert: BudgetAlert | undefined;

  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare(
      `INSERT INTO transactions (id, type, amount, currency, category, description, account, payment_method, date, confidence, ai_parsed, engine_used, status, notes, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      tx.id,
      tx.type,
      tx.amount,
      tx.currency,
      tx.category,
      tx.description,
      tx.account,
      tx.payment_method,
      tx.date,
      tx.confidence ?? null,
      tx.ai_parsed ? 1 : 0,
      tx.engine_used ?? null,
      tx.status ?? null,
      tx.notes ?? null,
      tx.tags && tx.tags.length ? JSON.stringify(tx.tags) : null
    );

    const account = db.prepare('SELECT * FROM accounts WHERE name = ?').get(tx.account) as
      | (Omit<Account, 'accountNumber'> & { accountNumber: string | null })
      | undefined;
    if (account) {
      const delta = tx.type === 'income' ? tx.amount : -tx.amount;
      db.prepare('UPDATE accounts SET balance = ? WHERE id = ?').run(
        round2(account.balance + delta),
        account.id
      );
    }

    if (tx.type === 'expense') {
      alert = applyBudgetDelta(tx.category, tx.amount) ?? undefined;
    }

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  return { transaction: tx, alert };
}

export function deleteTransaction(id: string): boolean {
  const existing = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as unknown as
    | TxRow
    | undefined;
  if (!existing) return false;

  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare('DELETE FROM transactions WHERE id = ?').run(id);

    const tx = toTransaction(existing);
    const account = db.prepare('SELECT * FROM accounts WHERE name = ?').get(tx.account) as unknown as
      | (Omit<Account, 'accountNumber'> & { accountNumber: string | null })
      | undefined;
    if (account) {
      const delta = tx.type === 'income' ? -tx.amount : tx.amount;
      db.prepare('UPDATE accounts SET balance = ? WHERE id = ?').run(
        round2(account.balance + delta),
        account.id
      );
    }

    if (tx.type === 'expense') {
      applyBudgetDelta(tx.category, -tx.amount);
    }

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  return true;
}

export function updateTransaction(id: string, patch: Partial<Omit<Transaction, 'id'>>): Transaction | null {
  const existing = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as unknown as
    | TxRow
    | undefined;
  if (!existing) return null;

  const old = toTransaction(existing);
  const updated: Transaction = { ...old, ...patch, id: old.id };

  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare(
      `UPDATE transactions SET type = ?, amount = ?, currency = ?, category = ?, description = ?, account = ?, payment_method = ?, date = ?, confidence = ?, ai_parsed = ?, engine_used = ?, status = ?, notes = ?, tags = ? WHERE id = ?`
    ).run(
      updated.type,
      updated.amount,
      updated.currency,
      updated.category,
      updated.description,
      updated.account,
      updated.payment_method,
      updated.date,
      updated.confidence ?? null,
      updated.ai_parsed ? 1 : 0,
      updated.engine_used ?? null,
      updated.status ?? null,
      updated.notes ?? null,
      updated.tags && updated.tags.length ? JSON.stringify(updated.tags) : null,
      updated.id
    );

    const reverseDeltas = (acc: Transaction) => {
      const account = db.prepare('SELECT * FROM accounts WHERE name = ?').get(acc.account) as
        | (Omit<Account, 'accountNumber'> & { accountNumber: string | null })
        | undefined;
      if (account) {
        const delta = acc.type === 'income' ? -acc.amount : acc.amount;
        db.prepare('UPDATE accounts SET balance = ? WHERE id = ?').run(
          round2(account.balance + delta),
          account.id
        );
      }
      if (acc.type === 'expense') {
        applyBudgetDelta(acc.category, -acc.amount);
      }
    };

    reverseDeltas(old);

    const applyDeltas = (acc: Transaction) => {
      const account = db.prepare('SELECT * FROM accounts WHERE name = ?').get(acc.account) as
        | (Omit<Account, 'accountNumber'> & { accountNumber: string | null })
        | undefined;
      if (account) {
        const delta = acc.type === 'income' ? acc.amount : -acc.amount;
        db.prepare('UPDATE accounts SET balance = ? WHERE id = ?').run(
          round2(account.balance + delta),
          account.id
        );
      }
      if (acc.type === 'expense') {
        applyBudgetDelta(acc.category, acc.amount);
      }
    };

    applyDeltas(updated);

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  return updated;
}

const listAccountsStmt = db.prepare('SELECT * FROM accounts ORDER BY balance DESC');

export function listAccounts(): Account[] {
  return (listAccountsStmt.all() as (Omit<Account, 'accountNumber'> & { accountNumber: string | null })[]).map(
    (a) => ({
      id: a.id,
      name: a.name,
      type: a.type as Account['type'],
      balance: a.balance,
      currency: a.currency,
      accountNumber: a.accountNumber ?? undefined,
      color: a.color,
      icon: a.icon,
    })
  );
}

export function addAccount(input: Omit<Account, 'id'>): Account {
  const account: Account = { ...input, id: nextId('acc') };
  db.prepare(
    'INSERT INTO accounts (id, name, type, balance, currency, accountNumber, color, icon) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    account.id,
    account.name,
    account.type,
    account.balance,
    account.currency,
    account.accountNumber ?? null,
    account.color,
    account.icon
  );
  return account;
}

const listBudgetsStmt = db.prepare('SELECT * FROM budgets');

export function listBudgets(): Budget[] {
  return (listBudgetsStmt.all() as unknown as BudgetRow[]).map((b) => ({
    id: b.id,
    category: b.category,
    monthlyLimit: b.monthlyLimit,
    spent: b.spent,
    period: b.period,
    alertThreshold: b.alertThreshold,
    approachingSent: !!b.approachingSent,
    exceededSent: !!b.exceededSent,
  }));
}

export function addBudget(input: Omit<Budget, 'id'>): Budget {
  const budget: Budget = {
    ...input,
    id: nextId('b'),
    alertThreshold: input.alertThreshold || DEFAULT_ALERT_THRESHOLD,
  };
  db.prepare(
    'INSERT INTO budgets (id, category, monthlyLimit, spent, period, alertThreshold, approachingSent, exceededSent) VALUES (?, ?, ?, ?, ?, ?, 0, 0)'
  ).run(budget.id, budget.category, budget.monthlyLimit, budget.spent, budget.period, budget.alertThreshold);
  return budget;
}

export function updateBudget(id: string, patch: Partial<Omit<Budget, 'id'>>): Budget | null {
  const existing = db.prepare('SELECT * FROM budgets WHERE id = ?').get(id) as unknown as
    | BudgetRow
    | undefined;
  if (!existing) return null;

  const updated: Budget = {
    id: existing.id,
    category: patch.category ?? existing.category,
    monthlyLimit: patch.monthlyLimit ?? existing.monthlyLimit,
    spent: patch.spent ?? existing.spent,
    period: patch.period ?? existing.period,
    alertThreshold: patch.alertThreshold ?? existing.alertThreshold ?? DEFAULT_ALERT_THRESHOLD,
  };

  // Limit/threshold changed -> re-arm both triggers so a fresh crossing fires again.
  db.prepare(
    'UPDATE budgets SET category = ?, monthlyLimit = ?, spent = ?, period = ?, alertThreshold = ?, approachingSent = 0, exceededSent = 0 WHERE id = ?'
  ).run(
    updated.category,
    updated.monthlyLimit,
    updated.spent,
    updated.period,
    updated.alertThreshold,
    updated.id
  );
  return { ...updated, approachingSent: false, exceededSent: false };
}

export function deleteBudget(id: string): boolean {
  const res = db.prepare('DELETE FROM budgets WHERE id = ?').run(id);
  return (res as { changes: number }).changes > 0;
}

/// Recomputes every budget's spent from the transactions table using the
/// both-level rule (top-level budgets roll up subcategories). Used by the
/// taxonomy migration so spent stays accurate after re-categorization.
export function recomputeBudgetSpent(): void {
  const budgets = db.prepare('SELECT * FROM budgets').all() as unknown as BudgetRow[];
  const txs = listTxStmt.all() as unknown as TxRow[];
  for (const b of budgets) {
    const isTop = !b.category.includes(' > ');
    const spent = txs
      .filter((t) => t.type === 'expense')
      .filter((t) => {
        if (t.category === b.category) return true;
        if (isTop && (t.category.split(' > ')[0] ?? t.category) === b.category) return true;
        return false;
      })
      .reduce((s, t) => s + (t.amount || 0), 0);
    updateBudgetSpentStmt.run(round2(spent), 0, 0, b.id);
  }
}

interface CategoryRow {
  id: string;
  name: string;
  path: string;
  parent: string | null;
  type: string;
  icon: string;
  color: string;
  budgetLimit: number | null;
  keywords: string | null;
}

function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    path: row.path,
    parent: row.parent ?? undefined,
    type: row.type as Category['type'],
    icon: row.icon,
    color: row.color,
    budgetLimit: row.budgetLimit ?? undefined,
    keywords: row.keywords ? (JSON.parse(row.keywords) as string[]) : undefined,
  };
}

const listCategoriesStmt = db.prepare('SELECT * FROM categories ORDER BY type, parent, name');

export function listCategories(): Category[] {
  return (listCategoriesStmt.all() as unknown as CategoryRow[]).map(toCategory);
}

const selectCategoryByPathStmt = db.prepare('SELECT * FROM categories WHERE path = ?');

/// Returns the existing category row for a path (top-level or "Parent > Leaf").
export function findCategory(path: string): Category | undefined {
  const row = selectCategoryByPathStmt.get(path) as unknown as CategoryRow | undefined;
  return row ? toCategory(row) : undefined;
}

/// Creates a category row if one with this exact path doesn't already exist.
export function ensureCategory(path: string, type: 'income' | 'expense' | 'transfer' = 'expense'): Category {
  const existing = selectCategoryByPathStmt.get(path) as unknown as CategoryRow | undefined;
  if (existing) return toCategory(existing);

  const parent = path.includes(' > ') ? path.split(' > ')[0] : path;
  const name = path.includes(' > ') ? path.split(' > ').slice(1).join(' > ') : path;
  const color = type === 'income' ? '#10B981' : type === 'transfer' ? '#3B82F6' : '#EF4444';
  const cat: Category = {
    id: nextId('cat'),
    name,
    path,
    parent,
    type,
    icon: type === 'income' ? 'TrendingUp' : type === 'transfer' ? 'ArrowLeftRight' : 'Tag',
    color,
    keywords: [name.toLowerCase()],
  };
  db.prepare(
    'INSERT INTO categories (id, name, path, parent, type, icon, color, budgetLimit, keywords) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(cat.id, cat.name, cat.path, cat.parent ?? null, cat.type, cat.icon, cat.color, null, cat.keywords ? JSON.stringify(cat.keywords) : null);
  return cat;
}

/// Adds a new category (top-level or "Parent > Leaf"). For leaves, the parent
/// must exist. Returns null if the path already exists.
export function addCategory(input: { name: string; parent?: string; type: 'income' | 'expense' | 'transfer'; icon?: string; color?: string; keywords?: string[] }): Category | null {
  const path = input.parent && input.parent.trim() ? `${input.parent.trim()} > ${input.name.trim()}` : input.name.trim();
  if (selectCategoryByPathStmt.get(path)) return null;

  const parentRow = input.parent && input.parent.trim() ? (selectCategoryByPathStmt.get(input.parent.trim()) as unknown as CategoryRow | undefined) : undefined;
  const parentName = parentRow ? parentRow.name : (input.parent?.trim() || path);
  const color = input.color || (input.type === 'income' ? '#10B981' : input.type === 'transfer' ? '#3B82F6' : '#EF4444');
  const cat: Category = {
    id: nextId('cat'),
    name: input.name.trim(),
    path,
    parent: parentName,
    type: input.type,
    icon: input.icon || (input.type === 'income' ? 'TrendingUp' : input.type === 'transfer' ? 'ArrowLeftRight' : 'Tag'),
    color,
    keywords: input.keywords?.length ? input.keywords : [input.name.trim().toLowerCase()],
  };
  db.prepare(
    'INSERT INTO categories (id, name, path, parent, type, icon, color, budgetLimit, keywords) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(cat.id, cat.name, cat.path, cat.parent ?? null, cat.type, cat.icon, cat.color, null, cat.keywords ? JSON.stringify(cat.keywords) : null);
  return cat;
}

export function updateCategory(id: string, patch: { name?: string; parent?: string; type?: 'income' | 'expense' | 'transfer'; icon?: string; color?: string; keywords?: string[] }): Category | null {
  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as unknown as CategoryRow | undefined;
  if (!existing) return null;

  const name = patch.name?.trim() || existing.name;
  const parent = patch.parent !== undefined ? (patch.parent?.trim() || null) : existing.parent;
  const path = parent ? `${parent} > ${name}` : name;
  const type = patch.type ?? (existing.type as Category['type']);
  const color = patch.color || existing.color;
  const keywords = patch.keywords && patch.keywords.length ? patch.keywords : (existing.keywords ? (JSON.parse(existing.keywords) as string[]) : [name.toLowerCase()]);

  db.prepare(
    'UPDATE categories SET name = ?, path = ?, parent = ?, type = ?, icon = ?, color = ?, keywords = ? WHERE id = ?'
  ).run(name, path, parent, type, patch.icon || existing.icon, color, JSON.stringify(keywords), id);
  return toCategory({ id, name, path, parent, type, icon: patch.icon || existing.icon, color, budgetLimit: existing.budgetLimit, keywords: JSON.stringify(keywords) });
}

export function deleteCategory(id: string): boolean {
  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as unknown as CategoryRow | undefined;
  if (!existing) return false;
  if (existing.parent === null || existing.path === existing.parent) {
    // Top-level: delete the group and all its leaves.
    db.prepare('DELETE FROM categories WHERE parent = ? OR id = ?').run(existing.path, id);
  } else {
    db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  }
  return true;
}
