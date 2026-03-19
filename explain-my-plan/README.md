# Explain My Plan — AI Clarity & Structuring Tool

Transform vague ideas into clear, actionable plans using AI-powered analysis.

## Project Overview

**Explain My Plan** is a full-stack web application that helps organize unstructured thoughts and raw ideas into clear, structured plans. Users input a raw idea or plan in natural language, and the system uses AI to:

- **Structurize**: Extract goal, method, steps, and timeline
- **Identify Gaps**: Highlight missing elements (clarity, resources, timeline)
- **Simplify**: Generate a concise summary
- **Actionize**: Provide practical next steps
- **Score Clarity**: Assign a 0–100 clarity score with transparent breakdown

### Key Insight

Many people have ideas but struggle to structure them. This tool bridges the gap between raw thoughts and executable plans by leveraging AI to identify what's clear, what's missing, and what needs attention.

---

## Core Features

### 1. **Input Interface**
- Clean, distraction-free textarea for raw ideas
- Character count (max 1200)
- Keyboard shortcut: Ctrl/Cmd + Enter to analyze

### 2. **Structured Analysis**
Converts raw input into clear components:
- **Goal**: The primary objective extracted from input
- **Method/Approach**: The strategy or approach described
- **Identified Steps**: Steps implied or explicitly mentioned
- **Timeline**: Time horizon (or "Not specified")

### 3. **Missing Elements Detection**
Identifies gaps in the plan:
- Goal Clarity: Is the goal specific enough?
- Execution Steps: Are steps detailed and actionable?
- Resources: Are resource requirements identified?
- Timeline: Is a realistic timeline included?

### 4. **Simplified Version**
A single, clear sentence that distills the essence of the plan for easy communication.

### 5. **Actionable Next Steps**
4-5 practical, immediately actionable steps based on the structured plan.

### 6. **Clarity Score (0–100)**
Transparent scoring based on:
- **Goal Defined** (0–30): How specific and clear is the goal?
- **Steps Defined** (0–30): Are execution steps clear?
- **Timeline Present** (0–20): Is timeline specified?
- **Completeness** (0–20): Overall plan completeness

#### Scoring Logic
```
Total = Goal (0-30) + Steps (0-30) + Timeline (0-20) + Completeness (0-20)
```
- **75–100**: Clear, structured plan with good detail
- **45–74**: Decent structure but missing some elements
- **<45**: Vague; needs significant refinement

### 7. **Iteration Capability**
- Modify your input and re-analyze
- Watch your clarity score improve
- "Analyze Another Plan" button for quick reset

---

## Technical Stack

### Frontend
- **Framework**: React 19 with Vite
- **Styling**: CSS-in-JS (inline styles in App.jsx)
- **UI**: Clean, dark theme with accent colors
- **Interactivity**: Real-time character count, smooth animations

### Backend
- **Runtime**: Node.js with Express
- **API Pattern**: RESTful endpoint `/api/analyze`
- **AI Integration**: [Groq API](https://groq.com) with `llama3-8b-8192` model
- **Request Format**: Chat completion format (OpenAI-compatible)

### AI Prompt Design

The system prompt is carefully crafted to:
1. **Ensure consistent JSON output** (no markdown, no extra text)
2. **Define exact structure** for parsing predictability
3. **Include scoring rubric** in the prompt itself for consistency
4. **Encourage practical feedback** on missing elements

---

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Groq API key (free at [console.groq.com](https://console.groq.com))

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd explain-my-plan/explain-my-plan
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env` file**
   ```bash
   GROQ_API_KEY=your_groq_api_key_here
   PORT=3001
   ```

4. **Start the application**
   ```bash
   # Option A: Run both servers together
   npm start

   # Option B: Run separately
   npm run server    # Terminal 1 - starts backend on :3001
   npm run dev       # Terminal 2 - starts frontend on :5173
   ```

5. **Open in browser**
   ```
   http://localhost:5173
   ```

---

## How It Works

### Request Flow

```
User Input → Frontend → Backend API → Groq API → Parse JSON → Display Results
```

### API Endpoint: `POST /api/analyze`

**Request:**
```json
{
  "input": "I want to start a YouTube channel and earn money quickly"
}
```

**Response:**
```json
{
  "goal": "Start a YouTube channel and generate revenue",
  "method": "Create regular video content and monetize through ads/sponsorships",
  "steps": ["Choose a niche", "Set up channel", "Create content", "Optimize for growth"],
  "timeline": "3-6 months to first monetization",
  "missingElements": {
    "goalClarity": null,
    "executionSteps": "Need more detail on content calendar",
    "resources": "Equipment and software requirements not mentioned",
    "timeline": null
  },
  "simplifiedVersion": "Create niche YouTube content and monetize through ads within 3-6 months.",
  "actionableSteps": [
    "Choose 1-2 specific niches",
    "Research top competitors in your niche",
    "Plan first 10 video topics",
    "Purchase/setup recording equipment"
  ],
  "clarityScore": 65,
  "clarityBreakdown": {
    "goalDefined": 25,
    "stepsDefined": 18,
    "timelinePresent": 15,
    "completeness": 7
  },
  "clarityExplanation": "Good goal and timeline, but lacks detail on specific execution steps and required resources."
}
```

---

## Clarity Score Logic

### Why This Scoring System?

The scoring system balances **specificity** with **practicality**:

| Component | Points | Measures |
|---|---|---|
| Goal Defined | 0–30 | How specific and actionable? (e.g., "Make money" = 5/30, "Earn $1k/month from YouTube" = 25/30) |
| Steps Defined | 0–30 | Are steps clear and sequenced? (e.g., Vague = 5/30, Detailed roadmap = 28/30) |
| Timeline | 0–20 | Is timeline realistic and specific? ("Soon" = 0/20, "6 months" = 18/20) |
| Completeness | 0–20 | Are resources, risks, dependencies mentioned? |

### Example Scoring

**Input:** "I want to start a YouTube channel and earn money quickly"

```
Goal Clarity: 25/30       → Clear goal, but "quickly" is vague
Steps Defined: 18/30      → Some steps implied, but lacks detail
Timeline: 15/20           → Mentions urgency but not specific
Completeness: 7/20        → Missing resources, platform strategy
────────────────────
Total: 65/100
```

---

## Project Structure

```
explain-my-plan/
├── server.js                 # Backend: Express + Groq API integration
├── src/
│   ├── App.jsx              # Frontend: React component with inline CSS
│   ├── main.jsx             # Entry point
│   └── index.css             # Global styles
├── .env                      # API keys (create this)
├── package.json              # Dependencies
├── vite.config.js           # Vite configuration
└── README.md                 # This file
```

---

## Deployment

### Frontend Deployment (Vercel)

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variable:  
   ```
   VITE_API_URL=https://your-backend-url.com
   ```
4. Update `src/App.jsx` line 126:
   ```javascript
   const res = await fetch(`${import.meta.env.VITE_API_URL}/api/analyze`, {
   ```

### Backend Deployment (Render)

1. Create `Procfile`:
   ```
   web: node server.js
   ```

2. Push to GitHub

3. Connect to Render:
   - New → Web Service
   - Connect GitHub repo
   - Set Environment Variable:
     ```
     GROQ_API_KEY=your_key_here
     ```

4. Deploy and get backend URL

---

## Challenges & AI Prompting Approach (200 words)

**Challenges Faced:**

1. **API Provider Iterations**: Started with Anthropic (budget issues) → Gemini (model unavailability) → Groq (free + reliable). This taught me to abstract API calls for provider flexibility.

2. **JSON Parsing Reliability**: LLMs sometimes wrap JSON in markdown. Solution: Regex extraction with meaningful error fallbacks.

3. **CORS Blocking**: Initial frontend-to-API calls failed. Solution: Backend proxy pattern for security + compatibility.

4. **Prompt Consistency**: Early prompts generated valid but inconsistent JSON. Solution: Explicit schema specification in prompt.

**AI Prompting Approach:**

Used a **three-layer strategy**:

1. **Role Definition**: "You are a structured thinking assistant" sets context and expectations.

2. **Schema Embedding**: Exact JSON structure in the prompt ensures consistent parsing. Including field names, types, and examples reduces hallucinations.

3. **Rubric Integration**: Embedding scoring rules in the system prompt (not post-processing) ensures AI understands _why_ it's scoring, producing aligned results.

This approach prioritized **reliability over sophistication**—a simple, well-designed prompt beats complex chain-of-thought for this use case. The key insight: make the AI's job as clear as possible.
