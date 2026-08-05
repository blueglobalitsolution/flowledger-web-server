import React, { useState } from 'react';
import {
  User,
  Building2,
  Tags,
  CreditCard,
  Repeat,
  Target,
  Settings as SettingsIcon,
  Database,
  HelpCircle,
  Info,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const MoreSettingsView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const menuItems = [
    { id: 'businesses', label: 'Businesses', badge: '2 Active', icon: Building2, color: 'text-indigo-400' },
    { id: 'categories', label: 'Categories', icon: Tags, color: 'text-emerald-400' },
    { id: 'payment_methods', label: 'Payment Methods', icon: CreditCard, color: 'text-blue-400' },
    { id: 'recurring', label: 'Recurring Transactions', icon: Repeat, color: 'text-purple-400' },
    { id: 'goals', label: 'Goals & Targets', icon: Target, color: 'text-amber-400' },
    { id: 'settings', label: 'Settings', icon: SettingsIcon, color: 'text-slate-400' },
    { id: 'backup', label: 'Data & Backup', icon: Database, color: 'text-teal-400' },
    { id: 'help', label: 'Help & Support', icon: HelpCircle, color: 'text-pink-400' },
    { id: 'about', label: 'About FlowLedger', badge: 'v1.0.0', icon: Info, color: 'text-sky-400' },
  ];

  return (
    <div className="space-y-6 pb-12 text-white">
      {/* Profile Header Card matching Screen 9 */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 p-0.5 shadow-lg">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-bold text-lg text-emerald-400">
              MS
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">Mehul Solanki</h2>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase">
                Pro Plan
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">mehul@flowledger.app</p>
          </div>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-400 font-mono bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Biometric & Encrypted</span>
        </span>
      </div>

      {/* Menu Options List matching Screen 9 */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl divide-y divide-slate-800/80 shadow-xl overflow-hidden">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              onClick={() => setActiveSection(activeSection === item.id ? null : item.id)}
              className="p-4 flex items-center justify-between hover:bg-slate-800/60 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3.5">
                <span className={`p-2 rounded-xl bg-slate-950 border border-slate-800 ${item.color}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <span className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
                  {item.label}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {item.badge && (
                  <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                    {item.badge}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
              </div>
            </div>
          );
        })}
      </div>

      {/* System Status Details */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 text-xs text-slate-400 space-y-2 font-mono">
        <div className="text-slate-200 font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>FlowLedger Local Engine Active</span>
        </div>
        <p>
          Version 1.0.0 • SQLite & Hive Offline Storage Synced • FastAPI Microservice Edge Router Connected
        </p>
      </div>
    </div>
  );
};
