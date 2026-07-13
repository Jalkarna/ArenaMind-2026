import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environmental variables
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '127.0.0.1';

// Verify Key Presence (CWE-200 / Fail-safe)
if (!OPENROUTER_API_KEY) {
  console.error('[Critical Security] OPENROUTER_API_KEY is not defined in environment variables. Server aborting.');
  process.exit(1);
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
  
  if (!query) {
    return res.status(400).json({ error: 'Query is required.' });
  }

  const systemPrompt = getSystemPrompt(context.role || 'fan', context);
  const userLang = context.language || 'en';

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://127.0.0.1:5173',
        'X-Title': 'ArenaMind 2026 Stadium Operations'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat', // DeepSeek V3/V4 on OpenRouter
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        temperature: 0.2,
        max_tokens: 300
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'OpenRouter API failed');
    }

    const answer = data.choices[0].message.content.trim();
    
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
    res.status(500).json({ error: 'Failed to fetch response from StadiuMind core AI.' });
  }
});

/**
 * Endpoint 2: Incident Triage
 */
app.post('/api/triage', async (req, res) => {
  const { category, location, description } = req.body;

  if (!description) {
    return res.status(400).json({ error: 'Description is required.' });
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
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://127.0.0.1:5173'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages: [{ role: 'user', content: triagePrompt }],
        temperature: 0.1,
        max_tokens: 150
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'OpenRouter API failed');
    }

    const content = data.choices[0].message.content.trim();
    // Strip markdown formatting if AI returned backticks
    const cleanContent = content.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    const result = JSON.parse(cleanContent);

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
  const { text, targetLangs } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required.' });
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
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://127.0.0.1:5173'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages: [{ role: 'user', content: translatePrompt }],
        temperature: 0.1,
        max_tokens: 250
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'OpenRouter API failed');
    }

    const content = data.choices[0].message.content.trim();
    const cleanContent = content.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    const translations = JSON.parse(cleanContent);

    res.json({
      translations: {
        en: text,
        ...translations
      }
    });
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
