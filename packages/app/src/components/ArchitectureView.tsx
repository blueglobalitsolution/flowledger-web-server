import React, { useState } from 'react';
import { Network, Database, Server, Cpu, ShieldCheck, Terminal, Layers, ArrowRight, Play, CheckCircle2 } from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  const [activeApiRoute, setActiveApiRoute] = useState('/ai/parse');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [isLoadingApi, setIsLoadingApi] = useState(false);

  const databaseTables = [
    { name: 'users', rows: '1,420', cols: ['id', 'email', 'password_hash', 'pin_code', 'currency', 'created_at'] },
    { name: 'businesses', rows: '180', cols: ['id', 'name', 'tax_id', 'plan_tier', 'created_at'] },
    { name: 'user_business_map', rows: '1,600', cols: ['user_id', 'business_id', 'role'] },
    { name: 'accounts', rows: '4,850', cols: ['id', 'user_id', 'name', 'type', 'balance', 'currency'] },
    { name: 'categories', rows: '12,400', cols: ['id', 'user_id', 'name', 'type', 'color', 'icon'] },
    { name: 'transactions', rows: '1,48,200', cols: ['id', 'user_id', 'account_id', 'category_id', 'amount', 'confidence', 'ai_parsed'] },
    { name: 'budgets', rows: '3,200', cols: ['id', 'user_id', 'category_id', 'monthly_limit', 'alert_threshold'] },
    { name: 'audit_logs', rows: '3,40,000', cols: ['id', 'user_id', 'action', 'ip_address', 'timestamp'] },
    { name: 'refresh_tokens', rows: '2,900', cols: ['id', 'user_id', 'token_hash', 'expires_at'] },
  ];

  const handleTestApi = async (route: string) => {
    setActiveApiRoute(route);
    setIsLoadingApi(true);
    try {
      if (route === '/ai/parse') {
        const res = await fetch('/api/ai/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: 'Tea ₹30 at Chai Stall via UPI', engine: 'qwen2.5:3b' }),
        });
        const data = await res.json();
        setApiResponse(data);
      } else if (route === '/health') {
        const res = await fetch('/api/health');
        const data = await res.json();
        setApiResponse(data);
      } else if (route === '/benchmark') {
        const res = await fetch('/api/ai/benchmark');
        const data = await res.json();
        setApiResponse(data);
      } else {
        const res = await fetch('/api/openapi.json');
        const data = await res.json();
        setApiResponse(data);
      }
    } catch (err: any) {
      setApiResponse({ error: err.message });
    } finally {
      setIsLoadingApi(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 text-white">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-2">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Network className="w-5 h-5" />
          </span>
          <h2 className="text-xl font-bold tracking-tight">
            FlowLedger Architecture v1.0 Blueprint & API Gateway
          </h2>
        </div>
        <p className="text-xs text-slate-400 max-w-3xl">
          Microservice architecture separating core FastAPI Gateway business services from the dedicated AI Parsing Service.
        </p>
      </div>

      {/* Visual System Topology Diagram */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6">
        <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>System Topology & Microservices Flow</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center text-xs">
          {/* Node 1: Mobile Client */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto border border-purple-500/30 font-bold">
              FL
            </div>
            <div className="font-bold text-white">Flutter Mobile</div>
            <div className="text-[10px] text-slate-400 font-mono">Android & iOS</div>
            <div className="text-[9px] bg-slate-900 px-2 py-1 rounded text-slate-300 border border-slate-800 font-mono">
              Riverpod + SQLite + Hive
            </div>
          </div>

          {/* Node 2: FastAPI Gateway */}
          <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/30 space-y-2 shadow-lg shadow-emerald-500/5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30 font-bold">
              <Server className="w-4 h-4" />
            </div>
            <div className="font-bold text-emerald-400">FastAPI API Gateway</div>
            <div className="text-[10px] text-slate-400 font-mono">Auth, Users, Transactions</div>
            <div className="text-[9px] bg-slate-900 px-2 py-1 rounded text-emerald-300 border border-emerald-800 font-mono">
              JWT + REST + WebSockets
            </div>
          </div>

          {/* Node 3: AI Engine Microservice */}
          <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/30 space-y-2 shadow-lg shadow-indigo-500/5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/30 font-bold">
              <Cpu className="w-4 h-4" />
            </div>
            <div className="font-bold text-indigo-300">Dedicated AI Service</div>
            <div className="text-[10px] text-slate-400 font-mono">Qwen 2.5 3B / Ollama</div>
            <div className="text-[9px] bg-slate-900 px-2 py-1 rounded text-indigo-300 border border-indigo-800 font-mono">
              JSON Output + Confidence
            </div>
          </div>

          {/* Node 4: Persistence Databases */}
          <div className="bg-slate-950 p-4 rounded-xl border border-blue-500/30 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/30 font-bold">
              <Database className="w-4 h-4" />
            </div>
            <div className="font-bold text-blue-300">Cloud Persistence</div>
            <div className="text-[10px] text-slate-400 font-mono">PostgreSQL + Redis + MinIO</div>
            <div className="text-[9px] bg-slate-900 px-2 py-1 rounded text-blue-300 border border-blue-800 font-mono">
              Docker + Proxmox
            </div>
          </div>
        </div>
      </div>

      {/* OpenAPI Swagger Interactive Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>FastAPI OpenAPI Endpoint Explorer</span>
          </h3>

          <div className="space-y-2">
            <button
              onClick={() => handleTestApi('/ai/parse')}
              className={`w-full p-3 rounded-xl border text-left flex items-center justify-between text-xs cursor-pointer font-mono ${
                activeApiRoute === '/ai/parse' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded font-bold text-[10px]">POST</span>
                <span>/api/ai/parse</span>
              </div>
              <span>Run Request</span>
            </button>

            <button
              onClick={() => handleTestApi('/health')}
              className={`w-full p-3 rounded-xl border text-left flex items-center justify-between text-xs cursor-pointer font-mono ${
                activeApiRoute === '/health' ? 'bg-indigo-500/10 border-indigo-500 text-indigo-300' : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="bg-blue-500 text-slate-950 px-1.5 py-0.5 rounded font-bold text-[10px]">GET</span>
                <span>/api/health</span>
              </div>
              <span>Run Request</span>
            </button>

            <button
              onClick={() => handleTestApi('/benchmark')}
              className={`w-full p-3 rounded-xl border text-left flex items-center justify-between text-xs cursor-pointer font-mono ${
                activeApiRoute === '/benchmark' ? 'bg-indigo-500/10 border-indigo-500 text-indigo-300' : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="bg-blue-500 text-slate-950 px-1.5 py-0.5 rounded font-bold text-[10px]">GET</span>
                <span>/api/ai/benchmark</span>
              </div>
              <span>Run Request</span>
            </button>

            <button
              onClick={() => handleTestApi('/openapi.json')}
              className={`w-full p-3 rounded-xl border text-left flex items-center justify-between text-xs cursor-pointer font-mono ${
                activeApiRoute === '/openapi.json' ? 'bg-indigo-500/10 border-indigo-500 text-indigo-300' : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="bg-blue-500 text-slate-950 px-1.5 py-0.5 rounded font-bold text-[10px]">GET</span>
                <span>/api/openapi.json</span>
              </div>
              <span>Run Request</span>
            </button>
          </div>
        </div>

        {/* Response Inspector */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Gateway JSON Response</h3>
            <span className="text-[10px] text-emerald-400 font-mono">HTTP 200 OK</span>
          </div>

          <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono text-emerald-300 border border-slate-800 h-64 overflow-y-auto">
            {isLoadingApi ? 'Querying FastAPI Gateway...' : JSON.stringify(apiResponse || { status: 'click an endpoint on the left to test' }, null, 2)}
          </pre>
        </div>
      </div>

      {/* PostgreSQL Database ERD Schema Viewer */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-400" />
          <span>PostgreSQL Relational Database Schema ERD</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {databaseTables.map((tbl) => (
            <div key={tbl.name} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-emerald-400 font-mono">{tbl.name}</span>
                <span className="text-[10px] text-slate-500 font-mono">{tbl.rows} rows</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {tbl.cols.map((col) => (
                  <span key={col} className="text-[10px] bg-slate-900 text-slate-300 px-1.5 py-0.5 rounded font-mono border border-slate-800">
                    {col}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
