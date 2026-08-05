import React from 'react';
import { Sparkles, CheckCircle2, HelpCircle, FileText, AlertCircle, ArrowRight, Zap } from 'lucide-react';
import { AIParseResult } from '@shared/types';

interface AIParsingModalProps {
  parseResult: AIParseResult | null;
  onClose: () => void;
  onConfirmAutoSave: (result: AIParseResult) => void;
  onResolveCategory: (result: AIParseResult, selectedCategory: string) => void;
  onOpenManualForm: (result: AIParseResult) => void;
}

export const AIParsingModal: React.FC<AIParsingModalProps> = ({
  parseResult,
  onClose,
  onConfirmAutoSave,
  onResolveCategory,
  onOpenManualForm,
}) => {
  if (!parseResult) return null;

  const { confidence, amount, currency, category, description, account, payment_method, type, engine_used, processing_time_ms } = parseResult;

  // Determine Confidence Tier
  const isHighConfidence = confidence >= 95;
  const isMediumConfidence = confidence >= 80 && confidence < 95;
  const isLowConfidence = confidence < 80;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 text-white relative overflow-hidden">
        {/* Glow Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isHighConfidence ? 'bg-emerald-500/20 text-emerald-400' : isMediumConfidence ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'}`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">AI Confidence Engine</h3>
              <p className="text-xs text-slate-400 font-mono">
                Engine: {engine_used} ({processing_time_ms}ms)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm font-semibold cursor-pointer">
            ✕
          </button>
        </div>

        {/* Confidence Gauge */}
        <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-300">Confidence Score</span>
            <span className={`font-mono text-sm font-bold ${isHighConfidence ? 'text-emerald-400' : isMediumConfidence ? 'text-amber-400' : 'text-rose-400'}`}>
              {confidence}% Confidence
            </span>
          </div>
          <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800 flex">
            <div
              className={`h-full transition-all ${isHighConfidence ? 'bg-emerald-500' : isMediumConfidence ? 'bg-amber-400' : 'bg-rose-500'}`}
              style={{ width: `${confidence}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>&lt;80%: Manual Form</span>
            <span>80-95%: User Check</span>
            <span>&gt;95%: Auto Save</span>
          </div>
        </div>

        {/* Parsed Output Details */}
        <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800 space-y-3">
          <div className="text-xs font-bold text-slate-400 tracking-wider uppercase">Extracted Transaction JSON</div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Type & Amount</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {type.toUpperCase()} {currency}{amount}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Category</span>
              <span className="font-semibold text-slate-200">{category}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Account / Payment</span>
              <span className="font-medium text-slate-300">{account} ({payment_method})</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Description</span>
              <span className="font-medium text-slate-300 truncate block">{description}</span>
            </div>
          </div>
        </div>

        {/* Action Decision Logic per Confidence Tier */}
        {isHighConfidence && (
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Confidence &gt; 95% — High Certainty Auto-Save</span>
            </div>
            <p className="text-xs text-slate-300">
              FlowLedger business rules automatically save high confidence transactions directly into PostgreSQL & Hive local cache.
            </p>
            <button
              onClick={() => onConfirmAutoSave(parseResult)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl transition-all cursor-pointer text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <span>Confirm & Save to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {isMediumConfidence && (
          <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>Confidence 80–95% — Ask User Clarification</span>
            </div>
            <p className="text-xs text-slate-300">
              The AI parsed this expense, but wants to confirm the category:
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => onResolveCategory(parseResult, 'Food & Dining')}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-2 rounded-lg border border-slate-700 text-xs cursor-pointer"
              >
                Food & Dining
              </button>
              <button
                onClick={() => onResolveCategory(parseResult, 'Snacks & Beverages')}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-2 rounded-lg border border-slate-700 text-xs cursor-pointer"
              >
                Snacks & Beverages
              </button>
              <button
                onClick={() => onResolveCategory(parseResult, category)}
                className="flex-1 bg-amber-500 text-slate-950 font-bold py-2 rounded-lg text-xs cursor-pointer"
              >
                Accept ({category})
              </button>
            </div>
          </div>
        )}

        {isLowConfidence && (
          <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-rose-300 text-xs font-semibold">
              <FileText className="w-4 h-4 text-rose-400" />
              <span>Confidence &lt; 80% — Open Manual Entry Form</span>
            </div>
            <p className="text-xs text-slate-300">
              Ambiguous transaction string. FlowLedger pre-fills available extracted fields and opens the standard entry form for user editing.
            </p>
            <button
              onClick={() => onOpenManualForm(parseResult)}
              className="w-full bg-rose-500 hover:bg-rose-400 text-white font-bold py-2.5 rounded-xl transition-all cursor-pointer text-xs flex items-center justify-center gap-2"
            >
              <span>Open Pre-filled Entry Form</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
