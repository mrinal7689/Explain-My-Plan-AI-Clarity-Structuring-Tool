import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


// --- Mongo connection ---
const mongoUri = process.env.MONGO_URI;
let mongoReady = false;
if (!mongoUri) {
  console.warn("MONGO_URI not set – auth & history will be unavailable.");
} else {
  mongoose
    .connect(mongoUri, { dbName: process.env.MONGO_DB_NAME || "explain_my_plan" })
    .then(() => {
      mongoReady = true;
      console.log("✓ Connected to MongoDB");
    })
    .catch((err) => {
      mongoReady = false;
      console.error("MongoDB connection error:", err.message);
    });
}

// --- Mongo models ---
const userSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

const planSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rawInput: { type: String, required: true },
    structuredOutput: { type: Object, required: true },
    clarityScore: { type: Number, required: true },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
const Plan = mongoose.models.Plan || mongoose.model("Plan", planSchema);

// --- Auth helpers ---
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

function createToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// --- AI prompt ---
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
  if (!apiKey) throw new Error("GROQ_API_KEY environment variable not set");

  const url = "https://api.groq.com/openai/v1/chat/completions";
  const requestBody = {
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userInput },
    ],
    model: "llama-3.1-8b-instant",
    temperature: 0.7,
    max_tokens: 2000,
  };

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
  if (!content) throw new Error("No response text from Groq API");

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No valid JSON found in response");

  return JSON.parse(jsonMatch[0]);
}

// --- Auth routes ---
app.post("/api/auth/signup", async (req, res) => {
  try {
    if (!mongoUri) return res.status(500).json({ error: "MongoDB not configured on server" });
    if (!mongoReady) return res.status(503).json({ error: "MongoDB not reachable. Check Atlas IP whitelist/VPN." });

    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: "Account already exists. Please login." });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name: name || "", email, passwordHash });
    const token = createToken(user);

    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Signup error:", error.message);
    return res.status(500).json({ error: "Failed to create account" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    if (!mongoUri) return res.status(500).json({ error: "MongoDB not configured on server" });
    if (!mongoReady) return res.status(503).json({ error: "MongoDB not reachable. Check Atlas IP whitelist/VPN." });

    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = createToken(user);
    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ error: "Failed to login" });
  }
});

// --- Core analysis route (saves into MongoDB chat history) ---
app.post("/api/analyze", authMiddleware, async (req, res) => {
  try {
    const { input } = req.body;
    if (!input || typeof input !== "string" || !input.trim()) {
      return res.status(400).json({ error: "Input is required" });
    }

    const result = await callGroqAPI(input);

    if (mongoUri && req.user?.id && mongoReady) {
      try {
        await Plan.create({
          userId: req.user.id,
          rawInput: input,
          structuredOutput: result,
          clarityScore: result.clarityScore ?? 0,
        });
      } catch (err) {
        console.error("Failed to save plan:", err.message);
      }
    }

    return res.json(result);
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({ error: error.message || "Something went wrong" });
  }
});

// --- Recent chat history ---
app.get("/api/plans/recent", authMiddleware, async (req, res) => {
  try {
    if (!mongoUri) return res.json({ plans: [] });
    if (!mongoReady) return res.status(503).json({ error: "MongoDB not reachable. Check Atlas IP whitelist/VPN." });

    const plans = await Plan.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return res.json({
      plans: plans.map((p) => ({
        id: p._id,
        createdAt: p.createdAt,
        rawInput: p.rawInput,
        clarityScore: p.clarityScore,
        structuredOutput: p.structuredOutput,
      })),
    });
  } catch (error) {
    console.error("Fetch plans error:", error.message);
    return res.status(500).json({ error: "Failed to load previous plans" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✓ Backend server running on http://localhost:${PORT}`);
});

