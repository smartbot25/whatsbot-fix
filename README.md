# 📱 WhatsBot-Fix — Bot de WhatsApp con Meta API
**Ed-Fix Digital Suite | by Edgar**

---

## ¿Qué hace este bot?

Responde automáticamente en WhatsApp:
- ✅ Saluda al cliente con mensaje personalizado
- ✅ Responde horarios, dirección, teléfono, servicios
- ✅ Captura nombre + número de leads que piden asesor
- ✅ Guarda leads en Supabase (opcional)
- ✅ Permite enviar mensajes manuales desde el panel admin
- ✅ IA Gemini para respuestas inteligentes (opcional, gratis)

---

## 📁 Estructura del proyecto

```
whatsbot-fix/
├── netlify/
│   └── functions/
│       ├── webhook.js    ← CORAZÓN: recibe mensajes de WhatsApp
│       ├── leads.js      ← API para ver leads desde el admin
│       └── send.js       ← API para enviar mensajes manuales
├── bot/
│   ├── chatbot-logic.js  ← Cerebro: genera respuestas
│   ├── whatsapp-sender.js ← Envía mensajes a WhatsApp
│   └── lead-manager.js   ← Guarda leads en Supabase
├── config/
│   └── bot-config.js     ← Lee variables de entorno
├── admin/
│   └── index.html        ← Panel de administración
├── .env.example          ← Template de variables
├── package.json
└── netlify.toml
```

---

## 🚀 Despliegue rápido

### 1. Instalar dependencias
```bash
npm install
```

### 2. Subir a Netlify
```bash
# Opción A: Drag & Drop en netlify.com
# Opción B: CLI
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

### 3. Configurar variables en Netlify
Netlify → Site Settings → Environment Variables → agrega las variables del `.env.example`

### 4. Configurar webhook en Meta
Meta App → WhatsApp → Configuration → Webhook:
- URL: `https://tu-sitio.netlify.app/webhook`
- Verify Token: el que pusiste en `WEBHOOK_VERIFY_TOKEN`
- Suscribir a: `messages`

---

## 💰 Modelo de negocio

| Concepto | Precio sugerido |
|---|---|
| Instalación | S/ 350 – 500 |
| Mensualidad | S/ 150 – 200 |
| Con IA Gemini | +S/ 50/mes |
| Costo real tuyo | S/ 0 (todo gratis) |

**Meta semana 1:** 2 clientes = S/ 700–1,000

---

## 🔗 URLs del bot desplegado

- **Webhook (Meta):** `https://tu-sitio.netlify.app/webhook`
- **Panel Admin:** `https://tu-sitio.netlify.app/admin`
- **API Leads:** `https://tu-sitio.netlify.app/api/leads`
- **API Send:** `https://tu-sitio.netlify.app/api/send`

---

*WhatsBot-Fix by Ed-Fix Digital Suite*
