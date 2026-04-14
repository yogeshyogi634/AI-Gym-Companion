import React, { useState, useEffect } from "react";
import I from "./components/Icons";
import Ring from "./components/Ring";
import Calendar from "./components/Calendar";
import WCard from "./components/WCard";
import { fmtKey, fmtNice, same } from "./utils/dateUtils";
import {
  askGemini,
  askGeminiWithImage,
  fetchAllMeals,
  saveMeal,
  deleteMeal as apiDeleteMeal,
  fetchAllWorkouts,
  saveWorkoutDone,
  fetchWeightHistory,
  fetchWeight,
  saveWeight,
  fetchWater,
  saveWater,
  fetchGoals,
  saveGoals,
} from "./api";
import { getWorkoutForDate } from "./data/workouts";

import "./index.css";

const DEFAULT_GOALS = {
  calories: 2500,
  protein: 150,
  carbs: 300,
  fat: 80,
  fiber: 35,
  waterGlasses: 16,
};

export default function App() {
  const [sel, setSel] = useState(new Date());
  const [all, setAll] = useState({});
  const [inputs, setInputs] = useState({
    morning: "",
    afternoon: "",
    night: "",
    postworkout: "",
  });
  const [macros, setMacros] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
  });
  const [workoutDone, setWorkoutDone] = useState({});
  const [workout, setWorkout] = useState([]);
  const [loadSlot, setLoadSlot] = useState(null);
  const [editing, setEditing] = useState({});
  const [tab, setTab] = useState("dashboard");
  const [showCal, setShowCal] = useState(false);
  const [dayPlan, setDayPlan] = useState(() => getWorkoutForDate(new Date()));
  const [theme, setTheme] = useState(
    () => localStorage.getItem("gymzy_theme") || "dark",
  );

  // New feature states
  const [goals, setGoals] = useState(DEFAULT_GOALS);
  const [showGoals, setShowGoals] = useState(false);
  const [goalDraft, setGoalDraft] = useState(DEFAULT_GOALS);
  const [water, setWater] = useState(0);
  const [todayWeight, setTodayWeight] = useState("");
  const [weightHistory, setWeightHistory] = useState([]);
  const [weightInput, setWeightInput] = useState("");

  const fileRefs = {
    morning: React.useRef(null),
    afternoon: React.useRef(null),
    night: React.useRef(null),
    postworkout: React.useRef(null),
  };
  const cameraRefs = {
    morning: React.useRef(null),
    afternoon: React.useRef(null),
    night: React.useRef(null),
    postworkout: React.useRef(null),
  };

  const dk = fmtKey(sel);
  const dd = all[dk] || {};

  const slots = [
    {
      key: "morning",
      label: "Breakfast",
      icon: <I.Sun />,
      grad: "from-amber-500/15 to-transparent",
      ph: "e.g. 3 eggs, 2 toast, banana, black coffee...",
    },
    {
      key: "afternoon",
      label: "Lunch",
      icon: <I.Cloud />,
      grad: "from-sky-500/15 to-transparent",
      ph: "e.g. chicken breast 200g, rice 1 cup, dal, salad...",
    },
    {
      key: "night",
      label: "Dinner",
      icon: <I.Moon />,
      grad: "from-indigo-500/15 to-transparent",
      ph: "e.g. paneer tikka 150g, 2 roti, raita, veggies...",
    },
    {
      key: "postworkout",
      label: "Post-Workout",
      icon: <I.Zap />,
      grad: "from-emerald-500/15 to-transparent",
      ph: "e.g. whey protein, banana, peanut butter toast...",
    },
  ];

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("gymzy_theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  // Load all data from MongoDB on mount
  useEffect(() => {
    fetchAllMeals().then((data) => setAll(data));
    fetchAllWorkouts().then((data) => setWorkoutDone(data));
    fetchGoals().then((data) => {
      if (data && data.calories) {
        const g = {
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat,
          fiber: data.fiber,
          waterGlasses: data.waterGlasses || 8,
        };
        setGoals(g);
        setGoalDraft(g);
      }
    });
    fetchWeightHistory().then((data) => setWeightHistory(data || []));
  }, []);

  // Load water & weight for selected date
  useEffect(() => {
    fetchWater(dk).then((data) => setWater(data?.glasses || 0));
    fetchWeight(dk).then((data) => {
      setTodayWeight(data?.weight || "");
      setWeightInput(data?.weight ? String(data.weight) : "");
    });
  }, [dk]);

  // Recalculate macros
  useEffect(() => {
    const d = all[dk] || {};
    const t = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    Object.values(d).forEach((m) => {
      if (m?.macros) {
        t.calories += m.macros.calories || 0;
        t.protein += m.macros.protein || 0;
        t.carbs += m.macros.carbs || 0;
        t.fat += m.macros.fat || 0;
        t.fiber += m.macros.fiber || 0;
      }
    });
    setMacros(t);
  }, [dk, all]);

  // Load workout for selected date, restoring done states
  useEffect(() => {
    const plan = getWorkoutForDate(sel);
    setDayPlan(plan);
    const saved = workoutDone[dk] || {};
    setWorkout(plan.exercises.map((e, i) => ({ ...e, done: !!saved[i] })));
  }, [dk, workoutDone]);

  async function calc(slot) {
    const food = inputs[slot];
    if (!food.trim()) return;
    setLoadSlot(slot);
    const sys = `You are a nutrition calculator. Given food items, estimate macros. Respond ONLY with a JSON object: {"calories":500,"protein":30,"carbs":60,"fat":15,"fiber":5,"items":[{"name":"chicken breast","qty":"200g","cal":330,"protein":62,"carbs":0,"fat":7}]}. Be accurate with Indian and international foods. No markdown, just pure JSON.`;
    const r = await askGemini(
      `Calculate detailed macros for this meal: ${food}`,
      sys,
    );
    setLoadSlot(null);
    if (r) {
      try {
        let clean = r.trim();
        const first = clean.indexOf("{");
        const last = clean.lastIndexOf("}");
        if (first !== -1 && last !== -1) {
          clean = clean.substring(first, last + 1);
        }
        const p = JSON.parse(clean);
        const mealData = { text: food, macros: p, items: p.items || [] };
        setAll((prev) => ({
          ...prev,
          [dk]: { ...(prev[dk] || {}), [slot]: mealData },
        }));
        setInputs((prev) => ({ ...prev, [slot]: "" }));
        setEditing((prev) => {
          const u = { ...prev };
          delete u[slot];
          return u;
        });
        saveMeal(dk, slot, mealData);
      } catch (e) {
        console.error("Failed parsing:", e, "\nRaw Response:", r);
        alert(
          "Failed to parse the response! Check the console. Raw output was: " +
            r.slice(0, 100) +
            "...",
        );
      }
    }
  }

  async function calcFromImage(slot, file) {
    if (!file) return;
    setLoadSlot(slot);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result.split(",")[1];
      const mimeType = file.type;
      const r = await askGeminiWithImage(base64, mimeType);
      setLoadSlot(null);
      if (r) {
        try {
          let clean = r.trim();
          const first = clean.indexOf("{");
          const last = clean.lastIndexOf("}");
          if (first !== -1 && last !== -1)
            clean = clean.substring(first, last + 1);
          const p = JSON.parse(clean);
          const foodNames = (p.items || [])
            .map((it) => `${it.name} (${it.qty})`)
            .join(", ");
          const mealData = {
            text: foodNames || "Photo meal",
            macros: p,
            items: p.items || [],
          };
          setAll((prev) => ({
            ...prev,
            [dk]: { ...(prev[dk] || {}), [slot]: mealData },
          }));
          setEditing((prev) => {
            const u = { ...prev };
            delete u[slot];
            return u;
          });
          saveMeal(dk, slot, mealData);
        } catch (e) {
          console.error("Failed parsing image response:", e, "\nRaw:", r);
          alert(
            "Failed to parse the response! Raw: " + r.slice(0, 100) + "...",
          );
        }
      }
    };
    reader.readAsDataURL(file);
  }

  function editMeal(slot) {
    const sv = dd[slot];
    if (!sv) return;
    setEditing((prev) => ({ ...prev, [slot]: sv }));
    setInputs((prev) => ({ ...prev, [slot]: sv.text }));
    setAll((prev) => {
      const u = { ...prev };
      if (u[dk]) {
        const d = { ...u[dk] };
        delete d[slot];
        u[dk] = d;
      }
      return u;
    });
    apiDeleteMeal(dk, slot);
  }

  function cancelEdit(slot) {
    const orig = editing[slot];
    if (!orig) return;
    setAll((prev) => ({
      ...prev,
      [dk]: { ...(prev[dk] || {}), [slot]: orig },
    }));
    saveMeal(dk, slot, orig);
    setInputs((prev) => ({ ...prev, [slot]: "" }));
    setEditing((prev) => {
      const u = { ...prev };
      delete u[slot];
      return u;
    });
  }

  function removeMeal(slot) {
    setAll((prev) => {
      const u = { ...prev };
      if (u[dk]) {
        const d = { ...u[dk] };
        delete d[slot];
        u[dk] = d;
      }
      return u;
    });
    apiDeleteMeal(dk, slot);
  }

  // Water handlers
  function addWater(amount) {
    const newVal = Math.max(0, water + amount);
    setWater(newVal);
    saveWater(dk, newVal);
  }

  // Weight handler
  function logWeight() {
    const w = parseFloat(weightInput);
    if (isNaN(w) || w <= 0) return;
    setTodayWeight(w);
    saveWeight(dk, w);
    // Update history
    setWeightHistory((prev) => {
      const filtered = prev.filter((e) => e.date !== dk);
      return [{ date: dk, weight: w }, ...filtered].sort((a, b) =>
        b.date.localeCompare(a.date),
      );
    });
  }

  // Goals handler
  function saveGoalsDraft() {
    setGoals(goalDraft);
    saveGoals(goalDraft);
    setShowGoals(false);
  }

  const cc = workout.filter((e) => e.done).length;
  const ml = Object.keys(dd).length;
  const isT = same(sel, new Date());

  // Dashboard stats
  const waterPct =
    goals.waterGlasses > 0
      ? Math.min((water / goals.waterGlasses) * 100, 100)
      : 0;
  const calPct =
    goals.calories > 0
      ? Math.min((macros.calories / goals.calories) * 100, 100)
      : 0;
  const workoutPct = workout.length > 0 ? (cc / workout.length) * 100 : 0;
  const recentWeights = weightHistory.slice(0, 7).reverse();
  const latestWeight = weightHistory.length > 0 ? weightHistory[0] : null;
  const prevWeight = weightHistory.length > 1 ? weightHistory[1] : null;
  const weightDiff =
    latestWeight && prevWeight
      ? (latestWeight.weight - prevWeight.weight).toFixed(1)
      : null;

  return (
    <div
      className="h-screen overflow-hidden transition-colors duration-300 flex flex-col"
      style={{
        background: "var(--bg-page)",
        color: "var(--text)",
        fontFamily: "'DM Sans',sans-serif",
      }}
    >
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-48 -right-48 w-[500px] h-[500px] rounded-full"
          style={{
            opacity: "var(--ambient-1)",
            background: "radial-gradient(circle,#f59e0b,transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-48 -left-48 w-[500px] h-[500px] rounded-full"
          style={{
            opacity: "var(--ambient-2)",
            background: "radial-gradient(circle,#22c55e,transparent 70%)",
          }}
        />
      </div>

      {/* Decorative gym icons - left side */}
      <div
        className="fixed left-0 top-0 bottom-0 pointer-events-none hidden lg:block"
        style={{
          width: "calc((100% - 32rem) / 2)",
          opacity: "var(--deco-opacity)",
        }}
      >
        <svg
          className="absolute"
          style={{ top: "8%", left: "20%", transform: "rotate(-15deg)" }}
          width="72"
          height="72"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6.5 6.5h11M6.5 17.5h11" />
          <rect x="2" y="4.5" width="3" height="6" rx="1" />
          <rect x="2" y="13.5" width="3" height="6" rx="1" />
          <rect x="19" y="4.5" width="3" height="6" rx="1" />
          <rect x="19" y="13.5" width="3" height="6" rx="1" />
          <line x1="3.5" y1="10.5" x2="3.5" y2="13.5" />
          <line x1="20.5" y1="10.5" x2="20.5" y2="13.5" />
        </svg>
        <svg
          className="absolute"
          style={{ top: "22%", left: "55%", transform: "rotate(10deg)" }}
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ef4444"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        <svg
          className="absolute"
          style={{ top: "35%", left: "15%", transform: "rotate(-5deg)" }}
          width="56"
          height="56"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#f97316"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </svg>
        <svg
          className="absolute"
          style={{ top: "48%", left: "50%", transform: "rotate(8deg)" }}
          width="44"
          height="44"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#22c55e"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="7" y="8" width="10" height="14" rx="2" />
          <path d="M7 12h10" />
          <path d="M9 4h6l1 4H8l1-4z" />
          <path d="M10 12v4" />
          <path d="M14 12v4" />
        </svg>
        <svg
          className="absolute"
          style={{ top: "62%", left: "25%", transform: "rotate(-12deg)" }}
          width="50"
          height="50"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="13" r="8" />
          <path d="M12 9v4l2 2" />
          <path d="M9 2h6" />
          <path d="M12 2v3" />
        </svg>
        <svg
          className="absolute"
          style={{ top: "76%", left: "55%", transform: "rotate(20deg)" }}
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#a855f7"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
          <path d="M12 2v4" />
          <path d="M12 18v4" />
          <path d="M2 12h4" />
          <path d="M18 12h4" />
        </svg>
        <svg
          className="absolute"
          style={{ top: "90%", left: "20%", transform: "rotate(-8deg)" }}
          width="42"
          height="42"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#14b8a6"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 18h18v1H3z" />
          <path d="M5 18l1-6c.2-1 1-2 2-2h2l1 1h3c2 0 4 1.5 5 3l1 2v2" />
          <path d="M8 10l-1-3c0-1 .5-2 1.5-2s2 1 2 2l-.5 3" />
        </svg>
        <svg
          className="absolute"
          style={{ top: "5%", left: "60%", transform: "rotate(25deg)" }}
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6.5 6.5h11M6.5 17.5h11" />
          <rect x="2" y="4.5" width="3" height="6" rx="1" />
          <rect x="2" y="13.5" width="3" height="6" rx="1" />
          <rect x="19" y="4.5" width="3" height="6" rx="1" />
          <rect x="19" y="13.5" width="3" height="6" rx="1" />
          <line x1="3.5" y1="10.5" x2="3.5" y2="13.5" />
          <line x1="20.5" y1="10.5" x2="20.5" y2="13.5" />
        </svg>
      </div>

      {/* Decorative gym icons - right side */}
      <div
        className="fixed right-0 top-0 bottom-0 pointer-events-none hidden lg:block"
        style={{
          width: "calc((100% - 32rem) / 2)",
          opacity: "var(--deco-opacity)",
        }}
      >
        <svg
          className="absolute"
          style={{ top: "6%", left: "35%", transform: "rotate(12deg)" }}
          width="60"
          height="60"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2a4 4 0 0 0-4 4c0 1.5.8 2.8 2 3.5L8 14h8l-2-4.5c1.2-.7 2-2 2-3.5a4 4 0 0 0-4-4z" />
          <ellipse cx="12" cy="18" rx="5" ry="4" />
        </svg>
        <svg
          className="absolute"
          style={{ top: "20%", left: "60%", transform: "rotate(-10deg)" }}
          width="50"
          height="50"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#eab308"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
        <svg
          className="absolute"
          style={{ top: "34%", left: "25%", transform: "rotate(5deg)" }}
          width="44"
          height="44"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
        </svg>
        <svg
          className="absolute"
          style={{ top: "46%", left: "55%", transform: "rotate(-18deg)" }}
          width="56"
          height="56"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ef4444"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 16c1-1 2-3 2-6s2-5 5-5c2 0 3 1 4 3s2 4 5 4" />
          <path d="M21 14c-1 1-2 3-4 4s-4 2-6 2-4-.5-5.5-2" />
          <path d="M7 21c-1-1-2-2-2.5-3.5" />
        </svg>
        <svg
          className="absolute"
          style={{ top: "60%", left: "30%", transform: "rotate(15deg)" }}
          width="46"
          height="46"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#22c55e"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
        <svg
          className="absolute"
          style={{ top: "74%", left: "60%", transform: "rotate(-5deg)" }}
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="8" r="6" />
          <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
          <circle cx="12" cy="8" r="2" />
        </svg>
        <svg
          className="absolute"
          style={{ top: "88%", left: "35%", transform: "rotate(8deg)" }}
          width="52"
          height="52"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ef4444"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 12h4l3-9 4 18 3-9h6" />
        </svg>
        <svg
          className="absolute"
          style={{ top: "10%", left: "15%", transform: "rotate(-20deg)" }}
          width="34"
          height="34"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#f97316"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </svg>
      </div>

      <div
        className="relative max-w-lg mx-auto px-4 py-5 flex-1 overflow-hidden flex flex-col w-full rounded-3xl my-3"
        style={{ border: "1px solid var(--border)", background: "var(--card)" }}
      >
        {/* Header */}
        <header className="flex items-center justify-between mb-5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg"
              style={{
                boxShadow: `0 8px 24px ${theme === "dark" ? "rgba(245,158,11,0.2)" : "rgba(245,158,11,0.15)"}`,
              }}
            >
              <I.Fire />
            </div>
            <div>
              <h1
                className="text-xl font-extrabold tracking-tight leading-none"
                style={{ fontFamily: "'Outfit',sans-serif" }}
              >
                GYMZY
              </h1>
              <p
                className="text-[9px] tracking-[0.25em] uppercase mt-0.5"
                style={{ opacity: "var(--faint)" }}
              >
                AI Gym Companion
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGoals(true)}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
              style={{
                background: "var(--subtle)",
                color: `color-mix(in srgb, var(--text) 45%, transparent)`,
              }}
            >
              <I.Settings />
            </button>
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
              style={{
                background: "var(--subtle)",
                color: `color-mix(in srgb, var(--text) 45%, transparent)`,
              }}
            >
              {theme === "dark" ? <I.ThemeSun /> : <I.ThemeMoon />}
            </button>
            <button
              onClick={() => setShowCal(!showCal)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${showCal ? "bg-amber-500 text-black shadow-lg" : ""}`}
              style={
                showCal
                  ? { boxShadow: "0 8px 24px var(--shadow-glow)" }
                  : {
                      background: "var(--subtle)",
                      color: `color-mix(in srgb, var(--text) 45%, transparent)`,
                    }
              }
            >
              <I.Cal />
            </button>
          </div>
        </header>

        {/* Date Nav */}
        <div className="flex items-center justify-between mb-4 px-1 shrink-0">
          <button
            onClick={() => setSel(new Date(sel.getTime() - 864e5))}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: "var(--subtle)" }}
          >
            <I.Left />
          </button>
          <div
            className="text-center cursor-pointer"
            onClick={() => setShowCal(!showCal)}
          >
            <div className="text-sm font-semibold">
              {isT ? "Today" : fmtNice(sel)}
            </div>
            <div
              className="text-[10px] mt-0.5 tabular-nums"
              style={{ opacity: "var(--faint)" }}
            >
              {fmtKey(sel)}
            </div>
          </div>
          <button
            onClick={() => setSel(new Date(sel.getTime() + 864e5))}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: "var(--subtle)" }}
          >
            <I.Right />
          </button>
        </div>

        {/* Calendar */}
        {showCal && (
          <Calendar
            sel={sel}
            onPick={setSel}
            data={all}
            onClose={() => setShowCal(false)}
          />
        )}

        {/* Macros */}
        <section
          className="mb-5 p-4 rounded-3xl shrink-0"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2
              className="text-[10px] uppercase tracking-[0.2em] font-medium"
              style={{ opacity: "var(--dim)" }}
            >
              Daily Macros
            </h2>
            <span
              className="text-[11px] tabular-nums"
              style={{ opacity: "var(--faint)" }}
            >
              {Math.round(macros.calories)} / {goals.calories} kcal
            </span>
          </div>
          <div className="flex justify-between px-1">
            <Ring
              value={macros.calories}
              max={goals.calories}
              color="#f59e0b"
              label="Cal"
              unit="kcal"
            />
            <Ring
              value={macros.protein}
              max={goals.protein}
              color="#ef4444"
              label="Prot"
            />
            <Ring
              value={macros.carbs}
              max={goals.carbs}
              color="#3b82f6"
              label="Carb"
            />
            <Ring
              value={macros.fat}
              max={goals.fat}
              color="#a855f7"
              label="Fat"
            />
          </div>
        </section>

        {/* Tabs */}
        <div
          className="flex gap-1 mb-3 p-1 rounded-2xl shrink-0"
          style={{ background: "var(--card)" }}
        >
          {[
            { id: "dashboard", label: "Home", icon: <I.Home /> },
            { id: "meals", label: "Meals", icon: <I.Fire />, badge: ml },
            { id: "workout", label: "Workout", icon: <I.Dumbbell /> },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-medium transition-all"
              style={
                tab === t.id
                  ? { background: "var(--tab-active)", color: "var(--text)" }
                  : { color: "var(--tab-text)" }
              }
            >
              {t.icon}
              {t.label}
              {t.badge > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 tabular-nums">
                  {t.badge}/4
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* ═══ DASHBOARD ═══ */}
          {tab === "dashboard" && (
            <div className="space-y-3">
              {/* Quick Stats Row */}
              <div className="grid grid-cols-2 gap-3">
                {/* Calories Card */}
                <div
                  className="p-4 rounded-2xl"
                  style={{
                    background: "var(--card-alt)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <I.Fire />
                    <span
                      className="text-[10px] uppercase tracking-wider font-medium"
                      style={{ opacity: "var(--dim)" }}
                    >
                      Calories
                    </span>
                  </div>
                  <div className="text-2xl font-bold tabular-nums">
                    {Math.round(macros.calories)}
                  </div>
                  <div
                    className="h-1.5 rounded-full mt-2 overflow-hidden"
                    style={{ background: "var(--progress-track)" }}
                  >
                    <div
                      className="h-full rounded-full bg-amber-500 transition-all duration-700"
                      style={{ width: `${calPct}%` }}
                    />
                  </div>
                  <div
                    className="text-[10px] mt-1 tabular-nums"
                    style={{ opacity: "var(--faint)" }}
                  >
                    {Math.round(calPct)}% of {goals.calories} kcal
                  </div>
                </div>

                {/* Workout Card */}
                <div
                  className="p-4 rounded-2xl"
                  style={{
                    background: "var(--card-alt)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <I.Dumbbell />
                    <span
                      className="text-[10px] uppercase tracking-wider font-medium"
                      style={{ opacity: "var(--dim)" }}
                    >
                      Workout
                    </span>
                  </div>
                  <div className="text-2xl font-bold tabular-nums">
                    {cc}
                    <span
                      className="text-sm font-normal"
                      style={{ opacity: "var(--dim)" }}
                    >
                      {" "}
                      / {workout.length}
                    </span>
                  </div>
                  <div
                    className="h-1.5 rounded-full mt-2 overflow-hidden"
                    style={{ background: "var(--progress-track)" }}
                  >
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                      style={{ width: `${workoutPct}%` }}
                    />
                  </div>
                  <div
                    className="text-[10px] mt-1"
                    style={{ opacity: "var(--faint)" }}
                  >
                    {dayPlan.type === "Rest"
                      ? "Rest Day"
                      : `${dayPlan.type} Day`}
                  </div>
                </div>
              </div>

              {/* Water Intake */}
              <div
                className="p-4 rounded-2xl"
                style={{
                  background: "var(--card-alt)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400">
                      <I.Droplet />
                    </span>
                    <span
                      className="text-[10px] uppercase tracking-wider font-medium"
                      style={{ opacity: "var(--dim)" }}
                    >
                      Water Intake
                    </span>
                  </div>
                  <span className="text-[11px] tabular-nums text-blue-400 font-semibold">
                    {water} / {goals.waterGlasses} glasses
                  </span>
                </div>
                {/* Water glasses visual */}
                <div className="flex gap-1.5 mb-3 flex-wrap">
                  {Array.from({ length: goals.waterGlasses }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-7 h-9 rounded-lg border-2 transition-all duration-300 flex items-center justify-end flex-col overflow-hidden ${
                        i < water ? "border-blue-400/50" : ""
                      }`}
                      style={i >= water ? { borderColor: "var(--border)" } : {}}
                    >
                      {i < water && (
                        <div
                          className="w-full bg-blue-400/30 rounded-b-sm transition-all duration-500"
                          style={{ height: "100%" }}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => addWater(-1)}
                    disabled={water <= 0}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-20 active:scale-95"
                    style={{ background: "var(--subtle)" }}
                  >
                    <I.Minus />
                  </button>
                  <div
                    className="flex-1 h-2 rounded-full overflow-hidden"
                    style={{ background: "var(--progress-track)" }}
                  >
                    <div
                      className="h-full rounded-full bg-blue-400 transition-all duration-500"
                      style={{ width: `${waterPct}%` }}
                    />
                  </div>
                  <button
                    onClick={() => addWater(1)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 bg-blue-500/15 text-blue-400"
                  >
                    <I.Plus />
                  </button>
                </div>
                <div
                  className="text-[10px] text-center mt-2 tabular-nums"
                  style={{ opacity: "var(--faint)" }}
                >
                  {water * 250}ml / {goals.waterGlasses * 250}ml
                </div>
              </div>

              {/* Body Weight */}
              <div
                className="p-4 rounded-2xl"
                style={{
                  background: "var(--card-alt)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400">
                      <I.Scale />
                    </span>
                    <span
                      className="text-[10px] uppercase tracking-wider font-medium"
                      style={{ opacity: "var(--dim)" }}
                    >
                      Body Weight
                    </span>
                  </div>
                  {latestWeight && (
                    <div className="flex items-center gap-1.5">
                      {weightDiff && weightDiff !== "0.0" && (
                        <span
                          className={`flex items-center gap-0.5 text-[11px] font-semibold ${parseFloat(weightDiff) > 0 ? "text-red-400" : "text-emerald-400"}`}
                        >
                          {parseFloat(weightDiff) > 0 ? (
                            <I.TrendUp />
                          ) : (
                            <I.TrendDown />
                          )}
                          {Math.abs(parseFloat(weightDiff))} kg
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Weight input */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="number"
                    step="0.1"
                    placeholder={
                      todayWeight ? String(todayWeight) : "Enter weight (kg)"
                    }
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && logWeight()}
                    className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors"
                    style={{
                      background: "var(--input-bg)",
                      color: "var(--input-text)",
                      border: "1px solid var(--input-border)",
                      caretColor: "var(--input-caret)",
                    }}
                  />
                  <button
                    onClick={logWeight}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium bg-purple-500/15 text-purple-400 transition-all active:scale-95"
                  >
                    Log
                  </button>
                </div>

                {/* Weight trend mini chart */}
                {recentWeights.length > 1 && (
                  <div>
                    <div
                      className="text-[9px] uppercase tracking-wider mb-2"
                      style={{ opacity: "var(--faint)" }}
                    >
                      Last {recentWeights.length} entries
                    </div>
                    <div
                      className="flex items-end gap-1"
                      style={{ height: "60px" }}
                    >
                      {(() => {
                        const weights = recentWeights.map((e) => e.weight);
                        const min = Math.min(...weights) - 0.5;
                        const max = Math.max(...weights) + 0.5;
                        const range = max - min || 1;
                        return recentWeights.map((entry, i) => {
                          const h = ((entry.weight - min) / range) * 100;
                          return (
                            <div
                              key={i}
                              className="flex-1 flex flex-col items-center gap-1"
                            >
                              <span
                                className="text-[8px] tabular-nums"
                                style={{ opacity: "var(--dim)" }}
                              >
                                {entry.weight}
                              </span>
                              <div
                                className="w-full rounded-t-md bg-purple-400/30 transition-all duration-500"
                                style={{ height: `${Math.max(h, 8)}%` }}
                              />
                              <span
                                className="text-[7px] tabular-nums"
                                style={{ opacity: "var(--faint)" }}
                              >
                                {entry.date.slice(5)}
                              </span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}

                {todayWeight && (
                  <div className="text-center mt-2">
                    <span className="text-lg font-bold text-purple-400 tabular-nums">
                      {todayWeight} kg
                    </span>
                    <span
                      className="text-[10px] ml-1"
                      style={{ opacity: "var(--faint)" }}
                    >
                      today
                    </span>
                  </div>
                )}
              </div>

              {/* Meals Summary */}
              <div
                className="p-4 rounded-2xl"
                style={{
                  background: "var(--card-alt)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <I.Fire />
                  <span
                    className="text-[10px] uppercase tracking-wider font-medium"
                    style={{ opacity: "var(--dim)" }}
                  >
                    Meals Logged
                  </span>
                  <span
                    className="ml-auto text-[11px] px-2 py-0.5 rounded-full text-emerald-400 font-semibold tabular-nums"
                    style={{ background: "var(--badge-bg)" }}
                  >
                    {ml} / 4
                  </span>
                </div>
                <div className="space-y-1.5">
                  {slots.map((s) => {
                    const sv = dd[s.key];
                    return (
                      <div
                        key={s.key}
                        className="flex items-center justify-between py-1.5 px-3 rounded-lg"
                        style={{
                          background: sv ? "var(--card)" : "transparent",
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span style={{ opacity: sv ? 1 : "var(--faint)" }}>
                            {s.icon}
                          </span>
                          <span
                            className="text-[12px]"
                            style={{
                              opacity: sv ? "var(--muted)" : "var(--faint)",
                            }}
                          >
                            {s.label}
                          </span>
                        </div>
                        {sv ? (
                          <span className="text-[11px] tabular-nums text-emerald-400 font-semibold">
                            {Math.round(sv.macros.calories)} kcal
                          </span>
                        ) : (
                          <span
                            className="text-[10px]"
                            style={{ opacity: "var(--faint)" }}
                          >
                            Not logged
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Macro breakdown bars */}
              {macros.calories > 0 && (
                <div
                  className="p-4 rounded-2xl"
                  style={{
                    background: "var(--card-alt)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div
                    className="text-[10px] uppercase tracking-widest mb-3 font-medium"
                    style={{ opacity: "var(--faint)" }}
                  >
                    Macro Progress
                  </div>
                  <div className="space-y-2">
                    {[
                      {
                        l: "Protein",
                        v: macros.protein,
                        m: goals.protein,
                        c: "#ef4444",
                      },
                      {
                        l: "Carbs",
                        v: macros.carbs,
                        m: goals.carbs,
                        c: "#3b82f6",
                      },
                      { l: "Fat", v: macros.fat, m: goals.fat, c: "#a855f7" },
                      {
                        l: "Fiber",
                        v: macros.fiber,
                        m: goals.fiber,
                        c: "#22c55e",
                      },
                    ].map((x) => (
                      <div key={x.l}>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span style={{ opacity: "var(--dim)" }}>{x.l}</span>
                          <span
                            className="tabular-nums"
                            style={{ opacity: "var(--faint)" }}
                          >
                            {Math.round(x.v)}g / {x.m}g
                          </span>
                        </div>
                        <div
                          className="h-1.5 rounded-full overflow-hidden"
                          style={{ background: "var(--progress-track)" }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${Math.min((x.v / x.m) * 100, 100)}%`,
                              background: x.c,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ MEALS ═══ */}
          {tab === "meals" && (
            <div className="space-y-3">
              {slots.map((s) => {
                const sv = dd[s.key];
                return (
                  <div
                    key={s.key}
                    className="rounded-2xl overflow-hidden"
                    style={{
                      background: "var(--card-alt)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div
                      className={`flex items-center gap-2.5 px-4 pt-3 pb-2 bg-gradient-to-r ${s.grad}`}
                    >
                      <span style={{ opacity: "var(--muted)" }}>{s.icon}</span>
                      <span className="text-[13px] font-bold tracking-wide">
                        {s.label}
                      </span>
                      {sv && (
                        <span
                          className="ml-auto text-[11px] px-2 py-0.5 rounded-full text-emerald-400 font-semibold tabular-nums"
                          style={{ background: "var(--badge-bg)" }}
                        >
                          {Math.round(sv.macros.calories)} kcal
                        </span>
                      )}
                    </div>

                    {sv ? (
                      <div className="px-4 pb-3.5 pt-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className="text-[13px] leading-relaxed"
                            style={{ opacity: "var(--muted)" }}
                          >
                            {sv.text}
                          </p>
                          <div className="flex gap-1 shrink-0">
                            <button
                              onClick={() => editMeal(s.key)}
                              className="hover:text-amber-400 transition-all p-1"
                              style={{ opacity: 0.3 }}
                              title="Edit"
                            >
                              <I.Pencil />
                            </button>
                            <button
                              onClick={() => removeMeal(s.key)}
                              className="hover:text-red-400 transition-all p-1"
                              style={{ opacity: 0.3 }}
                              title="Delete"
                            >
                              <I.Trash />
                            </button>
                          </div>
                        </div>
                        {sv.items?.length > 0 && (
                          <div className="mt-2.5 space-y-1">
                            {sv.items.map((it, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between text-[11px] py-1.5 px-3 rounded-lg"
                                style={{ background: "var(--card)" }}
                              >
                                <span
                                  className="truncate mr-2"
                                  style={{ opacity: "var(--muted)" }}
                                >
                                  {it.name}{" "}
                                  <span style={{ opacity: 0.6 }}>
                                    ({it.qty})
                                  </span>
                                </span>
                                <div
                                  className="flex gap-2 tabular-nums whitespace-nowrap text-[10px]"
                                  style={{ opacity: "var(--dim)" }}
                                >
                                  <span>{it.cal}cal</span>
                                  <span className="text-red-400">
                                    {it.protein}p
                                  </span>
                                  <span className="text-blue-400">
                                    {it.carbs}c
                                  </span>
                                  <span className="text-purple-400">
                                    {it.fat}f
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-3 mt-2.5">
                          {[
                            { l: "P", v: sv.macros.protein, c: "#ef4444" },
                            { l: "C", v: sv.macros.carbs, c: "#3b82f6" },
                            { l: "F", v: sv.macros.fat, c: "#a855f7" },
                          ].map((m) => (
                            <div
                              key={m.l}
                              className="flex items-center gap-1.5 text-[10px]"
                            >
                              <div
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ background: m.c }}
                              />
                              <span style={{ opacity: "var(--dim)" }}>
                                {m.l}: {Math.round(m.v)}g
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="px-4 pb-3.5 pt-1.5">
                        {editing[s.key] && (
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-medium text-amber-400">
                              Editing meal...
                            </span>
                            <button
                              onClick={() => cancelEdit(s.key)}
                              className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg hover:text-red-400 transition-all"
                              style={{
                                background: "var(--card)",
                                opacity: 0.7,
                              }}
                              title="Cancel edit"
                            >
                              <I.X /> Cancel
                            </button>
                          </div>
                        )}
                        <div className="flex gap-2 items-end">
                          <textarea
                            rows={2}
                            placeholder={s.ph}
                            value={inputs[s.key]}
                            onChange={(e) =>
                              setInputs((p) => ({
                                ...p,
                                [s.key]: e.target.value,
                              }))
                            }
                            className="flex-1 rounded-xl px-3 py-2.5 resize-none outline-none transition-colors text-sm"
                            style={{
                              border: editing[s.key]
                                ? `1px solid #f59e0b`
                                : `1px solid var(--input-border)`,
                            }}
                          />
                          <div className="flex flex-col gap-1.5">
                            <button
                              onClick={() => calc(s.key)}
                              disabled={
                                !inputs[s.key].trim() || loadSlot === s.key
                              }
                              className="shrink-0 h-10 w-10 rounded-xl bg-gradient-to-b from-amber-400 to-orange-500 text-black flex items-center justify-center disabled:opacity-25 disabled:cursor-not-allowed hover:shadow-lg transition-all active:scale-95"
                              style={{
                                boxShadow: "0 4px 16px var(--shadow-glow)",
                              }}
                            >
                              {loadSlot === s.key ? (
                                <I.Loader />
                              ) : (
                                <I.Sparkle />
                              )}
                            </button>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() =>
                                  cameraRefs[s.key].current?.click()
                                }
                                disabled={loadSlot === s.key}
                                className="shrink-0 h-[30px] w-[30px] flex-1 rounded-lg flex items-center justify-center disabled:opacity-25 transition-all active:scale-95"
                                style={{
                                  background: "var(--subtle)",
                                  color: "var(--text)",
                                }}
                              >
                                <I.Camera />
                              </button>
                              <button
                                onClick={() => fileRefs[s.key].current?.click()}
                                disabled={loadSlot === s.key}
                                className="shrink-0 h-[30px] w-[30px] flex-1 rounded-lg flex items-center justify-center disabled:opacity-25 transition-all active:scale-95"
                                style={{
                                  background: "var(--subtle)",
                                  color: "var(--text)",
                                }}
                              >
                                <I.Image />
                              </button>
                            </div>
                          </div>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          ref={cameraRefs[s.key]}
                          className="hidden"
                          onChange={(e) => {
                            calcFromImage(s.key, e.target.files[0]);
                            e.target.value = "";
                          }}
                        />
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileRefs[s.key]}
                          className="hidden"
                          onChange={(e) => {
                            calcFromImage(s.key, e.target.files[0]);
                            e.target.value = "";
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Daily bars */}
              {macros.calories > 0 && (
                <div
                  className="p-4 rounded-2xl"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div
                    className="text-[10px] uppercase tracking-widest mb-3 font-medium"
                    style={{ opacity: "var(--faint)" }}
                  >
                    Daily Totals
                  </div>
                  <div className="space-y-2">
                    {[
                      {
                        l: "Protein",
                        v: macros.protein,
                        m: goals.protein,
                        c: "#ef4444",
                      },
                      {
                        l: "Carbs",
                        v: macros.carbs,
                        m: goals.carbs,
                        c: "#3b82f6",
                      },
                      { l: "Fat", v: macros.fat, m: goals.fat, c: "#a855f7" },
                      {
                        l: "Fiber",
                        v: macros.fiber,
                        m: goals.fiber,
                        c: "#22c55e",
                      },
                    ].map((x) => (
                      <div key={x.l}>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span style={{ opacity: "var(--dim)" }}>{x.l}</span>
                          <span
                            className="tabular-nums"
                            style={{ opacity: "var(--faint)" }}
                          >
                            {Math.round(x.v)}g / {x.m}g
                          </span>
                        </div>
                        <div
                          className="h-1.5 rounded-full overflow-hidden"
                          style={{ background: "var(--progress-track)" }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${Math.min((x.v / x.m) * 100, 100)}%`,
                              background: x.c,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ WORKOUT ═══ */}
          {tab === "workout" && (
            <div>
              {/* Day label + split badge */}
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                      dayPlan.type === "Push"
                        ? "bg-red-500/15 text-red-400"
                        : dayPlan.type === "Pull"
                          ? "bg-blue-500/15 text-blue-400"
                          : dayPlan.type === "Legs"
                            ? "bg-purple-500/15 text-purple-400"
                            : "bg-emerald-500/15 text-emerald-400"
                    }`}
                  >
                    {dayPlan.type}
                  </span>
                  <span
                    className="text-sm font-semibold"
                    style={{ opacity: 0.6 }}
                  >
                    {dayPlan.label}
                  </span>
                </div>
                <span
                  className="text-[10px] uppercase tracking-widest"
                  style={{ opacity: "var(--faint)" }}
                >
                  {sel.toLocaleDateString("en-US", { weekday: "long" })}
                </span>
              </div>

              {/* Weekly split overview */}
              <div className="flex gap-1 mb-5">
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => {
                  const colors = [
                    "bg-red-500",
                    "bg-blue-500",
                    "bg-purple-500",
                    "bg-red-500",
                    "bg-blue-500",
                    "bg-purple-500",
                    "bg-white/20",
                  ];
                  const currentIdx = sel.getDay() === 0 ? 6 : sel.getDay() - 1;
                  return (
                    <div
                      key={i}
                      className="flex-1 text-center py-1.5 rounded-lg text-[10px] font-medium transition-all"
                      style={
                        i === currentIdx
                          ? {
                              background: "var(--week-active)",
                              color: "var(--text)",
                            }
                          : { color: "var(--week-text)" }
                      }
                    >
                      <div>{d}</div>
                      <div
                        className={`w-1.5 h-1.5 rounded-full mx-auto mt-1 ${colors[i]}`}
                        style={{ opacity: i === currentIdx ? 1 : 0.3 }}
                      />
                    </div>
                  );
                })}
              </div>

              {dayPlan.type === "Rest" ? (
                <div className="text-center py-14">
                  <div className="text-4xl mb-3">😴</div>
                  <h3 className="text-lg font-bold text-emerald-400 mb-1">
                    Rest Day
                  </h3>
                  <p className="text-sm" style={{ opacity: "var(--dim)" }}>
                    Recovery is when muscles grow.
                  </p>
                  <p
                    className="text-xs mt-2"
                    style={{ opacity: "var(--faint)" }}
                  >
                    Stretch, hydrate, and eat well.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span
                      className="text-xs tabular-nums"
                      style={{ opacity: "var(--dim)" }}
                    >
                      {cc}/{workout.length} exercises
                    </span>
                    <div
                      className="flex-1 mx-3 h-1.5 rounded-full overflow-hidden"
                      style={{ background: "var(--progress-track)" }}
                    >
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                        style={{
                          width: `${workout.length > 0 ? (cc / workout.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    {workout.map((ex, i) => (
                      <WCard
                        key={i}
                        ex={ex}
                        i={i}
                        onToggle={() => {
                          setWorkout((p) => {
                            const u = p.map((e, j) =>
                              j === i ? { ...e, done: !e.done } : e,
                            );
                            const doneMap = Object.fromEntries(
                              u.map((e, j) => [j, e.done]),
                            );
                            setWorkoutDone((prev) => ({
                              ...prev,
                              [dk]: doneMap,
                            }));
                            saveWorkoutDone(dk, doneMap);
                            return u;
                          });
                        }}
                      />
                    ))}
                  </div>
                  {cc === workout.length && workout.length > 0 && (
                    <div className="mt-6 p-5 rounded-2xl bg-gradient-to-b from-emerald-500/10 to-emerald-500/[0.02] border border-emerald-500/20 text-center">
                      <div className="text-3xl mb-2">💪</div>
                      <h3 className="font-bold text-emerald-400 text-lg">
                        Workout Complete!
                      </h3>
                      <p
                        className="text-xs mt-1"
                        style={{ opacity: "var(--dim)" }}
                      >
                        {dd.postworkout
                          ? "Post-workout meal logged. Recovery mode: ON."
                          : "Don't forget to log your post-workout meal!"}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══ GOALS MODAL ═══ */}
      {showGoals && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowGoals(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-sm rounded-3xl p-6 animate-slideDown"
            style={{
              background: "var(--bg-body)",
              border: "1px solid var(--border)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="text-amber-400">
                  <I.Target />
                </span>
                <h2 className="text-lg font-bold">Custom Goals</h2>
              </div>
              <button
                onClick={() => setShowGoals(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "var(--subtle)" }}
              >
                <I.X />
              </button>
            </div>

            <div className="space-y-3">
              {[
                {
                  key: "calories",
                  label: "Calories",
                  unit: "kcal",
                  color: "#f59e0b",
                },
                {
                  key: "protein",
                  label: "Protein",
                  unit: "g",
                  color: "#ef4444",
                },
                { key: "carbs", label: "Carbs", unit: "g", color: "#3b82f6" },
                { key: "fat", label: "Fat", unit: "g", color: "#a855f7" },
                { key: "fiber", label: "Fiber", unit: "g", color: "#22c55e" },
                {
                  key: "waterGlasses",
                  label: "Water",
                  unit: "glasses",
                  color: "#38bdf8",
                },
              ].map((g) => (
                <div key={g.key}>
                  <label
                    className="text-[11px] uppercase tracking-wider font-medium flex items-center gap-2 mb-1"
                    style={{ opacity: "var(--dim)" }}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: g.color }}
                    />
                    {g.label}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={goalDraft[g.key]}
                      onChange={(e) =>
                        setGoalDraft((p) => ({
                          ...p,
                          [g.key]: Number(e.target.value),
                        }))
                      }
                      className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors"
                      style={{
                        background: "var(--input-bg)",
                        color: "var(--input-text)",
                        border: "1px solid var(--input-border)",
                        caretColor: "var(--input-caret)",
                      }}
                    />
                    <span
                      className="text-[11px] w-12"
                      style={{ opacity: "var(--faint)" }}
                    >
                      {g.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => {
                  setGoalDraft(DEFAULT_GOALS);
                }}
                className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
                style={{ background: "var(--subtle)", color: "var(--text)" }}
              >
                Reset
              </button>
              <button
                onClick={saveGoalsDraft}
                className="flex-1 py-3 rounded-xl text-sm font-medium bg-gradient-to-b from-amber-400 to-orange-500 text-black transition-all active:scale-95"
                style={{ boxShadow: "0 4px 16px var(--shadow-glow)" }}
              >
                Save Goals
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
