import { DatabaseSync } from 'node:sqlite';
import { dirname, join, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';
import type { Account, Budget, BudgetAlert, Category, Customer, Transaction, TransactionType } from '@shared/types';

export const DEFAULT_ALERT_THRESHOLD = 90;
export const SEPARATOR = ' > ';

const moduleDir = dirname(resolve(process.argv[1] ?? '.'));
const dataDir = join(moduleDir, '..', 'data');
mkdirSync(dataDir, { recursive: true });

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function nextId(prefix: string): string {
  return prefix + '-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
}

export class UserStore {
  public db: DatabaseSync;

  constructor(public userId: string) {
    // Sanitize email/userId for filename
    const safeName = userId.replace(/[^a-zA-Z0-9]/g, '_');
    this.db = new DatabaseSync(join(dataDir, `${safeName}_flowledger.db`), { timeout: 10000 });
    this.init();
  }

  private init() {
    this.db.exec(`
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

      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        labelName TEXT NOT NULL,
        labelColor INTEGER NOT NULL,
        baseIncome REAL NOT NULL,
        baseExpense REAL NOT NULL,
        service TEXT NOT NULL
      );
    `);

    const budgetCols = new Set((this.db.prepare('PRAGMA table_info(budgets)').all() as { name: string }[]).map((c) => c.name));
    if (!budgetCols.has('approachingSent')) this.db.exec('ALTER TABLE budgets ADD COLUMN approachingSent INTEGER NOT NULL DEFAULT 0');
    if (!budgetCols.has('exceededSent')) this.db.exec('ALTER TABLE budgets ADD COLUMN exceededSent INTEGER NOT NULL DEFAULT 0');

    const catCols = new Set((this.db.prepare('PRAGMA table_info(categories)').all() as { name: string }[]).map((c) => c.name));
    if (!catCols.has('path')) this.db.exec('ALTER TABLE categories ADD COLUMN path TEXT');
    if (!catCols.has('parent')) this.db.exec('ALTER TABLE categories ADD COLUMN parent TEXT');
    if (!catCols.has('keywords')) this.db.exec('ALTER TABLE categories ADD COLUMN keywords TEXT');
    
    const txCols = new Set((this.db.prepare('PRAGMA table_info(transactions)').all() as { name: string }[]).map((c) => c.name));
    if (!txCols.has('tags')) this.db.exec('ALTER TABLE transactions ADD COLUMN tags TEXT');
    if (!txCols.has('customerId')) {
      this.db.exec('ALTER TABLE transactions ADD COLUMN customerId TEXT');
    }

    // Unconditional migration: Link old transactions by matching description/notes with customer names
    try {
      const customersTableExists = (this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='customers'").get() as any);
      if (customersTableExists) {
        const customers = this.db.prepare('SELECT id, name FROM customers').all() as { id: string, name: string }[];
        const updateStmt = this.db.prepare(`
          UPDATE transactions 
          SET customerId = ? 
          WHERE customerId IS NULL 
            AND (
              LOWER(description) LIKE ? 
              OR LOWER(notes) LIKE ?
            )
        `);
        let migratedCount = 0;
        for (const c of customers) {
          if (!c.name || c.name.length < 3) continue; // Avoid matching too short names like "a" or "i"
          const searchPattern = `%${c.name.toLowerCase()}%`;
          const res = updateStmt.run(c.id, searchPattern, searchPattern) as { changes: number };
          migratedCount += res.changes;
        }
        if (migratedCount > 0) {
          console.log(`[Migration] Successfully linked ${migratedCount} historical transactions to customers.`);
        }
      }
    } catch (err) {
      console.error('Failed to run transaction-customer history migration:', err);
    }

    const accountCount = (this.db.prepare('SELECT COUNT(*) as count FROM accounts').get() as { count: number }).count;
    if (accountCount === 0) {
      this.db.prepare(
        'INSERT INTO accounts (id, name, type, balance, currency, accountNumber, color, icon) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run('acc-default', 'Physical Wallet', 'Cash', 0.0, '₹', null, '#10B981', 'Wallet');
    }

    const allTxs = this.db.prepare('SELECT * FROM transactions').all() as any[];
    const referencedAccounts = new Set<string>();
    for (const tx of allTxs) {
      if (tx.account) referencedAccounts.add(tx.account);
    }

    for (const accName of referencedAccounts) {
      const exists = this.db.prepare('SELECT COUNT(*) as count FROM accounts WHERE name = ?').get(accName) as { count: number };
      if (exists.count === 0) {
        let type = 'Bank'; let color = '#10B981'; let icon = 'Building2';
        const lowerName = accName.toLowerCase();
        if (lowerName.includes('cash') || lowerName.includes('wallet') || lowerName.includes('physical')) { type = 'Cash'; color = '#F59E0B'; icon = 'Wallet'; }
        else if (lowerName.includes('card')) { type = 'Credit Card'; color = '#EF4444'; icon = 'CreditCard'; }
        this.db.prepare('INSERT INTO accounts (id, name, type, balance, currency, accountNumber, color, icon) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(`acc-auto-${Date.now()}-${Math.floor(Math.random() * 1000)}`, accName, type, 0.0, '₹', null, color, icon);
      }
    }

    const allAccounts = this.db.prepare('SELECT * FROM accounts').all() as any[];
    for (const acc of allAccounts) {
      let balance = 0.0;
      for (const tx of allTxs) {
        if (tx.account === acc.name) {
          if (tx.type === 'income') balance += tx.amount;
          else if (tx.type === 'expense') balance -= tx.amount;
        }
      }
      this.db.prepare('UPDATE accounts SET balance = ? WHERE id = ?').run(balance, acc.id);
    }
  }

  // --- Transactions ---
  listTransactions(filters?: { month?: string; type?: string; category?: string }): Transaction[] {
    const month = filters?.month; const type = filters?.type; const category = filters?.category;
    let rows: any[];
    if (!month && !type && !category) {
      rows = this.db.prepare('SELECT * FROM transactions ORDER BY date DESC, id DESC').all();
    } else {
      rows = this.db.prepare(`SELECT * FROM transactions WHERE (? IS NULL OR date LIKE ?) AND (? IS NULL OR type = ?) AND (? IS NULL OR category = ?) ORDER BY date DESC, id DESC`).all(
        month ?? null, month ? `${month}%` : null, type ?? null, type ?? null, category ?? null, category ?? null
      );
    }
    return rows.map(this.toTransaction);
  }

  addTransaction(input: Omit<Transaction, 'id'>): { transaction: Transaction; alert?: BudgetAlert } {
    const tx: Transaction = { ...input, id: nextId('tx') };
    let alert: BudgetAlert | undefined;
    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db.prepare(`INSERT INTO transactions (id, type, amount, currency, category, description, account, payment_method, date, confidence, ai_parsed, engine_used, status, notes, tags, customerId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        tx.id, tx.type, tx.amount, tx.currency, tx.category, tx.description, tx.account, tx.payment_method, tx.date, tx.confidence ?? null, tx.ai_parsed ? 1 : 0, tx.engine_used ?? null, tx.status ?? null, tx.notes ?? null, tx.tags && tx.tags.length ? JSON.stringify(tx.tags) : null, tx.customerId ?? null
      );
      const account = this.db.prepare('SELECT * FROM accounts WHERE name = ?').get(tx.account) as any;
      if (account) {
        const delta = tx.type === 'income' ? tx.amount : -tx.amount;
        this.db.prepare('UPDATE accounts SET balance = ? WHERE id = ?').run(round2(account.balance + delta), account.id);
      }
      if (tx.type === 'expense') alert = this.applyBudgetDelta(tx.category, tx.amount) ?? undefined;
      this.db.exec('COMMIT');
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
    return { transaction: tx, alert };
  }

  deleteTransaction(id: string): boolean {
    const existing = this.db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as any;
    if (!existing) return false;
    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
      const tx = this.toTransaction(existing);
      const account = this.db.prepare('SELECT * FROM accounts WHERE name = ?').get(tx.account) as any;
      if (account) {
        const delta = tx.type === 'income' ? -tx.amount : tx.amount;
        this.db.prepare('UPDATE accounts SET balance = ? WHERE id = ?').run(round2(account.balance + delta), account.id);
      }
      if (tx.type === 'expense') this.applyBudgetDelta(tx.category, -tx.amount);
      this.db.exec('COMMIT');
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
    return true;
  }

  updateTransaction(id: string, patch: Partial<Omit<Transaction, 'id'>>): Transaction | null {
    const existing = this.db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as any;
    if (!existing) return null;
    const old = this.toTransaction(existing);
    const updated: Transaction = { ...old, ...patch, id: old.id };
    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db.prepare(`UPDATE transactions SET type = ?, amount = ?, currency = ?, category = ?, description = ?, account = ?, payment_method = ?, date = ?, confidence = ?, ai_parsed = ?, engine_used = ?, status = ?, notes = ?, tags = ?, customerId = ? WHERE id = ?`).run(
        updated.type, updated.amount, updated.currency, updated.category, updated.description, updated.account, updated.payment_method, updated.date, updated.confidence ?? null, updated.ai_parsed ? 1 : 0, updated.engine_used ?? null, updated.status ?? null, updated.notes ?? null, updated.tags && updated.tags.length ? JSON.stringify(updated.tags) : null, updated.customerId ?? null, updated.id
      );
      const reverseDeltas = (acc: Transaction) => {
        const account = this.db.prepare('SELECT * FROM accounts WHERE name = ?').get(acc.account) as any;
        if (account) {
          const delta = acc.type === 'income' ? -acc.amount : acc.amount;
          this.db.prepare('UPDATE accounts SET balance = ? WHERE id = ?').run(round2(account.balance + delta), account.id);
        }
        if (acc.type === 'expense') this.applyBudgetDelta(acc.category, -acc.amount);
      };
      reverseDeltas(old);
      const applyDeltas = (acc: Transaction) => {
        const account = this.db.prepare('SELECT * FROM accounts WHERE name = ?').get(acc.account) as any;
        if (account) {
          const delta = acc.type === 'income' ? acc.amount : -acc.amount;
          this.db.prepare('UPDATE accounts SET balance = ? WHERE id = ?').run(round2(account.balance + delta), account.id);
        }
        if (acc.type === 'expense') this.applyBudgetDelta(acc.category, acc.amount);
      };
      applyDeltas(updated);
      this.db.exec('COMMIT');
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
    return updated;
  }


  // --- Customers ---

  public listCustomers(): Customer[] {
    return this.db.prepare('SELECT * FROM customers').all() as Customer[];
  }

  public addCustomer(c: Customer): void {
    this.db.prepare(`
      INSERT INTO customers (id, name, labelName, labelColor, baseIncome, baseExpense, service)
      VALUES (@id, @name, @labelName, @labelColor, @baseIncome, @baseExpense, @service)
    `).run(c as any);
  }

  public updateCustomer(c: Customer): void {
    this.db.prepare(`
      UPDATE customers 
      SET name = @name, labelName = @labelName, labelColor = @labelColor, baseIncome = @baseIncome, baseExpense = @baseExpense, service = @service
      WHERE id = @id
    `).run(c as any);
  }

  public deleteCustomer(id: string): void {
    this.db.prepare('DELETE FROM customers WHERE id = ?').run(id);
  }

  // --- Accounts ---
  listAccounts(): Account[] {
    return (this.db.prepare('SELECT * FROM accounts ORDER BY balance DESC').all() as any[]).map(a => ({
      id: a.id, name: a.name, type: a.type, balance: a.balance, currency: a.currency, accountNumber: a.accountNumber ?? undefined, color: a.color, icon: a.icon
    }));
  }

  addAccount(input: Omit<Account, 'id'>): Account {
    const account: Account = { ...input, id: nextId('acc') };
    this.db.prepare('INSERT INTO accounts (id, name, type, balance, currency, accountNumber, color, icon) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      account.id, account.name, account.type, account.balance, account.currency, account.accountNumber ?? null, account.color, account.icon
    );
    return account;
  }

  // --- Budgets ---
  listBudgets(): Budget[] {
    return (this.db.prepare('SELECT * FROM budgets').all() as any[]).map(b => ({
      id: b.id, category: b.category, monthlyLimit: b.monthlyLimit, spent: b.spent, period: b.period, alertThreshold: b.alertThreshold, approachingSent: !!b.approachingSent, exceededSent: !!b.exceededSent
    }));
  }

  addBudget(input: Omit<Budget, 'id'>): Budget {
    const budget: Budget = { ...input, id: nextId('b'), alertThreshold: input.alertThreshold || DEFAULT_ALERT_THRESHOLD };
    this.db.prepare('INSERT INTO budgets (id, category, monthlyLimit, spent, period, alertThreshold, approachingSent, exceededSent) VALUES (?, ?, ?, ?, ?, ?, 0, 0)').run(
      budget.id, budget.category, budget.monthlyLimit, budget.spent, budget.period, budget.alertThreshold
    );
    return budget;
  }

  updateBudget(id: string, patch: Partial<Omit<Budget, 'id'>>): Budget | null {
    const existing = this.db.prepare('SELECT * FROM budgets WHERE id = ?').get(id) as any;
    if (!existing) return null;
    const updated: Budget = {
      id: existing.id, category: patch.category ?? existing.category, monthlyLimit: patch.monthlyLimit ?? existing.monthlyLimit, spent: patch.spent ?? existing.spent, period: patch.period ?? existing.period, alertThreshold: patch.alertThreshold ?? existing.alertThreshold ?? DEFAULT_ALERT_THRESHOLD
    };
    this.db.prepare('UPDATE budgets SET category = ?, monthlyLimit = ?, spent = ?, period = ?, alertThreshold = ?, approachingSent = 0, exceededSent = 0 WHERE id = ?').run(
      updated.category, updated.monthlyLimit, updated.spent, updated.period, updated.alertThreshold, updated.id
    );
    return { ...updated, approachingSent: false, exceededSent: false };
  }

  deleteBudget(id: string): boolean {
    const res = this.db.prepare('DELETE FROM budgets WHERE id = ?').run(id) as { changes: number };
    return res.changes > 0;
  }

  // --- Categories ---
  listCategories(): Category[] {
    return (this.db.prepare('SELECT * FROM categories ORDER BY type, parent, name').all() as any[]).map(this.toCategory);
  }

  ensureCategory(path: string, type: 'income' | 'expense' | 'transfer' = 'expense'): Category {
    const existing = this.db.prepare('SELECT * FROM categories WHERE path = ?').get(path) as any;
    if (existing) return this.toCategory(existing);
    const parent = path.includes(SEPARATOR) ? path.split(SEPARATOR)[0] : path;
    const name = path.includes(SEPARATOR) ? path.split(SEPARATOR).slice(1).join(SEPARATOR) : path;
    const color = type === 'income' ? '#10B981' : type === 'transfer' ? '#3B82F6' : '#EF4444';
    const cat: Category = { id: nextId('cat'), name, path, parent, type, icon: type === 'income' ? 'TrendingUp' : type === 'transfer' ? 'ArrowLeftRight' : 'Tag', color, keywords: [name.toLowerCase()] };
    this.db.prepare('INSERT INTO categories (id, name, path, parent, type, icon, color, budgetLimit, keywords) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      cat.id, cat.name, cat.path, cat.parent ?? null, cat.type, cat.icon, cat.color, null, cat.keywords ? JSON.stringify(cat.keywords) : null
    );
    return cat;
  }

  addCategory(input: { name: string; parent?: string; type: 'income' | 'expense' | 'transfer'; icon?: string; color?: string; keywords?: string[] }): Category | null {
    const path = input.parent && input.parent.trim() ? `${input.parent.trim()}${SEPARATOR}${input.name.trim()}` : input.name.trim();
    if (this.db.prepare('SELECT * FROM categories WHERE path = ?').get(path)) return null;
    const parentRow = input.parent && input.parent.trim() ? (this.db.prepare('SELECT * FROM categories WHERE path = ?').get(input.parent.trim()) as any) : undefined;
    const parentName = parentRow ? parentRow.name : (input.parent?.trim() || path);
    const color = input.color || (input.type === 'income' ? '#10B981' : input.type === 'transfer' ? '#3B82F6' : '#EF4444');
    const cat: Category = { id: nextId('cat'), name: input.name.trim(), path, parent: parentName, type: input.type, icon: input.icon || (input.type === 'income' ? 'TrendingUp' : input.type === 'transfer' ? 'ArrowLeftRight' : 'Tag'), color, keywords: input.keywords?.length ? input.keywords : [input.name.trim().toLowerCase()] };
    this.db.prepare('INSERT INTO categories (id, name, path, parent, type, icon, color, budgetLimit, keywords) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      cat.id, cat.name, cat.path, cat.parent ?? null, cat.type, cat.icon, cat.color, null, cat.keywords ? JSON.stringify(cat.keywords) : null
    );
    return cat;
  }

  updateCategory(id: string, patch: { name?: string; parent?: string; type?: 'income' | 'expense' | 'transfer'; icon?: string; color?: string; keywords?: string[] }): Category | null {
    const existing = this.db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as any;
    if (!existing) return null;
    const name = patch.name?.trim() || existing.name;
    const parent = patch.parent !== undefined ? (patch.parent?.trim() || null) : existing.parent;
    const path = parent ? `${parent}${SEPARATOR}${name}` : name;
    const type = patch.type ?? existing.type;
    const color = patch.color || existing.color;
    const keywords = patch.keywords && patch.keywords.length ? patch.keywords : (existing.keywords ? JSON.parse(existing.keywords) : [name.toLowerCase()]);
    this.db.prepare('UPDATE categories SET name = ?, path = ?, parent = ?, type = ?, icon = ?, color = ?, keywords = ? WHERE id = ?').run(
      name, path, parent, type, patch.icon || existing.icon, color, JSON.stringify(keywords), id
    );
    return this.toCategory({ id, name, path, parent, type, icon: patch.icon || existing.icon, color, budgetLimit: existing.budgetLimit, keywords: JSON.stringify(keywords) });
  }

  deleteCategory(id: string): boolean {
    const existing = this.db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as any;
    if (!existing) return false;
    if (existing.parent === null || existing.path === existing.parent) {
      this.db.prepare('DELETE FROM categories WHERE parent = ? OR id = ?').run(existing.path, id);
    } else {
      this.db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    }
    return true;
  }

  // --- Helpers ---
  private toTransaction(row: any): Transaction {
    return {
      id: row.id, type: row.type, amount: row.amount, currency: row.currency, category: row.category, description: row.description, account: row.account, payment_method: row.payment_method, date: row.date, confidence: row.confidence ?? undefined, ai_parsed: row.ai_parsed ? true : undefined, engine_used: row.engine_used ?? undefined, status: row.status ?? undefined, notes: row.notes ?? undefined, tags: row.tags ? JSON.parse(row.tags) : undefined, customerId: row.customerId ?? undefined
    };
  }
  private toCategory(row: any): Category {
    return {
      id: row.id, name: row.name, path: row.path, parent: row.parent ?? undefined, type: row.type, icon: row.icon, color: row.color, budgetLimit: row.budgetLimit ?? undefined, keywords: row.keywords ? JSON.parse(row.keywords) : undefined
    };
  }
  private applyBudgetDelta(category: string, delta: number): BudgetAlert | null {
    const all = this.db.prepare('SELECT * FROM budgets').all() as any[];
    const topLevel = category.split(SEPARATOR)[0] ?? category;
    const rows = all.filter(b => b.category === category || (!b.category.includes(SEPARATOR) && b.category === topLevel));
    if (rows.length === 0) return null;
    let mostSevere: BudgetAlert | null = null;
    for (const row of rows) {
      const newSpent = round2(row.spent + delta);
      const limit = row.monthlyLimit;
      const threshold = round2(limit * (row.alertThreshold / 100));
      let { approachingSent, exceededSent } = row;
      let alert: BudgetAlert | null = null;
      if (delta > 0 && limit > 0) {
        if (!approachingSent && newSpent >= threshold) { approachingSent = 1; alert = { type: 'approaching', category: row.category, spent: newSpent, monthlyLimit: limit, alertThreshold: row.alertThreshold }; }
        if (!exceededSent && newSpent >= limit) { exceededSent = 1; alert = { type: 'exceeded', category: row.category, spent: newSpent, monthlyLimit: limit, alertThreshold: row.alertThreshold }; }
      } else if (delta < 0 && limit > 0) {
        if (approachingSent && newSpent < threshold) approachingSent = 0;
        if (exceededSent && newSpent < limit) exceededSent = 0;
      }
      this.db.prepare('UPDATE budgets SET spent = ?, approachingSent = ?, exceededSent = ? WHERE id = ?').run(newSpent, approachingSent, exceededSent, row.id);
      if (alert && (!mostSevere || (alert.type === 'exceeded' && mostSevere.type !== 'exceeded'))) mostSevere = alert;
    }
    return mostSevere;
  }
}

const userStores = new Map<string, UserStore>();

export function getStore(userId: string): UserStore {
  if (!userStores.has(userId)) {
    userStores.set(userId, new UserStore(userId));
  }
  return userStores.get(userId)!;
}
