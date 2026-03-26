import React from 'react';

export default function Ring({ value, max, color, label, unit = "g" }) {
  const pct = Math.min((value / max) * 100, 100);
  const r = 34, c = 2 * Math.PI * r, off = c - (pct / 100) * c;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-[68px] h-[68px]">
        <svg viewBox="0 0 76 76" className="w-full h-full -rotate-90">
          <circle cx="38" cy="38" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5"/>
          <circle cx="38" cy="38" r={r} fill="none" stroke={color} strokeWidth="5"
            strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
            style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1)" }}/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[15px] font-bold" style={{ color }}>{Math.round(value)}</span>
          <span className="text-[8px] uppercase tracking-wider opacity-30">{unit}</span>
        </div>
      </div>
      <span className="text-[9px] uppercase tracking-[0.15em] opacity-35">{label}</span>
    </div>
  );
}
