import React, { useState, useEffect } from "react";
import I from "./components/Icons";
import Ring from "./components/Ring";
import Calendar from "./components/Calendar";
import WCard from "./components/WCard";
import { fmtKey, fmtNice, same } from "./utils/dateUtils";
import { askGemini } from "./api";

import "./index.css";

export default function App() {
  const [sel, setSel] = useState(new Date());
  const [all, setAll] = useState({});
  const [inputs, setInputs] = useState({ morning:"", afternoon:"", night:"", postworkout:"" });
  const [macros, setMacros] = useState({ calories:0, protein:0, carbs:0, fat:0, fiber:0 });
  const [workout, setWorkout] = useState([]);
  const [loadSlot, setLoadSlot] = useState(null);
  const [loadW, setLoadW] = useState(false);
  const [tab, setTab] = useState("meals");
  const [wDone, setWDone] = useState(false);
  const [showCal, setShowCal] = useState(false);

  const dk = fmtKey(sel);
  const dd = all[dk] || {};

  const slots = [
    { key:"morning", label:"Breakfast", icon:<I.Sun/>, grad:"from-amber-500/15 to-transparent", ph:"e.g. 3 eggs, 2 toast, banana, black coffee..." },
    { key:"afternoon", label:"Lunch", icon:<I.Cloud/>, grad:"from-sky-500/15 to-transparent", ph:"e.g. chicken breast 200g, rice 1 cup, dal, salad..." },
    { key:"night", label:"Dinner", icon:<I.Moon/>, grad:"from-indigo-500/15 to-transparent", ph:"e.g. paneer tikka 150g, 2 roti, raita, veggies..." },
    { key:"postworkout", label:"Post-Workout", icon:<I.Zap/>, grad:"from-emerald-500/15 to-transparent", ph:"e.g. whey protein, banana, peanut butter toast..." },
  ];

  const goals = { calories:2500, protein:150, carbs:300, fat:80, fiber:35 };

  useEffect(() => {
    const d = all[dk] || {};
    const t = { calories:0, protein:0, carbs:0, fat:0, fiber:0 };
    Object.values(d).forEach(m => {
      if(m?.macros) { t.calories+=m.macros.calories||0; t.protein+=m.macros.protein||0; t.carbs+=m.macros.carbs||0; t.fat+=m.macros.fat||0; t.fiber+=m.macros.fiber||0; }
    });
    setMacros(t);
  }, [dk, all]);

  async function calc(slot) {
    const food = inputs[slot];
    if(!food.trim()) return;
    setLoadSlot(slot);
    const sys = `You are a nutrition calculator. Given food items, estimate macros. Respond ONLY with a JSON object: {"calories":500,"protein":30,"carbs":60,"fat":15,"fiber":5,"items":[{"name":"chicken breast","qty":"200g","cal":330,"protein":62,"carbs":0,"fat":7}]}. Be accurate with Indian and international foods. No markdown, just pure JSON.`;
    const r = await askGemini(`Calculate detailed macros for this meal: ${food}`, sys);
    setLoadSlot(null);
    if(r) {
      try {
        let clean = r.trim();
        const first = clean.indexOf('{');
        const last = clean.lastIndexOf('}');
        if (first !== -1 && last !== -1) {
          clean = clean.substring(first, last + 1);
        }
        const p = JSON.parse(clean);
        setAll(prev => ({ ...prev, [dk]: { ...(prev[dk]||{}), [slot]: { text:food, macros:p, items:p.items||[] } } }));
        setInputs(prev => ({ ...prev, [slot]:"" }));
      } catch(e) { 
        console.error("Failed parsing:", e, "\nRaw Response:", r);
        alert("Failed to parse the response! Check the console. Raw output was: " + r.slice(0, 100) + "...");
      }
    }
  }

  function removeMeal(slot) {
    setAll(prev => {
      const u = { ...prev }; if(u[dk]) { const d={...u[dk]}; delete d[slot]; u[dk]=d; } return u;
    });
  }

  async function genW() {
    setLoadW(true);
    const dn = sel.toLocaleDateString("en-US",{weekday:"long"});
    const sys = `You are a gym workout planner. Respond ONLY with a JSON array: [{"name":"Bench Press","detail":"4 sets × 10 reps · 90s rest","muscle":"Chest"}]. Include 6-8 exercises with warmup and cooldown. No markdown, just JSON array.`;
    const mc = macros.calories > 0 ? `Today's intake: ${Math.round(macros.calories)} cal, ${Math.round(macros.protein)}g protein.` : "";
    const r = await askGemini(`Create a gym workout for ${dn}. ${mc} Use push/pull/legs or upper/lower split. Include sets, reps, rest.`, sys);
    setLoadW(false);
    if(r) {
      try {
        const p = JSON.parse(r.replace(/```json|```/g,"").trim());
        setWorkout(p.map(e=>({...e,done:false}))); setWDone(true);
      } catch(e) { console.error("Failed to parse workout response:", e); }
    }
  }

  const cc = workout.filter(e=>e.done).length;
  const ml = Object.keys(dd).length;
  const isT = same(sel, new Date());

  return (
    <div className="min-h-screen text-white" style={{ background:"linear-gradient(160deg,#06060a 0%,#0b0e14 40%,#0f1219 100%)", fontFamily:"'DM Sans',sans-serif" }}>
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-48 -right-48 w-[500px] h-[500px] rounded-full opacity-[0.02]" style={{background:"radial-gradient(circle,#f59e0b,transparent 70%)"}}/>
        <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] rounded-full opacity-[0.015]" style={{background:"radial-gradient(circle,#22c55e,transparent 70%)"}}/>
      </div>

      <div className="relative max-w-lg mx-auto px-4 py-5 pb-24">
        {/* Header */}
        <header className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20"><I.Fire/></div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight leading-none" style={{fontFamily:"'Outfit',sans-serif"}}>FORGE</h1>
              <p className="text-[9px] tracking-[0.25em] uppercase opacity-20 mt-0.5">AI Gym Companion</p>
            </div>
          </div>
          <button onClick={()=>setShowCal(!showCal)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${showCal?"bg-amber-500 text-black shadow-lg shadow-amber-500/20":"bg-white/[0.05] text-white/35 hover:bg-white/[0.08]"}`}>
            <I.Cal/>
          </button>
        </header>

        {/* Date Nav */}
        <div className="flex items-center justify-between mb-4 px-1">
          <button onClick={()=>setSel(new Date(sel.getTime()-864e5))} className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center hover:bg-white/[0.08] transition-colors"><I.Left/></button>
          <div className="text-center cursor-pointer" onClick={()=>setShowCal(!showCal)}>
            <div className="text-sm font-semibold">{isT ? "Today" : fmtNice(sel)}</div>
            <div className="text-[10px] opacity-25 mt-0.5 tabular-nums">{fmtKey(sel)}</div>
          </div>
          <button onClick={()=>setSel(new Date(sel.getTime()+864e5))} className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center hover:bg-white/[0.08] transition-colors"><I.Right/></button>
        </div>

        {/* Calendar */}
        {showCal && <Calendar sel={sel} onPick={setSel} data={all} onClose={()=>setShowCal(false)}/>}

        {/* Macros */}
        <section className="mb-5 p-4 rounded-3xl bg-white/[0.025] border border-white/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[10px] uppercase tracking-[0.2em] opacity-30 font-medium">Daily Macros</h2>
            <span className="text-[11px] opacity-20 tabular-nums">{Math.round(macros.calories)} / {goals.calories} kcal</span>
          </div>
          <div className="flex justify-between px-1">
            <Ring value={macros.calories} max={goals.calories} color="#f59e0b" label="Cal" unit="kcal"/>
            <Ring value={macros.protein} max={goals.protein} color="#ef4444" label="Prot"/>
            <Ring value={macros.carbs} max={goals.carbs} color="#3b82f6" label="Carb"/>
            <Ring value={macros.fat} max={goals.fat} color="#a855f7" label="Fat"/>
          </div>
        </section>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 p-1 rounded-2xl bg-white/[0.025]">
          {[{id:"meals",label:"Meals",icon:<I.Fire/>,badge:ml},{id:"workout",label:"Workout",icon:<I.Dumbbell/>}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
                tab===t.id?"bg-white/[0.08] text-white":"text-white/25 hover:text-white/45"}`}>
              {t.icon}{t.label}
              {t.badge>0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 tabular-nums">{t.badge}/4</span>}
            </button>
          ))}
        </div>

        {/* ═══ MEALS ═══ */}
        {tab==="meals" && (
          <div className="space-y-3">
            {slots.map(s => {
              const sv = dd[s.key];
              return (
                <div key={s.key} className="rounded-2xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
                  <div className={`flex items-center gap-2.5 px-4 pt-3 pb-2 bg-gradient-to-r ${s.grad}`}>
                    <span className="opacity-55">{s.icon}</span>
                    <span className="text-[13px] font-bold tracking-wide">{s.label}</span>
                    {sv && <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-white/[0.06] text-emerald-400 font-semibold tabular-nums">{Math.round(sv.macros.calories)} kcal</span>}
                  </div>

                  {sv ? (
                    <div className="px-4 pb-3.5 pt-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[13px] opacity-50 leading-relaxed">{sv.text}</p>
                        <button onClick={()=>removeMeal(s.key)} className="opacity-20 hover:opacity-70 hover:text-red-400 transition-all p-1 shrink-0"><I.Trash/></button>
                      </div>
                      {sv.items?.length>0 && (
                        <div className="mt-2.5 space-y-1">
                          {sv.items.map((it,i)=>(
                            <div key={i} className="flex items-center justify-between text-[11px] py-1.5 px-3 rounded-lg bg-white/[0.025]">
                              <span className="opacity-50 truncate mr-2">{it.name} <span className="opacity-30">({it.qty})</span></span>
                              <div className="flex gap-2 opacity-35 tabular-nums whitespace-nowrap text-[10px]">
                                <span>{it.cal}cal</span>
                                <span className="text-red-400">{it.protein}p</span>
                                <span className="text-blue-400">{it.carbs}c</span>
                                <span className="text-purple-400">{it.fat}f</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-3 mt-2.5">
                        {[{l:"P",v:sv.macros.protein,c:"#ef4444"},{l:"C",v:sv.macros.carbs,c:"#3b82f6"},{l:"F",v:sv.macros.fat,c:"#a855f7"}].map(m=>(
                          <div key={m.l} className="flex items-center gap-1.5 text-[10px]">
                            <div className="w-1.5 h-1.5 rounded-full" style={{background:m.c}}/><span className="opacity-35">{m.l}: {Math.round(m.v)}g</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="px-4 pb-3.5 pt-1.5">
                      <div className="flex gap-2 items-end">
                        <textarea rows={2} placeholder={s.ph} value={inputs[s.key]}
                          onChange={e=>setInputs(p=>({...p,[s.key]:e.target.value}))}
                          className="flex-1 rounded-xl px-3 py-2.5 resize-none border border-white/[0.08] focus:!border-amber-500/40 outline-none transition-colors text-sm"
                          />
                        <button onClick={()=>calc(s.key)}
                          disabled={!inputs[s.key].trim()||loadSlot===s.key}
                          className="shrink-0 h-10 w-10 rounded-xl bg-gradient-to-b from-amber-400 to-orange-500 text-black flex items-center justify-center disabled:opacity-25 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-orange-500/20 transition-all active:scale-95">
                          {loadSlot===s.key?<I.Loader/>:<I.Sparkle/>}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Daily bars */}
            {macros.calories>0 && (
              <div className="p-4 rounded-2xl bg-white/[0.025] border border-white/[0.06]">
                <div className="text-[10px] uppercase tracking-widest opacity-20 mb-3 font-medium">Daily Totals</div>
                <div className="space-y-2">
                  {[{l:"Protein",v:macros.protein,m:goals.protein,c:"#ef4444"},{l:"Carbs",v:macros.carbs,m:goals.carbs,c:"#3b82f6"},{l:"Fat",v:macros.fat,m:goals.fat,c:"#a855f7"},{l:"Fiber",v:macros.fiber,m:goals.fiber,c:"#22c55e"}].map(x=>(
                    <div key={x.l}>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="opacity-40">{x.l}</span>
                        <span className="tabular-nums opacity-30">{Math.round(x.v)}g / {x.m}g</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{width:`${Math.min((x.v/x.m)*100,100)}%`,background:x.c}}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ WORKOUT ═══ */}
        {tab==="workout" && (
          <div>
            {!wDone ? (
              <div className="text-center py-14">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center opacity-25"><I.Dumbbell/></div>
                <p className="text-sm opacity-25 mb-1">Generate your workout for</p>
                <p className="text-base font-bold text-white/70 mb-1">{fmtNice(sel)}</p>
                {macros.calories>0 && <p className="text-[11px] opacity-20 mb-5">Based on {Math.round(macros.calories)} kcal logged</p>}
                {macros.calories===0 && <p className="text-[11px] opacity-15 mb-5">Log meals first for a tailored plan</p>}
                <button onClick={genW} disabled={loadW}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-b from-amber-400 to-orange-500 text-black font-bold text-sm hover:shadow-lg hover:shadow-orange-500/25 transition-all active:scale-95 disabled:opacity-50">
                  {loadW?<><I.Loader/> Generating...</>:<><I.Sparkle/> Generate Workout</>}
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4 px-1">
                  <span className="text-xs opacity-35 tabular-nums">{cc}/{workout.length}</span>
                  <div className="flex-1 mx-3 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                      style={{width:`${workout.length>0?(cc/workout.length)*100:0}%`}}/>
                  </div>
                  <button onClick={()=>{setWDone(false);setWorkout([]);}}
                    className="text-[11px] opacity-25 hover:opacity-55 transition-opacity px-2 py-1 rounded-lg hover:bg-white/[0.04]">↻ New</button>
                </div>
                <div className="space-y-2">
                  {workout.map((ex,i)=><WCard key={i} ex={ex} i={i} onToggle={()=>setWorkout(p=>p.map((e,j)=>j===i?{...e,done:!e.done}:e))}/>)}
                </div>
                {cc===workout.length && workout.length>0 && (
                  <div className="mt-6 p-5 rounded-2xl bg-gradient-to-b from-emerald-500/10 to-emerald-500/[0.02] border border-emerald-500/20 text-center">
                    <div className="text-3xl mb-2">💪</div>
                    <h3 className="font-bold text-emerald-400 text-lg">Workout Complete!</h3>
                    <p className="text-xs opacity-30 mt-1">
                      {dd.postworkout ? "Post-workout meal logged. Recovery mode: ON." : "Don't forget to log your post-workout meal!"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
