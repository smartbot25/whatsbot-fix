/**
 * WhatsBot-Fix — El Cerebro de SmartBot Perú 🚀
 * Lógica de ventas: Reglas de Negocio + Inteligencia Artificial Gemini
 */

const BOT_CONFIG = require('../config/bot-config');

const sessions = new Map();

function getSession(phone) {
  if (!sessions.has(phone)) {
    sessions.set(phone, {
      phone,
      step: 'idle',
      name: null,
      businessType: null,
      messageCount: 0,
      firstContact: new Date().toISOString(),
      lastContact: new Date().toISOString(),
    });
  }
  const s = sessions.get(phone);
  s.lastContact = new Date().toISOString();
  s.messageCount++;
  return s;
}

function updateSession(phone, updates) {
  const s = getSession(phone);
  Object.assign(s, updates);
  sessions.set(phone, s);
}

// ─── PROCESADOR PRINCIPAL ────────────────────────────────────
async function processMessage(phoneFrom, messageText, messageType = 'text') {
  const msg = (messageText || '').toLowerCase().trim();
  const session = getSession(phoneFrom);
  const biz = BOT_CONFIG.business;

  console.log(`[SmartBot] De: ${phoneFrom} | Msg: "${messageText}" | Step: ${session.step}`);

  if (messageType !== 'text') {
    return buildResponse([
      `¡Hola! Recibí tu ${messageType === 'image' ? 'imagen 📷' : 'archivo'}.`,
      `Por ahora solo proceso texto para darte una mejor asesoría. ¿En qué puedo ayudarte?`,
    ]);
  }

  // ─── FLUJO DE CAPTURA DE LEADS (VENTAS) ──────────────────────
  if (session.step === 'collecting_name') {
    updateSession(phoneFrom, { name: messageText, step: 'collecting_biz' });
    return buildResponse([
      `¡Mucho gusto, *${messageText}*! 😊`,
      `Para darte una idea de cómo la IA puede ayudarte: ¿Qué tipo de negocio tienes o qué proyecto quieres automatizar? (Ej: Academia de Trading, Tienda, Inmobiliaria...)`,
    ]);
  }

  if (session.step === 'collecting_biz') {
    updateSession(phoneFrom, { businessType: messageText, step: 'done' });
    const name = session.name || 'emprendedor';
    
    // Este objeto dispara el guardado en Supabase en el webhook
    return {
      type: 'lead_captured',
      name: name,
      phone: phoneFrom,
      query: `Negocio: ${messageText}`,
      message: buildResponse([
        `✅ ¡Excelente, *${name}*!`,
        `He registrado tu interés en automatizar tu negocio de *${messageText}*.`,
        `Un consultor experto de *SmartBot Perú* revisará tu caso y te escribirá pronto para darte una propuesta.`,
        ``,
        `¿Deseas saber algo más sobre nuestros Bots o Dashboards mientras tanto?`,
      ]).message,
    };
  }

  // ─── SALUDOS E INICIO ────────────────────────────────────────
  if (/^(hola|buenos|buenas|hi|hey|saludos|inicio|empezar)/.test(msg)) {
    updateSession(phoneFrom, { step: 'idle' });
    return buildResponse([
      `¡Bienvenido a *SmartBot Perú*! 🤖🚀`,
      `Soy tu asistente virtual impulsado por Inteligencia Artificial.`,
      ``,
      `Te ayudo a escalar tu negocio con:`,
      `1️⃣ *Bots con IA:* Atención 24/7 que cierra ventas.`,
      `2️⃣ *Dashboards:* Paneles privados para ver tus leads.`,
      `3️⃣ *Trading:* Alertas y automatización de señales.`,
      ``,
      `¿De qué te gustaría recibir información hoy?`,
    ]);
  }

  // ─── SERVICIOS ESPECÍFICOS ──────────────────────────────────
  if (/trading|señales|mercado|cripto|bolsa/.test(msg)) {
    return buildResponse([
      `📈 *Automatización de Trading:*`,
      `Desarrollamos bots que envían señales en tiempo real a tus clientes y analizan el mercado usando IA.`,
      ``,
      `¿Te gustaría automatizar tu comunidad de trading? Escribe *"asesor"* para darte detalles.`,
    ]);
  }

  if (/dashboard|panel|ver leads|donde veo/.test(msg)) {
    return buildResponse([
      `💻 *Dashboards Profesionales:*`,
      `Todos tus contactos de WhatsApp se guardan automáticamente en un panel privado. ¡Nunca más pierdas un cliente en el chat!`,
      ``,
      `¿Quieres ver una demo del panel? Escribe *"asesor"*.`,
    ]);
  }

  // ─── PEDIR ASESOR (DISPARA CAPTURA) ──────────────────────────
  if (/asesor|persona|humano|quiero|informacion|info|contratar|demo/.test(msg)) {
    updateSession(phoneFrom, { step: 'collecting_name' });
    return buildResponse([
      `¡Genial! 🚀 Me encantaría conectarte con nuestro equipo.`,
      ``,
      `¿Cuál es tu *nombre*?`,
    ]);
  }

  // ─── IA GEMINI (Para todo lo demás) ─────────────────────────
  if (BOT_CONFIG.ai.geminiKey) {
    try {
      const aiResponse = await callGemini(messageText, biz);
      if (aiResponse) return buildResponse([aiResponse]);
    } catch (e) {
      console.error('[Gemini] Error:', e.message);
    }
  }

  return buildResponse([
    `Interesante... 😊 ¿Me podrías dar más detalles?`,
    ``,
    `O si prefieres hablar con un experto de *SmartBot Perú*, escribe *"asesor"*.`,
  ]);
}

function buildResponse(lines) {
  return { type: 'text', message: lines.join('\n') };
}

// ─── GEMINI IA: ENTRENAMIENTO DE VENTAS ───────────────────────
async function callGemini(userMessage, biz) {
  const fetch = require('node-fetch');

  // Aquí configuramos el "Cerebro" de ventas
  const systemContext = `Eres el asistente experto de "SmartBot Perú". 
Tu objetivo es vender soluciones de automatización con IA y WhatsApp.
Servicios: Bots inteligentes para negocios, Paneles de Leads (Dashboards) y Bots de Trading.
Personalidad: Profesional, innovador y muy servicial. 
REGLA DE ORO: Si el cliente parece interesado en comprar o quiere una demo, sugiérele escribir la palabra "asesor".
Responde en español, máximo 3 líneas. Usa emojis de tecnología (🚀, 🤖, 📈).`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${BOT_CONFIG.ai.model}:generateContent?key=${BOT_CONFIG.ai.geminiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${systemContext}\n\nCliente pregunta: ${userMessage}`,
          }],
        }],
        generationConfig: {
          maxOutputTokens: BOT_CONFIG.ai.maxTokens,
          temperature: 0.7, // Un poco de creatividad para vender mejor
        },
      }),
    }
  );

  if (!response.ok) throw new Error(`Gemini Error`);
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

module.exports = { processMessage, getSession, updateSession };