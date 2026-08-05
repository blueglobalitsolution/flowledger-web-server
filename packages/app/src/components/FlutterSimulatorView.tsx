import React, { useState } from 'react';
import {
  Smartphone,
  Plus,
  Send,
  Sparkles,
  CheckCircle2,
  Wifi,
  Battery,
  Database,
  ArrowLeft,
  Home,
  Receipt,
  PieChart as PieIcon,
  Settings,
  Mic,
  Bell,
  Search,
  Filter,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Building2,
  CreditCard,
  Wallet,
  Check,
  TrendingUp,
  TrendingDown,
  Layers,
  Table,
  Zap,
} from 'lucide-react';
import { Transaction, Account } from '@shared/types';

interface FlutterSimulatorViewProps {
  transactions: Transaction[];
  accounts: Account[];
  onAddTransaction: (t: Transaction) => void;
  activeEngineName: string;
}

export type MobileScreenType =
  | 'home'
  | 'transactions'
  | 'add_transaction'
  | 'spreadsheet'
  | 'reports'
  | 'budget'
  | 'ai_parse'
  | 'accounts'
  | 'more_menu'
  | 'login';


export const FlutterSimulatorView: React.FC<FlutterSimulatorViewProps> = ({
  transactions,
  accounts,
  onAddTransaction,
  activeEngineName,
}) => {
  const [devicePlatform, setDevicePlatform] = useState<'ios' | 'android'>('ios');
  const [activeScreen, setActiveScreen] = useState<MobileScreenType>('home');

  // Input states for AI Quick Entry & Add Transaction form
  const [quickAiText, setQuickAiText] = useState('Tea 30 at Chai Corner via UPI');
  const [addTxType, setAddTxType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [addTxAmount, setAddTxAmount] = useState('1,250');
  const [addTxCategory, setAddTxCategory] = useState('Food & Beverages');
  const [addTxAccount, setAddTxAccount] = useState('Cash');
  const [addTxMethod, setAddTxMethod] = useState('UPI');
  const [addTxDate, setAddTxDate] = useState('30 Jul 2026');
  const [addTxTime, setAddTxTime] = useState('09:41 AM');

  const [aiParsedData, setAiParsedData] = useState({
    input: 'Tea 30 at Chai Corner via UPI',
    type: 'Expense',
    amount: '₹30',
    category: 'Food & Beverages',
    description: 'Tea at Chai Corner',
    payment_method: 'UPI',
    account: 'Cash',
    date: '30 Jul 2026',
    time: '09:41 AM',
    confidence: 96,
  });

  const handleRunAiParse = () => {
    const isTea = quickAiText.toLowerCase().includes('tea') || quickAiText.includes('30');
    setAiParsedData({
      input: quickAiText || 'Tea 30 at Chai Corner via UPI',
      type: 'Expense',
      amount: isTea ? '₹30' : '₹450',
      category: isTea ? 'Food & Beverages' : 'Transport & Fuel',
      description: quickAiText || 'Tea at Chai Corner',
      payment_method: 'UPI',
      account: 'Cash',
      date: '30 Jul 2026',
      time: '09:41 AM',
      confidence: 96,
    });
    setActiveScreen('ai_parse');
  };

  const handleSaveParsedTransaction = () => {
    const newTx: Transaction = {
      id: `tx-mob-${Date.now()}`,
      type: 'expense',
      amount: 30,
      currency: '₹',
      category: aiParsedData.category,
      description: aiParsedData.description,
      account: aiParsedData.account,
      payment_method: aiParsedData.payment_method,
      date: '2026-07-30',
      confidence: aiParsedData.confidence,
      ai_parsed: true,
      engine_used: activeEngineName,
      status: 'completed',
    };
    onAddTransaction(newTx);
    setActiveScreen('transactions');
  };

  const handleSaveManualTransaction = () => {
    const numericAmt = parseFloat(addTxAmount.replace(/,/g, '')) || 1250;
    const newTx: Transaction = {
      id: `tx-mob-manual-${Date.now()}`,
      type: addTxType,
      amount: numericAmt,
      currency: '₹',
      category: addTxCategory,
      description: `${addTxCategory} Expense`,
      account: addTxAccount,
      payment_method: addTxMethod,
      date: '2026-07-30',
      confidence: 100,
      ai_parsed: false,
      status: 'completed',
    };
    onAddTransaction(newTx);
    setActiveScreen('transactions');
  };

  return (
    <div className="space-y-8 pb-12 text-white">
      {/* Top Banner & Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <Smartphone className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold tracking-tight">
                Flutter Cross-Platform App Viewer (iOS & Android)
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              Experience the complete mobile application UI. Switch between all 9 screens from the reference design.
            </p>
          </div>

          {/* Device OS Selector */}
          <div className="flex items-center bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setDevicePlatform('ios')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                devicePlatform === 'ios'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              📱 iPhone 15 Pro (iOS)
            </button>
            <button
              onClick={() => setDevicePlatform('android')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                devicePlatform === 'android'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🤖 Pixel 8 Pro (Android)
            </button>
          </div>
        </div>

        {/* Screen Jump Selector Buttons matching all 10 screens */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 border-t border-slate-800/80 text-xs">
          {[
            { id: 'home', label: '1. Home' },
            { id: 'transactions', label: '2. Transactions' },
            { id: 'add_transaction', label: '3. Add Transaction' },
            { id: 'spreadsheet', label: '4. Spreadsheet' },
            { id: 'reports', label: '5. Reports' },
            { id: 'budget', label: '6. Budget' },
            { id: 'ai_parse', label: '7. AI Parse Result' },
            { id: 'accounts', label: '8. Accounts' },
            { id: 'more_menu', label: '9. More / Settings' },
            { id: 'login', label: '10. Mobile App Login' },
          ].map((sc) => (
            <button
              key={sc.id}
              onClick={() => setActiveScreen(sc.id as MobileScreenType)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer text-xs ${
                activeScreen === sc.id
                  ? 'bg-indigo-600 text-white font-bold border border-indigo-400'
                  : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {sc.label}
            </button>
          ))}
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Phone Frame Simulator Container */}
        <div className="lg:col-span-5 flex justify-center">
          <div
            className={`w-[360px] h-[720px] bg-slate-950 border-[10px] ${
              devicePlatform === 'ios' ? 'border-slate-800 rounded-[52px]' : 'border-slate-900 rounded-[36px]'
            } shadow-2xl relative overflow-hidden flex flex-col ring-1 ring-white/10`}
          >
            {/* Top Device Notch / Island */}
            <div className="w-full bg-slate-950 pt-3 pb-1 px-6 flex items-center justify-between text-[11px] font-mono text-slate-300 select-none z-30">
              <span>9:41</span>
              {devicePlatform === 'ios' ? (
                <div className="w-24 h-4 bg-slate-900 rounded-full mx-auto shadow-inner" />
              ) : (
                <div className="w-3.5 h-3.5 bg-slate-900 rounded-full mx-auto" />
              )}
              <div className="flex items-center gap-1.5 text-slate-400">
                <Wifi className="w-3 h-3" />
                <Battery className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* SCREEN CONTENT FRAME */}
            <div className="flex-1 overflow-y-auto bg-slate-950 text-white p-4 space-y-4 font-sans text-xs select-none">
              
              {/* SCREEN 1: HOME */}
              {activeScreen === 'home' && (
                <div className="space-y-4 animate-fade-in">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/30">
                        <Zap className="w-4 h-4 fill-emerald-400" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm tracking-tight text-white">FlowLedger</span>
                        <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-1.5 py-0.2 rounded font-mono">v1.0</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 bg-slate-900 rounded-lg text-slate-400">
                        <Bell className="w-3.5 h-3.5" />
                      </button>
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-400 to-indigo-500 text-slate-950 font-bold text-[10px] flex items-center justify-center">
                        MS
                      </div>
                    </div>
                  </div>

                  {/* AI Quick Entry Input */}
                  <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-3 space-y-2">
                    <div className="text-[10px] text-indigo-300 font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      <span>AI Quick Entry</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-950 rounded-xl p-2 border border-slate-800">
                      <input
                        type="text"
                        value={quickAiText}
                        onChange={(e) => setQuickAiText(e.target.value)}
                        className="w-full bg-transparent text-white text-[11px] focus:outline-none"
                        placeholder="Type or speak your transaction"
                      />
                      <Mic className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <button
                        onClick={handleRunAiParse}
                        className="bg-emerald-500 text-slate-950 text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 cursor-pointer"
                      >
                        AI Parse
                      </button>
                    </div>
                  </div>

                  {/* Metric Cards Grid matching Screen 1 */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400">Total Net Worth</div>
                      <div className="text-sm font-bold font-mono text-white mt-0.5">₹55,651.30</div>
                      <div className="text-[9px] text-emerald-400 mt-1">▲ 12.4% vs last month</div>
                    </div>

                    <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400">Monthly Income</div>
                      <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">₹99,500</div>
                      <div className="text-[9px] text-emerald-400 mt-1">▲ 15.2% vs last month</div>
                    </div>

                    <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400">Monthly Expenses</div>
                      <div className="text-sm font-bold font-mono text-rose-400 mt-0.5">₹8,920</div>
                      <div className="text-[9px] text-emerald-400 mt-1">▼ 8.2% vs last month</div>
                    </div>

                    <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400">Net Cashflow</div>
                      <div className="text-sm font-bold font-mono text-indigo-300 mt-0.5">₹90,580</div>
                      <div className="text-[9px] text-emerald-400 mt-1">▲ 83.8% savings rate</div>
                    </div>
                  </div>

                  {/* Cashflow Trend Chart Box */}
                  <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-slate-200">Cashflow Trend</span>
                      <span className="text-slate-400 font-mono">Aug 2026</span>
                    </div>
                    <div className="h-20 bg-slate-950 rounded-lg border border-slate-800 flex items-end justify-between p-2">
                      <div className="w-2.5 bg-emerald-500 h-10 rounded-t" />
                      <div className="w-2.5 bg-emerald-500 h-14 rounded-t" />
                      <div className="w-2.5 bg-emerald-500 h-8 rounded-t" />
                      <div className="w-2.5 bg-emerald-500 h-16 rounded-t" />
                      <div className="w-2.5 bg-emerald-500 h-12 rounded-t" />
                    </div>
                  </div>

                  {/* Recent Entries matching Screen 1 */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-slate-300">Recent Ledger Entries</span>
                      <button onClick={() => setActiveScreen('transactions')} className="text-emerald-400 hover:underline">
                        View All
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-[11px]">Tea at Chai Corner</div>
                          <div className="text-[9px] text-slate-400">Expense • Today • Cash</div>
                        </div>
                        <div className="font-mono text-rose-400 font-bold">-₹30</div>
                      </div>

                      <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-[11px]">Payment from Client</div>
                          <div className="text-[9px] text-slate-400">Income • Today • HDFC</div>
                        </div>
                        <div className="font-mono text-emerald-400 font-bold">+₹15,000</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SCREEN 2: TRANSACTIONS */}
              {activeScreen === 'transactions' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between pt-1">
                    <h3 className="font-bold text-sm text-white">Transactions</h3>
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-slate-400" />
                      <Filter className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  {/* Category Pills matching Screen 2 */}
                  <div className="flex items-center gap-1.5 overflow-x-auto text-[10px] pb-1">
                    <span className="bg-emerald-500 text-slate-950 font-bold px-3 py-1 rounded-full">All</span>
                    <span className="bg-slate-900 text-slate-300 px-3 py-1 rounded-full border border-slate-800">Income</span>
                    <span className="bg-slate-900 text-slate-300 px-3 py-1 rounded-full border border-slate-800">Expense</span>
                    <span className="bg-slate-900 text-slate-300 px-3 py-1 rounded-full border border-slate-800">Transfer</span>
                  </div>

                  {/* Date Group 1: Today • 30 Jul 2026 */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono bg-slate-900 px-2.5 py-1 rounded-lg">
                      <span>Today • 30 Jul 2026</span>
                      <span>
                        <strong className="text-emerald-400">₹12,670</strong> | <strong className="text-rose-400">₹2,430</strong>
                      </span>
                    </div>

                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-emerald-400 text-[11px]">Payment from Client</div>
                        <div className="text-[9px] text-slate-400">10:30 AM • Project Payment • HDFC Bank</div>
                      </div>
                      <div className="font-mono font-bold text-emerald-400">+₹15,000</div>
                    </div>

                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-white text-[11px]">Tea at Chai Corner</div>
                        <div className="text-[9px] text-slate-400">09:15 AM • Food & Beverages • Cash</div>
                      </div>
                      <div className="font-mono font-bold text-rose-400">-₹30</div>
                    </div>

                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-white text-[11px]">Auto Fare</div>
                        <div className="text-[9px] text-slate-400">08:40 AM • Travel • UPI</div>
                      </div>
                      <div className="font-mono font-bold text-rose-400">-₹120</div>
                    </div>
                  </div>

                  {/* Date Group 2: Yesterday • 29 Jul 2026 */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono bg-slate-900 px-2.5 py-1 rounded-lg">
                      <span>Yesterday • 29 Jul 2026</span>
                      <span>
                        <strong className="text-emerald-400">₹4,500</strong> | <strong className="text-rose-400">₹3,450</strong>
                      </span>
                    </div>

                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-emerald-400 text-[11px]">Freelance Work</div>
                        <div className="text-[9px] text-slate-400">Web Development • HDFC Bank</div>
                      </div>
                      <div className="font-mono font-bold text-emerald-400">+₹4,500</div>
                    </div>

                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-white text-[11px]">Petrol Pump</div>
                        <div className="text-[9px] text-slate-400">Fuel • Cash</div>
                      </div>
                      <div className="font-mono font-bold text-rose-400">-₹2,000</div>
                    </div>
                  </div>
                </div>
              )}

              {/* SCREEN 3: ADD TRANSACTION */}
              {activeScreen === 'add_transaction' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-slate-400" onClick={() => setActiveScreen('home')}>
                    <ArrowLeft className="w-4 h-4 cursor-pointer" />
                    <span className="font-bold text-sm text-white">Add Transaction</span>
                  </div>

                  {/* Type Toggle Tabs matching Screen 3 */}
                  <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
                    <button
                      onClick={() => setAddTxType('expense')}
                      className={`py-1.5 rounded-lg transition-all ${addTxType === 'expense' ? 'bg-rose-500 text-white' : 'text-slate-400'}`}
                    >
                      Expense
                    </button>
                    <button
                      onClick={() => setAddTxType('income')}
                      className={`py-1.5 rounded-lg transition-all ${addTxType === 'income' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'}`}
                    >
                      Income
                    </button>
                    <button
                      onClick={() => setAddTxType('transfer')}
                      className={`py-1.5 rounded-lg transition-all ${addTxType === 'transfer' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                    >
                      Transfer
                    </button>
                  </div>

                  {/* Large Amount Display */}
                  <div className="text-center py-2 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-1">
                    <div className="text-2xl font-bold font-mono text-white">₹ {addTxAmount}</div>
                    <div className="text-[10px] text-slate-400">Add Description (Optional)</div>
                  </div>

                  {/* Form Fields List matching Screen 3 */}
                  <div className="bg-slate-900 rounded-2xl divide-y divide-slate-800 border border-slate-800 text-[11px]">
                    <div className="p-3 flex justify-between items-center">
                      <span className="text-slate-400">Category</span>
                      <span className="font-bold text-white flex items-center gap-1">{addTxCategory} <ChevronRight className="w-3.5 h-3.5 text-slate-500" /></span>
                    </div>
                    <div className="p-3 flex justify-between items-center">
                      <span className="text-slate-400">Account</span>
                      <span className="font-bold text-white flex items-center gap-1">{addTxAccount} <ChevronRight className="w-3.5 h-3.5 text-slate-500" /></span>
                    </div>
                    <div className="p-3 flex justify-between items-center">
                      <span className="text-slate-400">Payment Method</span>
                      <span className="font-bold text-white flex items-center gap-1">{addTxMethod} <ChevronRight className="w-3.5 h-3.5 text-slate-500" /></span>
                    </div>
                    <div className="p-3 flex justify-between items-center">
                      <span className="text-slate-400">Date</span>
                      <span className="font-bold text-white flex items-center gap-1">{addTxDate} <ChevronRight className="w-3.5 h-3.5 text-slate-500" /></span>
                    </div>
                    <div className="p-3 flex justify-between items-center">
                      <span className="text-slate-400">Time</span>
                      <span className="font-bold text-white flex items-center gap-1">{addTxTime} <ChevronRight className="w-3.5 h-3.5 text-slate-500" /></span>
                    </div>
                  </div>

                  {/* Save Draft & Save Buttons matching Screen 3 */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button className="bg-slate-800 text-slate-300 font-bold py-2.5 rounded-xl text-xs border border-slate-700">
                      Save Draft
                    </button>
                    <button
                      onClick={handleSaveManualTransaction}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs cursor-pointer"
                    >
                      Save Transaction
                    </button>
                  </div>
                </div>
              )}

              {/* SCREEN 4: SPREADSHEET VIEW */}
              {activeScreen === 'spreadsheet' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                      <Table className="w-4 h-4 text-emerald-400" />
                      <span>Spreadsheet View</span>
                    </h3>
                    <div className="flex items-center gap-1 text-[10px] font-mono bg-slate-900 px-2 py-1 rounded border border-slate-800">
                      <Calendar className="w-3 h-3 text-emerald-400" />
                      <span>Jul 2026</span>
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto">
                    <table className="w-full text-[9px] font-mono border-collapse">
                      <thead>
                        <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                          <th className="p-1.5 border-r border-slate-800">Date</th>
                          <th className="p-1.5 border-r border-slate-800">Desc</th>
                          <th className="p-1.5 border-r border-slate-800 text-emerald-400">Inc</th>
                          <th className="p-1.5 border-r border-slate-800 text-rose-400">Exp</th>
                          <th className="p-1.5 text-slate-200">Bal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        <tr>
                          <td className="p-1.5 border-r border-slate-800">30 Jul</td>
                          <td className="p-1.5 border-r border-slate-800 font-sans">Client Pay</td>
                          <td className="p-1.5 border-r border-slate-800 text-emerald-400 font-bold">15,000</td>
                          <td className="p-1.5 border-r border-slate-800 text-slate-500">-</td>
                          <td className="p-1.5 font-bold">55,651</td>
                        </tr>
                        <tr>
                          <td className="p-1.5 border-r border-slate-800">30 Jul</td>
                          <td className="p-1.5 border-r border-slate-800 font-sans">Tea Chai</td>
                          <td className="p-1.5 border-r border-slate-800 text-slate-500">-</td>
                          <td className="p-1.5 border-r border-slate-800 text-rose-400 font-bold">30</td>
                          <td className="p-1.5 font-bold">55,621</td>
                        </tr>
                        <tr>
                          <td className="p-1.5 border-r border-slate-800">29 Jul</td>
                          <td className="p-1.5 border-r border-slate-800 font-sans">Freelance</td>
                          <td className="p-1.5 border-r border-slate-800 text-emerald-400 font-bold">4,500</td>
                          <td className="p-1.5 border-r border-slate-800 text-slate-500">-</td>
                          <td className="p-1.5 font-bold">55,621</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SCREEN 5: REPORTS */}
              {activeScreen === 'reports' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-white">Reports</h3>
                    <span className="text-[10px] font-mono text-slate-400">Jul 1 - Jul 31, 2026</span>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg text-[10px]">
                    <span className="bg-emerald-500 text-slate-950 font-bold px-2 py-0.5 rounded">Summary</span>
                    <span className="text-slate-400 px-2 py-0.5">Categories</span>
                    <span className="text-slate-400 px-2 py-0.5">Cashflow</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                      <div className="text-[9px] text-slate-400">Income</div>
                      <div className="text-xs font-bold text-emerald-400 font-mono">₹99,500</div>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                      <div className="text-[9px] text-slate-400">Expense</div>
                      <div className="text-xs font-bold text-rose-400 font-mono">₹8,920</div>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                      <div className="text-[9px] text-slate-400">Profit</div>
                      <div className="text-xs font-bold text-indigo-300 font-mono">₹90,580</div>
                    </div>
                  </div>
                </div>
              )}

              {/* SCREEN 6: BUDGET */}
              {activeScreen === 'budget' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-white">Budget</h3>
                    <span className="text-[10px] font-mono text-emerald-400">Jul 2026</span>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span>Overall Budget</span>
                      <span className="font-mono text-emerald-400">₹50,000</span>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div className="bg-emerald-500 h-full w-[56.9%]" />
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                      <span>Spent ₹28,450 (56.9%)</span>
                      <span>Remaining ₹21,550</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold text-slate-400 flex justify-between">
                      <span>Category Budget</span>
                      <span className="text-emerald-400">Edit</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 space-y-1 text-[10px]">
                      <div className="flex justify-between font-bold">
                        <span>Food & Beverages</span>
                        <span>₹4,000 (93%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                        <div className="bg-amber-400 h-full w-[93%]" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SCREEN 7: AI PARSE RESULT */}
              {activeScreen === 'ai_parse' && (
                <div className="space-y-3 animate-fade-in">
                  <h3 className="font-bold text-sm text-white">AI Parse Result</h3>

                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 space-y-1">
                    <div className="text-[9px] text-slate-400">Your Input</div>
                    <div className="text-xs font-mono text-white">{aiParsedData.input}</div>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-2xl border border-emerald-500/40 space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-white">Parsed Transaction</span>
                      <span className="bg-emerald-500/20 text-emerald-300 font-bold font-mono px-2 py-0.5 rounded border border-emerald-500/40">
                        Confidence: {aiParsedData.confidence}%
                      </span>
                    </div>

                    <div className="space-y-1 font-mono text-[10px] divide-y divide-slate-800/80">
                      <div className="flex justify-between pt-1">
                        <span className="text-slate-400">Type</span>
                        <span className="font-bold text-rose-400">{aiParsedData.type}</span>
                      </div>
                      <div className="flex justify-between pt-1">
                        <span className="text-slate-400">Amount</span>
                        <span className="font-bold text-emerald-400">{aiParsedData.amount}</span>
                      </div>
                      <div className="flex justify-between pt-1">
                        <span className="text-slate-400">Category</span>
                        <span className="font-bold text-white">{aiParsedData.category}</span>
                      </div>
                      <div className="flex justify-between pt-1">
                        <span className="text-slate-400">Description</span>
                        <span className="text-white">{aiParsedData.description}</span>
                      </div>
                      <div className="flex justify-between pt-1">
                        <span className="text-slate-400">Payment Method</span>
                        <span className="text-white">{aiParsedData.payment_method}</span>
                      </div>
                      <div className="flex justify-between pt-1">
                        <span className="text-slate-400">Account</span>
                        <span className="text-white">{aiParsedData.account}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setActiveScreen('add_transaction')}
                      className="bg-slate-800 text-slate-300 font-bold py-2 rounded-xl text-xs border border-slate-700"
                    >
                      Edit Details
                    </button>
                    <button
                      onClick={handleSaveParsedTransaction}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2 rounded-xl text-xs cursor-pointer shadow-lg shadow-emerald-500/20"
                    >
                      Save Transaction
                    </button>
                  </div>
                </div>
              )}

              {/* SCREEN 8: ACCOUNTS */}
              {activeScreen === 'accounts' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-white">Accounts</h3>
                    <span className="text-xs text-emerald-400 font-bold cursor-pointer">+ Add</span>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                    <div className="text-[10px] text-slate-400">Total Balance</div>
                    <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">₹1,10,230.50</div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-white text-[11px]">Main Checking</div>
                        <div className="text-[9px] text-slate-400">Bank •• 4892</div>
                      </div>
                      <div className="font-mono font-bold text-white">₹14,250.80</div>
                    </div>

                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-white text-[11px]">HDFC Savings</div>
                        <div className="text-[9px] text-slate-400">Bank •• 1024</div>
                      </div>
                      <div className="font-mono font-bold text-white">₹48,900.00</div>
                    </div>

                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-white text-[11px]">ICICI Sapphire</div>
                        <div className="text-[9px] text-slate-400">Credit Card •• 9912</div>
                      </div>
                      <div className="font-mono font-bold text-rose-400">-₹12,800.00</div>
                    </div>
                  </div>
                </div>
              )}

              {/* SCREEN 9: MORE MENU / SETTINGS */}
              {activeScreen === 'more_menu' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center">
                      MS
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white">Mehul Solanki</div>
                      <div className="text-[9px] text-slate-400 font-mono">mehul@flowledger.app</div>
                      <span className="text-[8px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.2 rounded mt-1 inline-block">
                        Pro Plan
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-2xl divide-y divide-slate-800 border border-slate-800 text-[11px]">
                    <div className="p-2.5 flex justify-between items-center">
                      <span className="text-slate-200">Businesses</span>
                      <span className="text-[10px] text-slate-400 font-mono">2 Active &gt;</span>
                    </div>
                    <div className="p-2.5 flex justify-between items-center">
                      <span className="text-slate-200">Categories</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <div className="p-2.5 flex justify-between items-center">
                      <span className="text-slate-200">Payment Methods</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <div className="p-2.5 flex justify-between items-center">
                      <span className="text-slate-200">Recurring Transactions</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <div className="p-2.5 flex justify-between items-center">
                      <span className="text-slate-200">Goals</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <div className="p-2.5 flex justify-between items-center">
                      <span className="text-slate-200">Settings</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <div className="p-2.5 flex justify-between items-center">
                      <span className="text-slate-200">Data & Backup</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <div
                      onClick={() => setActiveScreen('login')}
                      className="p-2.5 flex justify-between items-center cursor-pointer hover:bg-slate-800/60 transition-colors"
                    >
                      <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" /> Mobile Authentication & Login
                      </span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded font-mono">
                        Active &gt;
                      </span>
                    </div>
                    <div className="p-2.5 flex justify-between items-center">
                      <span className="text-slate-200">Help & Support</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <div className="p-2.5 flex justify-between items-center">
                      <span className="text-slate-200">About FlowLedger</span>
                      <span className="text-[10px] text-slate-400 font-mono">v1.0.0 &gt;</span>
                    </div>
                  </div>
                </div>
              )}

              {/* SCREEN 10: MOBILE APP LOGIN & BIOMETRICS */}
              {activeScreen === 'login' && (
                <div className="space-y-3 animate-fade-in pt-1">
                  <div className="text-center space-y-1">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/30 ring-1 ring-white/20">
                      <Zap className="w-6 h-6 fill-slate-950" />
                    </div>
                    <h3 className="text-base font-bold text-white">FlowLedger Mobile</h3>
                    <p className="text-[10px] text-slate-400">Sign in to sync your financial ledger</p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-2.5 text-[11px]">
                    <div>
                      <label className="text-slate-400 text-[10px] block mb-1">Mobile Account Email</label>
                      <input
                        type="email"
                        readOnly
                        value="mehul@flowledger.app"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 font-mono text-emerald-300 text-[10px]"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 text-[10px] block mb-1">PIN / Password</label>
                      <input
                        type="password"
                        readOnly
                        value="••••••••"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 font-mono text-slate-300 text-[10px]"
                      />
                    </div>

                    <button
                      onClick={() => setActiveScreen('home')}
                      className="w-full bg-emerald-500 text-slate-950 font-bold py-2.5 rounded-xl text-xs cursor-pointer hover:bg-emerald-400 transition-all shadow-md shadow-emerald-500/20"
                    >
                      Authenticate Mobile Session
                    </button>
                  </div>

                  {/* Biometric Quick Login Option */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center space-y-2">
                    <div className="text-[10px] text-slate-400">Or use Face ID / Fingerprint Biometrics</div>
                    <button
                      onClick={() => setActiveScreen('home')}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Scan Face ID / Touch ID</span>
                    </button>
                  </div>

                  {/* Role Switch Note */}
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-indigo-500/30 text-[10px] text-slate-400 space-y-1">
                    <div className="text-indigo-300 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Role-Based Sync Active
                    </div>
                    <p>App User profile is synchronized with local Riverpod state and Cloud Firestore.</p>
                  </div>
                </div>
              )}


            </div>

            {/* Mobile Bottom Floating Action Button (+) */}
            {activeScreen !== 'add_transaction' && activeScreen !== 'ai_parse' && (
              <button
                onClick={() => setActiveScreen('add_transaction')}
                className="absolute bottom-14 right-4 w-11 h-11 bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 rounded-full flex items-center justify-center shadow-xl cursor-pointer hover:scale-105 transition-all z-30 ring-2 ring-emerald-300/40"
              >
                <Plus className="w-5 h-5 stroke-[3]" />
              </button>
            )}

            {/* Mobile Bottom Navigation Bar matching screenshot */}
            <div className="bg-slate-950 border-t border-slate-800/80 py-2 px-3 flex justify-around items-center text-slate-400 text-[9px] z-30">
              <button
                onClick={() => setActiveScreen('home')}
                className={`flex flex-col items-center gap-0.5 cursor-pointer ${activeScreen === 'home' ? 'text-emerald-400 font-bold' : ''}`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>Home</span>
              </button>
              <button
                onClick={() => setActiveScreen('transactions')}
                className={`flex flex-col items-center gap-0.5 cursor-pointer ${activeScreen === 'transactions' ? 'text-emerald-400 font-bold' : ''}`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Transactions</span>
              </button>
              <div className="w-6" /> {/* Placeholder spacing for center FAB */}
              <button
                onClick={() => setActiveScreen('reports')}
                className={`flex flex-col items-center gap-0.5 cursor-pointer ${activeScreen === 'reports' ? 'text-emerald-400 font-bold' : ''}`}
              >
                <PieIcon className="w-3.5 h-3.5" />
                <span>Reports</span>
              </button>
              <button
                onClick={() => setActiveScreen('more_menu')}
                className={`flex flex-col items-center gap-0.5 cursor-pointer ${activeScreen === 'more_menu' ? 'text-emerald-400 font-bold' : ''}`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>More</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side Info Panel explaining Flutter & Web synchronicity */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span>FlowLedger Multi-Platform Synchronicity (Web + iOS + Android)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-emerald-400">Web App (React + Tailwind)</div>
                <p className="text-slate-400 text-[11px]">
                  Full widescreen dashboard with interactive Recharts, spreadsheet views, SaaS admin controls, and local AI microservice integration.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-purple-400">Flutter Mobile App (iOS / Android)</div>
                <p className="text-slate-400 text-[11px]">
                  Riverpod state management + Hive key-value cache + SQLite database for offline-first resilience.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-indigo-500/30 text-xs space-y-1">
              <div className="font-bold text-indigo-300">💡 Interactive Simulator Tip:</div>
              <p className="text-slate-400 text-[11px]">
                Click any of the top numbered screen pills (<span className="text-emerald-400">1. Home</span>, <span className="text-emerald-400">3. Add Transaction</span>, <span className="text-emerald-400">4. Spreadsheet</span>, <span className="text-emerald-400">7. AI Parse Result</span>, etc.) to preview all 9 screens shown in the design showcase!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
