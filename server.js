import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';
import { SYSTEM_PROMPT } from './prompt.js';

// ─── Validar que exista la API key al arrancar ────────────────────────────────
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ Falta GEMINI_API_KEY en el archivo .env');
  process.exit(1);
}

// ─── Setup ───────────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 3001;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─── Middlewares ─────────────────────────────────────────────────────────────
app.use(express.json());

app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:4321',
  methods: ['POST'],
}));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── POST /api/chat ───────────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  // Validación básica
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'El campo "messages" es requerido y debe ser un array.' });
  }

  // Verificar que cada mensaje tenga role y content
  const valid = messages.every(m => 
    (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
  );
  if (!valid) {
    return res.status(400).json({ error: 'Cada mensaje debe tener role ("user" | "assistant") y content (string).' });
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',       // modelo gratuito y rápido
      systemInstruction: SYSTEM_PROMPT,
    });

    // Gemini usa "model" en lugar de "assistant" para los mensajes del bot
    // y espera el historial sin el último mensaje (ese se manda aparte)
    const history = messages.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages.at(-1).content;

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage);
    const reply = result.response.text();

    return res.json({ reply });

  } catch (error) {
    console.error('Error al llamar a Gemini:', error?.message || error);

    // Distinguir errores de API key vs errores generales
    if (error?.message?.includes('API_KEY')) {
      return res.status(401).json({ error: 'API key inválida o sin permisos.' });
    }

    return res.status(500).json({ error: 'Error interno del servidor. Intentá de nuevo.' });
  }
});

// ─── Arrancar servidor ────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Backend corriendo en http://localhost:${PORT}`);
  console.log(`   Endpoint del chat: POST http://localhost:${PORT}/api/chat`);
});
