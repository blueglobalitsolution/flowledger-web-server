import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  PieChart as PieIcon,
  Layers,
  FileText,
  Sparkles,
  CreditCard,
  Building2,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Account, Transaction } from '@shared/types';

type Range = 'today' | 'week' | 'month' | 'custom';

interface ReportWindow {
  from: Date;
  to: Date;
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getWindow(range: Range, customFrom?: Date, customTo?: Date): ReportWindow {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (range) {
    case 'today':
      return { from: today, to: today };
    case 'week': {
      const mon = new Date(today);
      mon.setDate(today.getDate() - ((today.getDay() + 6) % 7));
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      return { from: mon, to: sun };
    }
    case 'month':
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: new Date(now.getFullYear(), now.getMonth() + 1, 0),
      };
    case 'custom': {
      const f = customFrom ?? today;
      const t = customTo ?? today;
      const order = f.getTime() <= t.getTime() ? { from: f, to: t } : { from: t, to: f };
      return order;
    }
  }
}

function formatWindow(win: ReportWindow): string {
  const f = win.from.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const t = win.to.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return win.from.getTime() === win.to.getTime() ? f : `${f} – ${t}`;
}

const fmtAmount = (n: number) =>
  '₹' + (isFinite(n) ? Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00');

interface Bucket {
  label: string;
  income: number;
  expense: number;
}

function buildBuckets(txs: Transaction[], win: ReportWindow): Bucket[] {
  const spanDays = Math.floor((win.to.getTime() - win.from.getTime()) / 86400000) + 1;
  const byDate = new Map<string, Transaction[]>();
  for (const t of txs) {
    const arr = byDate.get(t.date) ?? [];
    arr.push(t);
    byDate.set(t.date, arr);
  }
  const incomeOf = (g: Transaction[]) => g.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenseOf = (g: Transaction[]) => g.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const buckets: Bucket[] = [];

  if (spanDays <= 7) {
    for (let i = 0; i < spanDays; i++) {
      const day = new Date(win.from.getTime() + i * 86400000);
      const k = dateKey(day);
      const g = byDate.get(k) ?? [];
      buckets.push({ label: String(day.getDate()), income: incomeOf(g), expense: expenseOf(g) });
    }
  } else if (spanDays <= 62) {
    let cur = new Date(win.from);
    cur.setDate(cur.getDate() - ((cur.getDay() + 6) % 7)); // align to Monday
    let week = 1;
    while (cur.getTime() <= win.to.getTime()) {
      const end = new Date(cur.getTime() + 6 * 86400000);
      const g = txs.filter((t) => t.date >= dateKey(cur) && t.date <= dateKey(end));
      buckets.push({ label: `W${week}`, income: incomeOf(g), expense: expenseOf(g) });
      week++;
      cur = new Date(end.getTime() + 86400000);
    }
  } else {
    let cur = new Date(win.from.getFullYear(), win.from.getMonth(), 1);
    while (cur.getTime() <= win.to.getTime()) {
      const end = new Date(cur.getFullYear(), cur.getMonth() + 1, 0);
      const g = txs.filter((t) => t.date >= dateKey(cur) && t.date <= dateKey(end));
      buckets.push({
        label: cur.toLocaleDateString('en-US', { month: 'short' }),
        income: incomeOf(g),
        expense: expenseOf(g),
      });
      cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    }
  }
  if (buckets.length === 0) buckets.push({ label: '-', income: 0, expense: 0 });
  return buckets;
}

interface ViewProps {
  transactions?: Transaction[];
  accounts?: Account[];
  onOpenNewTransactionModal?: () => void;
}

const DONUT_COLORS = ['#8B5CF6', '#BCFC6A', '#3B82F6', '#EC4899', '#F59E0B', '#10B981', '#06B6D4', '#6366F1'];

export const ReportsView: React.FC<ViewProps> = ({ transactions = [], accounts = [], onOpenNewTransactionModal }) => {
  const [range, setRange] = useState<Range>('month');
  const [customFrom, setCustomFrom] = useState<Date>(() => new Date());
  const [customTo, setCustomTo] = useState<Date>(() => new Date());
  const [subTab, setSubTab] = useState<'summary' | 'categories' | 'cashflow' | 'accounts'>('summary');

  const win = useMemo(() => getWindow(range, customFrom, customTo), [range, customFrom, customTo]);
  const stats = useMemo(() => {
    const fromK = dateKey(win.from);
    const toK = dateKey(win.to);
    const txs = transactions.filter((t) => t.date && t.date >= fromK && t.date <= toK);
    let income = 0;
    let expense = 0;
    const spend = new Map<string, number>();
    const topOf = (p: string) => (p.includes(' > ') ? p.split(' > ')[0] : p);
    for (const t of txs) {
      if (t.type === 'income') income += t.amount;
      else {
        expense += t.amount;
        spend.set(topOf(t.category), (spend.get(topOf(t.category)) ?? 0) + t.amount);
      }
    }
    const savingsRate = income > 0 ? Math.max(0, Math.round(((income - expense) / income) * 100)) : 0;
    return {
      txs,
      income,
      expense,
      net: income - expense,
      savingsRate,
      spend,
      buckets: buildBuckets(txs, win),
      count: txs.length,
    };
  }, [transactions, win]);

  const spendEntries = useMemo(
    () => Array.from(stats.spend.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    [stats.spend],
  );

  const empty = transactions.length === 0;
  const totalNetWorth = accounts.reduce((acc, a) => acc + a.balance, 0);

  const downloadPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text('FlowLedger — Financial Analytics Report', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Period: ${formatWindow(win)}    Generated: ${new Date().toLocaleString('en-IN')}`, 14, 27);

    autoTable(doc, {
      startY: 34,
      head: [['Income', 'Expense', 'Net Flow', 'Savings Rate', 'Transactions']],
      body: [
        [
          fmtAmount(stats.income),
          fmtAmount(stats.expense),
          fmtAmount(stats.net),
          `${stats.savingsRate}%`,
          String(stats.count),
        ],
      ],
      theme: 'grid',
      headStyles: { fillColor: [140, 99, 230], fontSize: 9 },
      styles: { fontSize: 10 },
    });

    if (spendEntries.length) {
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text('Spending by Category', 14, (doc as any).lastAutoTable.finalY + 14);
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 18,
        head: [['Category', 'Amount', 'Share']],
        body: spendEntries.map((e) => [
          e.name,
          fmtAmount(e.value),
          stats.expense === 0 ? '0%' : `${((e.value / stats.expense) * 100).toFixed(1)}%`,
        ]),
        theme: 'grid',
        headStyles: { fillColor: [140, 99, 230], fontSize: 9 },
        styles: { fontSize: 10 },
      });
    }

    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(`Transactions (${stats.txs.length})`, 14, (doc as any).lastAutoTable.finalY + 14);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 18,
      head: [['Date', 'Description', 'Category', 'Account', 'Type', 'Amount']],
      body: [...stats.txs]
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .map((t) => [
          t.date,
          t.description,
          t.category,
          t.account,
          t.type,
          fmtAmount(t.type === 'income' ? t.amount : -t.amount),
        ]),
      theme: 'grid',
      headStyles: { fillColor: [24, 29, 39], fontSize: 9 },
      styles: { fontSize: 9 },
    });

    doc.save(`flowledger-report-${dateKey(new Date())}.pdf`);
  };

  return (
    <div className="space-y-6 pb-16 text-white max-w-7xl mx-auto">
      {/* ── Header Banner ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/30 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-56 h-56 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3.5">
            <span className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner">
              <BarChart3 className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                Reports & Financial Analytics
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
                Comprehensive financial intelligence, cash flow trends, category spend ratios, and downloadable PDF reports.
              </p>
            </div>
          </div>

          <button
            onClick={downloadPdf}
            disabled={empty}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Download className="w-4 h-4" />
            Download PDF Report
          </button>
        </div>

        {/* Period Window Controls */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              {(['today', 'week', 'month', 'custom'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-4 py-1.5 rounded-lg font-semibold capitalize transition-all ${
                    range === r
                      ? 'bg-emerald-400 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {range === 'custom' && (
              <div className="flex items-center gap-2 text-xs">
                <label className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <input
                    type="date"
                    value={dateKey(customFrom)}
                    onChange={(e) => e.target.value && setCustomFrom(new Date(e.target.value + 'T00:00:00'))}
                    className="bg-transparent outline-none text-slate-300 [color-scheme:dark]"
                  />
                </label>
                <span className="text-slate-500 font-mono">to</span>
                <label className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <input
                    type="date"
                    value={dateKey(customTo)}
                    onChange={(e) => e.target.value && setCustomTo(new Date(e.target.value + 'T00:00:00'))}
                    className="bg-transparent outline-none text-slate-300 [color-scheme:dark]"
                  />
                </label>
              </div>
            )}
          </div>

          <div className="text-xs font-mono text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800/80 self-start sm:self-auto">
            Period: <span className="text-white font-semibold">{formatWindow(win)}</span>
          </div>
        </div>

        {/* Sub-Tab Selection */}
        <div className="relative z-10 flex items-center gap-2 pt-1 border-t border-slate-800/60 overflow-x-auto">
          {(['summary', 'categories', 'cashflow', 'accounts'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSubTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap ${
                subTab === tab
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800/80'
              }`}
            >
              {tab === 'summary'
                ? 'Overview Summary'
                : tab === 'categories'
                ? 'Category Breakdown'
                : tab === 'cashflow'
                ? 'Cashflow Timeline'
                : 'Account Balances'}
            </button>
          ))}
        </div>
      </div>

      {empty ? (
        /* Stylish Empty State Illustration Card */
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-10 sm:p-14 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400 shadow-inner">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-white">No Transactions Recorded for Selected Period</h3>
            <p className="text-xs text-slate-400">
              FlowLedger generates real-time financial charts, cashflow breakdowns, and downloadable PDF reports automatically once you log transactions.
            </p>
          </div>
          {onOpenNewTransactionModal && (
            <button
              onClick={onOpenNewTransactionModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/20 transition-all active:scale-95"
            >
              Add First Transaction
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ── Executive Stat Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Total Period Income"
              value={fmtAmount(stats.income)}
              color="text-emerald-400"
              icon={<TrendingUp className="w-4 h-4" />}
              sub={`${stats.count} total transactions`}
              bgTint="bg-emerald-500/10 border-emerald-500/20"
            />
            <MetricCard
              label="Total Period Expense"
              value={fmtAmount(stats.expense)}
              color="text-rose-400"
              icon={<TrendingDown className="w-4 h-4" />}
              sub={`${spendEntries.length} active categories`}
              bgTint="bg-rose-500/10 border-rose-500/20"
            />
            <MetricCard
              label="Net Cash Flow"
              value={fmtAmount(stats.net)}
              color={stats.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}
              icon={<ArrowUpRight className="w-4 h-4" />}
              sub={stats.net >= 0 ? 'Net Surplus' : 'Net Deficit'}
              bgTint={stats.net >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}
            />
            <MetricCard
              label="Savings Efficiency"
              value={`${stats.savingsRate}%`}
              color="text-purple-400"
              icon={<Sparkles className="w-4 h-4" />}
              sub={`Savings rate ratio`}
              bgTint="bg-purple-500/10 border-purple-500/20"
            />
          </div>

          {/* ── Sub-Tab 1: Overview Summary ── */}
          {subTab === 'summary' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Income vs Expense Bar Chart */}
              <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-emerald-400" />
                      Income vs Expense Comparison
                    </h3>
                    <p className="text-[11px] text-slate-400">Cashflow trajectory across time buckets</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Income
                    </span>
                    <span className="flex items-center gap-1.5 text-rose-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Expense
                    </span>
                  </div>
                </div>

                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.buckets} barGap={6}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#252b37" vertical={false} />
                      <XAxis dataKey="label" stroke="#535862" fontSize={11} tickLine={false} />
                      <YAxis stroke="#535862" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#181d27',
                          borderColor: '#252b37',
                          borderRadius: '0.75rem',
                          color: '#fff',
                          fontSize: '12px',
                          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                        }}
                        formatter={(v: any) => [fmtAmount(Number(v)), 'Amount']}
                      />
                      <Bar dataKey="income" name="Income" fill="#bcfc6a" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="expense" name="Expense" fill="#EF4444" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Expense Donut Breakdown */}
              <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="border-b border-slate-800/80 pb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <PieIcon className="w-4 h-4 text-purple-400" />
                    Top Category Share
                  </h3>
                  <p className="text-[11px] text-slate-400">Proportional expense distribution</p>
                </div>

                {spendEntries.length === 0 ? (
                  <div className="py-16 text-center text-xs text-slate-500">No expenses recorded in this period.</div>
                ) : (
                  <div className="space-y-4">
                    <div className="h-56 w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={spendEntries}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={85}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {spendEntries.map((e, idx) => (
                              <Cell key={idx} fill={DONUT_COLORS[idx % DONUT_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(v: any) => [fmtAmount(Number(v)), 'Amount']}
                            contentStyle={{
                              backgroundColor: '#181d27',
                              borderColor: '#252b37',
                              borderRadius: '0.75rem',
                              color: '#fff',
                              fontSize: '12px',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[10px] uppercase text-slate-400">Total Spend</span>
                        <span className="text-sm font-bold font-mono text-white">{fmtAmount(stats.expense)}</span>
                      </div>
                    </div>

                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                      {spendEntries.map((c, i) => (
                        <div key={c.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
                            />
                            <span className="text-slate-300 font-medium truncate">{c.name}</span>
                          </div>
                          <span className="font-mono font-bold text-slate-100 shrink-0">
                            {stats.expense ? ((c.value / stats.expense) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Sub-Tab 2: Categories Breakdown ── */}
          {subTab === 'categories' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-purple-400" />
                    Spending by Category ({spendEntries.length})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Detailed breakdown of top expenses</p>
                </div>
              </div>

              {spendEntries.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">No expenses in this period.</p>
              ) : (
                <div className="space-y-3">
                  {spendEntries.map((c, i) => {
                    const share = stats.expense > 0 ? (c.value / stats.expense) * 100 : 0;
                    return (
                      <div
                        key={c.name}
                        className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-2 hover:border-slate-700 transition-all"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-3.5 h-3.5 rounded-full shrink-0"
                              style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
                            />
                            <span className="font-bold text-white text-sm">{c.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-sm font-bold text-emerald-400">{fmtAmount(c.value)}</span>
                            <span className="font-mono text-[11px] text-slate-400 ml-2">({share.toFixed(1)}%)</span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${share}%`,
                              backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Sub-Tab 3: Cashflow Timeline ── */}
          {subTab === 'cashflow' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
              <div className="border-b border-slate-800/80 pb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  Cashflow Timeline Breakdown
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Bucket comparison of inflows vs outflows</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase tracking-wider">
                      <th className="py-3 px-4">Period</th>
                      <th className="py-3 px-4 text-right">Income</th>
                      <th className="py-3 px-4 text-right">Expense</th>
                      <th className="py-3 px-4 text-right">Net Flow</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {stats.buckets.map((b, i) => {
                      const net = b.income - b.expense;
                      return (
                        <tr key={i} className="hover:bg-slate-950/60 transition-colors">
                          <td className="py-3 px-4 font-bold text-white font-sans">{b.label}</td>
                          <td className="py-3 px-4 text-right text-emerald-400 font-bold">{fmtAmount(b.income)}</td>
                          <td className="py-3 px-4 text-right text-rose-400 font-bold">{fmtAmount(b.expense)}</td>
                          <td className={`py-3 px-4 text-right font-bold ${net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {fmtAmount(net)}
                          </td>
                          <td className="py-3 px-4 text-center font-sans">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                net >= 0
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}
                            >
                              {net >= 0 ? 'Surplus' : 'Deficit'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Sub-Tab 4: Account Balances ── */}
          {subTab === 'accounts' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-blue-400" />
                    Connected Account Balances ({accounts.length})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Liquid assets and card balances across accounts</p>
                </div>
                <div className="text-xs font-mono text-slate-400">
                  Total Net Worth:{' '}
                  <span className="font-bold text-white text-sm">₹{totalNetWorth.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {accounts.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">No accounts connected yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {accounts.map((a) => {
                    const share = totalNetWorth > 0 ? Math.round((a.balance / totalNetWorth) * 100) : 0;
                    return (
                      <div
                        key={a.id}
                        className="bg-slate-950 p-4 rounded-2xl border border-slate-800/90 space-y-3 hover:border-slate-700 transition-all shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span
                              className="p-2.5 rounded-xl border border-slate-700/50"
                              style={{ backgroundColor: (a.color || '#8B5CF6') + '22' }}
                            >
                              <Wallet className="w-4 h-4" style={{ color: a.color || '#8B5CF6' }} />
                            </span>
                            <div>
                              <div className="font-bold text-white text-sm">{a.name}</div>
                              <div className="text-[10px] text-slate-500 capitalize">{a.type.replace('_', ' ')}</div>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full text-slate-400">
                            {share}% of total
                          </span>
                        </div>

                        <div className="pt-2 border-t border-slate-900 flex items-baseline justify-between">
                          <span className="text-[10px] text-slate-500 font-mono">Current Balance</span>
                          <span className="font-mono text-base font-bold text-white">
                            ₹{a.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

function MetricCard({
  label,
  value,
  color,
  icon,
  sub,
  bgTint,
}: {
  label: string;
  value: string;
  color: string;
  icon: React.ReactNode;
  sub: string;
  bgTint?: string;
}) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2 backdrop-blur-sm transition-all hover:border-slate-700">
      <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
        <span>{label}</span>
        <span className={`p-2 rounded-xl border ${bgTint || 'bg-slate-800 text-slate-300'}`}>{icon}</span>
      </div>
      <div className={`text-2xl font-bold font-mono tracking-tight ${color}`}>{value}</div>
      <div className="text-[11px] text-slate-400 font-mono pt-0.5">{sub}</div>
    </div>
  );
}