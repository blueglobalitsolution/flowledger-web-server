import { Account, AIEngineConfig, Budget, Category, NotificationItem, Transaction } from './types';

export const INITIAL_ACCOUNTS: Account[] = [
  { id: 'acc-1', name: 'Main Checking', type: 'Bank', balance: 14250.80, currency: '₹', accountNumber: '•••4892', color: '#3B82F6', icon: 'Landmark' },
  { id: 'acc-2', name: 'HDFC Savings', type: 'Bank', balance: 48900.00, currency: '₹', accountNumber: '•••1024', color: '#10B981', icon: 'Building2' },
  { id: 'acc-3', name: 'Physical Wallet', type: 'Cash', balance: 3450.00, currency: '₹', color: '#F59E0B', icon: 'Wallet' },
  { id: 'acc-4', name: 'ICICI Sapphire', type: 'Credit Card', balance: -12800.00, currency: '₹', accountNumber: '•••9912', color: '#EF4444', icon: 'CreditCard' },
  { id: 'acc-5', name: 'Paytm / PhonePe', type: 'Wallet', balance: 1850.50, currency: '₹', color: '#8B5CF6', icon: 'Smartphone' },
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Food & Dining', type: 'expense', icon: 'Utensils', color: '#EF4444', budgetLimit: 15000 },
  { id: 'cat-2', name: 'Transport & Fuel', type: 'expense', icon: 'Car', color: '#F59E0B', budgetLimit: 8000 },
  { id: 'cat-3', name: 'Shopping & Apparel', type: 'expense', icon: 'ShoppingBag', color: '#EC4899', budgetLimit: 12000 },
  { id: 'cat-4', name: 'Bills & Utilities', type: 'expense', icon: 'Zap', color: '#3B82F6', budgetLimit: 10000 },
  { id: 'cat-5', name: 'Salary & Income', type: 'income', icon: 'TrendingUp', color: '#10B981' },
  { id: 'cat-6', name: 'Freelance & SaaS', type: 'income', icon: 'Laptop', color: '#6366F1' },
  { id: 'cat-7', name: 'Entertainment', type: 'expense', icon: 'Film', color: '#8B5CF6', budgetLimit: 5000 },
  { id: 'cat-8', name: 'Health & Medical', type: 'expense', icon: 'HeartPulse', color: '#14B8A6', budgetLimit: 6000 },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-101',
    type: 'expense',
    amount: 30,
    currency: '₹',
    category: 'Food & Dining',
    description: 'Tea at Chai Corner',
    account: 'Physical Wallet',
    payment_method: 'UPI',
    date: '2026-08-02',
    confidence: 98,
    ai_parsed: true,
    engine_used: 'Qwen 2.5 3B Instruct',
    status: 'completed'
  },
  {
    id: 'tx-102',
    type: 'expense',
    amount: 450,
    currency: '₹',
    category: 'Transport & Fuel',
    description: 'Uber Ride to Office',
    account: 'ICICI Sapphire',
    payment_method: 'Credit Card',
    date: '2026-08-01',
    confidence: 96,
    ai_parsed: true,
    engine_used: 'Qwen 2.5 3B Instruct',
    status: 'completed'
  },
  {
    id: 'tx-103',
    type: 'income',
    amount: 85000,
    currency: '₹',
    category: 'Salary & Income',
    description: 'Monthly Salary Credit - Tech Corp',
    account: 'Main Checking',
    payment_method: 'Bank Transfer',
    date: '2026-08-01',
    confidence: 99,
    ai_parsed: true,
    engine_used: 'Qwen 2.5 3B Instruct',
    status: 'completed'
  },
  {
    id: 'tx-104',
    type: 'expense',
    amount: 2490,
    currency: '₹',
    category: 'Bills & Utilities',
    description: 'Airtel Broadband Bill',
    account: 'Main Checking',
    payment_method: 'Auto Debit',
    date: '2026-07-30',
    confidence: 94,
    ai_parsed: true,
    engine_used: 'Qwen 2.5 3B Instruct',
    status: 'completed'
  },
  {
    id: 'tx-105',
    type: 'expense',
    amount: 1850,
    currency: '₹',
    category: 'Food & Dining',
    description: 'Dinner at Italian Bistro',
    account: 'ICICI Sapphire',
    payment_method: 'Credit Card',
    date: '2026-07-29',
    confidence: 89,
    ai_parsed: true,
    engine_used: 'Qwen 2.5 3B Instruct',
    status: 'completed'
  },
  {
    id: 'tx-106',
    type: 'income',
    amount: 14500,
    currency: '₹',
    category: 'Freelance & SaaS',
    description: 'FlowLedger SaaS Subscription Payout',
    account: 'HDFC Savings',
    payment_method: 'Stripe Direct',
    date: '2026-07-28',
    confidence: 97,
    ai_parsed: true,
    engine_used: 'Qwen 2.5 3B Instruct',
    status: 'completed'
  },
  {
    id: 'tx-107',
    type: 'expense',
    amount: 3200,
    currency: '₹',
    category: 'Shopping & Apparel',
    description: 'Amazon Electronics & Accessories',
    account: 'ICICI Sapphire',
    payment_method: 'Credit Card',
    date: '2026-07-27',
    confidence: 92,
    ai_parsed: true,
    engine_used: 'Qwen 2.5 3B Instruct',
    status: 'completed'
  }
];

export const INITIAL_BUDGETS: Budget[] = [
  { id: 'b-1', category: 'Food & Dining', monthlyLimit: 15000, spent: 8920, period: 'August 2026', alertThreshold: 80 },
  { id: 'b-2', category: 'Transport & Fuel', monthlyLimit: 8000, spent: 4850, period: 'August 2026', alertThreshold: 80 },
  { id: 'b-3', category: 'Shopping & Apparel', monthlyLimit: 12000, spent: 9600, period: 'August 2026', alertThreshold: 75 },
  { id: 'b-4', category: 'Bills & Utilities', monthlyLimit: 10000, spent: 2490, period: 'August 2026', alertThreshold: 85 },
  { id: 'b-5', category: 'Entertainment', monthlyLimit: 5000, spent: 4100, period: 'August 2026', alertThreshold: 80 },
];

export const AVAILABLE_AI_ENGINES: AIEngineConfig[] = [
  {
    id: 'qwen2.5:3b',
    name: 'Qwen 2.5 3B Instruct',
    version: '2.5-3B-Q4_K_M',
    provider: 'Ollama (Local GPU)',
    latencyMs: 145,
    tokensPerSec: 118,
    accuracyScore: 96.4,
    jsonCompliance: 99.2,
    memoryFootprintMB: 1929,
    isDefault: true,
    description: 'Local Qwen 2.5 3B model running in Ollama on http://localhost:11434 for private edge transaction parsing.'
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'High Confidence Auto-Save',
    message: 'Parsed "Tea ₹30 at Chai Corner" with 98% confidence. Saved automatically to Physical Wallet.',
    type: 'success',
    timestamp: '10 minutes ago',
    read: false
  },
  {
    id: 'notif-2',
    title: 'Budget Threshold Warning',
    message: 'Shopping & Apparel has reached 80% of monthly limit (₹9,600 / ₹12,000).',
    type: 'warning',
    timestamp: '2 hours ago',
    read: false
  },
  {
    id: 'notif-3',
    title: 'AI Microservice Health',
    message: 'Qwen 2.5 3B Instruct running in Ollama at optimal ~145ms latency. 0 failed JSON outputs today.',
    type: 'info',
    timestamp: '1 day ago',
    read: true
  }
];
