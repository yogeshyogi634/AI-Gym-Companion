import React from 'react';
import I from './Icons';

export default function WCard({ ex, i, onToggle }) {
  return (
    <div onClick={onToggle}
      className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 ${
        ex.done ? "bg-emerald-500/10 border border-emerald-500/30" : ""
      }`}
      style={ex.done ? {} : {background:"var(--card-alt)", border:"1px solid var(--border)"}}
      >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
          ex.done ? "bg-emerald-500 border-emerald-500" : ""}`}
          style={ex.done ? {} : {borderColor:"var(--done-check-border)"}}>
          {ex.done && <I.Check/>}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold text-sm ${ex.done ? "line-through" : ""}`} style={ex.done ? {opacity:0.5} : {}}>{ex.name}</h4>
          <p className="text-xs mt-0.5" style={{opacity:"var(--dim)"}}>{ex.detail}</p>
        </div>
        {ex.muscle && <span className="text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap" style={{background:"var(--subtle)", opacity:"var(--dim)"}}>{ex.muscle}</span>}
      </div>
    </div>
  );
}
