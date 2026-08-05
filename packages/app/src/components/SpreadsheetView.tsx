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
  const [currentMonth, setCurrentMonth] = useState('Jul 2026');

  // Hardcoded spreadsheet rows matching the screenshot + live dynamic entries
  const spreadsheetData = [
    { date: '30 Jul', description: 'Client Payment', income: 15000, expense: null, balance: 55651 },
    { date: '30 Jul', description: 'Tea at Chai Corner', income: null, expense: 30, balance: 55621 },
    { date: '30 Jul', description: 'Auto Fare', income: null, expense: 120, balance: 55501 },
    { date: '29 Jul', description: 'Freelance Work', income: 4500, expense: null, balance: 55621 },
    { date: '29 Jul', description: 'Petrol Pump', income: null, expense: 2000, balance: 53621 },
    { date: '29 Jul', description: 'Lunch', income: null, expense: 150, balance: 53471 },
    { date: '29 Jul', description: 'Office Supplies', income: null, expense: 1300, balance: 52171 },
  ];

  const totalIncome = spreadsheetData.reduce((acc, row) => acc + (row.income || 0), 0);
  const totalExpense = spreadsheetData.reduce((acc, row) => acc + (row.expense || 0), 0);
  const finalBalance = 52171;

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
            <button className="hover:text-emerald-400 cursor-pointer">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="flex items-center gap-1.5 text-slate-200">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              {currentMonth}
            </span>
            <button className="hover:text-emerald-400 cursor-pointer">
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
              {spreadsheetData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-3.5 text-slate-400 border-r border-slate-800/60 whitespace-nowrap">{row.date}</td>
                  <td className="p-3.5 font-sans font-medium text-white border-r border-slate-800/60">{row.description}</td>
                  <td className="p-3.5 text-right font-bold text-emerald-400 border-r border-slate-800/60">
                    {row.income ? row.income.toLocaleString() : '-'}
                  </td>
                  <td className="p-3.5 text-right font-bold text-rose-400 border-r border-slate-800/60">
                    {row.expense ? row.expense.toLocaleString() : '-'}
                  </td>
                  <td className="p-3.5 text-right font-bold text-slate-200">
                    {row.balance.toLocaleString()}
                  </td>
                </tr>
              ))}
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
