import React, { useMemo, useState } from 'react';
import {
  ReceiptText,
  Search,
  Download,
  Plus,
  Trash2,
  Sparkles,
  X,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertTriangle,
  Layers,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
  CheckCircle2,
} from 'lucide-react';
import { Transaction } from '@shared/types';

interface TransactionsViewProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  onOpenNewTransactionModal: () => void;
}

type SortField = 'date' | 'amount' | 'description' | 'category';
type SortOrder = 'asc' | 'desc';

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  onDeleteTransaction,
  onOpenNewTransactionModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAccount, setFilterAccount] = useState<string>('all');

  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const [deleteTxItem, setDeleteTxItem] = useState<Transaction | null>(null);

  const topOf = (p: string) => (p.includes(' > ') ? p.split(' > ')[0] : p);

  const categoriesList = useMemo(
    () => Array.from(new Set(transactions.map((t) => topOf(t.category)))).sort(),
    [transactions]
  );

  const accountsList = useMemo(
    () => Array.from(new Set(transactions.map((t) => t.account))).sort(),
    [transactions]
  );

  // Executive KPI Aggregations
  const totalCount = transactions.length;
  const totalIncome = useMemo(
    () => transactions.filter((t) => t.type === 'income').reduce((acc, t) => acc + t.amount, 0),
    [transactions]
  );
  const totalExpense = useMemo(
    () => transactions.filter((t) => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0),
    [transactions]
  );
  const aiParsedCount = useMemo(() => transactions.filter((t) => t.ai_parsed).length, [transactions]);
  const aiRatio = totalCount > 0 ? Math.round((aiParsedCount / totalCount) * 100) : 0;

  // Filter & Sort Logic
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        const matchesSearch =
          t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.account.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.payment_method.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesType = filterType === 'all' || t.type === filterType;
        const matchesCategory = filterCategory === 'all' || topOf(t.category) === filterCategory;
        const matchesAccount = filterAccount === 'all' || t.account === filterAccount;

        return matchesSearch && matchesType && matchesCategory && matchesAccount;
      })
      .sort((a, b) => {
        let modifier = sortOrder === 'asc' ? 1 : -1;
        if (sortField === 'amount') {
          return (a.amount - b.amount) * modifier;
        }
        if (sortField === 'date') {
          return a.date.localeCompare(b.date) * modifier;
        }
        if (sortField === 'description') {
          return a.description.localeCompare(b.description) * modifier;
        }
        if (sortField === 'category') {
          return a.category.localeCompare(b.category) * modifier;
        }
        return 0;
      });
  }, [transactions, searchQuery, filterType, filterCategory, filterAccount, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleExportCSV = () => {
    const headers = 'ID,Date,Type,Amount,Currency,Category,Description,Account,Payment Method,Confidence,AI Parsed\n';
    const rows = filteredTransactions
      .map(
        (t) =>
          `"${t.id}","${t.date}","${t.type}",${t.amount},"${t.currency}","${t.category}","${t.description}","${t.account}","${t.payment_method}",${t.confidence || ''},${t.ai_parsed ? 'YES' : 'NO'}`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flowledger-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const confirmDelete = () => {
    if (deleteTxItem) {
      onDeleteTransaction(deleteTxItem.id);
      setDeleteTxItem(null);
    }
  };

  return (
    <div className="space-y-6 pb-16 text-white max-w-7xl mx-auto">
      {/* ── Page Header Banner ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/30 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/3 -mb-12 w-56 h-56 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3.5">
            <span className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner">
              <ReceiptText className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                Transaction Ledger & Spreadsheet
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
                Complete multi-account ledger synchronized across Flutter SQLite, Hive, and PostgreSQL with AI auto-categorization metadata.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportCSV}
              disabled={filteredTransactions.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold text-xs border border-slate-700 transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={onOpenNewTransactionModal}
              className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/20 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Entry</span>
            </button>
          </div>
        </div>

        {/* Search & Filters Bar */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-3 border-t border-slate-800/80">
          {/* Search Input */}
          <div className="lg:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search description, category, account, payment method…"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-9 py-2.5 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div className="lg:col-span-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-200 focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all cursor-pointer"
            >
              <option value="all">All Types (Income, Expense, Transfer)</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Income Only</option>
              <option value="transfer">Transfers Only</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="lg:col-span-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-200 focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Account Filter */}
          <div className="lg:col-span-2">
            <select
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-200 focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all cursor-pointer"
            >
              <option value="all">All Accounts</option>
              {accountsList.map((acc) => (
                <option key={acc} value={acc}>
                  {acc}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Executive Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Count */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm transition-all hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Total Transactions</span>
            <span className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-white font-mono tracking-tight">{totalCount}</div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-2 font-medium">
            <span>Showing:</span>
            <span className="font-mono text-purple-400 font-bold">{filteredTransactions.length} entries</span>
          </div>
        </div>

        {/* Total Inflow */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm transition-all hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Total Income (Inflow)</span>
            <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono tracking-tight">
            ₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-400/80 flex items-center gap-1 mt-2 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" /> Total income credits
          </div>
        </div>

        {/* Total Outflow */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm transition-all hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Total Expense (Outflow)</span>
            <span className="p-2 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono tracking-tight">
            ₹{totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-rose-400/80 flex items-center gap-1 mt-2 font-medium">
            <ArrowDownRight className="w-3.5 h-3.5" /> Total expense debits
          </div>
        </div>

        {/* AI Ratio */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm transition-all hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>AI Automated Parsing</span>
            <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-white font-mono tracking-tight flex items-baseline gap-2">
            {aiRatio}%
            <span className="text-xs text-slate-400 font-normal">({aiParsedCount} parsed)</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-1.5 mt-3 overflow-hidden border border-slate-800">
            <div
              className="h-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${aiRatio}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Main Transactions Spreadsheet Table ── */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        {filteredTransactions.length === 0 ? (
          /* Empty State Illustration Card */
          <div className="py-16 px-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-3xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-400 shadow-inner">
              <ReceiptText className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-base font-bold text-white">No Transactions Found</h3>
              <p className="text-xs text-slate-400">
                {transactions.length === 0
                  ? 'No transaction records logged yet in FlowLedger.'
                  : 'No records match your selected search or filter criteria.'}
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              {searchQuery || filterType !== 'all' || filterCategory !== 'all' || filterAccount !== 'all' ? (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterType('all');
                    setFilterCategory('all');
                    setFilterAccount('all');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all"
                >
                  Reset Filters
                </button>
              ) : (
                <button
                  onClick={onOpenNewTransactionModal}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/20 transition-all"
                >
                  Add First Transaction
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono select-none">
                  <th
                    onClick={() => handleSort('date')}
                    className="p-4 cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Date</span>
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                    </div>
                  </th>
                  <th className="p-4">Type</th>
                  <th
                    onClick={() => handleSort('description')}
                    className="p-4 cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Description</span>
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('category')}
                    className="p-4 cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Category</span>
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                    </div>
                  </th>
                  <th className="p-4">Account / Method</th>
                  <th
                    onClick={() => handleSort('amount')}
                    className="p-4 cursor-pointer hover:text-white transition-colors text-right"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Amount</span>
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                    </div>
                  </th>
                  <th className="p-4">AI Metadata</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Date */}
                    <td className="p-4 font-mono text-slate-400 whitespace-nowrap">{tx.date}</td>

                    {/* Type Badge */}
                    <td className="p-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase font-mono border ${
                          tx.type === 'income'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : tx.type === 'expense'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}
                      >
                        {tx.type === 'income' ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : tx.type === 'expense' ? (
                          <ArrowDownRight className="w-3 h-3" />
                        ) : (
                          <ArrowRightLeft className="w-3 h-3" />
                        )}
                        {tx.type}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="p-4 font-medium text-white max-w-xs truncate">
                      {tx.description}
                      {tx.tags && tx.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {tx.tags.map((tag) => (
                            <span key={tag} className="text-[9px] font-mono bg-slate-950 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Category */}
                    <td className="p-4 text-slate-300 font-medium whitespace-nowrap">
                      <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800/80">
                        {tx.category}
                      </span>
                    </td>

                    {/* Account / Method */}
                    <td className="p-4 text-slate-300 whitespace-nowrap">
                      <span className="font-semibold">{tx.account}</span>{' '}
                      <span className="text-[11px] font-mono text-slate-500">({tx.payment_method})</span>
                    </td>

                    {/* Amount */}
                    <td
                      className={`p-4 font-mono font-bold text-sm whitespace-nowrap text-right ${
                        tx.type === 'income' ? 'text-emerald-400' : 'text-slate-100'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* AI Engine Metadata */}
                    <td className="p-4 whitespace-nowrap">
                      {tx.ai_parsed ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/30 px-2.5 py-1 rounded-lg font-mono">
                          <Sparkles className="w-3 h-3 text-purple-400" />
                          {tx.confidence}% ({tx.engine_used || 'Qwen'})
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800/60">
                          Manual Entry
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setDeleteTxItem(tx)}
                        className="text-slate-500 hover:text-rose-400 p-2 rounded-lg hover:bg-rose-500/10 transition-all cursor-pointer"
                        title="Delete Entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Table Footer */}
            <div className="bg-slate-950 px-4 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>
                Showing <strong className="text-white">{filteredTransactions.length}</strong> of{' '}
                <strong className="text-white">{transactions.length}</strong> total entries
              </span>
              <span className="text-[11px] text-slate-500">Sorted by: {sortField} ({sortOrder})</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {deleteTxItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-red-500/30 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center gap-3 text-red-400">
              <span className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-6 h-6" />
              </span>
              <div>
                <h3 className="text-base font-bold text-white">Delete Transaction Entry</h3>
                <p className="text-xs text-slate-400">Confirm permanent removal from ledger.</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-1 font-mono">
              <div>
                Description: <span className="font-bold text-white font-sans">{deleteTxItem.description}</span>
              </div>
              <div>
                Amount: <span className="font-bold text-emerald-400">₹{deleteTxItem.amount.toLocaleString('en-IN')}</span>
              </div>
              <div>Date: {deleteTxItem.date}</div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteTxItem(null)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="w-1/2 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/20 transition-all"
              >
                Delete Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
