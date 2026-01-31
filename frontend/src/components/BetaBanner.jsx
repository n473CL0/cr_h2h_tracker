import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

const BetaBanner = ({ onOpenFeedback }) => {
  return (
    <div className="w-full bg-indigo-500/10 border-b border-indigo-500/20 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-3 text-sm">
        <span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-[0_0_10px_rgba(99,102,241,0.5)]">
          Beta
        </span>
        <span className="text-indigo-200">
          This is a public beta.
        </span>
        <button 
          onClick={onOpenFeedback} 
          className="group flex items-center gap-1 font-medium text-white hover:text-indigo-300 transition-colors"
        >
          Submit feedback here
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default BetaBanner;