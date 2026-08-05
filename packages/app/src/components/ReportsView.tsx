import React, { useMemo, useState } from 'react';
import { BarChart3, Calendar, Download, TrendingUp, TrendingDown, Wallet, ArrowUpRight } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
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
}

const DONUT_COLORS = ['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#14B8A6', '#EC4899', '#06B6D4'];

export const ReportsView: React.FC<ViewProps> = ({ transactions = [], accounts = [] }) => {
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
    return { txs, income, expense, net: income - expense, spend, buckets: buildBuckets(txs, win), count: txs.length };
  }, [transactions, win]);

  const spendEntries = useMemo(
    () => Array.from(stats.spend.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    [stats.spend],
  );

  const empty = transactions.length === 0;

  const downloadPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text('FlowLedger — Financial Report', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Period: ${formatWindow(win)}    Generated: ${new Date().toLocaleString('en-IN')}`, 14, 27);

    autoTable(doc, {
      startY: 34,
      head: [['Income', 'Expense', 'Net', 'Transactions']],
      body: [[fmtAmount(stats.income), fmtAmount(stats.expense), fmtAmount(stats.net), String(stats.count)]],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], fontSize: 9 },
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
        headStyles: { fillColor: [59, 130, 246], fontSize: 9 },
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
        .map((t) => [t.date, t.description, t.category, t.account, t.type, fmtAmount(t.type === 'income' ? t.amount : -t.amount)]),
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], fontSize: 9 },
      styles: { fontSize: 9 },
    });

    doc.save(`flowledger-report-${dateKey(new Date())}.pdf`);
  };

  return (
    <div className="space-y-6 pb-12 text-white">
      {/* Header & controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold tracking-tight">Reports & Financial Analytics</h2>
          </div>

          <button
            onClick={downloadPdf}
            disabled={empty}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-sm font-bold hover:bg-emerald-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>

        {/* Range control */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {(['today', 'week', 'month', 'custom'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-4 py-1.5 rounded-lg font-medium transition-all capitalize cursor-pointer ${
                  range === r ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {r === 'today' ? 'Today' : r === 'week' ? 'Week' : r === 'month' ? 'Month' : 'Custom'}
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
              <span className="text-slate-500">to</span>
              <label className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300 font-mono">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <input
                  type="date"
                  value={dateKey(customTo)}
                  onChange={(e) => e.target.value && setCustomTo(new Date(e.target.value + 'T00:00:00'))}
                  className="bg-transparent outline-none [color-scheme:dark]"
                />
              </label>
            </div>
          )}

          <span className="text-[11px] text-slate-400 font-mono sm:ml-auto">{formatWindow(win)}</span>
        </div>

        {/* Sub tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800/80 pt-2 pb-1 overflow-x-auto text-xs">
          {(['summary', 'categories', 'cashflow', 'accounts'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSubTab(tab)}
              className={`px-4 py-1.5 rounded-lg font-medium capitalize transition-all cursor-pointer whitespace-nowrap ${
                subTab === tab ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {empty ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400 text-sm">
          Add some transactions to see reports.
        </div>
      ) : (
        <>
          {/* Metric cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard label="Income" value={fmtAmount(stats.income)} color="text-emerald-400" icon={<TrendingUp className="w-3.5 h-3.5" />} sub={`${stats.count} transactions`} />
            <MetricCard label="Expense" value={fmtAmount(stats.expense)} color="text-rose-400" icon={<TrendingDown className="w-3.5 h-3.5" />} sub={`${spendEntries.length} categories`} />
            <MetricCard label="Net" value={fmtAmount(stats.net)} color={stats.net >= 0 ? 'text-emerald-400' : 'text-rose-400'} icon={<ArrowUpRight className="w-3.5 h-3.5" />} sub={stats.net >= 0 ? 'Surplus' : 'Deficit'} />
          </div>

          {subTab === 'summary' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Income vs Expense" legend>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.buckets} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="label" stroke="#64748B" fontSize={11} />
                    <YAxis stroke="#64748B" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff', fontSize: '12px' }}
                      formatter={(v: any) => fmtAmount(Number(v))}
                    />
                    <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Expense" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Expense by Category" emptyMsg={spendEntries.length === 0 ? 'No expenses in this period' : undefined}>
                {spendEntries.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <div className="h-56 w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={spendEntries} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                            {spendEntries.map((e: any, idx: number) => (
                              <Cell key={idx} fill={DONUT_COLORS[idx % DONUT_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: any) => fmtAmount(Number(v))} contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff', fontSize: '12px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center">
                          <div className="text-xs font-mono font-bold">{fmtAmount(stats.expense)}</div>
                          <div className="text-[10px] text-slate-400">Total</div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 text-xs max-h-56 overflow-auto">
                      {spendEntries.map((c, i) => (
                        <div key={c.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                            <span className="text-slate-300 font-medium">{c.name}</span>
                          </div>
                          <span className="font-mono font-bold text-slate-100">{stats.expense ? ((c.value / stats.expense) * 100).toFixed(0) : 0}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </ChartCard>
            </div>
          )}

          {subTab === 'categories' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-4">Spending by Category</h3>
              {spendEntries.length === 0 ? (
                <p className="text-sm text-slate-400">No expenses in this period.</p>
              ) : (
                <div className="table w-full text-xs">
                  <div className="table-header-group text-slate-400 uppercase tracking-wide font-mono">
                    <div className="table-row">
                      <div className="table-cell py-2 pr-2">Category</div>
                      <div className="table-cell py-2 pr-2 text-right">Amount</div>
                      <div className="table-cell py-2 text-right">Share</div>
                    </div>
                  </div>
                  {spendEntries.map((c, i) => (
                    <div key={c.name} className="table-row border-t border-slate-800/60">
                      <div className="table-cell py-2 pr-2">
                        <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                        {c.name}
                      </div>
                      <div className="table-cell py-2 pr-2 text-right text-emerald-300 font-mono">{fmtAmount(c.value)}</div>
                      <div className="table-cell py-2 text-right font-mono">{stats.expense ? ((c.value / stats.expense) * 100).toFixed(1) : 0}%</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {subTab === 'cashflow' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-4">Cashflow by period</h3>
              <div className="table w-full text-xs">
                <div className="table-header text-slate-400 uppercase tracking-wide font-mono">
                  <div className="table-row">
                    <div className="table-cell py-2 pr-2">Period</div>
                    <div className="table-cell py-2 pr-2 text-right">Income</div>
                    <div className="table-cell py-2 pr-2 text-right">Expense</div>
                    <div className="table-cell py-2 text-right">Net</div>
                  </div>
                </div>
                {stats.buckets.map((b, i) => (
                  <div key={i} className="table-row border-t border-slate-800/60">
                    <div className="table-cell py-2 pr-2">{b.label}</div>
                    <div className="table-cell py-2 pr-2 text-right text-emerald-300 font-mono">{fmtAmount(b.income)}</div>
                    <div className="table-cell py-2 pr-2 text-right text-rose-300 font-mono">{fmtAmount(b.expense)}</div>
                    <div className="table-cell py-2 text-right font-mono">{fmtAmount(b.income - b.expense)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {subTab === 'accounts' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-4">Accounts</h3>
              {accounts.length === 0 ? (
                <p className="text-sm text-slate-400">No accounts yet.</p>
              ) : (
                <div className="space-y-2 text-sm">
                  {accounts.map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
                      <div className="flex items-center gap-3">
                        <span className="p-2 rounded-lg" style={{ backgroundColor: a.color + '33' }}>
                          <Wallet className="w-4 h-4" style={{ color: a.color }} />
                        </span>
                        <div>
                          <div className="font-semibold text-slate-200">{a.name}</div>
                          <div className="text-[11px] text-slate-500 capitalize">{a.type.replace('_', ' ')}</div>
                        </div>
                      </div>
                      <div className="font-mono font-bold text-slate-100">{fmtAmount(a.balance)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

function MetricCard({ label, value, color, icon, sub }: { label: string; value: string; color: string; icon: React.ReactNode; sub: string }) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-1">
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
      <div className={`text-[11px] flex items-center gap-1 font-mono pt-1 ${color}`}>
        {icon}
        <span>{sub}</span>
      </div>
    </div>
  );
}

function ChartCard({ title, legend, emptyMsg, children }: { title: string; legend?: boolean; emptyMsg?: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">{title}</h3>
        {legend && (
          <div className="flex items-center gap-3 text-[10px] font-mono">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Income
            </span>
            <span className="flex items-center gap-1 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Expense
            </span>
          </div>
        )}
      </div>
      {emptyMsg ? (
        <p className="text-sm text-slate-400">{emptyMsg}</p>
      ) : (
        <div className="h-64 w-full">{children}</div>
      )}
    </div>
  );
}