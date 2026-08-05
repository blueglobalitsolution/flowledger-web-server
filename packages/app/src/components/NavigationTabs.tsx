import React from 'react';
import {
  LayoutDashboard,
  BrainCircuit,
  Smartphone,
  ReceiptText,
  PieChart,
  Network,
  Table,
  BarChart3,
  Landmark,
  MoreHorizontal,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'flutter-simulator'
  | 'transactions'
  | 'spreadsheet'
  | 'reports'
  | 'budgets'
  | 'accounts'
  | 'more'
  | 'ai-sandbox'
  | 'architecture';

interface NavigationTabsProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  pendingUnconfirmedCount?: number;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onTabChange,
  pendingUnconfirmedCount = 0,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'flutter-simulator', label: 'Mobile App (iOS/Android)', icon: Smartphone, highlight: true },
    { id: 'transactions', label: 'Transactions', icon: ReceiptText },
    { id: 'spreadsheet', label: 'Spreadsheet', icon: Table },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'budgets', label: 'Budgets', icon: PieChart },
    { id: 'accounts', label: 'Accounts', icon: Landmark },
    { id: 'more', label: 'More', icon: MoreHorizontal },
    { id: 'ai-sandbox', label: 'AI Engine', icon: BrainCircuit, badge: 'Qwen 2.5 3B' },
    { id: 'architecture', label: 'Architecture', icon: Network },
  ];

  return (
    <nav id="flowledger-tabs-nav" className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-sm overflow-x-auto">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 flex items-center space-x-1 py-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              id={`tab-btn-${t.id}`}
              onClick={() => onTabChange(t.id as ActiveTab)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer text-xs ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>{t.label}</span>
              {t.badge && (
                <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1 py-0.2 rounded font-mono border border-indigo-500/30">
                  {t.badge}
                </span>
              )}
              {t.id === 'ai-sandbox' && pendingUnconfirmedCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
