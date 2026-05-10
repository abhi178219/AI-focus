// ── Trading Brain · API helpers ───────────────────────────────────
// Wraps FastAPI backend: POST /signal/  /outcome/  /analyse/  GET /brain/

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`)
  return res.json()
}

/** Ask Claude for a trade signal */
export function askClaude(payload) {
  return post('/signal/', payload)
}

/** Log the outcome of a completed trade */
export function logOutcome(payload) {
  return post('/outcome/', payload)
}

/** Trigger / deploy the daily analysis */
export function runAnalysis(market, deploy = false, date) {
  return post('/analyse/', { market, deploy, date })
}

/** Get the current brain status (rules count, etc.) */
export async function getBrainStatus() {
  const res = await fetch(`${BASE}/brain/`)
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}
