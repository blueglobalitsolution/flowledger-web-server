import React, { useState } from 'react';
import {
  ReceiptText,
  Search,
  Filter,
  Download,
  Plus,
  Trash2,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Sparkles,
} from 'lucide-react';
import { Transaction } from '@shared/types';

interface TransactionsViewProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  onOpenNewTransactionModal: () => void;
  onBulkInsert: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  onDeleteTransaction,
  onOpenNewTransactionModal,
  onBulkInsert,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const topOf = (p: string) => (p.includes(' > ') ? p.split(' > ')[0] : p);
  const categoriesList = Array.from(new Set(transactions.map((t) => topOf(t.category)))).sort();

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.account.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.payment_method.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesCategory = filterCategory === 'all' || topOf(t.category) === filterCategory;

    return matchesSearch && matchesType && matchesCategory;
  });

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

  return (
    <div className="space-y-6 pb-12 text-white">
      {/* Title & Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <ReceiptText className="w-5 h-5 text-emerald-400" />
              <span>FlowLedger Transaction Ledger & Spreadsheet</span>
            </h2>
            <p className="text-xs text-slate-400">
              Complete transaction log synchronized across Flutter Mobile SQLite, Hive, and PostgreSQL.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onBulkInsert}
              className="bg-indigo-600/80 hover:bg-indigo-500 text-white font-medium px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all border border-indigo-500/40"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Spreadsheet Bulk Insert</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="bg-slate-800 hover:bg-slate-700 text-emerald-300 font-medium px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer border border-slate-700"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={onOpenNewTransactionModal}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>New Entry</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search description, category, account..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer"
          >
            <option value="all">All Types (Income & Expense)</option>
            <option value="expense">Expenses Only</option>
            <option value="income">Income Only</option>
            <option value="transfer">Transfers</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categoriesList.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono">
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Description</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Account / Method</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">AI Engine</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-800/40 transition-all font-sans">
                  <td className="p-3.5 font-mono text-slate-400 whitespace-nowrap">{tx.date}</td>
                  <td className="p-3.5 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                        tx.type === 'income'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {tx.type}
                    </span>
                  </td>
                  <td className="p-3.5 font-medium text-white max-w-xs truncate">{tx.description}</td>
                  <td className="p-3.5 text-slate-300 font-medium whitespace-nowrap">{tx.category}</td>
                  <td className="p-3.5 text-slate-400 whitespace-nowrap">
                    {tx.account} <span className="text-slate-600">({tx.payment_method})</span>
                  </td>
                  <td className={`p-3.5 font-mono font-bold whitespace-nowrap ${tx.type === 'income' ? 'text-emerald-400' : 'text-slate-100'}`}>
                    {tx.type === 'income' ? '+' : '-'}{tx.currency}{tx.amount.toLocaleString()}
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    {tx.ai_parsed ? (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded font-mono">
                        <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                        {tx.confidence}% ({tx.engine_used || 'Qwen'})
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-mono">Manual</span>
                    )}
                  </td>
                  <td className="p-3.5 text-right whitespace-nowrap">
                    <button
                      onClick={() => onDeleteTransaction(tx.id)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-all cursor-pointer"
                      title="Delete Transaction"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
