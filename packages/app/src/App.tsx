import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { NavigationTabs } from './components/NavigationTabs';
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
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

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

export default function App() {
  const [activeEngine, setActiveEngine] = useState<AIEngineConfig>(AVAILABLE_AI_ENGINES[0]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleBulkInsert = async () => {
    const bulkMock: Omit<Transaction, 'id'>[] = [
      {
        type: 'expense',
        amount: 350,
        currency: '₹',
        category: 'Food & Dining',
        description: 'Starbucks Coffee & Muffin',
        account: 'ICICI Sapphire',
        payment_method: 'Credit Card',
        date: '2026-08-02',
        confidence: 96,
        ai_parsed: true,
        engine_used: activeEngine.name,
        status: 'completed',
      },
      {
        type: 'expense',
        amount: 1200,
        currency: '₹',
        category: 'Shopping & Apparel',
        description: 'Bookstore Fiction & Tech Magazines',
        account: 'Physical Wallet',
        payment_method: 'Cash',
        date: '2026-08-02',
        confidence: 95,
        ai_parsed: true,
        engine_used: activeEngine.name,
        status: 'completed',
      },
    ];
    for (const tx of bulkMock) {
      const { alert } = await createTransaction(tx);
      showBudgetAlert(alert);
    }
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

  return (
    <BrowserRouter>
      <div id="flowledger-root" className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 flex flex-col">
        {currentUser && (
          <Navbar
            activeEngine={activeEngine}
            quickParseCount={transactions.filter((t) => t.ai_parsed).length}
            currentUser={currentUser}
            lastSyncedAt={lastSyncedAt}
            onLogout={handleLogout}
          />
        )}

        {/* Navigation Tabs */}
        {currentUser && <NavigationTabs />}

        {/* Main View Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 pt-6">
          {isLoading && (
            <div className="flex items-center justify-center py-24 text-slate-400 text-sm animate-pulse">
              Loading from database...
            </div>
          )}
          
          <Routes>
            {!currentUser ? (
              <>
                <Route path="/login" element={
                  <LoginView onLogin={(user) => {
                    setCurrentUser(user);
                    window.location.href = '/dashboard';
                  }} />
                } />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </>
            ) : (
              <>
                <Route path="/login" element={<Navigate to="/dashboard" replace />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                
                <Route path="/dashboard" element={
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
                } />

                <Route path="/transactions" element={
                  <TransactionsView
                    transactions={transactions}
                    onDeleteTransaction={handleDeleteTransaction}
                    onOpenNewTransactionModal={() => {
                      setTransactionModalData(null);
                      setIsTransactionModalOpen(true);
                    }}
                    onBulkInsert={handleBulkInsert}
                  />
                } />

                <Route path="/spreadsheet" element={
                  <SpreadsheetView
                    transactions={transactions}
                    onOpenNewTransactionModal={() => {
                      setTransactionModalData(null);
                      setIsTransactionModalOpen(true);
                    }}
                  />
                } />

                <Route path="/reports" element={<ReportsView transactions={transactions} accounts={accounts} />} />

                <Route path="/budgets" element={
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
                } />

                <Route path="/accounts" element={
                  <AccountsView
                    accounts={accounts}
                    onAddAccount={handleAddAccount}
                  />
                } />

                <Route path="/ai-sandbox" element={
                  <AIEngineSandboxView
                    activeEngine={activeEngine}
                    onRunTestParse={handleSandboxTestParse}
                  />
                } />
              </>
            )}
          </Routes>
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
    </BrowserRouter>
  );
}
