import React, { useState } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Plus,
  ArrowRightLeft,
  Building2,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Send,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Account, Budget, Transaction, AIEngineConfig } from '@shared/types';

interface DashboardViewProps {
  transactions: Transaction[];
  accounts: Account[];
  budgets: Budget[];
  activeEngine: AIEngineConfig;
  onQuickParse: (text: string) => void;
  onOpenNewTransactionModal: () => void;
}

const CASHFLOW_CHART_DATA = [
  { day: 'Jul 26', income: 0, expense: 1200 },
  { day: 'Jul 27', income: 0, expense: 3200 },
  { day: 'Jul 28', income: 14500, expense: 450 },
  { day: 'Jul 29', income: 0, expense: 1850 },
  { day: 'Jul 30', income: 0, expense: 2490 },
  { day: 'Aug 01', income: 85000, expense: 450 },
  { day: 'Aug 02', income: 0, expense: 30 },
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  accounts,
  budgets,
  activeEngine,
  onQuickParse,
  onOpenNewTransactionModal,
}) => {
  const [promptText, setPromptText] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  // Financial Summary Aggregations
  const totalNetWorth = accounts.reduce((acc, a) => acc + a.balance, 0);
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);
  const netSavings = totalIncome - totalExpense;

  const handleParseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim()) return;
    setIsParsing(true);
    onQuickParse(promptText);
    setTimeout(() => {
      setIsParsing(false);
      setPromptText('');
    }, 400);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: Quick AI Natural Language Parser */}
      <div id="ai-quick-parser-card" className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Natural Language AI Transaction Entry
              </h2>
            </div>
            <p className="text-xs text-slate-300 max-w-xl">
              Type or speak any financial transaction. Powered by{' '}
              <strong className="text-emerald-300 font-mono">{activeEngine.name}</strong> with
              confidence auto-routing (&gt;95% auto-save, 80-95% user check).
            </p>
          </div>

          {/* Quick Natural Language Prompt Form */}
          <form onSubmit={handleParseSubmit} className="flex-1 max-w-xl flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="e.g., Tea ₹30 at Chai Corner via UPI, or Uber $45 to office on Credit Card"
                className="w-full bg-slate-950/80 border border-indigo-500/40 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent shadow-inner font-sans"
              />
              <button
                type="button"
                onClick={() => setPromptText('Tea ₹30 at local stall via UPI')}
                className="absolute right-3 top-2.5 text-[11px] text-emerald-400 hover:text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30 cursor-pointer font-mono"
              >
                Try "Tea ₹30"
              </button>
            </div>
            <button
              type="submit"
              disabled={isParsing || !promptText.trim()}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-5 py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer text-sm whitespace-nowrap"
            >
              {isParsing ? (
                <>
                  <Zap className="w-4 h-4 animate-spin" />
                  <span>Parsing...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>AI Parse</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Financial Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div id="stat-card-networth" className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Total Net Worth</span>
            <span className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">
            ₹{totalNetWorth.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-2 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+12.4% from last month across 5 accounts</span>
          </div>
        </div>

        <div id="stat-card-income" className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Monthly Income</span>
            <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight font-mono">
            ₹{totalIncome.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">Salary + SaaS & Freelance credits</div>
        </div>

        <div id="stat-card-expenses" className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Monthly Expenses</span>
            <span className="p-2 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-rose-400 tracking-tight font-mono">
            ₹{totalExpense.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">7 Transactions auto-categorized</div>
        </div>

        <div id="stat-card-savings" className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Net Cashflow</span>
            <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <ArrowRightLeft className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-indigo-300 tracking-tight font-mono">
            ₹{netSavings.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-emerald-400 mt-2 font-medium">
            83.8% savings rate this month
          </div>
        </div>
      </div>

      {/* Main Grid: Cashflow Chart + Accounts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cashflow Recharts Area Chart */}
        <div id="cashflow-chart-panel" className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Cashflow Trend & Aggregation
              </h3>
              <p className="text-xs text-slate-400">Daily Income vs Expense breakdown</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
              Aug 2026
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CASHFLOW_CHART_DATA}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#10B981"
                  fillOpacity={1}
                  fill="url(#colorIncome)"
                  name="Income (₹)"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#EF4444"
                  fillOpacity={1}
                  fill="url(#colorExpense)"
                  name="Expense (₹)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Financial Accounts List */}
        <div id="accounts-panel" className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-wide">
              Accounts & Cards
            </h3>
            <span className="text-xs text-slate-400 font-mono">{accounts.length} Active</span>
          </div>

          <div className="space-y-3">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: `${acc.color}20`, color: acc.color, border: `1px solid ${acc.color}40` }}
                  >
                    {acc.type === 'Bank' ? (
                      <Building2 className="w-4 h-4" />
                    ) : acc.type === 'Credit Card' ? (
                      <CreditCard className="w-4 h-4" />
                    ) : (
                      <Wallet className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">{acc.name}</div>
                    <div className="text-[10px] text-slate-400">
                      {acc.type} {acc.accountNumber && `• ${acc.accountNumber}`}
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono text-xs font-bold">
                  <span className={acc.balance >= 0 ? 'text-white' : 'text-rose-400'}>
                    ₹{acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Transactions Feed + Budget Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transactions Feed */}
        <div id="recent-transactions-panel" className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Recent Ledger Entries
              </h3>
              <p className="text-xs text-slate-400">Parsed by AI Engine & stored in Postgres / Hive</p>
            </div>
            <button
              onClick={onOpenNewTransactionModal}
              className="bg-slate-800 hover:bg-slate-700 text-emerald-400 font-medium px-3 py-1.5 rounded-lg border border-slate-700 text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Manual Entry</span>
            </button>
          </div>

          <div className="divide-y divide-slate-800/80">
            {transactions.slice(0, 6).map((tx) => (
              <div key={tx.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                      tx.type === 'income'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white flex items-center gap-2">
                      <span>{tx.description}</span>
                      {tx.ai_parsed && (
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-mono border border-indigo-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                          {tx.confidence}% Conf.
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                      <span>{tx.category}</span>
                      <span>•</span>
                      <span>{tx.account} ({tx.payment_method})</span>
                      <span>•</span>
                      <span>{tx.date}</span>
                    </div>
                  </div>
                </div>

                <div className={`font-mono text-sm font-bold ${tx.type === 'income' ? 'text-emerald-400' : 'text-slate-100'}`}>
                  {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Budget Health Monitoring */}
        <div id="budget-health-panel" className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-wide">
              Budget Health & Alerts
            </h3>
            <span className="text-xs text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> 1 Warning
            </span>
          </div>

          <div className="space-y-4">
            {budgets.map((b) => {
              const pct = Math.min(100, Math.round((b.spent / b.monthlyLimit) * 100));
              const isWarning = pct >= b.alertThreshold;
              return (
                <div key={b.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{b.category}</span>
                    <span className="font-mono text-slate-400">
                      ₹{b.spent.toLocaleString()} / ₹{b.monthlyLimit.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all rounded-full ${
                        isWarning ? 'bg-amber-400 shadow-sm shadow-amber-500/50' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>{pct}% Used</span>
                    <span>{isWarning ? '⚠️ Approaching limit' : '✅ Within threshold'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
