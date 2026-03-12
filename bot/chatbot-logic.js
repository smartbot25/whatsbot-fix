
/**
 * WhatsBot-Fix — Cerebro del Bot
 * Lógica de respuestas: reglas + Gemini IA
 */

const BOT_CONFIG = require('../config/bot-config');

// ─── Estado de sesiones en memoria ───────────────────────────
// (En producción con Supabase se persiste en BD)
const sessions = new Map();

function getSession(phone) {
  if (!sessions.has(phone)) {
    sessions.set(phone, {
      phone,
      step: 'idle',         // idle | collecting_name | collecting_query | done
      name: null,
      query: null,
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

// ─── Procesador principal ────────────────────────────────────
async function processMessage(phoneFrom, messageText, messageType = 'text') {
  const msg     = (messageText || '').toLowerCase().trim();
  const session = getSession(phoneFrom);
  const biz     = BOT_CONFIG.business;

  console.log(`[Bot] De: ${phoneFrom} | Msg: "${messageText}" | Step: ${session.step}`);

  // Mensajes no-texto (imagen, audio, etc.)
  if (messageType !== 'text') {
    return buildResponse([
      `Recibí tu ${messageType === 'image' ? 'imagen 📷' : messageType === 'audio' ? 'audio 🎙️' : 'archivo'}.`,
      `Por ahora solo proceso texto. ¿En qué te puedo ayudar? 😊`,
    ]);
  }

  // ─── Flujo de captura de datos ───────────────────────────
  if (session.step === 'collecting_name') {
    updateSession(phoneFrom, { name: messageText, step: 'collecting_query' });
    return buildResponse([
      `¡Mucho gusto, *${messageText}*! 😊`,
      `¿Cuál es tu consulta o en qué te puedo ayudar?`,
    ]);
  }

  if (session.step === 'collecting_query') {
    updateSession(phoneFrom, { query: messageText, step: 'done' });
    const name = session.name || 'cliente';
    // Aquí guardar lead en Supabase (manejado en webhook.js)
    return {
      type:    'lead_captured',
      name:    session.name,
      phone:   phoneFrom,
      query:   messageText,
      message: buildResponse([
        `✅ ¡Listo, *${name}*!`,
        `Un asesor de *${biz.name}* se comunicará contigo pronto al *${phoneFrom}* para atender tu consulta.`,
        ``,
        `¿Hay algo más en que pueda ayudarte?`,
      ]).message,
    };
  }

  // ─── Saludos ─────────────────────────────────────────────
  if (/^(hola|buenos|buenas|hi|hey|saludos|ola|buen\s?d[ií]a|buen\s?tarde|buen\s?noch)/.test(msg)) {
    updateSession(phoneFrom, { step: 'idle' });
    const greeting = biz.greeting.replace('{business}', biz.name);
    return buildResponse([
      greeting,
      ``,
      `Puedes preguntarme sobre:`,
      `📋 *Servicios* que ofrecemos`,
      `⏰ *Horarios* de atención`,
      `📍 *Ubicación* y cómo llegar`,
      `💰 *Precios* y presupuestos`,
      `👤 *Hablar con un asesor*`,
    ]);
  }

  // ─── Horarios ────────────────────────────────────────────
  if (/hora|horario|abierto|cuando atiend|atiend|disponib/.test(msg)) {
    return buildResponse([
      `⏰ *Horario de atención de ${biz.name}:*`,
      ``,
      biz.hours,
      ``,
      `¿Hay algo más en que te pueda ayudar?`,
    ]);
  }

  // ─── Ubicación ───────────────────────────────────────────
  if (/donde|ubic|direcci|c[oó]mo llegar|mapa|local/.test(msg)) {
    if (biz.address) {
      return buildResponse([
        `📍 *Nos encontramos en:*`,
        ``,
        biz.address,
        ``,
        `¿Necesitas algo más?`,
      ]);
    }
    return buildResponse([`📍 Contáctanos y te indicamos nuestra ubicación exacta.`]);
  }

  // ─── Teléfono / contacto ─────────────────────────────────
  if (/tel[eé]fono|llamar|contacto|celular|n[uú]mero|whatsapp/.test(msg)) {
    if (biz.phone) {
      return buildResponse([
        `📞 *Puedes contactarnos directamente al:*`,
        ``,
        `*${biz.phone}*`,
        ``,
        `¡Con gusto te atendemos!`,
      ]);
    }
    return buildResponse([`📞 Escríbenos aquí mismo y te atendemos de inmediato. 😊`]);
  }

  // ─── Servicios ───────────────────────────────────────────
  if (/servicio|ofrecen|qu[eé] hacen|qu[eé] venden|productos|men[uú]|carta/.test(msg)) {
    if (biz.services && biz.services.length > 0) {
      return buildResponse([
        `🎯 *Servicios de ${biz.name}:*`,
        ``,
        ...biz.services.map(s => `• ${s.trim()}`),
        ``,
        `¿Te interesa alguno en particular?`,
      ]);
    }
    return buildResponse([
      `Ofrecemos varios servicios. ¿Me puedes decir qué necesitas específicamente?`,
    ]);
  }

  // ─── Precios ─────────────────────────────────────────────
  if (/precio|costo|cu[aá]nto|vale|tarifa|cobran|presupuesto/.test(msg)) {
    return buildResponse([
      `💰 Los precios varían según el servicio.`,
      ``,
      `¿Quieres que un asesor te prepare un presupuesto personalizado?`,
      `Solo escribe *"quiero asesor"* y te contactamos. 😊`,
    ]);
  }

  // ─── Pedir asesor / humano ───────────────────────────────
  if (/asesor|persona|humano|agente|hablar con|atenci[oó]n|quiero asesor/.test(msg)) {
    updateSession(phoneFrom, { step: 'collecting_name' });
    return buildResponse([
      `¡Con mucho gusto! 😊`,
      `Para conectarte con un asesor de *${biz.name}*, necesito un dato rápido:`,
      ``,
      `¿Cuál es tu *nombre*?`,
    ]);
  }

  // ─── Gracias / despedida ─────────────────────────────────
  if (/gracias|muchas gracias|ok|listo|perfecto|chau|hasta luego|bye|adios/.test(msg)) {
    updateSession(phoneFrom, { step: 'idle' });
    return buildResponse([
      `¡De nada! 😊 Fue un placer atenderte.`,
      `Recuerda que estamos disponibles ${biz.hours}.`,
      `¡Hasta pronto! 👋`,
    ]);
  }

  // ─── Sí / no ─────────────────────────────────────────────
  if (/^(s[ií]|no|claro|dale|por favor|ok|ninguno)$/.test(msg)) {
    if (msg === 'no' || msg === 'ninguno') {
      return buildResponse([`Entendido. Si necesitas algo más, aquí estaré. 😊`]);
    }
    // "sí" sin contexto → ofrecer asesor
    updateSession(phoneFrom, { step: 'collecting_name' });
    return buildResponse([`¡Perfecto! ¿Me puedes dar tu *nombre* para conectarte con un asesor?`]);
  }

  // ─── IA Gemini (si está configurada) ────────────────────
  if (BOT_CONFIG.ai.geminiKey) {
    try {
      const aiResponse = await callGemini(messageText, biz);
      if (aiResponse) return buildResponse([aiResponse]);
    } catch (e) {
      console.error('[Gemini] Error:', e.message);
    }
  }

  // ─── Respuesta genérica ──────────────────────────────────
  return buildResponse([
    `Entiendo tu mensaje. 😊`,
    ``,
    `Para darte la mejor atención, ¿me puedes decir qué necesitas?`,
    ``,
    `Escribe *"asesor"* si quieres hablar con alguien de nuestro equipo.`,
  ]);
}

// ─── Helper: construir respuesta ────────────────────────────
function buildResponse(lines) {
  return {
    type:    'text',
    message: lines.join('\n'),
  };
}

// ─── Gemini AI ───────────────────────────────────────────────
async function callGemini(userMessage, biz) {
  const fetch = require('node-fetch');

  const systemContext = `Eres el asistente virtual de WhatsApp de "${biz.name}".
Horario: ${biz.hours}.
Dirección: ${biz.address || 'No especificada'}.
Servicios: ${biz.services.join(', ') || 'varios servicios'}.
Responde en español, de forma amable y concisa (máximo 3 líneas).
Usa emojis con moderación. Si no sabes algo, sugiere hablar con un asesor.
NUNCA inventes precios ni información que no se te dio.`;

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
          temperature:     BOT_CONFIG.ai.temperature,
        },
      }),
    }
  );

  if (!response.ok) throw new Error(`Gemini HTTP ${response.status}`);
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

module.exports = { processMessage, getSession, updateSession };
