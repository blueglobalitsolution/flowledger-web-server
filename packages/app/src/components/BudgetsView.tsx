import React, { useMemo, useState } from 'react';
import { PieChart as PieIcon, Trash2, Plus, Pencil } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Budget, Category, Transaction } from '@shared/types';

interface BudgetsViewProps {
  budgets: Budget[];
  categories: Category[];
  transactions: Transaction[];
  onCreateBudget: (input: Omit<Budget, 'id'>) => Promise<void>;
  onUpdateBudget: (id: string, patch: Partial<Omit<Budget, 'id'>>) => Promise<void>;
  onDeleteBudget: (id: string) => Promise<void>;
  onCreateCategory: (input: Omit<Category, 'id'>) => Promise<void>;
  onUpdateCategory: (id: string, patch: Partial<Omit<Category, 'id'>>) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
}

const COLORS = ['#EF4444', '#F59E0B', '#EC4899', '#3B82F6', '#8B5CF6', '#10B981', '#14B8A6'];
const SEP = ' > ';

export const BudgetsView: React.FC<BudgetsViewProps> = ({
  budgets,
  categories,
  transactions,
  onCreateBudget,
  onUpdateBudget,
  onDeleteBudget,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [limit, setLimit] = useState('');
  const [threshold, setThreshold] = useState('90');
  const [topCategory, setTopCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const topLevels = useMemo(
    () => categories.filter((c) => !c.path || !c.path.includes(SEP)),
    [categories]
  );
  const subcats = useMemo(
    () => categories.filter((c) => c.parent === topCategory && c.path?.includes(SEP)),
    [categories, topCategory]
  );

  const categoryExpensesMap: Record<string, number> = {};
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      categoryExpensesMap[t.category] = (categoryExpensesMap[t.category] || 0) + t.amount;
    });

  const pieChartData = Object.keys(categoryExpensesMap)
    .map((cat) => ({ name: cat, value: categoryExpensesMap[cat] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const startEdit = (b: Budget) => {
    setEditingId(b.id);
    setLimit(String(b.monthlyLimit));
    setThreshold(String(b.alertThreshold));
    const idx = b.category.indexOf(SEP);
    if (idx === -1) {
      setTopCategory(b.category);
      setSubCategory('');
    } else {
      setTopCategory(b.category.slice(0, idx));
      setSubCategory(b.category.slice(idx + SEP.length));
    }
  };

  const submit = async () => {
    if (!topCategory || saving) return;
    const monthlyLimit = Number(limit);
    if (!monthlyLimit || monthlyLimit <= 0) return;
    const category = subCategory ? `${topCategory}${SEP}${subCategory}` : topCategory;
    const input = {
      category,
      monthlyLimit,
      spent: 0,
      period: new Date().toISOString().slice(0, 7),
      alertThreshold: Number(threshold) || 90,
    };
    setSaving(true);
    try {
      if (editingId) {
        await onUpdateBudget(editingId, input);
      } else {
        await onCreateBudget(input);
      }
      setEditingId(null);
      setLimit('');
      setTopCategory('');
      setSubCategory('');
    } finally {
      setSaving(false);
    }
  };

  const editingExisting = editingId ? budgets.find((b) => b.id === editingId) : null;

  return (
    <div className="space-y-6 pb-12 text-white">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-2">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <PieIcon className="w-5 h-5" />
          </span>
          <h2 className="text-xl font-bold tracking-tight">Budgets & Category Analytics</h2>
        </div>
        <p className="text-xs text-slate-400">
          Set a monthly cap on a category or a subcategory (e.g. "Transportation" covers all of Petrol/Uber/Taxi).
          FlowLedger alerts you at your threshold and again when the cap is hit.
        </p>
      </div>

      {/* Set / edit budget form */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white">
          {editingExisting ? `Edit budget for ${editingExisting.category}` : 'Set a budget'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_200px_120px_auto] gap-3 items-end">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-slate-400">Category</label>
            <select
              value={topCategory}
              onChange={(e) => {
                setTopCategory(e.target.value);
                setSubCategory('');
              }}
              className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Top category…</option>
              {topLevels.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-slate-400">Subcategory (optional)</label>
            <select
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              disabled={!topCategory}
              className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm disabled:opacity-40"
            >
              <option value="">Whole {topCategory || 'category'}</option>
              {subcats.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-slate-400">Monthly limit (₹)</label>
            <input
              type="number"
              min={1}
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder="e.g. 5000"
              className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-slate-400">Alert at %</label>
            <input
              type="number"
              min={1}
              max={100}
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={saving || !topCategory || !Number(limit)}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-sm font-semibold"
            >
              {saving ? 'Saving…' : editingExisting ? 'Save changes' : 'Set limit'}
            </button>
            {editingExisting && (
              <button
                onClick={() => {
                  setEditingId(null);
                  setLimit('');
                  setTopCategory('');
                  setSubCategory('');
                }}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Expense Breakdown Pie Chart */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center justify-between">
            <span>Top Category Spending</span>
            <span className="text-xs font-mono text-slate-400">This month</span>
          </h3>
          {pieChartData.length === 0 ? (
            <p className="text-xs text-slate-500">No expenses yet.</p>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${String(name).split(SEP)[0]} (${((percent || 0) * 100).toFixed(0)}%)`}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff', fontSize: '12px' }}
                    formatter={(value: any) => [`₹${value}`, 'AmountSpent']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Budget Health Cards */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white">Monthly Budgets & Alerts</h3>
          {budgets.length === 0 && <p className="text-xs text-slate-500">No budgets yet. Use the form to set your first limit.</p>}
          <div className="space-y-4">
            {budgets.map((b) => {
              const pct = Math.min(100, Math.round((b.spent / b.monthlyLimit) * 100));
              const reached = b.spent >= b.monthlyLimit;
              const isWarning = pct >= b.alertThreshold;
              return (
                <div key={b.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-2">
                      {b.category}
                      {reached ? (
                        <span className="text-[10px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded border border-red-500/30 font-mono">🚨 Exceeded</span>
                      ) : isWarning ? (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30 font-mono">⚠️ Warning</span>
                      ) : null}
                    </span>
                    <span className="font-mono text-slate-300">
                      ₹{b.spent.toLocaleString()} / ₹{b.monthlyLimit.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all ${reached ? 'bg-red-500' : isWarning ? 'bg-amber-400' : 'bg-emerald-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>{pct}% (alert at {b.alertThreshold}%)</span>
                    <span>Remaining: ₹{(b.monthlyLimit - b.spent).toLocaleString()}</span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => startEdit(b)} className="flex items-center gap-1 text-[10px] bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded font-semibold">
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                    <button onClick={() => onDeleteBudget(b.id)} className="flex items-center gap-1 text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-300 px-2 py-1 rounded font-semibold border border-red-500/20">
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Category management */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Manage Categories ({topLevels.length} groups)</h3>
          <button
            onClick={() => {
              const name = window.prompt('New top-level category name');
              if (name?.trim()) onCreateCategory({ name: name.trim(), type: 'expense', icon: 'Tag', color: '#EF4444' });
            }}
            className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded font-semibold"
          >
            <Plus className="w-3 h-3" /> Add category
          </button>
        </div>
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {topLevels.map((c) => {
            const children = categories.filter((x) => x.parent === c.name && x.path?.includes(SEP));
            return (
              <div key={c.id} className="bg-slate-950 rounded-lg border border-slate-800 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                    {c.name}
                    <span className="text-[9px] font-mono text-slate-500">{c.type}</span>
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        const sub = window.prompt(`Subcategory under ${c.name}`);
                        if (sub?.trim()) onCreateCategory({ name: sub.trim(), parent: c.name, type: c.type, icon: c.icon, color: c.color });
                      }}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded font-semibold"
                    >
                      + Subcategory
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete "${c.name}" and all its subcategories?`)) onDeleteCategory(c.id);
                      }}
                      className="text-[10px] bg-red-500/10 text-red-300 hover:bg-red-500/20 px-2 py-0.5 rounded font-semibold border border-red-500/20"
                    >
                      <Trash2 className="w-3 h-3 inline" />
                    </button>
                  </div>
                </div>
                {children.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5 pl-3">
                    {children.map((s) => (
                      <span key={s.id} className="text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full text-slate-300">
                        {s.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
