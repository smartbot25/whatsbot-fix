/**
 * WhatsBot-Fix — WhatsApp Sender
 * Envía mensajes via Meta Cloud API
 */

const BOT_CONFIG = require('../config/bot-config');

const WA_API_URL = `${BOT_CONFIG.meta.apiBase}/${BOT_CONFIG.meta.apiVersion}/${BOT_CONFIG.meta.phoneNumberId}/messages`;

// ─── Enviar mensaje de texto ────────────────────────────────
async function sendText(toPhone, text) {
  return await sendToMeta({
    messaging_product: 'whatsapp',
    recipient_type:    'individual',
    to:                toPhone,
    type:              'text',
    text: {
      preview_url: false,
      body:        text,
    },
  });
}

// ─── Enviar mensaje con botones (máx 3 botones) ─────────────
async function sendButtons(toPhone, bodyText, buttons) {
  // buttons: [{id: 'btn_1', title: 'Texto'}]
  return await sendToMeta({
    messaging_product: 'whatsapp',
    recipient_type:    'individual',
    to:                toPhone,
    type:              'interactive',
    interactive: {
      type: 'button',
      body: { text: bodyText },
      action: {
        buttons: buttons.slice(0, 3).map(b => ({
          type:  'reply',
          reply: { id: b.id, title: b.title.slice(0, 20) },
        })),
      },
    },
  });
}

// ─── Enviar lista de opciones (máx 10 items) ─────────────────
async function sendList(toPhone, bodyText, buttonLabel, sections) {
  return await sendToMeta({
    messaging_product: 'whatsapp',
    recipient_type:    'individual',
    to:                toPhone,
    type:              'interactive',
    interactive: {
      type: 'list',
      body: { text: bodyText },
      action: {
        button:   buttonLabel,
        sections: sections,
      },
    },
  });
}

// ─── Marcar como leído ───────────────────────────────────────
async function markAsRead(messageId) {
  return await sendToMeta({
    messaging_product: 'whatsapp',
    status:            'read',
    message_id:        messageId,
  });
}

// ─── Enviador base ───────────────────────────────────────────
async function sendToMeta(payload) {
  if (!BOT_CONFIG.meta.accessToken || !BOT_CONFIG.meta.phoneNumberId) {
    console.error('[WhatsApp] ❌ AccessToken o PhoneNumberId no configurados');
    return { success: false, error: 'not_configured' };
  }

  try {
    const response = await fetch(WA_API_URL, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${BOT_CONFIG.meta.accessToken}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`[WhatsApp] ✅ Mensaje enviado a ${payload.to || 'unknown'}`);
      return { success: true, data };
    } else {
      console.error(`[WhatsApp] ❌ Error Meta API:`, JSON.stringify(data));
      return { success: false, error: data };
    }
  } catch (e) {
    console.error(`[WhatsApp] ❌ Error de red:`, e.message);
    return { success: false, error: e.message };
  }
}

module.exports = { sendText, sendButtons, sendList, markAsRead };
