/**
 * WhatsBot-Fix — Send Message API
 * Netlify Function: /.netlify/functions/send
 * Envía mensajes manuales desde el panel admin
 */

const { sendText } = require('../../bot/whatsapp-sender');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Auth
  const authHeader = event.headers?.authorization || '';
  const adminToken = process.env.ADMIN_TOKEN || 'edfix-admin-2025';
  if (authHeader !== `Bearer ${adminToken}`) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    const { phone, message } = JSON.parse(event.body || '{}');

    if (!phone || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Se requiere phone y message' }),
      };
    }

    // Limpiar número (solo dígitos)
    const cleanPhone = phone.replace(/\D/g, '');
    const result = await sendText(cleanPhone, message);

    return {
      statusCode: result.success ? 200 : 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(result),
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.message }),
    };
  }
};

