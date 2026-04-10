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
    <div className="rounded-2xl p-4 mb-5 animate-slideDown" style={{background:"var(--card)", border:"1px solid var(--border)"}}>
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setVd(new Date(vd.getFullYear(), vd.getMonth()-1, 1))} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{background:"var(--subtle)"}}><I.Left/></button>
        <span className="text-sm font-semibold">{fmtMonth(vd)}</span>
        <button onClick={() => setVd(new Date(vd.getFullYear(), vd.getMonth()+1, 1))} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{background:"var(--subtle)"}}><I.Right/></button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1.5">
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(x=>(
          <div key={x} className="text-center text-[9px] uppercase tracking-wider py-1" style={{opacity:"var(--faint)"}}>{x}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map(({d,out},i) => {
          const s = same(d, sel), t = same(d, new Date()), mc = mealCount(d);
          return (
            <button key={i} onClick={() => { onPick(new Date(d)); onClose(); }}
              className={`relative w-full aspect-square rounded-xl text-xs font-medium flex flex-col items-center justify-center transition-all ${
                s ? "bg-gradient-to-b from-amber-400 to-orange-500 text-black shadow-lg" : ""}`}
              style={
                out ? {opacity:0.15} :
                s ? {boxShadow:"0 8px 24px var(--shadow-glow)"} :
                t ? {background:"var(--cal-day-today-bg)", color:"#f59e0b", boxShadow:`inset 0 0 0 1px var(--cal-day-today-ring)`} :
                {color:"var(--cal-day-text)"}
              }>
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
          className="text-[10px] px-3 py-1.5 rounded-lg text-amber-400 transition-colors" style={{background:"var(--subtle)"}}>
          Jump to Today
        </button>
      </div>
    </div>
  );
}
