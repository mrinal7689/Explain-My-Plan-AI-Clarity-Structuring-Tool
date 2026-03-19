import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const SYSTEM_PROMPT = `You are a structured thinking assistant. When a user gives you a raw idea or plan, analyze it and return ONLY a valid JSON object (no markdown, no code fences, no extra text) with this exact structure:

{
  "goal": "A clearly stated goal extracted from the input",
  "method": "The approach or method described or implied",
  "steps": ["step 1", "step 2", "step 3"],
  "timeline": "Timeline mentioned, or 'Not specified'",
  "missingElements": {
    "goalClarity": "feedback on goal clarity or null if fine",
    "executionSteps": "feedback on steps or null if fine",
    "resources": "feedback on resources or null if fine",
    "timeline": "feedback on timeline or null if fine"
  },
  "simplifiedVersion": "A single clear sentence summarizing the plan",
  "actionableSteps": ["actionable step 1", "actionable step 2", "actionable step 3", "actionable step 4"],
  "clarityScore": 72,
  "clarityBreakdown": {
    "goalDefined": 25,
    "stepsDefined": 20,
    "timelinePresent": 15,
    "completeness": 12
  },
  "clarityExplanation": "Brief explanation of the score"
}

Scoring rules (max 100):
- goalDefined: 0-30 (is the goal specific and clear?)
- stepsDefined: 0-30 (are steps defined or implied?)
- timelinePresent: 0-20 (is a timeline given?)
- completeness: 0-20 (how complete is the overall plan?)

Be honest, practical, and constructive. Always return valid JSON only.`;

async function callGroqAPI(userInput) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY environment variable not set");
  }

  const url = `https://api.groq.com/openai/v1/chat/completions`;

  const requestBody = {
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: userInput,
      },
    ],
    model: "llama-3.1-8b-instant",
    temperature: 0.7,
    max_tokens: 2000,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`API Error (${response.status}): ${result.error?.message || JSON.stringify(result)}`);
    }

    const content = result.choices?.[0]?.message?.content || "";
    if (!content) {
      throw new Error("No response text from Groq API");
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in response");
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    throw new Error(`Groq API error: ${error.message}`);
  }
}

app.post("/api/analyze", async (req, res) => {
  try {
    const { input } = req.body;

    if (!input || typeof input !== "string" || !input.trim()) {
      return res.status(400).json({ error: "Input is required" });
    }

    console.log("Processing input:", input.substring(0, 50) + "...");

    const result = await callGroqAPI(input);
    res.json(result);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: error.message || "Something went wrong" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✓ Backend server running on http://localhost:${PORT}`);
});
