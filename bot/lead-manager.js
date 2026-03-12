
/**
 * WhatsBot-Fix — Lead Manager
 * Guarda leads en Supabase cuando el bot captura un contacto
 */

const BOT_CONFIG = require('../config/bot-config');

async function saveLead(leadData) {
  const { name, phone, query, businessName } = leadData;

  console.log(`[Leads] Guardando lead: ${name} | ${phone}`);

  // ─── Guardar en Supabase ─────────────────────────────────
  if (BOT_CONFIG.supabase.url && BOT_CONFIG.supabase.anonKey) {
    try {
      const response = await fetch(
        `${BOT_CONFIG.supabase.url}/rest/v1/whatsbot_leads`,
        {
          method: 'POST',
          headers: {
            'apikey':        BOT_CONFIG.supabase.anonKey,
            'Authorization': `Bearer ${BOT_CONFIG.supabase.anonKey}`,
            'Content-Type':  'application/json',
            'Prefer':        'return=minimal',
          },
          body: JSON.stringify({
            name:          name || 'Sin nombre',
            phone:         phone,
            query:         query || '',
            business_name: businessName || BOT_CONFIG.business.name,
            source:        'whatsapp_bot',
            status:        'new',
            created_at:    new Date().toISOString(),
          }),
        }
      );

      if (response.ok) {
        console.log(`[Leads] ✅ Lead guardado en Supabase: ${name}`);
        return { success: true };
      } else {
        const err = await response.text();
        console.error(`[Leads] Error Supabase: ${err}`);
      }
    } catch (e) {
      console.error(`[Leads] Error de red Supabase: ${e.message}`);
    }
  } else {
    // Sin Supabase: solo log en consola (ver en Netlify logs)
    console.log(`[Leads] ⚠️ Sin Supabase — Lead: ${JSON.stringify(leadData)}`);
  }

  return { success: false, reason: 'supabase_not_configured' };
}

async function getAllLeads() {
  if (!BOT_CONFIG.supabase.url) return [];

  try {
    const response = await fetch(
      `${BOT_CONFIG.supabase.url}/rest/v1/whatsbot_leads?order=created_at.desc`,
      {
        headers: {
          'apikey':        BOT_CONFIG.supabase.anonKey,
          'Authorization': `Bearer ${BOT_CONFIG.supabase.anonKey}`,
        },
      }
    );
    if (response.ok) return await response.json();
  } catch (e) {
    console.error('[Leads] Error obteniendo leads:', e.message);
  }
  return [];
}

module.exports = { saveLead, getAllLeads };
