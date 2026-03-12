/**
 * WhatsBot-Fix — Configuración Central
 * Meta WhatsApp Business API
 * ⚠️ NUNCA subir .env a GitHub
 */
const BOT_CONFIG = {

  // ─── Meta / WhatsApp ─────────────────────────────────────
  // Obtener en: developers.facebook.com → Tu App → WhatsApp → API Setup
  meta: {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    accessToken:   process.env.WHATSAPP_ACCESS_TOKEN    || '',
    verifyToken:   process.env.WEBHOOK_VERIFY_TOKEN     || 'edfix2025secret',
    apiVersion:    'v19.0',
    apiBase:       'https://graph.facebook.com',
  },

  // ─── IA Gemini (gratis) ──────────────────────────────────
  ai: {
    geminiKey:   process.env.GEMINI_API_KEY || '',
    model:       'gemini-1.5-flash',
    maxTokens:   300,
    temperature: 0.7,
  },

  // ─── Supabase ────────────────────────────────────────────
  supabase: {
    url:     process.env.SUPABASE_URL      || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
  },

  // ─── Datos del negocio (1 archivo por cliente) ───────────
  business: {
    name:     process.env.BUSINESS_NAME     || 'Mi Negocio',
    phone:    process.env.BUSINESS_PHONE    || '',
    address:  process.env.BUSINESS_ADDRESS  || '',
    hours:    process.env.BUSINESS_HOURS    || 'Lunes a Sábado 9am - 6pm',
    services: (process.env.BUSINESS_SERVICES || '').split(',').filter(Boolean),
    greeting: process.env.BUSINESS_GREETING || '¡Hola! 👋 Soy el asistente virtual de *{business}*. ¿En qué te puedo ayudar hoy?',
  },
};

module.exports = BOT_CONFIG;

