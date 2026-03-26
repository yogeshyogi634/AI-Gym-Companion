import React, { useState } from 'react';
import I from './Icons';
import { fmtKey, fmtMonth, same, calDays } from '../utils/dateUtils';

export default function Calendar({ sel, onPick, data, onClose }) {
  const [vd, setVd] = useState(new Date(sel));
  const days = calDays(vd.getFullYear(), vd.getMonth());
  const mealCount = d => {
    const m = data[fmtKey(d)];
    return m ? Object.keys(m).length : 0;
  };
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 mb-5 animate-slideDown">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setVd(new Date(vd.getFullYear(), vd.getMonth()-1, 1))} className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center hover:bg-white/[0.08] transition-colors"><I.Left/></button>
        <span className="text-sm font-semibold">{fmtMonth(vd)}</span>
        <button onClick={() => setVd(new Date(vd.getFullYear(), vd.getMonth()+1, 1))} className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center hover:bg-white/[0.08] transition-colors"><I.Right/></button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1.5">
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(x=>(
          <div key={x} className="text-center text-[9px] uppercase tracking-wider opacity-20 py-1">{x}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map(({d,out},i) => {
          const s = same(d, sel), t = same(d, new Date()), mc = mealCount(d);
          return (
            <button key={i} onClick={() => { onPick(new Date(d)); onClose(); }}
              className={`relative w-full aspect-square rounded-xl text-xs font-medium flex flex-col items-center justify-center transition-all ${
                out ? "opacity-15" : s ? "bg-gradient-to-b from-amber-400 to-orange-500 text-black shadow-lg shadow-orange-500/20"
                : t ? "bg-white/[0.07] text-amber-400 ring-1 ring-amber-500/25" : "hover:bg-white/[0.05] text-white/55"}`}>
              {d.getDate()}
              {mc > 0 && (
                <div className="flex gap-[3px] mt-0.5">
                  {Array.from({length: Math.min(mc,4)}).map((_,j)=>(
                    <div key={j} className={`w-[3px] h-[3px] rounded-full ${s ? "bg-black/40" : "bg-emerald-400"}`}/>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
      <div className="flex justify-center mt-3">
        <button onClick={() => { onPick(new Date()); onClose(); }}
          className="text-[10px] px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-amber-400 transition-colors">
          Jump to Today
        </button>
      </div>
    </div>
  );
}
