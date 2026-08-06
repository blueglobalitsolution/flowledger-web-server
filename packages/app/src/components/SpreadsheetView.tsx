import React, { useState } from 'react';
import { Table, Calendar, Download, ChevronLeft, ChevronRight, Plus, Sparkles } from 'lucide-react';
import { Transaction } from '@shared/types';

interface SpreadsheetViewProps {
  transactions: Transaction[];
  onOpenNewTransactionModal?: () => void;
}

export const SpreadsheetView: React.FC<SpreadsheetViewProps> = ({
  transactions,
  onOpenNewTransactionModal,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const currentMonthDisplay = currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const currentMonthStr = currentDate.toISOString().slice(0, 7); // e.g. "2026-07"

  // Sort chronologically to compute running balance
  const sortedTx = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
  
  let balance = 0;
  const txWithBalance = sortedTx.map(t => {
    if (t.type === 'income') balance += t.amount;
    else balance -= t.amount;
    return { ...t, balance };
  });

  // Filter for the selected month
  const monthTx = txWithBalance.filter(t => t.date.startsWith(currentMonthStr));
  
  // Show newest first in grid
  monthTx.reverse();

  const totalIncome = monthTx.reduce((acc, row) => acc + (row.type === 'income' ? row.amount : 0), 0);
  const totalExpense = monthTx.reduce((acc, row) => acc + (row.type === 'expense' ? row.amount : 0), 0);
  const finalBalance = monthTx.length > 0 
    ? monthTx[0].balance 
    : (txWithBalance.filter(t => t.date < currentMonthStr).pop()?.balance || 0);

  return (
    <div className="space-y-6 pb-12 text-white">
      {/* Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Table className="w-5 h-5 text-emerald-400" />
            <span>Spreadsheet View</span>
          </h2>
          <p className="text-xs text-slate-400">
            Grid view with running balances and double-entry reconciliation.
          </p>
        </div>

        {/* Date Month Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
            <button onClick={handlePrevMonth} className="hover:text-emerald-400 cursor-pointer">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="flex items-center gap-1.5 text-slate-200">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              {currentMonthDisplay}
            </span>
            <button onClick={handleNextMonth} className="hover:text-emerald-400 cursor-pointer">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {onOpenNewTransactionModal && (
            <button
              onClick={onOpenNewTransactionModal}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Entry</span>
            </button>
          )}
        </div>
      </div>

      {/* Spreadsheet Grid Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400">
                <th className="p-3.5 border-r border-slate-800">Date</th>
                <th className="p-3.5 border-r border-slate-800">Description</th>
                <th className="p-3.5 border-r border-slate-800 text-right text-emerald-400">Income (₹)</th>
                <th className="p-3.5 border-r border-slate-800 text-right text-rose-400">Expense (₹)</th>
                <th className="p-3.5 text-right text-slate-200">Balance (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {monthTx.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-3.5 text-slate-400 border-r border-slate-800/60 whitespace-nowrap">
                    {new Date(row.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                  </td>
                  <td className="p-3.5 font-sans font-medium text-white border-r border-slate-800/60">{row.description}</td>
                  <td className="p-3.5 text-right font-bold text-emerald-400 border-r border-slate-800/60">
                    {row.type === 'income' ? row.amount.toLocaleString() : '-'}
                  </td>
                  <td className="p-3.5 text-right font-bold text-rose-400 border-r border-slate-800/60">
                    {row.type === 'expense' ? row.amount.toLocaleString() : '-'}
                  </td>
                  <td className="p-3.5 text-right font-bold text-slate-200">
                    {row.balance.toLocaleString()}
                  </td>
                </tr>
              ))}
              {monthTx.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No entries found for {currentMonthDisplay}.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-950 border-t-2 border-slate-800 font-bold">
                <td className="p-3.5 border-r border-slate-800 text-slate-300" colSpan={2}>Total</td>
                <td className="p-3.5 border-r border-slate-800 text-right text-emerald-400">
                  {totalIncome.toLocaleString()}
                </td>
                <td className="p-3.5 border-r border-slate-800 text-right text-rose-400">
                  {totalExpense.toLocaleString()}
                </td>
                <td className="p-3.5 text-right text-emerald-400 font-bold">
                  {finalBalance.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
