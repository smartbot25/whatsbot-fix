/**
 * WhatsBot-Fix — API de Leads
 * Netlify Function: /.netlify/functions/leads
 * Permite al panel admin ver los leads capturados
 */

const BOT_CONFIG   = require('../../config/bot-config');
const { getAllLeads } = require('../../bot/lead-manager');

exports.handler = async (event) => {
  // Solo GET permitido
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Verificar admin token simple
  const authHeader = event.headers?.authorization || '';
  const adminToken = process.env.ADMIN_TOKEN || 'edfix-admin-2025';

  if (authHeader !== `Bearer ${adminToken}`) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' }),
    };
  }

  try {
    const leads = await getAllLeads();
    return {
      statusCode: 200,
      headers: {
        'Content-Type':                'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ leads, total: leads.length }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.message }),
    };
  }
};

