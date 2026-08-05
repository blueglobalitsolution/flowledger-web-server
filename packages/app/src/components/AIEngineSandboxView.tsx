import React, { useState } from 'react';
import {
  BrainCircuit,
  Cpu,
  Zap,
  Code2,
  Gauge,
  Sparkles,
  Terminal,
  Activity,
  Play,
} from 'lucide-react';
import { AIEngineConfig, AIParseResult } from '@shared/types';

interface AIEngineSandboxViewProps {
  activeEngine: AIEngineConfig;
  onRunTestParse: (inputPrompt: string, engineId: string) => Promise<AIParseResult>;
}

export const AIEngineSandboxView: React.FC<AIEngineSandboxViewProps> = ({
  activeEngine,
  onRunTestParse,
}) => {
  const [testUtterance, setTestUtterance] = useState('Spent 450 on Uber to office using Credit Card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<AIParseResult | null>(null);

  const sampleUtterances = [
    'Tea ₹30 at Chai Corner via UPI',
    'Spent 450 on Uber to office using Credit Card',
    'Got paid $3500 monthly salary from Tech Corp into Main Bank',
    'Bought groceries $82.50 at Trader Joes using Debit Card',
    'Paid Airtel wifi broadband bill 2490 auto debit',
  ];

  const handleTest = async (prompt?: string) => {
    const textToRun = prompt || testUtterance;
    if (!textToRun.trim()) return;
    setIsProcessing(true);
    try {
      const res = await onRunTestParse(textToRun, activeEngine.id);
      setLastResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 text-white">
      {/* Header & Concept Explanation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <BrainCircuit className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold tracking-tight">
                FlowLedger AI Engine Interface & Testbench
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              Local-first AI Engine architecture. Today using <strong className="text-emerald-400 font-mono">Qwen 2.5 3B Instruct</strong> (qwen2.5:3b) in Ollama on <span className="font-mono">localhost:11434</span> for private edge transaction parsing.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs font-mono">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Active Model: <strong className="text-emerald-300">{activeEngine.name}</strong></span>
          </div>
        </div>
      </div>

      {/* Active Engine Card */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-300">Active Parsing Engine</span>
          </div>
          <div className="font-bold text-sm text-white">{activeEngine.name}</div>
          <div className="text-[11px] text-slate-400 font-mono">
            Model: <span className="text-emerald-300">{activeEngine.id}</span> • Provider: {activeEngine.provider} • {activeEngine.memoryFootprintMB}MB VRAM
          </div>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono text-slate-300">
          <div><span className="text-slate-500">Latency:</span> <span className="text-emerald-300">{activeEngine.latencyMs}ms</span></div>
          <div><span className="text-slate-500">Tokens/s:</span> <span className="text-emerald-300">{activeEngine.tokensPerSec}</span></div>
          <div><span className="text-slate-500">Accuracy:</span> <span className="text-emerald-300">{activeEngine.accuracyScore}%</span></div>
        </div>
      </div>

      {/* Main Interactive Test Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Natural Language Input & Prompt Inspector */}
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <span>Test Natural Language Parsing</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">JSON Mode</span>
            </div>

            {/* Quick Preset Buttons */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-slate-400 font-medium">Preset Utterances:</span>
              <div className="flex flex-wrap gap-1.5">
                {sampleUtterances.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setTestUtterance(sample);
                      handleTest(sample);
                    }}
                    className="text-[11px] bg-slate-950 hover:bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-800 cursor-pointer font-sans transition-all hover:text-white"
                  >
                    "{sample}"
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt Text Input */}
            <div className="space-y-2">
              <textarea
                rows={3}
                value={testUtterance}
                onChange={(e) => setTestUtterance(e.target.value)}
                placeholder="Type any financial string..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 font-mono"
              />

              <button
                onClick={() => handleTest()}
                disabled={isProcessing || !testUtterance.trim()}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl transition-all cursor-pointer text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Zap className="w-4 h-4 animate-spin" />
                    <span>Executing {activeEngine.name}...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Run AI Engine Extraction ({activeEngine.name})</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* System Prompt Inspector */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-400" />
                <span>AI Prompt Template & Schema</span>
              </h3>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded font-mono text-slate-400">System Instruction</span>
            </div>
            <pre className="bg-slate-950 p-4 rounded-xl text-[11px] font-mono text-emerald-300 border border-slate-800/80 overflow-x-auto whitespace-pre-wrap leading-relaxed">
{`System: You are a finance parser.
Extract transaction details. Always return valid JSON. Never explain. Never add markdown.

Return:
- type: 'income' | 'expense' | 'transfer'
- amount: number
- currency: string
- category: string
- description: string
- account: string
- payment_method: string
- date: YYYY-MM-DD
- confidence: 0-100 score`}
            </pre>
          </div>
        </div>

        {/* Right Column: Execution Output & JSON Inspector */}
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>AI JSON Response & Confidence Score</span>
              </h3>
              {lastResult && (
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {lastResult.processing_time_ms} ms
                </span>
              )}
            </div>

            {lastResult ? (
              <div className="space-y-4">
                {/* Confidence Meter */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Confidence Score</span>
                    <span className="font-mono text-emerald-400 font-bold">{lastResult.confidence}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full ${lastResult.confidence >= 95 ? 'bg-emerald-500' : 'bg-amber-400'}`}
                      style={{ width: `${lastResult.confidence}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono flex justify-between">
                    <span>Engine: {lastResult.engine_used}</span>
                    <span>
                      Decision:{' '}
                      <strong className="text-white">
                        {lastResult.confidence >= 95 ? 'Auto-Save' : lastResult.confidence >= 80 ? 'Ask User' : 'Manual Form'}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Pretty JSON View */}
                <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono text-indigo-300 border border-slate-800 overflow-x-auto">
                  {JSON.stringify(
                    {
                      type: lastResult.type,
                      amount: lastResult.amount,
                      currency: lastResult.currency,
                      category: lastResult.category,
                      description: lastResult.description,
                      account: lastResult.account,
                      payment_method: lastResult.payment_method,
                      date: lastResult.date,
                      confidence: lastResult.confidence,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            ) : (
              <div className="bg-slate-950/60 p-8 rounded-xl border border-slate-800 text-center text-slate-500 text-xs space-y-2">
                <BrainCircuit className="w-8 h-8 mx-auto text-slate-700" />
                <p>Run a test utterance above to inspect real-time JSON parsing output & confidence score.</p>
              </div>
            )}
          </div>

          {/* Engine Benchmark */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Gauge className="w-4 h-4 text-emerald-400" />
              <span>Qwen 2.5 3B Benchmark</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2">Metric</th>
                    <th className="py-2">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  <tr className="text-slate-300">
                    <td className="py-2.5">Latency</td>
                    <td className="py-2.5 text-emerald-400">{activeEngine.latencyMs}ms</td>
                  </tr>
                  <tr className="text-slate-300">
                    <td className="py-2.5">Tokens/sec</td>
                    <td className="py-2.5 text-emerald-400">{activeEngine.tokensPerSec}</td>
                  </tr>
                  <tr className="text-slate-300">
                    <td className="py-2.5">Accuracy</td>
                    <td className="py-2.5 text-emerald-400">{activeEngine.accuracyScore}%</td>
                  </tr>
                  <tr className="text-slate-300">
                    <td className="py-2.5">JSON Compliance</td>
                    <td className="py-2.5 text-indigo-400">{activeEngine.jsonCompliance}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
