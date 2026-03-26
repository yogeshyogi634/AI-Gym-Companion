import React from 'react';
import I from './Icons';

export default function WCard({ ex, i, onToggle }) {
  return (
    <div onClick={onToggle}
      className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${
        ex.done ? "bg-emerald-500/10 border-emerald-500/30" : "bg-white/[0.03] border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05]"
      }`} style={{ animationDelay: `${i*60}ms` }}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
          ex.done ? "bg-emerald-500 border-emerald-500" : "border-white/20"}`}>
          {ex.done && <I.Check/>}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold text-sm ${ex.done ? "line-through opacity-50" : ""}`}>{ex.name}</h4>
          <p className="text-xs opacity-40 mt-0.5">{ex.detail}</p>
        </div>
        {ex.muscle && <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/[0.05] opacity-35 uppercase tracking-wider whitespace-nowrap">{ex.muscle}</span>}
      </div>
    </div>
  );
}
