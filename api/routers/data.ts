import { Router } from 'express';
import { getStore, DEFAULT_ALERT_THRESHOLD } from '../store';
import { requireRole } from '../auth';
import { broadcastChange, broadcastEvent } from '../events';

export const dataRouter: Router = Router();

const isUser = requireRole('user', 'admin', 'superadmin');

dataRouter.get('/transactions', isUser, (req, res) => {
  const store = getStore((req as any).auth.sub);
  const { month, type, category } = req.query;
  const filters =
    typeof month === 'string' || typeof type === 'string' || typeof category === 'string'
      ? {
          month: typeof month === 'string' ? month : undefined,
          type: typeof type === 'string' ? type : undefined,
          category: typeof category === 'string' ? category : undefined,
        }
      : undefined;
  res.json({ transactions: store.listTransactions(filters) });
});

dataRouter.post('/transactions', isUser, (req, res) => {
  const store = getStore((req as any).auth.sub);
  const body = req.body ?? {};
  if (typeof body.amount !== 'number' || Number.isNaN(body.amount)) {
    res.status(400).json({ error: 'amount is required and must be a number.' });
    return;
  }
  const { transaction: tx, alert } = store.addTransaction({
    type: body.type || 'expense',
    amount: body.amount,
    currency: body.currency || '?',
    category: body.category || 'Other',
    description: body.description || 'Untitled transaction',
    account: body.account || 'Physical Wallet',
    payment_method: body.payment_method || 'UPI',
    date: body.date || new Date().toISOString().split('T')[0],
    confidence: body.confidence,
    ai_parsed: body.ai_parsed,
    engine_used: body.engine_used,
    status: body.status || 'completed',
    notes: body.notes,
    tags: Array.isArray(body.tags) ? body.tags : undefined,
  });
  broadcastChange();
  if (alert) broadcastEvent('budget-alert', alert);
  store.ensureCategory(tx.category, tx.type === 'income' ? 'income' : tx.type === 'transfer' ? 'transfer' : 'expense');
  res.status(201).json({ transaction: tx, alert: alert ?? null });
});

dataRouter.delete('/transactions/:id', isUser, (req, res) => {
  const store = getStore((req as any).auth.sub);
  const deleted = store.deleteTransaction(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Transaction not found.' });
    return;
  }
  broadcastChange();
  res.json({ success: true });
});


// --- Customers ---

dataRouter.get('/customers', isUser, (req, res) => {
  const store = getStore((req as any).auth.sub);
  res.json({ customers: store.listCustomers() });
});

dataRouter.post('/customers', isUser, (req, res) => {
  const store = getStore((req as any).auth.sub);
  const body = req.body ?? {};
  
  if (!body.id || !body.name) {
    res.status(400).json({ error: 'id and name are required' });
    return;
  }
  
  const c = {
    id: body.id,
    name: body.name,
    labelName: body.labelName || 'VIP',
    labelColor: typeof body.labelColor === 'number' ? body.labelColor : 0,
    baseIncome: typeof body.baseIncome === 'number' ? body.baseIncome : 0,
    baseExpense: typeof body.baseExpense === 'number' ? body.baseExpense : 0,
    service: body.service || ''
  };
  
  store.addCustomer(c as any);
  broadcastChange();
  res.status(201).json({ customer: c });
});

dataRouter.put('/customers/:id', isUser, (req, res) => {
  const store = getStore((req as any).auth.sub);
  const body = req.body ?? {};
  
  const c = {
    id: req.params.id,
    name: body.name,
    labelName: body.labelName,
    labelColor: body.labelColor,
    baseIncome: body.baseIncome,
    baseExpense: body.baseExpense,
    service: body.service
  };
  
  store.updateCustomer(c as any);
  broadcastChange();
  res.json({ customer: c });
});

dataRouter.delete('/customers/:id', isUser, (req, res) => {
  const store = getStore((req as any).auth.sub);
  store.deleteCustomer(req.params.id);
  broadcastChange();
  res.json({ status: 'ok' });
});

dataRouter.get('/accounts', isUser, (req, res) => {
  const store = getStore((req as any).auth.sub);
  res.json({ accounts: store.listAccounts() });
});

dataRouter.post('/accounts', isUser, (req, res) => {
  const store = getStore((req as any).auth.sub);
  const body = req.body ?? {};
  if (!body.name || typeof body.name !== 'string') {
    res.status(400).json({ error: 'name is required.' });
    return;
  }
  const account = store.addAccount({
    name: body.name,
    type: body.type || 'Bank',
    balance: Number(body.balance) || 0,
    currency: body.currency || '?',
    accountNumber: body.accountNumber,
    color: body.color || '#3B82F6',
    icon: body.icon || 'Landmark',
  });
  broadcastChange();
  res.status(201).json({ account });
});

dataRouter.get('/budgets', isUser, (req, res) => {
  const store = getStore((req as any).auth.sub);
  res.json({ budgets: store.listBudgets() });
});

dataRouter.post('/budgets', isUser, (req, res) => {
  const store = getStore((req as any).auth.sub);
  const body = req.body ?? {};
  if (!body.category || typeof body.category !== 'string') {
    res.status(400).json({ error: 'category is required.' });
    return;
  }
  const budget = store.addBudget({
    category: body.category,
    monthlyLimit: Number(body.monthlyLimit) || 0,
    spent: Number(body.spent) || 0,
    period: body.period || new Date().toISOString().slice(0, 7),
    alertThreshold: Number(body.alertThreshold) || DEFAULT_ALERT_THRESHOLD,
  });
  store.ensureCategory(budget.category, 'expense');
  broadcastChange();
  res.status(201).json({ budget });
});

dataRouter.put('/budgets/:id', isUser, (req, res) => {
  const store = getStore((req as any).auth.sub);
  const body = req.body ?? {};
  const budget = store.updateBudget(req.params.id, {
    category: typeof body.category === 'string' ? body.category : undefined,
    monthlyLimit: body.monthlyLimit !== undefined ? Number(body.monthlyLimit) || 0 : undefined,
    spent: body.spent !== undefined ? Number(body.spent) || 0 : undefined,
    period: typeof body.period === 'string' ? body.period : undefined,
    alertThreshold: body.alertThreshold !== undefined ? Number(body.alertThreshold) || DEFAULT_ALERT_THRESHOLD : undefined,
  });
  if (!budget) {
    res.status(404).json({ error: 'Budget not found.' });
    return;
  }
  if (body.category && typeof body.category === 'string') {
    store.ensureCategory(budget.category, 'expense');
  }
  broadcastChange();
  res.json({ budget });
});

dataRouter.delete('/budgets/:id', isUser, (req, res) => {
  const store = getStore((req as any).auth.sub);
  if (!store.deleteBudget(req.params.id)) {
    res.status(404).json({ error: 'Budget not found.' });
    return;
  }
  broadcastChange();
  res.json({ success: true });
});

dataRouter.get('/categories', isUser, (req, res) => {
  const store = getStore((req as any).auth.sub);
  res.json({ categories: store.listCategories() });
});

dataRouter.post('/categories', isUser, (req, res) => {
  const store = getStore((req as any).auth.sub);
  const body = req.body ?? {};
  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    res.status(400).json({ error: 'name is required.' });
    return;
  }
  const type: 'income' | 'expense' | 'transfer' = ['income', 'expense', 'transfer'].includes(body.type) ? body.type : 'expense';
  const cat = store.addCategory({
    name: body.name,
    parent: typeof body.parent === 'string' ? body.parent : undefined,
    type,
    icon: typeof body.icon === 'string' ? body.icon : undefined,
    color: typeof body.color === 'string' ? body.color : undefined,
    keywords: Array.isArray(body.keywords) ? body.keywords.map(String) : undefined,
  });
  if (!cat) {
    res.status(409).json({ error: 'A category with this name already exists.' });
    return;
  }
  broadcastChange();
  res.status(201).json({ category: cat });
});

dataRouter.put('/categories/:id', isUser, (req, res) => {
  const store = getStore((req as any).auth.sub);
  const body = req.body ?? {};
  const cat = store.updateCategory(req.params.id, {
    name: typeof body.name === 'string' ? body.name : undefined,
    parent: body.parent !== undefined ? (body.parent === null ? null : String(body.parent)) : undefined,
    type: ['income', 'expense', 'transfer'].includes(body.type) ? body.type : undefined,
    icon: typeof body.icon === 'string' ? body.icon : undefined,
    color: typeof body.color === 'string' ? body.color : undefined,
    keywords: Array.isArray(body.keywords) ? body.keywords.map(String) : undefined,
  });
  if (!cat) {
    res.status(404).json({ error: 'Category not found.' });
    return;
  }
  broadcastChange();
  res.json({ category: cat });
});

dataRouter.delete('/categories/:id', isUser, (req, res) => {
  const store = getStore((req as any).auth.sub);
  if (!store.deleteCategory(req.params.id)) {
    res.status(404).json({ error: 'Category not found.' });
    return;
  }
  broadcastChange();
  res.json({ success: true });
});
