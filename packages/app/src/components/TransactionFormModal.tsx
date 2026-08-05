import React, { useMemo, useState } from 'react';
import { Account, Category, Transaction, TransactionType } from '@shared/types';

interface TransactionFormModalProps {
  initialData?: Partial<Transaction> | null;
  categories: Category[];
  accounts: Account[];
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
}

const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Wallet', 'Cheque', 'Net Banking'];
const TRANSACTION_TAGS = [
  'Personal', 'Business', 'Family', 'Office', 'Travel', 'Tax Deductible', 'Reimbursable', 'Urgent',
  'Recurring', 'One-Time', 'Client Project', 'Investment', 'Emergency',
];

const SEP = ' > ';

function splitPath(path: string): { top: string; sub: string | null } {
  if (!path) return { top: '', sub: null };
  const idx = path.indexOf(SEP);
  if (idx === -1) return { top: path, sub: null };
  return { top: path.slice(0, idx), sub: path.slice(idx + SEP.length) };
}

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  initialData,
  categories,
  accounts,
  onClose,
  onSave,
}) => {
  const [type, setType] = useState<TransactionType>(initialData?.type || 'expense');
  const [amount, setAmount] = useState<number>(initialData?.amount || 0);
  const [currency, setCurrency] = useState<string>(initialData?.currency || '₹');
  const initialPath = splitPath(initialData?.category || '');
  const [topCategory, setTopCategory] = useState<string>(initialPath.top || '');
  const [subCategory, setSubCategory] = useState<string>(initialPath.sub || '');
  const [description, setDescription] = useState<string>(initialData?.description || '');
  const [account, setAccount] = useState<string>(initialData?.account || accounts[0]?.name || 'Physical Wallet');
  const [paymentMethod, setPaymentMethod] = useState<string>(initialData?.payment_method || 'UPI');
  const [date, setDate] = useState<string>(initialData?.date || new Date().toISOString().split('T')[0]);
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const topLevels = useMemo(
    () => categories.filter((c) => !c.path || !c.path.includes(SEP)).filter((c) => c.type === type),
    [categories, type]
  );
  const subcats = useMemo(
    () => categories.filter((c) => c.parent === topCategory && c.path?.includes(SEP)),
    [categories, topCategory]
  );

  const accountNames = accounts.length ? accounts.map((a) => a.name) : ['Physical Wallet', 'Main Checking'];

  const toggleTag = (t: string) => {
    setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amount <= 0) return;
    const category = subCategory ? `${topCategory}${SEP}${subCategory}` : topCategory;
    const newTx: Transaction = {
      id: initialData?.id || `tx-${Date.now()}`,
      type,
      amount: Number(amount),
      currency,
      category,
      description: description.trim(),
      account,
      payment_method: paymentMethod,
      date,
      confidence: initialData?.confidence || 100,
      ai_parsed: initialData?.ai_parsed || false,
      engine_used: initialData?.engine_used || 'Manual',
      status: 'completed',
      tags: tags.length ? tags : undefined,
    };
    onSave(newTx);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 text-white max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="font-bold text-base">New Financial Transaction Entry</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm font-semibold cursor-pointer">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
          {/* Type Selector */}
          <div className="grid grid-cols-3 gap-2">
            {(['expense', 'income', 'transfer'] as TransactionType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setType(t);
                  setTopCategory('');
                  setSubCategory('');
                }}
                className={`py-2 rounded-xl border font-bold capitalize cursor-pointer transition-all ${
                  type === t
                    ? t === 'income'
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : 'bg-rose-500 text-white border-rose-400'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Amount & Currency */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-slate-400 block mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono"
              >
                <option value="₹">₹ (INR)</option>
                <option value="$">$ (USD)</option>
                <option value="€">€ (EUR)</option>
                <option value="£">£ (GBP)</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-slate-400 block mb-1">Amount</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount || ''}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono font-bold"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-slate-400 block mb-1">Description</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Tea at Chai Corner"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
          </div>

          {/* Category (cascading) */}
          <div>
            <label className="text-slate-400 block mb-1">Category</label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={topCategory}
                onChange={(e) => {
                  setTopCategory(e.target.value);
                  setSubCategory('');
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer"
              >
                <option value="">Top category…</option>
                {topLevels.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                disabled={!topCategory || subcats.length === 0}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer disabled:opacity-40"
              >
                <option value="">Subcategory…</option>
                {subcats.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            {!showNewCat ? (
              <button
                type="button"
                onClick={() => setShowNewCat(true)}
                className="mt-1.5 text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                + Add a new category
              </button>
            ) : (
              <div className="mt-1.5 flex gap-2">
                <input
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="New category name"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newCatName.trim() && !topLevels.some((c) => c.name.toLowerCase() === newCatName.trim().toLowerCase())) {
                      setTopCategory(newCatName.trim());
                      setSubCategory('');
                      setShowNewCat(false);
                      setNewCatName('');
                    }
                  }}
                  className="px-2 py-1 rounded bg-emerald-600 text-white font-semibold"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewCat(false)}
                  className="px-2 py-1 rounded bg-slate-800 text-slate-300 font-semibold"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Account & Payment */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-400 block mb-1">Account</label>
              <select
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer"
              >
                {accountNames.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer"
              >
                {PAYMENT_METHODS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="text-slate-400 block mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-slate-400 block mb-1.5">Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {TRANSACTION_TAGS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTag(t)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all ${
                    tags.includes(t)
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!topCategory}
              className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-40"
            >
              Save Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
