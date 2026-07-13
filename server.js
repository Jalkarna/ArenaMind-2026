import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environmental variables
dotenv.config();

const app = express();
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '127.0.0.1';
const ALLOWED_ORIGIN = process.env.APP_ORIGIN || 'http://127.0.0.1:5173';
const REQUEST_TIMEOUT_MS = 8_000;
const requestCounts = new Map();

app.disable('x-powered-by');
app.use(cors({ origin: ALLOWED_ORIGIN, methods: ['GET', 'POST'] }));
app.use(express.json({ limit: '16kb', strict: true }));
app.use((req, res, next) => {
  res.set({
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Cache-Control': 'no-store',
  });
  next();
});
app.use('/api', (req, res, next) => {
  const now = Date.now();
  const key = req.ip || 'local';
  const current = requestCounts.get(key) || { count: 0, resetAt: now + 60_000 };
  const bucket = now > current.resetAt ? { count: 0, resetAt: now + 60_000 } : current;
  bucket.count += 1;
  requestCounts.set(key, bucket);
  if (bucket.count > 60) return res.status(429).json({ error: 'Request limit reached. Retry in one minute.' });
  next();
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', provider: OPENROUTER_API_KEY ? 'configured' : 'offline-fallback' });
});

app.use('/api', (_req, res, next) => {
  if (!OPENROUTER_API_KEY) {
    return res.status(503).json({ error: 'Hosted AI is not configured. Use the deterministic offline engine.' });
  }
  next();
});

function isText(value, maxLength) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
}

async function callModel(messages, { maxTokens, temperature }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': ALLOWED_ORIGIN,
        'X-Title': 'ArenaMind 2026 Stadium Operations',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat',
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });
    const data = await response.json();
    if (!response.ok || !isText(data?.choices?.[0]?.message?.content, 10_000)) {
      throw new Error(data?.error?.message || 'AI provider returned an invalid response');
    }
    return data.choices[0].message.content.trim();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * System prompt helper to give the DeepSeek model the stadium logistics context
 */
function getSystemPrompt(role, context) {
  const gatesInfo = context.gates?.map(g => `${g.name}: status=${g.status}, load=${g.currentLoad}%, wait=${g.avgWaitMinutes}m`).join('; ') || 'No gate details available.';
  const transitInfo = context.transit?.map(t => `${t.type} ${t.route}: status=${t.status}, wait=${t.waitMinutes}m`).join('; ') || 'No transit details available.';
  const incidentsInfo = context.activeIncidents?.map(i => `[${i.severity}] ${i.location}: ${i.description} (status=${i.status})`).join('; ') || 'No incidents active.';

  if (role === 'operator') {
    return `You are ArenaMind 2026, the FIFA World Cup Stadium Operations AI Coordinator.
You are assisting stadium venue managers and organizers.
Current Stadium Status:
- Gates Load: ${gatesInfo}
- Transit Status: ${transitInfo}
- Active Incidents: ${incidentsInfo}

Provide a concise, direct operational summary or response. Address resources allocation, volunteer dispatches, and emergency alerts. Keep your answers technical, factual, and brief.`;
  }

  return `You are ArenaMind 2026, the interactive FIFA World Cup Stadium Fan Assistant.
You are helping fans and visitors navigate the stadium safely and efficiently.
Current Stadium Status:
- Gates Load: ${gatesInfo}
- Transit Status: ${transitInfo}
- Active Incidents: ${incidentsInfo}

Provide a friendly, helpful, and concise response in the appropriate language (e.g. Spanish, French, English, or Arabic).
Focus on:
- Recommending open/low-wait gates (Gate E is wheelchair friendly, Gate A/E have low wait times).
- Outbound transit alternatives (recommend Metro Line 2 or Shuttle S1; warn about crowded Line 6 Metro).
- Sustainability recycling depots (recycled cups earn 50 Eco-Points and offset 0.5kg CO2).
- Wheelchair accessibility routes and facilities.
Keep answers under 3-4 sentences. Do not mention system details.`;
}

/**
 * Endpoint 1: Chat Assistant
 */
app.post('/api/chat', async (req, res) => {
  const { query, context } = req.body;
  
  if (!isText(query, 500) || !context || typeof context !== 'object') {
    return res.status(400).json({ error: 'A query up to 500 characters and venue context are required.' });
  }

  const systemPrompt = getSystemPrompt(context.role || 'fan', context);
  try {
    const answer = await callModel([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query.trim() },
    ], { temperature: 0.2, maxTokens: 300 });
    
    // Formulate suggested actions dynamically based on text analysis
    const lowerAns = answer.toLowerCase();
    const suggestedActions = [];
    
    if (lowerAns.includes('gate') || lowerAns.includes('puerta') || lowerAns.includes('porte')) {
      suggestedActions.push({ label: 'View Gates Map', actionId: 'toggle-map-layer', payload: 'gates' });
    }
    if (lowerAns.includes('wheelchair') || lowerAns.includes('accessible') || lowerAns.includes('discapacidad')) {
      suggestedActions.push({ label: 'Show Accessible Routes', actionId: 'toggle-map-layer', payload: 'accessibility' });
    }
    if (lowerAns.includes('recycle') || lowerAns.includes('sustainability') || lowerAns.includes('reciclar')) {
      suggestedActions.push({ label: 'Open Carbon Hub', actionId: 'sustainability-panel' });
    }
    if (lowerAns.includes('metro') || lowerAns.includes('shuttle') || lowerAns.includes('transit')) {
      suggestedActions.push({ label: 'Show Transit Map', actionId: 'toggle-map-layer', payload: 'transit' });
    }

    res.json({
      answer,
      suggestedActions,
      detectedIntent: 'general_assistant',
      confidenceScore: 0.95
    });
  } catch (error) {
    console.error('[API Error] Chat proxy failed:', error.message);
    res.status(502).json({ error: 'Hosted AI did not return a valid response.' });
  }
});

/**
 * Endpoint 2: Incident Triage
 */
app.post('/api/triage', async (req, res) => {
  const { category, location, description } = req.body;

  if (!isText(description, 250) || !isText(category, 40) || !isText(location, 120)) {
    return res.status(400).json({ error: 'Valid category, location, and description fields are required.' });
  }

  const triagePrompt = `You are a Stadium Incident Triage Bot.
Analyze the following incident:
- Category: ${category}
- Location: ${location}
- Description: ${description}

Respond in STRICT JSON format with exactly three fields:
1. "severity": must be either "CRITICAL", "MAJOR", or "MINOR"
2. "recommendedAction": a one-sentence tactical instruction for staff
3. "taskTitle": a short dispatcher task title (e.g. "Clean spill at Sec 104" or "CRITICAL: Deploy EMS to Gate A")

JSON output only. No wrapper markdown backticks.`;

  try {
    const content = await callModel([{ role: 'user', content: triagePrompt }], { temperature: 0.1, maxTokens: 150 });
    // Strip markdown formatting if AI returned backticks
    const cleanContent = content.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    const result = JSON.parse(cleanContent);

    if (!['CRITICAL', 'MAJOR', 'MINOR'].includes(result.severity) ||
        !isText(result.recommendedAction, 500) || !isText(result.taskTitle, 160)) {
      throw new Error('Triage response did not match the required schema');
    }

    res.json(result);
  } catch (error) {
    console.error('[API Error] Triage proxy failed:', error.message);
    
    // Safe Fallback Rule
    res.json({
      severity: 'MAJOR',
      recommendedAction: 'Verify area immediately and contact near staff.',
      taskTitle: `Inspect ${category} at ${location.split(' ')[0]}`
    });
  }
});

/**
 * Endpoint 3: Emergency Broadcast Translator
 */
app.post('/api/broadcast', async (req, res) => {
  const { text, targetLangs = ['es', 'fr', 'ar'] } = req.body;

  if (!isText(text, 300) || !Array.isArray(targetLangs) ||
      targetLangs.some(lang => !['es', 'fr', 'ar'].includes(lang))) {
    return res.status(400).json({ error: 'Text up to 300 characters and supported target languages are required.' });
  }

  const translatePrompt = `You are a translation bot for a sports stadium.
Translate the following emergency notice:
"${text}"

Translate it into the following languages:
- Spanish (es)
- French (fr)
- Arabic (ar)

Respond in STRICT JSON format:
{
  "es": "Spanish translation",
  "fr": "French translation",
  "ar": "Arabic translation"
}
JSON output only. No markdown wrappers.`;

  try {
    const content = await callModel([{ role: 'user', content: translatePrompt }], { temperature: 0.1, maxTokens: 250 });
    const cleanContent = content.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    const translations = JSON.parse(cleanContent);

    const selectedTranslations = Object.fromEntries(
      targetLangs.map(lang => [lang, translations[lang]]).filter(([, value]) => isText(value, 1_000)),
    );
    if (Object.keys(selectedTranslations).length !== targetLangs.length) {
      throw new Error('Translation response did not match requested languages');
    }
    res.json({ translations: { en: text, ...selectedTranslations } });
  } catch (error) {
    console.error('[API Error] Broadcast translator failed:', error.message);
    res.json({
      translations: {
        en: text,
        es: `ALERTA: ${text} (Traducción fallida)`,
        fr: `ALERTE: ${text} (Traduction échouée)`,
        ar: `تنبيه: ${text}`
      }
    });
  }
});

app.listen(PORT, HOST, () => {
  console.log(`[Security System] BFF Server listening securely on http://${HOST}:${PORT}`);
});
