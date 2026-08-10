import React, { useEffect, useState } from 'react';
import { DashboardView } from './components/DashboardView';
import { AIEngineSandboxView } from './components/AIEngineSandboxView';
import { TransactionsView } from './components/TransactionsView';
import { SpreadsheetView } from './components/SpreadsheetView';
import { ReportsView } from './components/ReportsView';
import { BudgetsView } from './components/BudgetsView';
import { AccountsView } from './components/AccountsView';
import { AIParsingModal } from './components/AIParsingModal';
import { TransactionFormModal } from './components/TransactionFormModal';
import { LoginView } from './components/LoginView';
import { Sidebar } from './components/Sidebar';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { AVAILABLE_AI_ENGINES } from '@shared/mockData';
import {
  Account,
  AIEngineConfig,
  AIParseResult,
  AuthUser,
  Budget,
  BudgetAlert,
  Category,
  Transaction,
} from '@shared/types';
import {
  createAccount,
  createBudget,
  createCategory,
  createTransaction,
  deleteBudget,
  deleteCategory,
  deleteTransaction,
  getAccounts,
  getBudgets,
  getCategories,
  getStoredSession,
  getTransactions,
  login,
  logout,
  subscribeChanges,
  updateBudget,
  updateCategory,
} from '@shared/api';

const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
    exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

export default function App() {
  const [activeEngine, setActiveEngine] = useState<AIEngineConfig>(AVAILABLE_AI_ENGINES[0]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(getStoredSession()?.user ?? null);

  const [activeParseModal, setActiveParseModal] = useState<AIParseResult | null>(null);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionModalData, setTransactionModalData] = useState<Partial<Transaction> | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [budgetAlert, setBudgetAlert] = useState<BudgetAlert | null>(null);

  const showBudgetAlert = (alert: BudgetAlert | null) => {
    if (!alert) return;
    setBudgetAlert(alert);
    window.setTimeout(() => setBudgetAlert((cur) => (cur === alert ? null : cur)), 7000);
  };

  // Load all data straight from the database (fresh DB = empty).
  const refreshData = async () => {
    const [tx, acc, bud, cat] = await Promise.all([
      getTransactions(),
      getAccounts(),
      getBudgets(),
      getCategories(),
    ]);
    setTransactions(tx);
    setAccounts(acc);
    setBudgets(bud);
    setCategories(cat);
    setLastSyncedAt(new Date());
  };

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
  };

  useEffect(() => {
    (async () => {
      try {
        await refreshData();
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Live updates: refetch whenever the server broadcasts a change.
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeChanges(
      () => {
        refreshData().catch((err) => console.error('Live refresh failed:', err));
      },
      (alert) => showBudgetAlert(alert),
      (err) => console.warn('Live updates disconnected:', err)
    );
    return unsubscribe;
  }, [currentUser]);


  // Quick Natural Language AI Parse Handler
  const resolveAccount = (account: string) => {
    const exact = accounts.find((a) => a.name.toLowerCase() === (account || '').toLowerCase());
    if (exact) return exact.name;
    return accounts.length ? accounts[0].name : account || 'Physical Wallet';
  };

  const handleQuickParse = async (text: string) => {
    try {
      const response = await fetch('/api/ai/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, engine: activeEngine.id, accounts: accounts.map((a) => a.name) }),
      });

      const parseResult: AIParseResult = await response.json();
      parseResult.account = resolveAccount(parseResult.account);

      if (parseResult.confidence >= 95) {
        addTransactionFromParseResult(parseResult);
      } else {
        setActiveParseModal(parseResult);
      }
    } catch (err) {
      console.error('Quick parse failed:', err);
    }
  };

  const handleSandboxTestParse = async (inputPrompt: string, engineId: string): Promise<AIParseResult> => {
    const response = await fetch('/api/ai/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: inputPrompt, engine: engineId, accounts: accounts.map((a) => a.name) }),
    });

    const result: AIParseResult = await response.json();
    result.account = resolveAccount(result.account);
    return result;
  };

  const addTransactionFromParseResult = async (result: AIParseResult, resolvedCategory?: string) => {
    const { alert } = await createTransaction({
      type: result.type,
      amount: result.amount,
      currency: result.currency,
      category: resolvedCategory || result.category,
      description: result.description,
      account: resolveAccount(result.account),
      payment_method: result.payment_method,
      date: result.date,
      confidence: result.confidence,
      ai_parsed: true,
      engine_used: result.engine_used,
      status: 'completed',
    });
    showBudgetAlert(alert);
    await refreshData();
  };

  const handleSaveTransactionModal = async (tx: Transaction) => {
    const { id, ...input } = tx;
    const { alert } = await createTransaction(input);
    showBudgetAlert(alert);
    await refreshData();
  };

  const handleDeleteTransaction = async (id: string) => {
    await deleteTransaction(id);
    await refreshData();
  };


  const handleAddAccount = async (acc: Account) => {
    const { id, ...input } = acc;
    await createAccount(input);
    await refreshData();
  };

  const handleCreateBudget = async (input: Omit<Budget, 'id'>) => {
    await createBudget(input);
    await refreshData();
  };

  const handleUpdateBudget = async (id: string, patch: Partial<Omit<Budget, 'id'>>) => {
    await updateBudget(id, patch);
    await refreshData();
  };

  const handleDeleteBudget = async (id: string) => {
    await deleteBudget(id);
    await refreshData();
  };

  const handleCreateCategory = async (input: Omit<Category, 'id'>) => {
    await createCategory(input);
    await refreshData();
  };

  const handleUpdateCategory = async (id: string, patch: Partial<Omit<Category, 'id'>>) => {
    await updateCategory(id, patch);
    await refreshData();
  };

  const handleDeleteCategory = async (id: string) => {
    await deleteCategory(id);
    await refreshData();
  };

  if (!currentUser) {
    return (
        <Routes>
          <Route path="/login" element={
            <LoginView onLogin={(user) => {
              setCurrentUser(user);
              window.location.href = '/dashboard';
            }} />
          } />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#181d27]">
      <Sidebar currentUser={currentUser} onLogout={handleLogout} />
      <div id="flowledger-root" className="flex-1 min-h-screen text-slate-100 font-sans flex flex-col overflow-x-hidden" style={{ background: '#181d27', minHeight: '100vh' }}>
          {/* Main View Container */}
          <main className="flex-1 w-full mx-auto px-6 py-8">
            {isLoading && (
              <div className="flex items-center justify-center py-24 text-slate-400 text-sm animate-pulse">
                Loading from database...
              </div>
            )}
            
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/login" element={<Navigate to="/dashboard" replace />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                
                <Route path="/dashboard" element={
                  <PageTransition>
                    <DashboardView
                      transactions={transactions}
                      accounts={accounts}
                      budgets={budgets}
                      activeEngine={activeEngine}
                      onQuickParse={handleQuickParse}
                      onOpenNewTransactionModal={() => {
                        setTransactionModalData(null);
                        setIsTransactionModalOpen(true);
                      }}
                    />
                  </PageTransition>
                } />

                <Route path="/transactions" element={
                  <PageTransition>
                    <TransactionsView
                      transactions={transactions}
                      onDeleteTransaction={handleDeleteTransaction}
                      onOpenNewTransactionModal={() => {
                        setTransactionModalData(null);
                        setIsTransactionModalOpen(true);
                      }}
                    />
                  </PageTransition>
                } />

                <Route path="/spreadsheet" element={
                  <PageTransition>
                    <SpreadsheetView
                      transactions={transactions}
                      onOpenNewTransactionModal={() => {
                        setTransactionModalData(null);
                        setIsTransactionModalOpen(true);
                      }}
                    />
                  </PageTransition>
                } />

                <Route path="/reports" element={
                  <PageTransition>
                    <ReportsView transactions={transactions} accounts={accounts} />
                  </PageTransition>
                } />

                <Route path="/budgets" element={
                  <PageTransition>
                    <BudgetsView
                      budgets={budgets}
                      categories={categories}
                      transactions={transactions}
                      onCreateBudget={handleCreateBudget}
                      onUpdateBudget={handleUpdateBudget}
                      onDeleteBudget={handleDeleteBudget}
                      onCreateCategory={handleCreateCategory}
                      onUpdateCategory={handleUpdateCategory}
                      onDeleteCategory={handleDeleteCategory}
                    />
                  </PageTransition>
                } />

                <Route path="/accounts" element={
                  <PageTransition>
                    <AccountsView
                      accounts={accounts}
                      onAddAccount={handleAddAccount}
                    />
                  </PageTransition>
                } />

                <Route path="/ai-sandbox" element={
                  <PageTransition>
                    <AIEngineSandboxView
                      activeEngine={activeEngine}
                      onRunTestParse={handleSandboxTestParse}
                    />
                  </PageTransition>
                } />
              </Routes>
            </AnimatePresence>
          </main>

          {/* Modals */}
          {activeParseModal && (
            <AIParsingModal
              parseResult={activeParseModal}
              onClose={() => setActiveParseModal(null)}
              onConfirmAutoSave={(result) => {
                addTransactionFromParseResult(result);
                setActiveParseModal(null);
              }}
              onResolveCategory={(result, selectedCategory) => {
                addTransactionFromParseResult(result, selectedCategory);
                setActiveParseModal(null);
              }}
              onOpenManualForm={(result) => {
                setTransactionModalData({
                  type: result.type,
                  amount: result.amount,
                  currency: result.currency,
                  category: result.category,
                  description: result.description,
                  account: result.account,
                  payment_method: result.payment_method,
                  date: result.date,
                  confidence: result.confidence,
                  ai_parsed: true,
                });
                setActiveParseModal(null);
                setIsTransactionModalOpen(true);
              }}
            />
          )}

          {isTransactionModalOpen && (
            <TransactionFormModal
              initialData={transactionModalData}
              categories={categories}
              accounts={accounts}
              onClose={() => {
                setIsTransactionModalOpen(false);
                setTransactionModalData(null);
              }}
              onSave={handleSaveTransactionModal}
            />
          )}

          {/* Budget limit trigger toast */}
          {budgetAlert && (
            <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-pulse">
              <div
                className={`rounded-2xl border p-4 shadow-2xl flex items-start gap-3 ${
                  budgetAlert.type === 'exceeded'
                    ? 'bg-red-950 border-red-700 text-red-100'
                    : 'bg-amber-950/90 border-amber-600 text-amber-100'
                }`}
              >
                <span className="text-xl">{budgetAlert.type === 'exceeded' ? '🚨' : '⚠️'}</span>
                <div className="flex-1">
                  <p className="font-bold text-sm">
                    {budgetAlert.type === 'exceeded'
                      ? `You've exceeded your ${budgetAlert.category} budget`
                      : `You're reaching your ${budgetAlert.category} budget`}
                  </p>
                  <p className="text-xs mt-0.5 opacity-90">
                    ₹{budgetAlert.spent.toLocaleString()} spent of ₹{budgetAlert.monthlyLimit.toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setBudgetAlert(null)}
                  className="text-xs opacity-80 hover:opacity-100 font-semibold"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
  );
}
