require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { validate, parse } = require('@telegram-apps/init-data-node');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin
initializeApp({
  credential: cert({
    project_id: process.env.FIREBASE_PROJECT_ID,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

const db = getFirestore();
const BOT_TOKEN = process.env.BOT_TOKEN;

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Middleware: validate Telegram initData
function validateTelegram(req, res, next) {
  const initData = req.headers['x-telegram-init-data'];
  if (!initData) {
    return res.status(401).json({ error: 'Missing initData' });
  }
  try {
    validate(initData, BOT_TOKEN);
    const parsed = parse(initData);
    req.telegramUser = parsed.user;
    next();
  } catch (e) {
    console.error('Validation failed:', e.message);
    return res.status(401).json({ error: 'Invalid initData' });
  }
}

// POST /api/auth — create or fetch user
app.post('/api/auth', validateTelegram, async (req, res) => {
  const telegramId = req.telegramUser.id.toString();
  const userRef = db.collection('users').doc(telegramId);
  const doc = await userRef.get();

  if (!doc.exists) {
    const newUser = {
      telegramId,
      username: req.telegramUser.username || '',
      firstName: req.telegramUser.first_name || '',
      silentDays: 0,
      balance: 0,
      secretEcho: generateEcho(),
      entryNumber: Math.floor(Math.random() * 1000) + 100,
      lastStayAt: 0,
      wallMarks: [],
      hasMarkedToday: false,
      wasInvited: false,
      hasVowed: false,
      createdAt: FieldValue.serverTimestamp(),
    };
    await userRef.set(newUser);
    return res.json(newUser);
  }

  res.json(doc.data());
});

// Helper
function generateEcho() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`INDRI backend running on port ${PORT}`));