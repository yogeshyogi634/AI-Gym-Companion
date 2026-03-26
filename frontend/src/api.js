const BACKEND_URL = "http://localhost:3000/api/chat";

export async function askGemini(prompt, systemPrompt = "") {
  try {
    const res = await fetch(BACKEND_URL, {
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
