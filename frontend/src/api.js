const API = "http://localhost:3000/api";

export async function askGemini(prompt, systemPrompt = "") {
  try {
    const res = await fetch(`${API}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: systemPrompt,
        prompt: prompt,
      }),
    });
    const data = await res.json();
    return data.text || "";
  } catch (e) {
    console.error("API error:", e);
    return null;
  }
}

export async function askGeminiWithImage(base64Data, mimeType) {
  try {
    const res = await fetch(`${API}/chat-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64Data, mimeType }),
    });
    const data = await res.json();
    return data.text || "";
  } catch (e) {
    console.error("Image API error:", e);
    return null;
  }
}

// ═══ Meals ═══

export async function fetchAllMeals() {
  try {
    const res = await fetch(`${API}/meals`);
    return await res.json();
  } catch (e) {
    console.error("fetchAllMeals error:", e);
    return {};
  }
}

export async function fetchMeals(date) {
  try {
    const res = await fetch(`${API}/meals/${date}`);
    return await res.json();
  } catch (e) {
    console.error("fetchMeals error:", e);
    return {};
  }
}

export async function saveMeal(date, slot, data) {
  try {
    await fetch(`${API}/meals/${date}/${slot}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (e) {
    console.error("saveMeal error:", e);
  }
}

export async function deleteMeal(date, slot) {
  try {
    await fetch(`${API}/meals/${date}/${slot}`, { method: "DELETE" });
  } catch (e) {
    console.error("deleteMeal error:", e);
  }
}

// ═══ Body Weight ═══

export async function fetchWeightHistory() {
  try {
    const res = await fetch(`${API}/weight`);
    return await res.json();
  } catch (e) {
    console.error("fetchWeightHistory error:", e);
    return [];
  }
}

export async function fetchWeight(date) {
  try {
    const res = await fetch(`${API}/weight/${date}`);
    return await res.json();
  } catch (e) {
    console.error("fetchWeight error:", e);
    return null;
  }
}

export async function saveWeight(date, weight, unit = 'kg') {
  try {
    await fetch(`${API}/weight/${date}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weight, unit }),
    });
  } catch (e) {
    console.error("saveWeight error:", e);
  }
}

// ═══ Water Intake ═══

export async function fetchWater(date) {
  try {
    const res = await fetch(`${API}/water/${date}`);
    return await res.json();
  } catch (e) {
    console.error("fetchWater error:", e);
    return { glasses: 0 };
  }
}

export async function saveWater(date, glasses) {
  try {
    await fetch(`${API}/water/${date}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ glasses }),
    });
  } catch (e) {
    console.error("saveWater error:", e);
  }
}

// ═══ User Goals ═══

export async function fetchGoals() {
  try {
    const res = await fetch(`${API}/goals`);
    return await res.json();
  } catch (e) {
    console.error("fetchGoals error:", e);
    return null;
  }
}

export async function saveGoals(goals) {
  try {
    await fetch(`${API}/goals`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(goals),
    });
  } catch (e) {
    console.error("saveGoals error:", e);
  }
}

// ═══ Workouts ═══

export async function fetchAllWorkouts() {
  try {
    const res = await fetch(`${API}/workouts`);
    return await res.json();
  } catch (e) {
    console.error("fetchAllWorkouts error:", e);
    return {};
  }
}

export async function saveWorkoutDone(date, done) {
  try {
    await fetch(`${API}/workouts/${date}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done }),
    });
  } catch (e) {
    console.error("saveWorkoutDone error:", e);
  }
}
