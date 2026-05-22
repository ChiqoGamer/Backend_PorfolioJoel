# Joel Portfolio — Backend

Backend Express que expone un endpoint de chat conectado a Gemini AI.

## Estructura

```
joel-backend/
├── server.js       ← servidor Express + endpoint /api/chat
├── prompt.js       ← system prompt con todo el contexto de Joel
├── .env.example    ← variables de entorno necesarias
├── .gitignore
└── package.json
```

---

## Setup local

### 1. Instalá dependencias

```bash
cd joel-backend
npm install
```

### 2. Conseguí tu API key de Gemini

1. Entrá a https://aistudio.google.com/apikey
2. Hacé click en **Create API Key**
3. Copiá la key

### 3. Creá el archivo .env

```bash
cp .env.example .env
```

Abrí `.env` y pegá tu key:

```
GEMINI_API_KEY=AIzaSy...tu_key_aqui
PORT=3001
ALLOWED_ORIGIN=http://localhost:4321
```

### 4. Levantá el servidor

```bash
npm run dev
```

Vas a ver:
```
✅ Backend corriendo en http://localhost:3001
   Endpoint del chat: POST http://localhost:3001/api/chat
```

---

## Cambio en el frontend (AIChat.tsx)

Reemplazá el bloque `sendMessage` en tu componente:

```ts
// ANTES — llamaba directo a la API de Anthropic (key expuesta)
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: SYSTEM_PROMPT,
    messages: newMessages.map(m => ({ role: m.role, content: m.content })),
  }),
});
const data = await response.json();
const reply = data.content?.map((b: any) => b.text || '').join('') || 'No pude generar una respuesta.';

// DESPUÉS — llama a tu backend (key segura en el servidor)
const response = await fetch('http://localhost:3001/api/chat', {gi
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ messages: newMessages }),
});
const data = await response.json();
const reply = data.reply || 'No pude generar una respuesta.';
```

También podés borrar la constante `SYSTEM_PROMPT` del componente React — ya no la necesitás ahí, ahora vive en `prompt.js` en el backend.

---

## Deploy en producción

### Backend → Render (gratis)

1. Subí la carpeta `joel-backend` a un repo de GitHub
2. Entrá a https://render.com y creá una cuenta
3. **New → Web Service** → conectá el repo
4. Configuración:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node
5. En **Environment Variables** agregá:
   - `GEMINI_API_KEY` = tu key
   - `ALLOWED_ORIGIN` = `https://tu-portfolio.github.io` (la URL real de tu portfolio)
6. Deploy → Render te da una URL tipo `https://joel-backend.onrender.com`

### Frontend → actualizar la URL del fetch

Una vez deployado el backend, en `AIChat.tsx` cambiá:

```ts
// Desarrollo
const API_URL = 'http://localhost:3001/api/chat';

// Producción
const API_URL = 'https://joel-backend.onrender.com/api/chat';
```

O mejor, usá una variable de entorno en Astro para no tener que cambiar el código:

En `.env` del proyecto Astro:
```
PUBLIC_CHAT_API_URL=http://localhost:3001/api/chat
```

En `AIChat.tsx`:
```ts
const API_URL = import.meta.env.PUBLIC_CHAT_API_URL;
```

En producción (GitHub Pages / Netlify / Vercel), configurás esa variable con la URL de Render.

---

## Probar el endpoint manualmente

Con curl:
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      { "role": "user", "content": "¿En qué tecnologías estás trabajando ahora?" }
    ]
  }'
```

Respuesta esperada:
```json
{
  "reply": "Actualmente estoy metido de lleno en Node.js con Express..."
}
```
