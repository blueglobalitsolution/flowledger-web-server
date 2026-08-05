import React, { useState } from 'react';
import { Landmark, Building2, CreditCard, Wallet, Smartphone, Plus, ChevronRight, Check } from 'lucide-react';
import { Account } from '@shared/types';

interface AccountsViewProps {
  accounts: Account[];
  onAddAccount?: (acc: Account) => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({ accounts, onAddAccount }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<Account['type']>('Bank');
  const [newAccBalance, setNewAccBalance] = useState('');
  const [newAccNumber, setNewAccNumber] = useState('');

  const totalBalance = accounts.reduce((acc, a) => acc + a.balance, 0);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName || !newAccBalance) return;
    const newAccount: Account = {
      id: `acc-${Date.now()}`,
      name: newAccName,
      type: newAccType,
      balance: parseFloat(newAccBalance) || 0,
      currency: '₹',
      accountNumber: newAccNumber ? `•••${newAccNumber.slice(-4)}` : undefined,
      color: newAccType === 'Bank' ? '#10B981' : newAccType === 'Credit Card' ? '#EF4444' : '#F59E0B',
      icon: newAccType === 'Bank' ? 'Building2' : 'Wallet',
    };
    onAddAccount?.(newAccount);
    setIsModalOpen(false);
    setNewAccName('');
    setNewAccBalance('');
    setNewAccNumber('');
  };

  return (
    <div className="space-y-6 pb-12 text-white">
      {/* Header & Total Balance */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Landmark className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold tracking-tight">Accounts & Financial Wallets</h2>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Account</span>
          </button>
        </div>

        {/* Big Total Balance Header Card matching Screen 8 */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Balance</div>
            <div className="text-3xl font-bold font-mono text-emerald-400 mt-1">
              ₹{totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
            <Wallet className="w-8 h-8 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Account Cards List matching Screen 8 */}
      <div className="space-y-3">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="bg-slate-900/90 hover:bg-slate-800/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                style={{ backgroundColor: `${acc.color}20`, color: acc.color, border: `1px solid ${acc.color}40` }}
              >
                {acc.type === 'Bank' ? (
                  <Building2 className="w-5 h-5" />
                ) : acc.type === 'Credit Card' ? (
                  <CreditCard className="w-5 h-5" />
                ) : acc.type === 'Wallet' ? (
                  <Smartphone className="w-5 h-5" />
                ) : (
                  <Wallet className="w-5 h-5" />
                )}
              </div>

              <div>
                <div className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                  {acc.name}
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  {acc.type} {acc.accountNumber && `• ${acc.accountNumber}`}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`font-mono font-bold text-sm ${acc.balance < 0 ? 'text-rose-400' : 'text-white'}`}>
                ₹{acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
            </div>
          </div>
        ))}
      </div>

      {/* Modal for adding account */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Add New Account</h3>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Account Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC Salary Account"
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Account Type</label>
                <select
                  value={newAccType}
                  onChange={(e) => setNewAccType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                >
                  <option value="Bank">Bank Account</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Cash">Physical Wallet / Cash</option>
                  <option value="Wallet">Digital Wallet (Paytm/PhonePe)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Current Balance (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 25000"
                  value={newAccBalance}
                  onChange={(e) => setNewAccBalance(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Last 4 Digits (Optional)</label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="e.g. 4892"
                  value={newAccNumber}
                  onChange={(e) => setNewAccNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
