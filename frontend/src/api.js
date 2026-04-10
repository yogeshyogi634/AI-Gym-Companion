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
