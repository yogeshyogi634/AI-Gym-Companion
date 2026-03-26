import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  try {
    const { systemInstruction, prompt } = req.body;
    
    const requestBody = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { 
        maxOutputTokens: 8192,
        responseMimeType: "application/json"
      }
    };

    if (systemInstruction) {
      requestBody.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    // Fallback list of models to try in case of 503 (High Demand) or 404 (Not Found)
    const modelsToTry = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-flash-latest",
      "gemini-2.5-pro",
    ];

    let lastErrorData = null;
    let lastStatus = 500;

    for (const model of modelsToTry) {
      const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

      try {
        const response = await fetch(GEMINI_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        const data = await response.json();
        
        // If successful, return the data immediately
        if (response.ok) {
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
          return res.json({ text, usedModel: model });
        }
        
        // Save the error to return if all models fail
        lastErrorData = data;
        lastStatus = response.status;
        console.warn(`[API] Model ${model} failed (${lastStatus}):`, data?.error?.message);

        // Don't retry if the error is due to an invalid API key
        if (lastStatus === 400 && data?.error?.details?.[0]?.reason === "API_KEY_INVALID") {
          break;
        }
        // Otherwise, it's 503 or 404, loop continues to the next model
      } catch (fetchErr) {
        console.warn(`[API] Fetch error for model ${model}:`, fetchErr.message);
      }
    }

    // If all models failed, send the last error encountered
    return res.status(lastStatus).json(lastErrorData || { error: "All fallback models failed." });

  } catch (error) {
    console.error("API proxy error:", error);
    res.status(500).json({ error: "Internal server error connecting to Gemini API" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
