require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { validate, parse } = require('@telegram-apps/init-data-node');

const app = express();
app.use(cors());
app.use(express.json());

initializeApp({
  credential: cert({
    project_id: process.env.FIREBASE_PROJECT_ID,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

const db = getFirestore();
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_TELEGRAM_ID = process.env.ADMIN_TELEGRAM_ID || '';
const COOLDOWN_MS = 2 * 60 * 60 * 1000;
const INVITE_GATE_DAYS = 7;

function generateEcho() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

app.get('/health', (req, res) => res.json({ status: 'ok' }));

function validateTelegram(req, res, next) {
  const initData = req.headers['x-telegram-init-data'];
  if (!initData) return res.status(401).json({ error: 'Missing initData' });
  try {
    validate(initData, BOT_TOKEN);
    const parsed = parse(initData);
    req.telegramUser = parsed.user;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid initData' });
  }
}

async function incrementStats(fields) {
  const ref = db.collection('stats').doc('global');
  const doc = await ref.get();
  if (!doc.exists) {
    await ref.set({
      totalDistributed: 0,
      totalMembers: 0,
      awaitingClaim: 0,
      totalWitnesses: 0,
      totalTraces: 0,
      ...fields,
    });
  } else {
    await ref.update(fields);
  }
}

// ============ INVITE VALIDATION ============
app.post('/api/validate-invite', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.json({ valid: false });
  const snapshot = await db.collection('invites')
    .where('code', '==', code.toUpperCase())
    .where('usedBy', '==', null)
    .limit(1)
    .get();
  if (snapshot.empty) return res.json({ valid: false });
  const invite = snapshot.docs[0].data();
  const expiresAt = invite.expiresAt?.toDate?.();
  if (expiresAt && expiresAt.getTime() < Date.now()) return res.json({ valid: false });
  res.json({ valid: true });
});

// ============ AUTH ============
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
      hasInvitedToday: false,
      signalsReceived: 0,
      signalsSent: 0,
      walletAddress: '',
      createdAt: FieldValue.serverTimestamp(),
    };
    await userRef.set(newUser);
    await incrementStats({ totalMembers: FieldValue.increment(1) });
    return res.json({ ...newUser, createdAt: null });
  }

  res.json(doc.data());
});

// ============ VOW ============
app.post('/api/vow', validateTelegram, async (req, res) => {
  const telegramId = req.telegramUser.id.toString();
  await db.collection('users').doc(telegramId).update({ hasVowed: true });
  res.json({ success: true });
});

// ============ STAY ============
app.post('/api/stay', validateTelegram, async (req, res) => {
  const telegramId = req.telegramUser.id.toString();
  const userRef = db.collection('users').doc(telegramId);

  try {
    let updatedData = null;
    let reward = 0;

    await db.runTransaction(async (t) => {
      const doc = await t.get(userRef);
      if (!doc.exists) throw new Error('User not found');
      const data = doc.data();
      const now = Date.now();
      if (now - (data.lastStayAt || 0) < COOLDOWN_MS) throw new Error('Cooldown active');

      const days = data.silentDays || 0;
      let multiplier = 100;
      if (days >= 90) multiplier = 500;
      else if (days >= 30) multiplier = 250;
      else if (days >= 7) multiplier = 150;

      reward = multiplier;
      const newBalance = (data.balance || 0) + multiplier;
      const newDays = days + 1;
      const updates = { balance: newBalance, silentDays: newDays, lastStayAt: now };
      t.update(userRef, updates);
      updatedData = { ...data, ...updates };
    });

    await incrementStats({ totalDistributed: FieldValue.increment(reward) });
    res.json(updatedData);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ============ WALL ============
app.get('/api/wall', async (req, res) => {
  const snapshot = await db.collection('wall').orderBy('createdAt', 'desc').limit(200).get();
  res.json(snapshot.docs.map(doc => ({ telegramId: doc.data().telegramId, date: doc.data().date })));
});

app.post('/api/wall', validateTelegram, async (req, res) => {
  const telegramId = req.telegramUser.id.toString();
  const today = new Date().toISOString().split('T')[0];

  const existing = await db.collection('wall')
    .where('telegramId', '==', telegramId)
    .where('date', '==', today)
    .get();

  if (!existing.empty) return res.status(400).json({ error: 'Already traced today' });

  await db.collection('wall').add({
    telegramId,
    date: today,
    createdAt: FieldValue.serverTimestamp(),
  });

  await db.collection('users').doc(telegramId).update({
    wallMarks: FieldValue.arrayUnion(Date.now()),
    hasMarkedToday: true,
  });

  await incrementStats({ totalTraces: FieldValue.increment(1) });
  res.json({ success: true });
});

// ============ LEADERBOARD ============
app.get('/api/leaderboard', async (req, res) => {
  const snapshot = await db.collection('users').orderBy('silentDays', 'desc').limit(20).get();
  res.json(snapshot.docs.map(doc => ({
    secretEcho: doc.data().secretEcho,
    silentDays: doc.data().silentDays || 0,
  })));
});

// ============ LEDGER (now reads 1 doc) ============
app.get('/api/ledger', async (req, res) => {
  const doc = await db.collection('stats').doc('global').get();
  if (!doc.exists) return res.json({ totalDistributed: 0, totalMembers: 0, awaitingClaim: 0 });
  const data = doc.data();
  res.json({
    totalDistributed: data.totalDistributed || 0,
    totalMembers: data.totalMembers || 0,
    awaitingClaim: data.awaitingClaim || 0,
  });
});

// ============ FIRST 100 ============
app.get('/api/first100', async (req, res) => {
  const snapshot = await db.collection('users').orderBy('createdAt', 'asc').limit(100).get();
  res.json(snapshot.docs.map(doc => ({
    secretEcho: doc.data().secretEcho,
    silentDays: doc.data().silentDays || 0,
  })));
});

// ============ WITNESS ============
app.post('/api/witness', validateTelegram, async (req, res) => {
  const reporterId = req.telegramUser.id.toString();
  const { link, violatorEcho, note } = req.body;
  if (!link) return res.status(400).json({ error: 'Missing link' });

  await db.collection('witnesses').add({
    reporterId,
    link,
    violatorEcho: violatorEcho || '',
    note: note || '',
    status: 'pending',
    createdAt: FieldValue.serverTimestamp(),
  });

  await db.collection('users').doc(reporterId).update({
    balance: FieldValue.increment(50),
  });

  await incrementStats({
    totalDistributed: FieldValue.increment(50),
    totalWitnesses: FieldValue.increment(1),
  });

  res.json({ success: true, reward: 50 });
});

app.get('/api/disappeared', async (req, res) => {
  const snapshot = await db.collection('witnesses').where('status', '==', 'valid').limit(50).get();
  res.json(snapshot.docs.map(doc => ({
    echo: doc.data().violatorEcho || 'UNKNOWN',
    days: 0,
    reason: doc.data().note || 'Broke the silence',
  })));
});

// ============ ADMIN: review witnesses ============
function requireAdmin(req, res, next) {
  const telegramId = req.telegramUser.id.toString();
  if (telegramId !== ADMIN_TELEGRAM_ID) {
    return res.status(403).json({ error: 'Not the admin' });
  }
  next();
}

app.get('/api/admin/witnesses', validateTelegram, requireAdmin, async (req, res) => {
  const snapshot = await db.collection('witnesses')
    .where('status', '==', 'pending')
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();
  res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
});

app.post('/api/admin/witness/:id', validateTelegram, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'valid' | 'fake'
  if (!['valid', 'fake'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  await db.collection('witnesses').doc(id).update({ status });
  res.json({ success: true });
});

// ============ INVITE ============
app.post('/api/invite', validateTelegram, async (req, res) => {
  const telegramId = req.telegramUser.id.toString();
  const userRef = db.collection('users').doc(telegramId);
  const doc = await userRef.get();
  const data = doc.data();

  const canInvite = data.wasInvited || (data.silentDays || 0) >= INVITE_GATE_DAYS;
  if (!canInvite) return res.status(400).json({ error: 'Not eligible to invite yet' });
  if (data.hasInvitedToday) return res.status(400).json({ error: 'Already invited today' });

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db.collection('invites').add({
    code,
    fromUserId: telegramId,
    usedBy: null,
    createdAt: FieldValue.serverTimestamp(),
    expiresAt,
  });

  await userRef.update({ hasInvitedToday: true });
  res.json({ code, expiresAt: expiresAt.toISOString() });
});

// ============ SIGNAL ============
app.post('/api/signal', validateTelegram, async (req, res) => {
  const senderId = req.telegramUser.id.toString();
  const senderRef = db.collection('users').doc(senderId);

  const usersSnapshot = await db.collection('users').limit(100).get();
  const candidates = usersSnapshot.docs.filter(d => d.id !== senderId);
  if (candidates.length === 0) return res.status(400).json({ error: 'No other members yet' });

  const recipient = candidates[Math.floor(Math.random() * candidates.length)];
  const recipientId = recipient.id;

  await db.collection('signals').add({
    fromUserId: senderId,
    toUserId: recipientId,
    createdAt: FieldValue.serverTimestamp(),
  });

  await senderRef.update({ balance: FieldValue.increment(10), signalsSent: FieldValue.increment(1) });
  await db.collection('users').doc(recipientId).update({
    balance: FieldValue.increment(10),
    signalsReceived: FieldValue.increment(1),
  });

  await incrementStats({ totalDistributed: FieldValue.increment(20) });
  res.json({ success: true, reward: 10 });
});

// ============ ACTIVITY ============
app.get('/api/activity', async (req, res) => {
  const wallSnap = await db.collection('wall').orderBy('createdAt', 'desc').limit(5).get();
  const messages = [];
  wallSnap.forEach(doc => {
    const data = doc.data();
    const short = data.telegramId?.slice(-6) || 'UNKNOWN';
    messages.push(`${short} left a trace`);
  });
  if (messages.length === 0) {
    messages.push('The wall is silent');
    messages.push('They are watching');
    messages.push('The distribution continues');
  }
  res.json(messages);
});

// ============ WALLET LINK ============
app.post('/api/link-wallet', validateTelegram, async (req, res) => {
  const telegramId = req.telegramUser.id.toString();
  const { address } = req.body;
  if (!address || typeof address !== 'string') return res.status(400).json({ error: 'Invalid address' });

  await db.collection('users').doc(telegramId).update({ walletAddress: address });
  res.json({ success: true, address });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`INDRI backend running on port ${PORT}`));