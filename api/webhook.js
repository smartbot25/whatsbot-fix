/**
 * WhatsBot-Fix — Webhook Principal
 * Netlify Function: /.netlify/functions/webhook
 *
 * Este archivo es el CORAZÓN del bot:
 * 1. Meta llama aquí cuando alguien te escribe en WhatsApp
 * 2. Procesamos el mensaje con el chatbot
 * 3. Respondemos automáticamente
 */

const BOT_CONFIG      = require('../../config/bot-config');
const { processMessage } = require('../../bot/chatbot-logic');
const { sendText, markAsRead } = require('../../bot/whatsapp-sender');
const { saveLead }    = require('../../bot/lead-manager');

exports.handler = async (event, context) => {
  const { httpMethod, queryStringParameters, body, headers } = event;

  // ─── GET: Verificación del Webhook (Meta lo llama 1 vez al configurar) ──
  if (httpMethod === 'GET') {
    return handleVerification(queryStringParameters);
  }

  // ─── POST: Mensaje entrante de WhatsApp ──────────────────
  if (httpMethod === 'POST') {
    return handleIncomingMessage(body, headers);
  }

  return { statusCode: 405, body: 'Method Not Allowed' };
};

// ─── Verificación del Webhook ────────────────────────────────
function handleVerification(params) {
  const mode      = params?.['hub.mode'];
  const token     = params?.['hub.verify_token'];
  const challenge = params?.['hub.challenge'];

  console.log(`[Webhook] Verificando: mode=${mode} token=${token}`);

  if (mode === 'subscribe' && token === BOT_CONFIG.meta.verifyToken) {
    console.log('[Webhook] ✅ Verificación exitosa');
    return {
      statusCode: 200,
      body:       challenge,
    };
  }

  console.error('[Webhook] ❌ Verificación fallida — revisa WEBHOOK_VERIFY_TOKEN');
  return {
    statusCode: 403,
    body:       'Forbidden: verify token mismatch',
  };
}

// ─── Procesar mensaje entrante ───────────────────────────────
async function handleIncomingMessage(rawBody, headers) {
  // Siempre responder 200 inmediatamente a Meta (evita reintentos)
  // Procesamos de forma async
  try {
    const payload = JSON.parse(rawBody || '{}');

    // Validar que es un mensaje de WhatsApp
    const entry   = payload?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value   = changes?.value;

    if (!value) {
      return { statusCode: 200, body: 'OK' };
    }

    // Ignorar status updates (delivered, read, etc.)
    if (value.statuses) {
      console.log('[Webhook] Status update — ignorando');
      return { statusCode: 200, body: 'OK' };
    }

    const messages = value.messages;
    if (!messages || messages.length === 0) {
      return { statusCode: 200, body: 'OK' };
    }

    // Procesar cada mensaje
    for (const msg of messages) {
      await processSingleMessage(msg, value);
    }

  } catch (e) {
    console.error('[Webhook] Error procesando payload:', e.message);
    // Siempre devolver 200 a Meta para evitar reintentos
  }

  return { statusCode: 200, body: 'OK' };
}

// ─── Procesar un mensaje individual ─────────────────────────
async function processSingleMessage(msg, value) {
  const fromPhone  = msg.from;                    // Número del cliente
  const messageId  = msg.id;
  const timestamp  = msg.timestamp;
  const msgType    = msg.type;                    // text | image | audio | etc.

  // Extraer texto según el tipo
  let messageText = '';
  if (msgType === 'text') {
    messageText = msg.text?.body || '';
  } else if (msgType === 'interactive') {
    // Respuesta a botón o lista
    messageText = msg.interactive?.button_reply?.title
               || msg.interactive?.list_reply?.title
               || '';
  } else {
    messageText = `[${msgType}]`;
  }

  console.log(`[Bot] 📨 Mensaje de ${fromPhone}: "${messageText}" (tipo: ${msgType})`);

  // Marcar como leído (doble palomita azul)
  await markAsRead(messageId).catch(() => {});

  // Obtener respuesta del bot
  const botResponse = await processMessage(fromPhone, messageText, msgType);

  // Si capturó un lead, guardarlo
  if (botResponse.type === 'lead_captured') {
    await saveLead({
      name:         botResponse.name,
      phone:        fromPhone,
      query:        botResponse.query,
      businessName: BOT_CONFIG.business.name,
    });
  }

  // Enviar respuesta al cliente en WhatsApp
  const responseText = botResponse.message || botResponse;
  if (responseText) {
    // Pequeña pausa para naturalidad (opcional)
    await sleep(800);
    await sendText(fromPhone, responseText);
    console.log(`[Bot] ✅ Respondido a ${fromPhone}`);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
