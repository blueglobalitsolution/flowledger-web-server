import React, { useMemo, useState } from 'react';
import {
  PieChart as PieIcon,
  Trash2,
  Plus,
  Pencil,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Wallet,
  Tag,
  Search,
  X,
  SlidersHorizontal,
  Layers,
  ShieldAlert,
  BarChart3,
} from 'lucide-react';
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

const COLORS = ['#8b63e6', '#bcfc6a', '#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1'];
const SEP = ' > ';

const COLOR_PALETTE = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', 
  '#EC4899', '#14B8A6', '#6366F1', '#F43F5E', '#84CC16'
];

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
  // Form State
  const [limit, setLimit] = useState('');
  const [threshold, setThreshold] = useState('90');
  const [topCategory, setTopCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // View & Filter States
  const [activeChartTab, setActiveChartTab] = useState<'chart' | 'list'>('chart');
  const [budgetFilter, setBudgetFilter] = useState<'all' | 'alert' | 'healthy'>('all');
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryTypeFilter, setCategoryTypeFilter] = useState<'all' | 'expense' | 'income' | 'transfer'>('all');

  // Custom Modal States (Replacing window.prompt/confirm)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [catColor, setCatColor] = useState('#8B5CF6');

  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false);
  const [parentCatName, setParentCatName] = useState('');
  const [subcatName, setSubcatName] = useState('');

  const [deleteModalItem, setDeleteModalItem] = useState<{
    type: 'budget' | 'category';
    id: string;
    name: string;
  } | null>(null);

  // Derived Categories Data
  const topLevels = useMemo(
    () => categories.filter((c) => !c.path || !c.path.includes(SEP)),
    [categories]
  );

  const subcats = useMemo(
    () => categories.filter((c) => c.parent === topCategory && c.path?.includes(SEP)),
    [categories, topCategory]
  );

  // Category Expenses Aggregation
  const categoryExpensesMap: Record<string, number> = {};
  let totalExpensesSum = 0;

  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      categoryExpensesMap[t.category] = (categoryExpensesMap[t.category] || 0) + t.amount;
      totalExpensesSum += t.amount;
    });

  const pieChartData = Object.keys(categoryExpensesMap)
    .map((cat) => ({ name: cat, value: categoryExpensesMap[cat] }))
    .sort((a, b) => b.value - a.value);

  const topPieChartData = pieChartData.slice(0, 7);

  // KPI Aggregations
  const totalBudgetCap = useMemo(() => budgets.reduce((acc, b) => acc + b.monthlyLimit, 0), [budgets]);
  const totalBudgetSpent = useMemo(() => budgets.reduce((acc, b) => acc + b.spent, 0), [budgets]);
  const overallUtilization = totalBudgetCap > 0 ? Math.min(100, Math.round((totalBudgetSpent / totalBudgetCap) * 100)) : 0;
  const alertCount = useMemo(
    () =>
      budgets.filter(
        (b) => b.spent >= b.monthlyLimit || (b.spent / b.monthlyLimit) * 100 >= b.alertThreshold
      ).length,
    [budgets]
  );

  // Budget Form Handlers
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

  const cancelEdit = () => {
    setEditingId(null);
    setLimit('');
    setTopCategory('');
    setSubCategory('');
    setThreshold('90');
  };

  const submitBudget = async () => {
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
      cancelEdit();
    } finally {
      setSaving(false);
    }
  };

  // Category Modal Submit
  const handleSaveCategory = async () => {
    if (!catName.trim()) return;
    await onCreateCategory({
      name: catName.trim(),
      type: catType,
      icon: 'Tag',
      color: catColor,
    });
    setCatName('');
    setIsCategoryModalOpen(false);
  };

  // Subcategory Modal Submit
  const handleSaveSubcategory = async () => {
    if (!subcatName.trim() || !parentCatName) return;
    const parentObj = categories.find((c) => c.name === parentCatName);
    await onCreateCategory({
      name: subcatName.trim(),
      parent: parentCatName,
      type: parentObj?.type || 'expense',
      icon: parentObj?.icon || 'Tag',
      color: parentObj?.color || '#8B5CF6',
    });
    setSubcatName('');
    setParentCatName('');
    setIsSubcategoryModalOpen(false);
  };

  // Delete Action Dispatcher
  const handleConfirmDelete = async () => {
    if (!deleteModalItem) return;
    if (deleteModalItem.type === 'budget') {
      await onDeleteBudget(deleteModalItem.id);
    } else if (deleteModalItem.type === 'category') {
      await onDeleteCategory(deleteModalItem.id);
    }
    setDeleteModalItem(null);
  };

  // Filtered Budgets List
  const filteredBudgets = useMemo(() => {
    return budgets.filter((b) => {
      const pct = (b.spent / b.monthlyLimit) * 100;
      const isAlert = b.spent >= b.monthlyLimit || pct >= b.alertThreshold;
      if (budgetFilter === 'alert') return isAlert;
      if (budgetFilter === 'healthy') return !isAlert;
      return true;
    });
  }, [budgets, budgetFilter]);

  // Filtered Top Level Categories
  const filteredTopLevels = useMemo(() => {
    return topLevels.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
        categories.some(
          (sub) =>
            sub.parent === c.name &&
            sub.name.toLowerCase().includes(categorySearch.toLowerCase())
        );
      const matchesType = categoryTypeFilter === 'all' || c.type === categoryTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [topLevels, categories, categorySearch, categoryTypeFilter]);

  const editingExisting = editingId ? budgets.find((b) => b.id === editingId) : null;

  return (
    <div className="space-y-6 pb-16 text-white max-w-7xl mx-auto">
      {/* ── Page Header Banner ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900/90 to-purple-950/40 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-inner">
                <PieIcon className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                  Budgets & Category Analytics
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
                  Set monthly caps across top categories or subcategories. FlowLedger monitors spending limits and triggers intelligent alerts before thresholds are breached.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-lg shadow-purple-600/20 active:scale-95"
            >
              <Plus className="w-4 h-4" /> Add Group Category
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Budgeted Cap */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm transition-all hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Total Monthly Limit</span>
            <span className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-white font-mono tracking-tight">
            ₹{totalBudgetCap.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-2 font-medium">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Configured across {budgets.length} budget caps</span>
          </div>
        </div>

        {/* Budget Spent */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm transition-all hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Budgeted Spending</span>
            <span className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-white font-mono tracking-tight">
            ₹{totalBudgetSpent.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-2 font-medium">
            <span>Remaining balance:</span>
            <span className="font-mono text-emerald-400 font-bold">
              ₹{Math.max(0, totalBudgetCap - totalBudgetSpent).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Overall Utilization */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm transition-all hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Overall Cap Utilization</span>
            <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <BarChart3 className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold text-white font-mono tracking-tight">
              {overallUtilization}%
            </div>
            <span className="text-xs text-slate-400 font-mono">utilized</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-1.5 mt-3 overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-500 ${
                overallUtilization >= 100
                  ? 'bg-red-500'
                  : overallUtilization >= 85
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
              style={{ width: `${overallUtilization}%` }}
            />
          </div>
        </div>

        {/* Active Alerts */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm transition-all hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Budget Alerts</span>
            <span
              className={`p-2 rounded-xl border ${
                alertCount > 0
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-white font-mono tracking-tight flex items-center gap-2">
            {alertCount}
            {alertCount > 0 && (
              <span className="text-xs font-sans bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                Action needed
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-2 font-medium">
            {alertCount === 0 ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> All budgets within safe limits
              </span>
            ) : (
              <span className="text-amber-300">Budgets approaching or over limit</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Set / Edit Budget Form Card ── */}
      <div
        className={`bg-slate-900/90 border ${
          editingExisting ? 'border-purple-500/50 shadow-purple-500/10' : 'border-slate-800'
        } rounded-3xl p-6 sm:p-7 shadow-xl space-y-5 transition-all`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <SlidersHorizontal className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-white">
              {editingExisting ? `Edit Budget Cap: ${editingExisting.category}` : 'Set New Budget Cap'}
            </h3>
          </div>
          {editingExisting && (
            <span className="text-xs bg-purple-500/20 text-purple-300 font-medium px-3 py-1 rounded-full border border-purple-500/30 animate-pulse">
              Editing Active Budget
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
          {/* Main Category */}
          <div className="lg:col-span-3 space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Category *</span>
              <span className="text-[10px] text-slate-400 font-normal">Top Level</span>
            </label>
            <select
              value={topCategory}
              onChange={(e) => {
                setTopCategory(e.target.value);
                setSubCategory('');
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-medium text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            >
              <option value="">Select Category…</option>
              {topLevels.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>

          {/* Subcategory */}
          <div className="lg:col-span-3 space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Subcategory</span>
              <span className="text-[10px] text-slate-400 font-normal">Optional</span>
            </label>
            <select
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              disabled={!topCategory}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-medium text-white disabled:opacity-40 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            >
              <option value="">Whole {topCategory || 'Category'}</option>
              {subcats.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Monthly Limit */}
          <div className="lg:col-span-3 space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Monthly Limit (₹) *</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">
                ₹
              </span>
              <input
                type="number"
                min={1}
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder="5,000"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3.5 py-2.5 text-sm font-mono text-white placeholder-slate-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Alert Threshold */}
          <div className="lg:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Alert at %</label>
            <select
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-medium text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            >
              <option value="75">75% (Early)</option>
              <option value="80">80%</option>
              <option value="85">85%</option>
              <option value="90">90% (Standard)</option>
              <option value="95">95% (Late)</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="lg:col-span-1 flex gap-2">
            <button
              onClick={submitBudget}
              disabled={saving || !topCategory || !Number(limit)}
              className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-sm font-bold text-white shadow-lg shadow-purple-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              {saving ? 'Saving…' : editingExisting ? 'Save' : 'Set Limit'}
            </button>
            {editingExisting && (
              <button
                onClick={cancelEdit}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                title="Cancel edit"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Preset Limit Helper Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] text-slate-500 font-medium">Quick Amount Presets:</span>
          {[2000, 5000, 10000, 25000, 50000].map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => setLimit(String(amt))}
              className="text-[11px] font-mono bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-lg transition-all"
            >
              +₹{amt.toLocaleString('en-IN')}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Split Section: Analytics & Budget Cards ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Category Expense Breakdown */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-purple-400" />
                Category Spending Analytics
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Top expense categories this period</p>
            </div>
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveChartTab('chart')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeChartTab === 'chart'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Chart
              </button>
              <button
                onClick={() => setActiveChartTab('list')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeChartTab === 'list'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                List
              </button>
            </div>
          </div>

          {topPieChartData.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center mx-auto text-slate-500">
                <PieIcon className="w-6 h-6" />
              </div>
              <div className="text-xs text-slate-400 font-medium">No expense transactions recorded yet.</div>
            </div>
          ) : activeChartTab === 'chart' ? (
            <div className="space-y-4">
              <div className="h-64 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topPieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {topPieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#181d27',
                        borderColor: '#252b37',
                        borderRadius: '0.75rem',
                        color: '#fff',
                        fontSize: '12px',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                      }}
                      formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Amount']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Donut Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                    Total Expense
                  </span>
                  <span className="text-base font-bold font-mono text-white">
                    ₹{totalExpensesSum.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Legend Badges */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60">
                {topPieChartData.slice(0, 6).map((item, idx) => {
                  const share = totalExpensesSum > 0 ? ((item.value / totalExpensesSum) * 100).toFixed(1) : 0;
                  return (
                    <div key={item.name} className="flex items-center gap-2 text-xs truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span className="truncate text-slate-300 font-medium">{item.name.split(SEP)[0]}</span>
                      <span className="ml-auto font-mono text-[11px] text-slate-400">{share}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Ranked List View */
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {pieChartData.map((item, idx) => {
                const share = totalExpensesSum > 0 ? Math.round((item.value / totalExpensesSum) * 100) : 0;
                return (
                  <div key={item.name} className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        {item.name}
                      </span>
                      <span className="font-mono text-slate-300 font-semibold">
                        ₹{item.value.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${share}%`,
                          backgroundColor: COLORS[idx % COLORS.length],
                        }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono text-right">{share}% of total spend</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Monthly Budgets & Health Cards */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
                Monthly Budgets & Alerts ({budgets.length})
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Real-time cap monitoring & alert status</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
              <button
                onClick={() => setBudgetFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  budgetFilter === 'all'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({budgets.length})
              </button>
              <button
                onClick={() => setBudgetFilter('alert')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  budgetFilter === 'alert'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Alerts ({alertCount})
              </button>
              <button
                onClick={() => setBudgetFilter('healthy')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  budgetFilter === 'healthy'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Safe ({budgets.length - alertCount})
              </button>
            </div>
          </div>

          {/* Budget Health Cards List */}
          {filteredBudgets.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center mx-auto text-slate-500">
                <Layers className="w-6 h-6" />
              </div>
              <div className="text-xs text-slate-400 font-medium">
                {budgets.length === 0
                  ? 'No budgets created yet. Use the form above to set your first limit.'
                  : 'No budgets matching the selected filter.'}
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {filteredBudgets.map((b) => {
                const pct = Math.min(100, Math.round((b.spent / b.monthlyLimit) * 100));
                const reached = b.spent >= b.monthlyLimit;
                const isWarning = pct >= b.alertThreshold;
                const remaining = b.monthlyLimit - b.spent;

                return (
                  <div
                    key={b.id}
                    className={`bg-slate-950 p-4 rounded-2xl border transition-all ${
                      reached
                        ? 'border-red-500/40 bg-red-950/10'
                        : isWarning
                        ? 'border-amber-500/40 bg-amber-950/10'
                        : 'border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="font-bold text-white text-sm flex items-center gap-2">
                          <span>{b.category}</span>
                          {reached ? (
                            <span className="text-[10px] font-mono bg-red-500/20 text-red-300 px-2 py-0.5 rounded-md border border-red-500/30 flex items-center gap-1 font-semibold animate-pulse">
                              🚨 Exceeded
                            </span>
                          ) : isWarning ? (
                            <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md border border-amber-500/30 flex items-center gap-1 font-semibold">
                              ⚠️ Warning ({b.alertThreshold}%)
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/20 font-semibold">
                              ✓ Safe
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono text-sm font-bold text-white">
                          ₹{b.spent.toLocaleString('en-IN')} / ₹{b.monthlyLimit.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {remaining < 0 ? (
                            <span className="text-red-400 font-bold">
                              Over cap by ₹{Math.abs(remaining).toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span>Remaining: ₹{remaining.toLocaleString('en-IN')}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800 my-2">
                      <div
                        className={`h-full transition-all duration-500 ${
                          reached
                            ? 'bg-gradient-to-r from-red-600 to-red-500'
                            : isWarning
                            ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                            : 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 font-mono">
                      <span>{pct}% utilized</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(b)}
                          className="flex items-center gap-1 text-[11px] font-sans font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-800 transition-all"
                        >
                          <Pencil className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() =>
                            setDeleteModalItem({
                              type: 'budget',
                              id: b.id,
                              name: b.category,
                            })
                          }
                          className="flex items-center gap-1 text-[11px] font-sans font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1 rounded-lg border border-red-500/20 transition-all"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Category Management System ── */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Tag className="w-5 h-5 text-purple-400" />
              Manage Categories & Subcategories ({topLevels.length} Groups)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Organize expense, income, and transfer transaction classifications
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="Search category or subcategory…"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs font-medium text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
              {categorySearch && (
                <button
                  onClick={() => setCategorySearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Type Filter */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              {(['all', 'expense', 'income', 'transfer'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setCategoryTypeFilter(t)}
                  className={`px-3 py-1 rounded-lg font-semibold capitalize transition-all ${
                    categoryTypeFilter === t
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Add Group Category Button */}
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" /> Add Category
            </button>
          </div>
        </div>

        {/* Categories Grid / List */}
        {filteredTopLevels.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs font-medium">
            No category groups match your search filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
            {filteredTopLevels.map((c) => {
              const children = categories.filter((x) => x.parent === c.name && x.path?.includes(SEP));

              return (
                <div
                  key={c.id}
                  className="bg-slate-950 rounded-2xl border border-slate-800/90 p-4 space-y-3 transition-all hover:border-slate-700 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: c.color || '#8B5CF6' }}
                      />
                      <span className="font-bold text-white text-sm">{c.name}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold capitalize ${
                          c.type === 'expense'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : c.type === 'income'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}
                      >
                        {c.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setParentCatName(c.name);
                          setIsSubcategoryModalOpen(true);
                        }}
                        className="text-[11px] font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-800 transition-all flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Subcategory
                      </button>
                      <button
                        onClick={() =>
                          setDeleteModalItem({
                            type: 'category',
                            id: c.id,
                            name: c.name,
                          })
                        }
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all"
                        title="Delete Group Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Subcategories Pill List */}
                  <div className="pt-1 border-t border-slate-900">
                    {children.length === 0 ? (
                      <div className="text-[11px] text-slate-600 italic">No subcategories under this group.</div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {children.map((s) => (
                          <span
                            key={s.id}
                            className="inline-flex items-center gap-1.5 text-[11px] bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full text-slate-300 font-medium"
                          >
                            <span>{s.name}</span>
                            <button
                              onClick={() =>
                                setDeleteModalItem({
                                  type: 'category',
                                  id: s.id,
                                  name: `${c.name} > ${s.name}`,
                                })
                              }
                              className="text-slate-500 hover:text-red-400 transition-colors"
                              title="Delete subcategory"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Custom React Modals ── */}

      {/* 1. Add Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-purple-400" /> Create Category Group
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Category Name *</label>
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Subscriptions, Travel, Entertainment"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-medium text-white placeholder-slate-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Category Type *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['expense', 'income', 'transfer'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setCatType(t)}
                      className={`py-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                        catType === t
                          ? 'bg-purple-600 border-purple-500 text-white shadow'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Color Accent</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PALETTE.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setCatColor(hex)}
                      className={`w-7 h-7 rounded-full transition-all border-2 ${
                        catColor === hex ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCategory}
                disabled={!catName.trim()}
                className="w-1/2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-purple-600/20 transition-all"
              >
                Create Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Add Subcategory Modal */}
      {isSubcategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-400" /> Add Subcategory under "{parentCatName}"
              </h3>
              <button
                onClick={() => setIsSubcategoryModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Subcategory Name *</label>
                <input
                  type="text"
                  value={subcatName}
                  onChange={(e) => setSubcatName(e.target.value)}
                  placeholder="e.g. Petrol, Netflix, Fast Food"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-medium text-white placeholder-slate-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsSubcategoryModalOpen(false)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSubcategory}
                disabled={!subcatName.trim()}
                className="w-1/2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-purple-600/20 transition-all"
              >
                Add Subcategory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Delete Confirmation Modal */}
      {deleteModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-red-500/30 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center gap-3 text-red-400">
              <span className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-6 h-6" />
              </span>
              <div>
                <h3 className="text-base font-bold text-white">Confirm Deletion</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-1">
              <div>
                Are you sure you want to delete{' '}
                <span className="font-bold text-white">{deleteModalItem.name}</span>?
              </div>
              {deleteModalItem.type === 'category' && (
                <div className="text-[11px] text-slate-500">
                  Deleting a group category also removes associated subcategories.
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteModalItem(null)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="w-1/2 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/20 transition-all"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
