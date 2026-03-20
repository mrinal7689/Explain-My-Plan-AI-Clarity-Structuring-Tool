# Explain My Plan - AI Clarity and Structuring Tool

Explain My Plan converts raw, messy ideas into structured action plans with a transparent clarity score. It is built as a full-stack app with React (frontend), Express (backend), Groq API (LLM), and MongoDB (auth and history).

## Project Overview

This project helps users move from vague thinking to execution-ready planning.

Key outcomes for each input:
- Goal extraction
- Method identification
- Step breakdown
- Timeline detection
- Missing-elements feedback
- Actionable next steps
- Clarity score with scoring explanation

## Setup Instructions

### Prerequisites

- Node.js 18+
- npm
- MongoDB Atlas connection string
- Groq API key

### 1. Clone and install

```bash
git clone <your-repo-url>
cd explain-my-plan/explain-my-plan
npm install
```

### 2. Configure environment

Create a `.env` file:

```env
GROQ_API_KEY=your_groq_api_key
MONGO_URI=your_mongodb_connection_string
MONGO_DB_NAME=explain_my_plan
JWT_SECRET=your_long_random_secret
PORT=3001
```

### 3. Run locally

```bash
# Terminal 1
npm run server

# Terminal 2
npm run dev
```

Frontend runs on `http://localhost:5173` and backend runs on `http://localhost:3001`.

## Prompt Design Explanation

The prompt is intentionally strict to keep outputs parseable and useful.

Prompt design layers:
1. Role layer: defines the assistant as a structured-thinking planner.
2. Output schema layer: forces JSON-only response with exact keys.
3. Evaluation rubric layer: embeds scoring criteria and constraints.
4. Tone layer: asks for practical, constructive feedback.

Why this works:
- Reduces hallucinated output formats.
- Improves consistency across multiple user inputs.
- Produces structured data directly usable by UI and database.

## Clarity Score Logic Explanation

The score is out of 100 and broken into four parts:

- Goal Defined: 0-30
- Steps Defined: 0-30
- Timeline Present: 0-20
- Completeness: 0-20

Formula:

```text
clarityScore = goalDefined + stepsDefined + timelinePresent + completeness
```

Interpretation bands:
- 75-100: strong clarity and execution readiness
- 45-74: partially clear, requires refinement
- 0-44: vague and missing key execution details

## Before vs After Comparison of Plan Clarity

Even without separate "before" screenshots, the app supports before-vs-after clarity comparison through iterative re-analysis.

Example:

| Stage | User Input Quality | Clarity Score | Result Quality |
|---|---|---:|---|
| Before | Vague idea, no timeline, weak steps | 38 | Generic and incomplete |
| After | Specific goal, clear steps, timeline, constraints | 81 | Actionable and structured |

How to demonstrate in submission:
1. Run one vague input and capture score/output.
2. Refine same plan using missing-elements feedback.
3. Re-run analysis and show score improvement.

## Export Functionality (PDF or Shareable Link)

Current status:
- Not fully implemented yet in this codebase.

Recommended implementation options:
1. PDF export: use browser print stylesheet or `jspdf` to export analysis cards.
2. Shareable links: store each saved plan by ID and expose a read-only route like `/share/:planId`.

Suggested API additions:
- `GET /api/plans/:id`
- `POST /api/plans/:id/share`

## Enhanced Prompt Layering or Multi-step Reasoning

Current implementation already uses layered prompting with schema constraints.

Next enhancement path:
1. Stage A: extraction pass for goal, timeline, and raw steps.
2. Stage B: critique pass for missing elements and weak assumptions.
3. Stage C: rewrite pass for actionable plan and final scoring.

Benefits:
- More stable scoring
- Better explanations
- Fewer contradictory outputs

## Thoughtful UI Improvements

Already present:
- Guided auth flow for account creation and login
- Real-time score card with breakdown bars
- Missing-elements cards for quick refinement
- Strong visual hierarchy for goal, method, timeline, and steps

High-impact next improvements:
1. Add a History panel showing previous analyses from MongoDB.
2. Add side-by-side compare mode for two iterations.
3. Add one-click "Improve this plan" prompt injection using missing-elements feedback.
4. Add export/share actions directly in the analysis header.

## Screenshots

Current screenshot assets:

![App Preview](<src/assets/Screenshot 2026-03-19 210934.png>)
![App Preview](<src/assets/Screenshot 2026-03-19 210950.png>)
![App Preview](<src/assets/Screenshot 2026-03-19 211015.png>)

If you add more screenshots with spaces in names, use URL-encoded paths in Markdown (replace each space with `%20`).

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Auth: JWT + bcryptjs
- AI: Groq Chat Completions API

## Deployment Notes

- Frontend: Vercel
- Backend: Render
- Required backend env vars in production:
  - `GROQ_API_KEY`
  - `MONGO_URI`
  - `MONGO_DB_NAME` (optional but recommended)
  - `JWT_SECRET`

If login shows `MongoDB not configured on server`, your backend host is missing `MONGO_URI`.
