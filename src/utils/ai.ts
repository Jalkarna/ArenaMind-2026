import type { GateInfo, TransitInfo, IncidentReport } from './mockData';
import { sanitizeInput } from './security';

export interface AIContext {
  role: 'fan' | 'operator';
  language: string;
  ticketId?: string;
  seatSection?: string;
  activeIncidents?: IncidentReport[];
  gates?: GateInfo[];
  transit?: TransitInfo[];
}

export interface AIResponse {
  answer: string;
  suggestedActions?: { label: string; actionId: string; payload?: any }[];
  detectedIntent?: string;
  confidenceScore: number;
}

export const LOCALIZED_STRINGS: Record<string, Record<string, string>> = {
  en: {
    welcome: "Welcome to ArenaMind 2026. How can I assist you today?",
    gateRecommend: "We recommend entering through Gate E or Gate A. Avoid Gate C & D due to crowd delays.",
    incidentTriage: "AI Incident Command: Incident categorized and action dispatched.",
    askPlaceholder: "Ask about gates, food, transit, accessibility, or operations...",
  },
  es: {
    welcome: "Bienvenido a ArenaMind 2026. ¿Cómo puedo ayudarte hoy?",
    gateRecommend: "Recomendamos ingresar por la Puerta E o la Puerta A. Evite las Puertas C y D debido a las demoras por la multitud.",
    incidentTriage: "Comando de Incidentes de IA: Incidente categorizado y acción enviada.",
    askPlaceholder: "Pregunte sobre puertas, comida, tránsito, accesibilidad u operaciones...",
  },
  fr: {
    welcome: "Bienvenue à ArenaMind 2026. Comment puis-je vous aider aujourd'hui?",
    gateRecommend: "Nous vous conseillons d'entrer par la Porte E ou la Porte A. Évitez les Portes C et D en raison de l'affluence.",
    incidentTriage: "Commandement des Incidents IA: Incident catégorisé et action répartie.",
    askPlaceholder: "Demandez des infos sur les portes, la nourriture, les transports, l'accessibilité...",
  },
  ar: {
    welcome: "مرحباً بكم في ArenaMind 2026. كيف يمكنني مساعدتك اليوم؟",
    gateRecommend: "ننصح بالدخول عبر البوابة E أو البوابة A. تجنب البوابتين C و D بسبب الازدحام.",
    incidentTriage: "نظام إدارة الحوادث الذكي: تم تصنيف الحادث وتوزيع المهام.",
    askPlaceholder: "اسأل عن البوابات، المطاعم، المواصلات، ذوي الاحتياجات الخاصة...",
  }
};

export async function askArenaMindAI(query: string, context: AIContext): Promise<AIResponse> {
  await new Promise((resolve) => setTimeout(resolve, 350));

  const cleanQuery = sanitizeInput(query.toLowerCase().trim());
  const lang = context.language.toLowerCase();
  
  if (context.role === 'fan') {
    return handleFanQuery(cleanQuery, lang, context);
  } else {
    return handleOperatorQuery(cleanQuery, lang, context);
  }
}

function handleFanQuery(query: string, lang: string, context: AIContext): AIResponse {
  const seatText = context.seatSection ? `near your seat in **${context.seatSection}**` : "inside the stadium";

  if (query.includes('wheelchair') || query.includes('accessible') || query.includes('disabled') || query.includes('elevator') || query.includes('discapacidad')) {
    if (lang === 'es') {
      return {
        answer: `La **Puerta E (Acceso Oeste)** está totalmente equipada para sillas de ruedas y cuenta con ascensores directos a los niveles de palcos y tribunas superiores. Cerca de tu sección hay baños accesibles en el Concourse Oeste. ¿Te gustaría ver la ruta de navegación accesible en el mapa?`,
        suggestedActions: [
          { label: 'Mostrar ruta accesible', actionId: 'toggle-map-layer', payload: 'accessibility' },
          { label: 'Solicitar asistencia física', actionId: 'request-assist' }
        ],
        detectedIntent: 'accessibility_info',
        confidenceScore: 0.98
      };
    }
    return {
      answer: `**Gate E (West Entry)** is fully wheelchair accessible with direct elevators to suite levels and upper decks. Near your section, wheelchair-accessible restrooms are located on the West Concourse. Would you like to view the accessible route overlay on the interactive map?`,
      suggestedActions: [
        { label: 'Show Accessible Routes', actionId: 'toggle-map-layer', payload: 'accessibility' },
        { label: 'Request Volunteer Escort', actionId: 'request-assist' }
      ],
      detectedIntent: 'accessibility_info',
      confidenceScore: 0.98
    };
  }

  if (query.includes('gate') || query.includes('entrance') || query.includes('puerta') || query.includes('entrar') || query.includes('queue')) {
    const crowdedGates = context.gates?.filter(g => g.currentLoad > 75).map(g => g.name).join(', ') || 'Gate C and D';
    const clearGates = context.gates?.filter(g => g.status === 'Open' && g.currentLoad < 50).map(g => g.name).join(' and ') || 'Gate A and E';
    
    if (lang === 'es') {
      return {
        answer: `Actualmente, **${crowdedGates}** registran un alto nivel de congestión (esperas de 35-45 min). Le aconsejamos ingresar por **${clearGates}**, donde el tiempo de espera es inferior a 8 minutos.`,
        suggestedActions: [
          { label: 'Ver puertas en el mapa', actionId: 'toggle-map-layer', payload: 'gates' },
          { label: 'Buscar transporte alternativo', actionId: 'navigate-transit' }
        ],
        detectedIntent: 'gate_status',
        confidenceScore: 0.95
      };
    }
    return {
      answer: `Currently, **${crowdedGates}** are experiencing heavy crowd congestion with wait times upwards of 35-45 mins. We highly recommend using **${clearGates}**, where wait times are currently under 8 minutes.`,
      suggestedActions: [
        { label: 'View Gates on Map', actionId: 'toggle-map-layer', payload: 'gates' },
        { label: 'Navigate to Free Gates', actionId: 'navigate-transit' }
      ],
      detectedIntent: 'gate_status',
      confidenceScore: 0.95
    };
  }

  if (query.includes('metro') || query.includes('bus') || query.includes('transit') || query.includes('parking') || query.includes('estacionamiento') || query.includes('shuttle')) {
    if (lang === 'es') {
      return {
        answer: `El servicio de metro **Línea 6 Express** está extremadamente congestionado. Te recomendamos abordar la **Línea 2 Local** (con un intervalo de 5 min) o usar el **Shuttle del Estacionamiento S1** desde el sector Oeste. Los estacionamientos A y B están completos, pero quedan lugares en el Estacionamiento C de accesibilidad.`,
        suggestedActions: [
          { label: 'Ver horarios de transporte', actionId: 'show-transit' },
          { label: 'Dirección al Shuttle S1', actionId: 'toggle-map-layer', payload: 'transit' }
        ],
        detectedIntent: 'transit_recommendation',
        confidenceScore: 0.97
      };
    }
    return {
      answer: `The **Line 6 Express Metro** is currently crowded. We recommend taking the **Line 2 Local** (5-minute headway) or using the **Parking Shuttle S1** from the West sector. Parking Zones A & B are fully occupied, while Parking Zone C has 32 accessibility spaces remaining.`,
      suggestedActions: [
        { label: 'View Transit Timetables', actionId: 'show-transit' },
        { label: 'Route to Shuttle S1', actionId: 'toggle-map-layer', payload: 'transit' }
      ],
      detectedIntent: 'transit_recommendation',
      confidenceScore: 0.97
    };
  }

  if (query.includes('food') || query.includes('concession') || query.includes('eat') || query.includes('drink') || query.includes('beer') || query.includes('water') || query.includes('comida') || query.includes('comer') || query.includes('hamburguesa')) {
    if (lang === 'es') {
      return {
        answer: `Hay múltiples opciones gastronómicas ${seatText}. El **North Concourse Grill** tiene hamburguesas y opciones vegetarianas sin fila. Los puestos de comida locales en el West Concourse aceptan pago con tarjeta y móvil.`,
        suggestedActions: [
          { label: 'Ver comida en el mapa', actionId: 'toggle-map-layer', payload: 'concessions' },
          { label: 'Ver opciones veganas/sin gluten', actionId: 'filter-food' }
        ],
        detectedIntent: 'food_location',
        confidenceScore: 0.92
      };
    }
    return {
      answer: `There are multiple concession stands ${seatText}. The **North Concourse Grill** serves burgers and vegan options with virtually no waiting queue. Local food stalls on the West Concourse support digital payments and mobile ordering.`,
      suggestedActions: [
        { label: 'View Concessions on Map', actionId: 'toggle-map-layer', payload: 'concessions' },
        { label: 'Filter Vegan / Gluten-free', actionId: 'filter-food' }
      ],
      detectedIntent: 'food_location',
      confidenceScore: 0.92
    };
  }

  if (query.includes('recycle') || query.includes('sustainability') || query.includes('green') || query.includes('carbon') || query.includes('reciclar')) {
    if (lang === 'es') {
      return {
        answer: `¡Ayúdanos a mantener el Mundial 2026 verde! Por cada vaso o botella que recicles en los contenedores inteligentes ArenaMind, ahorras **0.5 kg de CO2** y sumas **50 puntos** para canjear por cupones de descuento del 15% en mercancía oficial.`,
        suggestedActions: [
          { label: 'Escanear depósito', actionId: 'scan-sustainability' },
          { label: 'Ver mi puntaje de carbono', actionId: 'sustainability-panel' }
        ],
        detectedIntent: 'sustainability_info',
        confidenceScore: 0.99
      };
    }
    return {
      answer: `Help us keep the 2026 World Cup green! For every cup or bottle you recycle in ArenaMind Smart Bins, you offset **0.5 kg of CO2** and receive **50 Eco-Points**, redeemable for 15% off discount codes at the official stadium merchandise store.`,
      suggestedActions: [
        { label: 'Scan Bin QR Code', actionId: 'scan-sustainability' },
        { label: 'View Carbon Leaderboard', actionId: 'sustainability-panel' }
      ],
      detectedIntent: 'sustainability_info',
      confidenceScore: 0.99
    };
  }

  if (lang === 'es') {
    return {
      answer: `Lo siento, no he entendido del todo tu pregunta sobre "${query}". Puedo darte información en tiempo real sobre accesos, transporte, baños accesibles, recarga de botellas, reciclaje ecológico y comida cerca de tu asiento.`,
      detectedIntent: 'fallback',
      confidenceScore: 0.5
    };
  }
  return {
    answer: `I apologize, I didn't fully capture your question about "${query}". I can provide real-time updates regarding gate occupancy, transit timetables, accessible facilities, recycling, concessions, and medical bays.`,
    detectedIntent: 'fallback',
    confidenceScore: 0.5
  };
}

function handleOperatorQuery(query: string, lang: string, context: AIContext): AIResponse {
  if (query.includes('summary') || query.includes('ops') || query.includes('report') || query.includes('status') || query.includes('resumen') || query.includes('estado')) {
    const openIncidents = context.activeIncidents?.filter(i => i.status !== 'Resolved').length || 0;
    const criticalIncidents = context.activeIncidents?.filter(i => i.severity === 'CRITICAL' && i.status !== 'Resolved').length || 0;
    const slowGatesCount = context.gates?.filter(g => g.currentLoad > 70).length || 0;
    
    let answerText = `### AI Operational Intelligence Brief (FIFA 2026 StadiuMind)
- **Active Incidents**: **${openIncidents}** active (${criticalIncidents} critical - Medical Unit dispatched to Sec 212).
- **Gate Bottlenecks**: **${slowGatesCount}** gates are heavily loaded. **Gate C** and **Gate D** exceed 80% capacity with wait times around 35-45 minutes.
- **Transit Update**: Metro Line 6 Express is crowded. Transit operations should divert outbound fans to Line 2 Local.

**Recommended Actions:**
1. **Divert Gates**: Broadcast app notification to incoming fans suggesting **Gate A** and **Gate E** (current wait time < 8m).
2. **Medical Alert**: Confirm security clearance for Medical Unit 3 arriving at Section 212.
3. **Dispatch Staff**: Assign unallocated staff to Gate D to assist with manual ticket validation.`;

    if (lang === 'es') {
      answerText = `### Resumen Operativo de Inteligencia Artificial (FIFA 2026)
- **Incidentes Activos**: **${openIncidents}** activos (${criticalIncidents} críticos - Unidad Médica desplegada en Sec 212).
- **Cuellos de Botella**: **${slowGatesCount}** puertas congestionadas. **Puertas C y D** superan el 80% de capacidad con esperas de 35-45 minutos.
- **Estado de Transporte**: Metro Línea 6 Express al límite. Se aconseja desviar fans hacia la Línea 2 Local.

**Acciones Recomendadas por la IA:**
1. **Desviar Puertas**: Enviar alerta a usuarios recomendando ingresar por **Puerta A** o **Puerta E** (esperas < 8m).
2. **Emergencia Médica**: Confirmar escolta de seguridad para la Unidad Médica 3 en camino a la Sección 212.
3. **Personal de Refuerzo**: Asignar operarios libres a la Puerta D para agilizar validación manual de boletos.`;
    }

    return {
      answer: answerText,
      suggestedActions: [
        { label: 'Broadcast Gate Bypass Alert', actionId: 'broadcast-bypass' },
        { label: 'Dispatch Extra Gate Staff', actionId: 'dispatch-gate-staff' }
      ],
      detectedIntent: 'ops_summary',
      confidenceScore: 0.99
    };
  }

  if (query.includes('incident') || query.includes('report') || query.includes('reportar') || query.includes('suceso')) {
    return {
      answer: `### AI Incident Triage Engine
Please use the Incident Report Form on the left menu to file an incident. Once filed:
1. **GenAI** will auto-classify severity (CRITICAL, MAJOR, MINOR).
2. The system will suggest specific tactical instructions.
3. A task will be automatically populated in the Staff Dispatcher board to delegate task to available volunteers or security personnel.`,
      detectedIntent: 'incident_help',
      confidenceScore: 0.90
    };
  }

  return {
    answer: `Operations Command Assistant active. You can request an operational summary (say 'summary' or 'ops status'), check transit statuses, or query dispatch rules.`,
    detectedIntent: 'fallback_ops',
    confidenceScore: 0.5
  };
}
