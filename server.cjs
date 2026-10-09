// require('dotenv').config();

// const express = require('express');
// const cors = require('cors');
// const { initializeApp, cert } = require('firebase-admin/app');
// const { getFirestore, FieldValue } = require('firebase-admin/firestore');
// const { validate, parse } = require('@telegram-apps/init-data-node');

// const app = express();
// app.use(cors());
// app.use(express.json());

// initializeApp({
//   credential: cert({
//     project_id: process.env.FIREBASE_PROJECT_ID,
//     client_email: process.env.FIREBASE_CLIENT_EMAIL,
//     private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
//   }),
// });

// const db = getFirestore();
// const BOT_TOKEN = process.env.BOT_TOKEN;
// const ADMIN_TELEGRAM_ID = process.env.ADMIN_TELEGRAM_ID || '';

// // ============ CONFIG ============
// const CONFIG = {
//   COOLDOWN_MS: 2 * 60 * 60 * 1000,
//   INVITE_GATE_DAYS: 1,
//   INVITE_TTL_MS: 24 * 60 * 60 * 1000,

//   // Signal system
//   SIGNAL_LIVE_WINDOW_MS: 5 * 60 * 1000,     // how long a tap stays "live"
//   SIGNAL_DELAY_MS: 24 * 60 * 60 * 1000,      // queue hold before firing
//   SIGNAL_ORDER_WEEK_MS: 7 * 24 * 60 * 60 * 1000,

//   // Wallet
//   WALLET_BLOCK_DURATION_MS: 2 * 24 * 60 * 60 * 1000, // 2 days
// };

// // ============ REWARDS ============
// const REWARDS = {
//   stay: {
//     tier1: 500,
//     tier2: 2000,
//     tier3: 5000,
//     tier4: 7500,
//   },
//   signal: 300,               // sender reward
//   signalRecipient: 300,      // normal recipient reward
//   signalDisappeared: 500,    // recipient reward if disappeared (silentDays === 0)
//   witness: 500,
//   wallTrace: 0,
//   invite: 1000,
// };

// function getStayReward(days) {
//   if (days >= 60) return REWARDS.stay.tier4;
//   if (days >= 30) return REWARDS.stay.tier3;
//   if (days >= 7) return REWARDS.stay.tier2;
//   return REWARDS.stay.tier1;
// }

// // ============ HELPERS ============
// function generateEcho() {
//   return Math.random().toString(36).substring(2, 8).toUpperCase();
// }

// function generateCode() {
//   return Math.random().toString(36).substring(2, 8).toUpperCase();
// }

// app.get('/health', (req, res) => res.json({ status: 'ok' }));

// function validateTelegram(req, res, next) {
//   const initData = req.headers['x-telegram-init-data'];
//   if (!initData) return res.status(401).json({ error: 'Missing initData' });
//   try {
//     validate(initData, BOT_TOKEN);
//     const parsed = parse(initData);
//     req.telegramUser = parsed.user;
//     next();
//   } catch (e) {
//     return res.status(401).json({ error: 'Invalid initData' });
//   }
// }

// async function incrementStats(fields) {
//   const ref = db.collection('stats').doc('global');
//   const doc = await ref.get();
//   if (!doc.exists) {
//     await ref.set({
//       totalDistributed: 0,
//       totalMembers: 0,
//       awaitingClaim: 0,
//       totalWitnesses: 0,
//       totalTraces: 0,
//       orderPool: 0,
//       lastOrderDistributionAt: 0,
//       ...fields,
//     });
//   } else {
//     await ref.update(fields);
//   }
// }

// // ============ SIGNAL SYSTEM (background tasks) ============

// // Move expired "live" taps into the 24h queue
// async function promoteLiveToQueue() {
//   const now = Date.now();
//   const expiredSnap = await db.collection('users')
//     .where('signalLiveUntil', '>', 0)
//     .where('signalLiveUntil', '<', now)
//     .limit(50)
//     .get();

//   for (const doc of expiredSnap.docs) {
//     const data = doc.data();
//     const queue = data.signalQueue || [];
//     queue.push({ queuedAt: data.signalLiveUntil });

//     await doc.ref.update({
//       signalLiveUntil: 0,
//       signalQueue: queue,
//       signalsQueued: FieldValue.increment(1),
//     });
//   }
// }

// // Fire queued signals older than SIGNAL_DELAY_MS
// async function fireQueuedSignals() {
//   const now = Date.now();
//   const usersSnap = await db.collection('users').limit(500).get();

//   for (const userDoc of usersSnap.docs) {
//     const data = userDoc.data();
//     const queue = data.signalQueue || [];
//     if (queue.length === 0) continue;

//     const ready = queue.filter(s => now - s.queuedAt >= CONFIG.SIGNAL_DELAY_MS);
//     const stillQueued = queue.filter(s => now - s.queuedAt < CONFIG.SIGNAL_DELAY_MS);
//     if (ready.length === 0) continue;

//     for (const _ of ready) {
//       await deliverSignal(userDoc.id);
//     }

//     await userDoc.ref.update({ signalQueue: stillQueued });
//   }
// }

// async function deliverSignal(senderId) {
//   const senderRef = db.collection('users').doc(senderId);

//   const allSnap = await db.collection('users').limit(500).get();
//   const others = allSnap.docs.filter(d => d.id !== senderId);

//   // Weighted pool: disappeared users appear 5× more often
//   const disappeared = others.filter(d => (d.data().silentDays || 0) === 0);
//   const pool = [];
//   for (let i = 0; i < 5; i++) pool.push(...disappeared);
//   pool.push(...others);

//   if (pool.length === 0) {
//     // Order fallback
//     await senderRef.update({ signalsToOrder: FieldValue.increment(1) });
//     await incrementStats({
//       orderPool: FieldValue.increment(REWARDS.signal),
//       totalDistributed: FieldValue.increment(REWARDS.signal),
//     });
//     return;
//   }

//   const recipient = pool[Math.floor(Math.random() * pool.length)];
//   const recipientData = recipient.data();
//   const isDisappeared = (recipientData.silentDays || 0) === 0;
//   const recipientReward = isDisappeared
//     ? REWARDS.signalDisappeared
//     : REWARDS.signalRecipient;

//   await senderRef.update({
//     signalsArrived: FieldValue.increment(1),
//     balance: FieldValue.increment(REWARDS.signal),
//   });

//   await db.collection('users').doc(recipient.id).update({
//     balance: FieldValue.increment(recipientReward),
//     signalsReceived: FieldValue.increment(1),
//   });

//   await db.collection('signals').add({
//     fromUserId: senderId,
//     toUserId: recipient.id,
//     traded: false,
//     disappeared: isDisappeared,
//     at: FieldValue.serverTimestamp(),
//   });

//   await incrementStats({
//     totalDistributed: FieldValue.increment(REWARDS.signal + recipientReward),
//   });

//   // Dot on the wall
//   await db.collection('wall').add({
//     telegramId: senderId,
//     date: new Date().toISOString().split('T')[0],
//     signal: true,
//     createdAt: FieldValue.serverTimestamp(),
//   });
// }

// // Distribute the Order pool weekly
// async function distributeOrderPool() {
//   const statsRef = db.collection('stats').doc('global');
//   const doc = await statsRef.get();
//   if (!doc.exists) return;

//   const data = doc.data();
//   const now = Date.now();
//   if ((data.lastOrderDistributionAt || 0) > now - CONFIG.SIGNAL_ORDER_WEEK_MS) return;
//   if ((data.orderPool || 0) <= 0) return;

//   const usersSnap = await db.collection('users').limit(500).get();
//   if (usersSnap.size === 0) return;

//   const perUser = Math.floor((data.orderPool || 0) / usersSnap.size);
//   if (perUser < 1) return;

//   const batch = db.batch();
//   usersSnap.forEach(userDoc => {
//     batch.update(userDoc.ref, { balance: FieldValue.increment(perUser) });
//   });
//   batch.update(statsRef, {
//     orderPool: 0,
//     lastOrderDistributionAt: now,
//   });
//   await batch.commit();
// }

// // ============ INVITE VALIDATION ============
// app.post('/api/validate-invite', async (req, res) => {
//   const { code } = req.body;
//   if (!code) return res.json({ valid: false });
//   const snapshot = await db.collection('invites')
//     .where('code', '==', code.toUpperCase())
//     .where('usedBy', '==', null)
//     .limit(1)
//     .get();
//   if (snapshot.empty) return res.json({ valid: false });
//   const invite = snapshot.docs[0].data();
//   const expiresAt = invite.expiresAt?.toDate?.();
//   if (expiresAt && expiresAt.getTime() < Date.now()) return res.json({ valid: false });
//   res.json({ valid: true });
// });

// // ============ REDEEM INVITE ============
// app.post('/api/redeem-invite', validateTelegram, async (req, res) => {
//   const telegramId = req.telegramUser.id.toString();
//   const { code } = req.body;
//   if (!code) return res.status(400).json({ error: 'Missing code' });

//   const snapshot = await db.collection('invites')
//     .where('code', '==', code.toUpperCase())
//     .where('usedBy', '==', null)
//     .limit(1)
//     .get();

//   if (snapshot.empty) return res.status(400).json({ error: 'Invalid or used code' });

//   const inviteDoc = snapshot.docs[0];
//   const invite = inviteDoc.data();
//   const expiresAt = invite.expiresAt?.toDate?.();
//   if (expiresAt && expiresAt.getTime() < Date.now()) {
//     return res.status(400).json({ error: 'Code expired' });
//   }

//   await inviteDoc.ref.update({
//     usedBy: telegramId,
//     usedAt: FieldValue.serverTimestamp(),
//   });

//   await db.collection('users').doc(telegramId).update({
//     wasInvited: true,
//     invitedBy: invite.fromUserId,
//   });

//   if (REWARDS.invite > 0 && invite.fromUserId) {
//     await db.collection('users').doc(invite.fromUserId).update({
//       balance: FieldValue.increment(REWARDS.invite),
//     });
//     await incrementStats({
//       totalDistributed: FieldValue.increment(REWARDS.invite),
//     });
//   }

//   res.json({ success: true, invitedBy: invite.fromUserId });
// });

// // ============ AUTH ============
// app.post('/api/auth', validateTelegram, async (req, res) => {
//   const telegramId = req.telegramUser.id.toString();
//   const userRef = db.collection('users').doc(telegramId);
//   const doc = await userRef.get();

//   const isAdmin = telegramId === ADMIN_TELEGRAM_ID;

//   if (!doc.exists) {
//     const statsRef = db.collection('stats').doc('global');
//     const statsDoc = await statsRef.get();
//     const currentCount = statsDoc.exists ? (statsDoc.data().totalMembers || 0) : 0;
//     const newEntryNumber = currentCount + 1;

//     const newUser = {
//       telegramId,
//       username: req.telegramUser.username || '',
//       firstName: req.telegramUser.first_name || '',
//       silentDays: 0,
//       balance: 0,
//       secretEcho: generateEcho(),
//       entryNumber: newEntryNumber,
//       lastStayAt: 0,
//       wallMarks: [],
//       hasMarkedToday: false,
//       wasInvited: false,
//       invitedBy: '',
//       hasVowed: false,
//       hasInvitedToday: false,
//       signalsReceived: 0,
//       signalsSent: 0,
//       // Signal system
//       signalLiveUntil: 0,
//       signalQueue: [],
//       lastSignalQueuedDate: '',
//       signalsQueued: 0,
//       signalsArrived: 0,
//       signalsTraded: 0,
//       signalsToOrder: 0,
//       walletAddress: '',
//       walletRejections: 0,
//       walletBlockedUntil: 0,
//       walletBlockReason: '',
//       createdAt: FieldValue.serverTimestamp(),
//     };
//     await userRef.set(newUser);
//     await incrementStats({ totalMembers: FieldValue.increment(1) });

//     // Fire background tasks
//     promoteLiveToQueue().catch(() => {});
//     fireQueuedSignals().catch(() => {});
//     distributeOrderPool().catch(() => {});

//     return res.json({ ...newUser, isAdmin, createdAt: null });
//   }

//   // Fire background tasks
//   promoteLiveToQueue().catch(() => {});
//   fireQueuedSignals().catch(() => {});
//   distributeOrderPool().catch(() => {});

//   res.json({ ...doc.data(), isAdmin });
// });

// // ============ VOW ============
// app.post('/api/vow', validateTelegram, async (req, res) => {
//   const telegramId = req.telegramUser.id.toString();
//   await db.collection('users').doc(telegramId).update({ hasVowed: true });
//   res.json({ success: true });
// });

// // ============ STAY ============
// app.post('/api/stay', validateTelegram, async (req, res) => {
//   const telegramId = req.telegramUser.id.toString();
//   const userRef = db.collection('users').doc(telegramId);

//   try {
//     let updatedData = null;
//     let reward = 0;

//     await db.runTransaction(async (t) => {
//       const doc = await t.get(userRef);
//       if (!doc.exists) throw new Error('User not found');
//       const data = doc.data();
//       const now = Date.now();
//       if (now - (data.lastStayAt || 0) < CONFIG.COOLDOWN_MS) throw new Error('Cooldown active');

//       const days = data.silentDays || 0;
//       const multiplier = getStayReward(days);

//       reward = multiplier;
//       const newBalance = (data.balance || 0) + multiplier;
//       const newDays = days + 1;
//       const updates = { balance: newBalance, silentDays: newDays, lastStayAt: now };
//       t.update(userRef, updates);
//       updatedData = { ...data, ...updates };
//     });

//     await incrementStats({ totalDistributed: FieldValue.increment(reward) });
//     res.json(updatedData);
//   } catch (e) {
//     res.status(400).json({ error: e.message });
//   }
// });

// // ============ WALL ============
// app.get('/api/wall', async (req, res) => {
//   const snapshot = await db.collection('wall').orderBy('createdAt', 'desc').limit(200).get();
//   res.json(snapshot.docs.map(doc => ({ telegramId: doc.data().telegramId, date: doc.data().date })));
// });

// app.post('/api/wall', validateTelegram, async (req, res) => {
//   const telegramId = req.telegramUser.id.toString();
//   const today = new Date().toISOString().split('T')[0];

//   const existing = await db.collection('wall')
//     .where('telegramId', '==', telegramId)
//     .where('date', '==', today)
//     .get();

//   if (!existing.empty) return res.status(400).json({ error: 'Already traced today' });

//   await db.collection('wall').add({
//     telegramId,
//     date: today,
//     createdAt: FieldValue.serverTimestamp(),
//   });

//   await db.collection('users').doc(telegramId).update({
//     wallMarks: FieldValue.arrayUnion(Date.now()),
//     hasMarkedToday: true,
//   });

//   await incrementStats({ totalTraces: FieldValue.increment(1) });
//   res.json({ success: true });
// });

// // ============ LEADERBOARD ============
// app.get('/api/leaderboard', async (req, res) => {
//   const snapshot = await db.collection('users').orderBy('silentDays', 'desc').limit(20).get();
//   res.json(snapshot.docs.map(doc => ({
//     secretEcho: doc.data().secretEcho,
//     silentDays: doc.data().silentDays || 0,
//   })));
// });

// // ============ LEDGER ============
// app.get('/api/ledger', async (req, res) => {
//   const statsDoc = await db.collection('stats').doc('global').get();
//   const stats = statsDoc.exists ? statsDoc.data() : {};

//   // Sum all balances = what's held in-app, waiting to be claimed on-chain
//   const usersSnap = await db.collection('users').select('balance').get();
//   let awaitingClaim = 0;
//   usersSnap.forEach(doc => {
//     awaitingClaim += doc.data().balance || 0;
//   });

//   res.json({
//     totalDistributed: stats.totalDistributed || 0,
//     totalMembers: stats.totalMembers || 0,
//     awaitingClaim,
//     orderPool: stats.orderPool || 0,
//   });
// });

// // ============ FIRST 100 ============
// app.get('/api/first100', async (req, res) => {
//   const snapshot = await db.collection('users').orderBy('entryNumber', 'asc').limit(100).get();
//   res.json(snapshot.docs.map(doc => ({
//     secretEcho: doc.data().secretEcho,
//     silentDays: doc.data().silentDays || 0,
//   })));
// });

// // ============ REFERRAL CHAIN ============
// app.get('/api/chain', validateTelegram, async (req, res) => {
//   const telegramId = req.telegramUser.id.toString();
//   const userRef = db.collection('users').doc(telegramId);
//   const userDoc = await userRef.get();
//   if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });

//   const user = userDoc.data();

//   // Walk up the chain
//   const ancestors = [];
//   let currentInviterId = user.invitedBy;

//   for (let i = 0; i < 20 && currentInviterId; i++) {
//     const inviterDoc = await db.collection('users').doc(currentInviterId).get();
//     if (!inviterDoc.exists) break;
//     const inviter = inviterDoc.data();
//     ancestors.unshift({
//       echo: inviter.secretEcho,
//       entryNumber: inviter.entryNumber,
//       silentDays: inviter.silentDays || 0,
//     });
//     currentInviterId = inviter.invitedBy;
//   }

//   // Direct children
//   const childrenSnap = await db.collection('users')
//     .where('invitedBy', '==', telegramId)
//     .limit(20)
//     .get();

//   const children = childrenSnap.docs.map(doc => {
//     const d = doc.data();
//     return {
//       echo: d.secretEcho,
//       entryNumber: d.entryNumber,
//       silentDays: d.silentDays || 0,
//     };
//   });

//   res.json({
//     self: {
//       echo: user.secretEcho,
//       entryNumber: user.entryNumber,
//       silentDays: user.silentDays || 0,
//     },
//     ancestors,
//     children,
//   });
// });

// // ============ WITNESS ============
// app.post('/api/witness', validateTelegram, async (req, res) => {
//   const reporterId = req.telegramUser.id.toString();
//   const { link, violatorEcho, note } = req.body;
//   if (!link) return res.status(400).json({ error: 'Missing link' });

//   await db.collection('witnesses').add({
//     reporterId,
//     link,
//     violatorEcho: (violatorEcho || '').trim().toUpperCase(),
//     note: (note || '').trim(),
//     status: 'pending',
//     createdAt: FieldValue.serverTimestamp(),
//   });

//   res.json({ success: true });
// });

// // ============ DISAPPEARED ============
// app.get('/api/disappeared', async (req, res) => {
//   const snapshot = await db.collection('witnesses').where('status', '==', 'valid').limit(50).get();
//   res.json(snapshot.docs.map(doc => ({
//     echo: doc.data().violatorEcho || 'UNKNOWN',
//     days: 0,
//     reason: doc.data().note || 'Broke the silence',
//   })));
// });

// // ============ ADMIN ============
// function requireAdmin(req, res, next) {
//   const telegramId = req.telegramUser.id.toString();
//   if (telegramId !== ADMIN_TELEGRAM_ID) {
//     return res.status(403).json({ error: 'Not the admin' });
//   }
//   next();
// }

// app.get('/api/admin/witnesses', validateTelegram, requireAdmin, async (req, res) => {
//   const snapshot = await db.collection('witnesses')
//     .where('status', '==', 'pending')
//     .orderBy('createdAt', 'desc')
//     .limit(50)
//     .get();
//   res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
// });

// app.post('/api/admin/witness/:id', validateTelegram, requireAdmin, async (req, res) => {
//   const { id } = req.params;
//   const { status } = req.body;
//   if (!['valid', 'fake'].includes(status)) {
//     return res.status(400).json({ error: 'Invalid status' });
//   }

//   const witnessRef = db.collection('witnesses').doc(id);
//   const witness = await witnessRef.get();
//   if (!witness.exists) return res.status(404).json({ error: 'Witness not found' });

//   const data = witness.data();
//   await witnessRef.update({ status });

//   if (status === 'valid') {
//     await db.collection('users').doc(data.reporterId).update({
//       balance: FieldValue.increment(REWARDS.witness),
//     });
//     await incrementStats({
//       totalDistributed: FieldValue.increment(REWARDS.witness),
//       totalWitnesses: FieldValue.increment(1),
//     });

//     if (data.violatorEcho) {
//       const violators = await db.collection('users')
//         .where('secretEcho', '==', data.violatorEcho)
//         .limit(1)
//         .get();
//       if (!violators.empty) {
//         await violators.docs[0].ref.update({ silentDays: 0 });
//       }
//     }
//   }

//   res.json({ success: true });
// });

// // ============ INVITE ============
// app.post('/api/invite', validateTelegram, async (req, res) => {
//   const telegramId = req.telegramUser.id.toString();
//   const userRef = db.collection('users').doc(telegramId);
//   const doc = await userRef.get();
//   const data = doc.data();

//   const canInvite = data.wasInvited || (data.silentDays || 0) >= CONFIG.INVITE_GATE_DAYS;
//   if (!canInvite) return res.status(400).json({ error: 'Not eligible to invite yet' });

//   // Check for an existing active code
//   const existing = await db.collection('invites')
//     .where('fromUserId', '==', telegramId)
//     .where('usedBy', '==', null)
//     .orderBy('createdAt', 'desc')
//     .limit(1)
//     .get();

//   if (!existing.empty) {
//     const invite = existing.docs[0].data();
//     const expiresAt = invite.expiresAt?.toDate?.();
//     if (expiresAt && expiresAt.getTime() > Date.now()) {
//       // Still valid and unused — return the same code
//       return res.json({
//         code: invite.code,
//         expiresAt: expiresAt.toISOString(),
//         reused: true,
//       });
//     }
//   }

//   // If they've already generated a code today (that was used or expired)
//   if (data.hasInvitedToday) {
//     return res.status(400).json({ error: 'Already invited today' });
//   }

//   // Generate a fresh code
//   const code = generateCode();
//   const expiresAt = new Date(Date.now() + CONFIG.INVITE_TTL_MS);

//   await db.collection('invites').add({
//     code,
//     fromUserId: telegramId,
//     usedBy: null,
//     createdAt: FieldValue.serverTimestamp(),
//     expiresAt,
//   });

//   await userRef.update({ hasInvitedToday: true });
//   res.json({ code, expiresAt: expiresAt.toISOString() });
// });

// // ============ SIGNAL — TAP ============
// app.post('/api/signal/tap', validateTelegram, async (req, res) => {
//   const senderId = req.telegramUser.id.toString();
//   const senderRef = db.collection('users').doc(senderId);

//   let result = { outcome: 'none' };

//   try {
//     await db.runTransaction(async (t) => {
//       const senderDoc = await t.get(senderRef);
//       if (!senderDoc.exists) throw new Error('User not found');
//       const sender = senderDoc.data();

//       // Daily limit
//       const today = new Date().toISOString().split('T')[0];
//       if (sender.lastSignalQueuedDate === today) {
//         throw new Error('One signal per day');
//       }

//       const now = Date.now();

//       // Look for a live partner
//       const liveSnap = await db.collection('users')
//         .where('signalLiveUntil', '>', now)
//         .limit(20)
//         .get();

//       const liveOthers = liveSnap.docs.filter(d => d.id !== senderId);

//       if (liveOthers.length > 0) {
//         // BLIND TRADE
//         const partner = liveOthers[Math.floor(Math.random() * liveOthers.length)];

//         t.update(senderRef, {
//           signalLiveUntil: 0,
//           lastSignalQueuedDate: today,
//           signalsTraded: FieldValue.increment(1),
//           balance: FieldValue.increment(REWARDS.signal),
//         });
//         t.update(partner.ref, {
//           signalLiveUntil: 0,
//           signalsTraded: FieldValue.increment(1),
//           balance: FieldValue.increment(REWARDS.signal),
//         });

//         t.set(db.collection('signals').doc(), {
//           fromUserId: senderId,
//           toUserId: partner.id,
//           traded: true,
//           at: FieldValue.serverTimestamp(),
//         });

//         result = { outcome: 'traded' };
//         return;
//       }

//       // No partner — go live
//       t.update(senderRef, {
//         signalLiveUntil: now + CONFIG.SIGNAL_LIVE_WINDOW_MS,
//         lastSignalQueuedDate: today,
//       });

//       result = { outcome: 'live' };
//     });
//   } catch (e) {
//     return res.status(400).json({ error: e.message });
//   }

//   if (result.outcome === 'traded') {
//     await incrementStats({
//       totalDistributed: FieldValue.increment(REWARDS.signal * 2),
//     });
//   }

//   res.json(result);
// });

// // ============ ACTIVITY ============
// app.get('/api/activity', async (req, res) => {
//   const wallSnap = await db.collection('wall').orderBy('createdAt', 'desc').limit(5).get();
//   const messages = [];
//   wallSnap.forEach(doc => {
//     const data = doc.data();
//     const short = data.telegramId?.slice(-6) || 'UNKNOWN';
//     messages.push(`${short} left a trace`);
//   });
//   if (messages.length === 0) {
//     messages.push('The wall is silent');
//     messages.push('They are watching');
//     messages.push('The distribution continues');
//   }
//   res.json(messages);
// });

// // ============ WALLET LINK ============
// app.post('/api/link-wallet', validateTelegram, async (req, res) => {
//   const telegramId = req.telegramUser.id.toString();
//   const { address } = req.body;
//   if (!address || typeof address !== 'string') return res.status(400).json({ error: 'Invalid address' });

//   await db.collection('users').doc(telegramId).update({ walletAddress: address });
//   res.json({ success: true, address });
// });

// // ============ WALLET STATUS ============
// // Returns the user's current block state. If the block has expired,
// // resets it in the same transaction and returns a clean state.
// app.get('/api/wallet/status', validateTelegram, async (req, res) => {
//   const telegramId = req.telegramUser.id.toString();
//   const userRef = db.collection('users').doc(telegramId);

//   try {
//     let result = null;

//     await db.runTransaction(async (t) => {
//       const doc = await t.get(userRef);
//       if (!doc.exists) {
//         result = { rejections: 0, blockedUntil: 0, reason: '' };
//         return;
//       }

//       const data = doc.data();
//       const now = Date.now();
//       const blockedUntil = data.walletBlockedUntil || 0;

//       // Block expired → reset everything atomically
//       if (blockedUntil > 0 && blockedUntil <= now) {
//         t.update(userRef, {
//           walletRejections: 0,
//           walletBlockedUntil: 0,
//           walletBlockReason: '',
//         });
//         result = { rejections: 0, blockedUntil: 0, reason: '' };
//         return;
//       }

//       result = {
//         rejections: data.walletRejections || 0,
//         blockedUntil,
//         reason: data.walletBlockReason || '',
//       };
//     });

//     res.json(result);
//   } catch (e) {
//     console.error('[wallet/status]', e);
//     res.status(500).json({ error: 'Could not read wallet status' });
//   }
// });

// // ============ WALLET REJECTION ============
// // Records a rejection. On the 4th rejection, sets a block.
// // While already blocked, this is idempotent — no state changes.
// // Uses a transaction so parallel rejections don't race.
// app.post('/api/wallet/reject', validateTelegram, async (req, res) => {
//   const telegramId = req.telegramUser.id.toString();
//   const { reason } = req.body || {};

//   if (!['balance', 'declined', 'network'].includes(reason)) {
//     return res.status(400).json({ error: 'Invalid reason' });
//   }

//   const userRef = db.collection('users').doc(telegramId);

//   try {
//     let result = null;

//     await db.runTransaction(async (t) => {
//       const doc = await t.get(userRef);
//       if (!doc.exists) throw new Error('User not found');

//       const data = doc.data();
//       const now = Date.now();
//       const currentBlockedUntil = data.walletBlockedUntil || 0;

//       // Already blocked → return existing state, no writes
//       if (currentBlockedUntil > now) {
//         result = {
//           rejections: data.walletRejections || 0,
//           blockedUntil: currentBlockedUntil,
//           reason: data.walletBlockReason || reason,
//         };
//         return;
//       }

//       const current = data.walletRejections || 0;
//       const next = current + 1;

//       const updates = {
//         walletRejections: next,
//         walletBlockReason: reason,
//       };

//       if (next >= 4) {
//         updates.walletBlockedUntil = now + CONFIG.WALLET_BLOCK_DURATION_MS;
//       }

//       t.update(userRef, updates);

//       result = {
//         rejections: next,
//         blockedUntil: updates.walletBlockedUntil || 0,
//         reason,
//       };
//     });

//     res.json(result);
//   } catch (e) {
//     console.error('[wallet/reject]', e);
//     res.status(400).json({ error: e.message });
//   }
// });

// // ============ WALLET CLEAR ============
// // Called on successful wallet link. Resets the counter and block.
// app.post('/api/wallet/clear', validateTelegram, async (req, res) => {
//   const telegramId = req.telegramUser.id.toString();
//   const userRef = db.collection('users').doc(telegramId);

//   try {
//     const doc = await userRef.get();
//     if (!doc.exists) return res.json({ success: true });

//     await userRef.update({
//       walletRejections: 0,
//       walletBlockedUntil: 0,
//       walletBlockReason: '',
//     });

//     res.json({ success: true });
//   } catch (e) {
//     console.error('[wallet/clear]', e);
//     res.status(500).json({ error: 'Could not clear wallet state' });
//   }
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`INDRI backend running on port ${PORT}`));



require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { validate, parse } = require('@telegram-apps/init-data-node');

// ==== TON imports ====
const {
  TonClient,
  WalletContractV5R1,
  WalletContractV4,
  Address,
  beginCell,
  internal,
  toNano,
  SendMode,
} = require('@ton/ton');
const { mnemonicToPrivateKey } = require('@ton/crypto');
const { getHttpEndpoint } = require('@orbs-network/ton-access');

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

// ============ CONFIG ============
const CONFIG = {
  COOLDOWN_MS: 2 * 60 * 60 * 1000,
  INVITE_GATE_DAYS: 1,
  INVITE_TTL_MS: 24 * 60 * 60 * 1000,

  // Signal system
  SIGNAL_LIVE_WINDOW_MS: 5 * 60 * 1000,
  SIGNAL_DELAY_MS: 24 * 60 * 60 * 1000,
  SIGNAL_ORDER_WEEK_MS: 7 * 24 * 60 * 60 * 1000,

  // Wallet block
  WALLET_BLOCK_DURATION_MS: 2 * 24 * 60 * 60 * 1000,

  // Claim
  MIN_CLAIM_AMOUNT: parseInt(process.env.MIN_CLAIM_AMOUNT || '1000', 10),
  CLAIM_FEE_TON: parseFloat(process.env.CLAIM_FEE_TON || '0.5'),
  CLAIM_COOLDOWN_MS: parseInt(process.env.CLAIM_COOLDOWN_MS || String(24 * 60 * 60 * 1000), 10),
  CLAIM_EXPIRY_MS: 15 * 60 * 1000,
  CLAIM_MAX_TRANSFER_ATTEMPTS: 3,
  INDRI_DECIMALS: parseInt(process.env.INDRI_DECIMALS || '9', 10),
};

// ============ REWARDS ============
const REWARDS = {
  stay: {
    tier1: 500,
    tier2: 2000,
    tier3: 5000,
    tier4: 7500,
  },
  signal: 300,
  signalRecipient: 300,
  signalDisappeared: 500,
  witness: 500,
  wallTrace: 0,
  invite: 1000,
};

function getStayReward(days) {
  if (days >= 60) return REWARDS.stay.tier4;
  if (days >= 30) return REWARDS.stay.tier3;
  if (days >= 7) return REWARDS.stay.tier2;
  return REWARDS.stay.tier1;
}

// ============ HELPERS ============
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
      orderPool: 0,
      lastOrderDistributionAt: 0,
      totalClaimed: 0,
      ...fields,
    });
  } else {
    await ref.update(fields);
  }
}

// ============ TON CLIENT (Orbs Access — no API key) ============
let tonClient = null;

async function getTonClient() {
  if (tonClient) return tonClient;
  const endpoint = await getHttpEndpoint({ network: 'mainnet' });
  tonClient = new TonClient({ endpoint });
  return tonClient;
}

async function getTreasuryWallet() {
  const client = await getTonClient();
  const mnemonic = process.env.TREASURY_MNEMONIC.split(' ');
  const keyPair = await mnemonicToPrivateKey(mnemonic);

  const walletVersion = process.env.TREASURY_WALLET_VERSION || 'v4';
  let walletContract;

  if (walletVersion === 'v4') {
    walletContract = WalletContractV5R1.create({
      workchain: 0,
      publicKey: keyPair.publicKey,
    });
  } else {
    walletContract = WalletContractV4.create({
      workchain: 0,
      publicKey: keyPair.publicKey,
    });
  }

  return {
    wallet: client.open(walletContract),
    keyPair,
    address: walletContract.address,
  };
}

async function getUserJettonWallet(ownerAddress) {
  const client = await getTonClient();
  const jettonMaster = Address.parse(process.env.INDRI_JETTON_MASTER);

  const result = await client.runMethod(jettonMaster, 'get_wallet_address', [
    { type: 'slice', cell: beginCell().storeAddress(ownerAddress).endCell() },
  ]);

  return result.stack.readAddress();
}

// ============ VERIFY CLAIM PAYMENT ============
// Checks that the on-chain transaction matches:
//   - sent by the user's linked wallet
//   - sent to the Order wallet
//   - amount >= CLAIM_FEE_TON
//   - comment contains the claimId
async function verifyClaimPayment(txHash, expectedFrom, expectedClaimId) {
  const client = await getTonClient();
  const orderWallet = Address.parse(process.env.ORDER_TON_ADDRESS);
  const fromAddress = Address.parse(expectedFrom);

  try {
    // Fetch recent transactions from the user's wallet
    const txs = await client.getTransactions(fromAddress, { limit: 20, archival: true });

    // Normalize the hash we're looking for
    const normalizedTarget = txHash.toLowerCase();

    let targetTx = null;
    for (const tx of txs) {
      const txHashHex = tx.hash().toString('hex').toLowerCase();
      if (
        txHashHex === normalizedTarget ||
        txHashHex.endsWith(normalizedTarget) ||
        normalizedTarget.endsWith(txHashHex)
      ) {
        targetTx = tx;
        break;
      }
    }

    if (!targetTx) {
      return { ok: false, reason: 'Transaction not found on-chain' };
    }

    // Extract the outgoing message
    const outMsgs = targetTx.outMessages;
    if (outMsgs.size === 0) {
      return { ok: false, reason: 'No outgoing messages in transaction' };
    }

    const outMsg = outMsgs.values().next().value;
    if (!outMsg) {
      return { ok: false, reason: 'Could not read outgoing message' };
    }

    // 1. Check destination
    const dest = outMsg.info?.dest;
    if (!dest || dest.toString() !== orderWallet.toString()) {
      return { ok: false, reason: 'Payment did not go to the Order wallet' };
    }

    // 2. Check amount
    const amountNano = outMsg.info?.value?.coins || 0n;
    const expectedNano = BigInt(Math.floor(CONFIG.CLAIM_FEE_TON * 1e9));
    const minAcceptable = (expectedNano * 99n) / 100n; // 1% slippage tolerance
    if (amountNano < minAcceptable) {
      return { ok: false, reason: `Payment too small: ${amountNano} < ${minAcceptable}` };
    }

    // 3. Check the comment contains the claimId
    const body = outMsg.body;
    if (!body) {
      return { ok: false, reason: 'Payment has no body' };
    }

    try {
      const cs = body.beginParse();
      const op = cs.loadUint(32);
      if (op !== 0) {
        return { ok: false, reason: 'Payment has no text comment' };
      }
      const comment = cs.loadStringTail();
      if (!comment.includes(expectedClaimId)) {
        return { ok: false, reason: 'Payment comment does not contain claimId' };
      }
    } catch (e) {
      return { ok: false, reason: 'Could not parse payment body' };
    }

    return { ok: true, tx: targetTx };
  } catch (e) {
    console.error('[verifyClaimPayment]', e);
    return { ok: false, reason: 'Verification error: ' + e.message };
  }
}

// ============ SEND TREASURY TRANSFER ============
async function sendTreasuryTransfer(claimId, claim) {
  const claimRef = db.collection('claims').doc(claimId);

  try {
    const { wallet, keyPair } = await getTreasuryWallet();
    const userWallet = Address.parse(claim.walletAddress);
    const userJettonWallet = await getUserJettonWallet(userWallet);

    const jettonAmount = BigInt(Math.floor(claim.amount * 10 ** CONFIG.INDRI_DECIMALS));
    const BASE_JETTON_SEND_AMOUNT = toNano('0.05');

    const jettonTransferPayload = beginCell()
      .storeUint(0xf8a7ea5, 32)      // TEP-74 transfer opcode
      .storeUint(0, 64)               // query_id
      .storeCoins(jettonAmount)       // amount of jettons
      .storeAddress(userWallet)       // destination
      .storeAddress(wallet.address)   // response_destination (excess TON)
      .storeBit(false)                // no custom payload
      .storeCoins(1n)                 // forward_ton_amount (1 nanoton)
      .storeMaybeRef(undefined)
      .endCell();

    const seqno = await wallet.getSeqno();

    await wallet.sendTransfer({
      seqno,
      secretKey: keyPair.secretKey,
      sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
      messages: [
        internal({
          to: userJettonWallet,
          value: BASE_JETTON_SEND_AMOUNT,
          body: jettonTransferPayload,
        }),
      ],
    });

    await claimRef.update({
      status: 'completed',
      completedAt: Date.now(),
      transferAttempts: FieldValue.increment(1),
    });

    await incrementStats({
      totalClaimed: FieldValue.increment(claim.amount),
    });
    await db.collection('users').doc(claim.telegramId).update({
      totalClaimed: FieldValue.increment(claim.amount),
      pendingClaimId: '',
    });

    console.log('[claim] completed', claimId, claim.amount, 'to', claim.walletAddress);
    return true;
  } catch (e) {
    console.error('[sendTreasuryTransfer]', claimId, e);
    await claimRef.update({
      transferAttempts: FieldValue.increment(1),
      lastTransferError: e.message,
      lastTransferAttemptAt: Date.now(),
    });
    return false;
  }
}

// ============ RECONCILIATION JOB ============
async function reconcileClaims() {
  const now = Date.now();

  try {
    // 1. Expire stale awaiting_payment claims (user never paid)
    const staleSnap = await db.collection('claims')
      .where('status', '==', 'awaiting_payment')
      .where('createdAt', '<', now - CONFIG.CLAIM_EXPIRY_MS)
      .limit(20)
      .get();

    for (const doc of staleSnap.docs) {
      const claim = doc.data();
      try {
        await db.runTransaction(async (t) => {
          const claimRef = db.collection('claims').doc(doc.id);
          const freshClaim = await t.get(claimRef);
          if (!freshClaim.exists) return;
          if (freshClaim.data().status !== 'awaiting_payment') return;

          t.update(claimRef, {
            status: 'expired',
            expiredAt: now,
          });

          const userRef = db.collection('users').doc(claim.telegramId);
          t.update(userRef, {
            balance: FieldValue.increment(claim.amount),
            pendingClaimId: '',
            lastClaimAt: 0,
          });
        });
        console.log('[reconcile] expired claim', doc.id, 'refunded', claim.amount);
      } catch (e) {
        console.error('[reconcile] failed to expire', doc.id, e);
      }
    }

    // 2. Retry failed treasury transfers
    const failedSnap = await db.collection('claims')
      .where('status', '==', 'payment_verified')
      .where('transferAttempts', '<', CONFIG.CLAIM_MAX_TRANSFER_ATTEMPTS)
      .limit(10)
      .get();

    for (const doc of failedSnap.docs) {
      const claim = doc.data();
      try {
        await sendTreasuryTransfer(doc.id, claim);
      } catch (e) {
        console.error('[reconcile] retry failed', doc.id, e);
      }
    }
  } catch (e) {
    console.error('[reconcile] job error', e);
  }
}

// ============ SIGNAL SYSTEM (background tasks) ============
async function promoteLiveToQueue() {
  const now = Date.now();
  const expiredSnap = await db.collection('users')
    .where('signalLiveUntil', '>', 0)
    .where('signalLiveUntil', '<', now)
    .limit(50)
    .get();

  for (const doc of expiredSnap.docs) {
    const data = doc.data();
    const queue = data.signalQueue || [];
    queue.push({ queuedAt: data.signalLiveUntil });

    await doc.ref.update({
      signalLiveUntil: 0,
      signalQueue: queue,
      signalsQueued: FieldValue.increment(1),
    });
  }
}

async function fireQueuedSignals() {
  const now = Date.now();
  const usersSnap = await db.collection('users').limit(500).get();

  for (const userDoc of usersSnap.docs) {
    const data = userDoc.data();
    const queue = data.signalQueue || [];
    if (queue.length === 0) continue;

    const ready = queue.filter(s => now - s.queuedAt >= CONFIG.SIGNAL_DELAY_MS);
    const stillQueued = queue.filter(s => now - s.queuedAt < CONFIG.SIGNAL_DELAY_MS);
    if (ready.length === 0) continue;

    for (const _ of ready) {
      await deliverSignal(userDoc.id);
    }

    await userDoc.ref.update({ signalQueue: stillQueued });
  }
}

async function deliverSignal(senderId) {
  const senderRef = db.collection('users').doc(senderId);

  const allSnap = await db.collection('users').limit(500).get();
  const others = allSnap.docs.filter(d => d.id !== senderId);

  const disappeared = others.filter(d => (d.data().silentDays || 0) === 0);
  const pool = [];
  for (let i = 0; i < 5; i++) pool.push(...disappeared);
  pool.push(...others);

  if (pool.length === 0) {
    await senderRef.update({ signalsToOrder: FieldValue.increment(1) });
    await incrementStats({
      orderPool: FieldValue.increment(REWARDS.signal),
      totalDistributed: FieldValue.increment(REWARDS.signal),
    });
    return;
  }

  const recipient = pool[Math.floor(Math.random() * pool.length)];
  const recipientData = recipient.data();
  const isDisappeared = (recipientData.silentDays || 0) === 0;
  const recipientReward = isDisappeared
    ? REWARDS.signalDisappeared
    : REWARDS.signalRecipient;

  await senderRef.update({
    signalsArrived: FieldValue.increment(1),
    balance: FieldValue.increment(REWARDS.signal),
  });

  await db.collection('users').doc(recipient.id).update({
    balance: FieldValue.increment(recipientReward),
    signalsReceived: FieldValue.increment(1),
  });

  await db.collection('signals').add({
    fromUserId: senderId,
    toUserId: recipient.id,
    traded: false,
    disappeared: isDisappeared,
    at: FieldValue.serverTimestamp(),
  });

  await incrementStats({
    totalDistributed: FieldValue.increment(REWARDS.signal + recipientReward),
  });

  await db.collection('wall').add({
    telegramId: senderId,
    date: new Date().toISOString().split('T')[0],
    signal: true,
    createdAt: FieldValue.serverTimestamp(),
  });
}

async function distributeOrderPool() {
  const statsRef = db.collection('stats').doc('global');
  const doc = await statsRef.get();
  if (!doc.exists) return;

  const data = doc.data();
  const now = Date.now();
  if ((data.lastOrderDistributionAt || 0) > now - CONFIG.SIGNAL_ORDER_WEEK_MS) return;
  if ((data.orderPool || 0) <= 0) return;

  const usersSnap = await db.collection('users').limit(500).get();
  if (usersSnap.size === 0) return;

  const perUser = Math.floor((data.orderPool || 0) / usersSnap.size);
  if (perUser < 1) return;

  const batch = db.batch();
  usersSnap.forEach(userDoc => {
    batch.update(userDoc.ref, { balance: FieldValue.increment(perUser) });
  });
  batch.update(statsRef, {
    orderPool: 0,
    lastOrderDistributionAt: now,
  });
  await batch.commit();
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

// ============ REDEEM INVITE ============
app.post('/api/redeem-invite', validateTelegram, async (req, res) => {
  const telegramId = req.telegramUser.id.toString();
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Missing code' });

  const snapshot = await db.collection('invites')
    .where('code', '==', code.toUpperCase())
    .where('usedBy', '==', null)
    .limit(1)
    .get();

  if (snapshot.empty) return res.status(400).json({ error: 'Invalid or used code' });

  const inviteDoc = snapshot.docs[0];
  const invite = inviteDoc.data();
  const expiresAt = invite.expiresAt?.toDate?.();
  if (expiresAt && expiresAt.getTime() < Date.now()) {
    return res.status(400).json({ error: 'Code expired' });
  }

  await inviteDoc.ref.update({
    usedBy: telegramId,
    usedAt: FieldValue.serverTimestamp(),
  });

  await db.collection('users').doc(telegramId).update({
    wasInvited: true,
    invitedBy: invite.fromUserId,
  });

  if (REWARDS.invite > 0 && invite.fromUserId) {
    await db.collection('users').doc(invite.fromUserId).update({
      balance: FieldValue.increment(REWARDS.invite),
    });
    await incrementStats({
      totalDistributed: FieldValue.increment(REWARDS.invite),
    });
  }

  res.json({ success: true, invitedBy: invite.fromUserId });
});

// ============ AUTH ============
app.post('/api/auth', validateTelegram, async (req, res) => {
  const telegramId = req.telegramUser.id.toString();
  const userRef = db.collection('users').doc(telegramId);
  const doc = await userRef.get();

  const isAdmin = telegramId === ADMIN_TELEGRAM_ID;

  if (!doc.exists) {
    const statsRef = db.collection('stats').doc('global');
    const statsDoc = await statsRef.get();
    const currentCount = statsDoc.exists ? (statsDoc.data().totalMembers || 0) : 0;
    const newEntryNumber = currentCount + 1;

    const newUser = {
      telegramId,
      username: req.telegramUser.username || '',
      firstName: req.telegramUser.first_name || '',
      silentDays: 0,
      balance: 0,
      secretEcho: generateEcho(),
      entryNumber: newEntryNumber,
      lastStayAt: 0,
      wallMarks: [],
      hasMarkedToday: false,
      wasInvited: false,
      invitedBy: '',
      hasVowed: false,
      hasInvitedToday: false,
      signalsReceived: 0,
      signalsSent: 0,
      signalLiveUntil: 0,
      signalQueue: [],
      lastSignalQueuedDate: '',
      signalsQueued: 0,
      signalsArrived: 0,
      signalsTraded: 0,
      signalsToOrder: 0,
      walletAddress: '',
      walletRejections: 0,
      walletBlockedUntil: 0,
      walletBlockReason: '',
      lastClaimAt: 0,
      pendingClaimId: '',
      totalClaimed: 0,
      createdAt: FieldValue.serverTimestamp(),
    };
    await userRef.set(newUser);
    await incrementStats({ totalMembers: FieldValue.increment(1) });

    promoteLiveToQueue().catch(() => {});
    fireQueuedSignals().catch(() => {});
    distributeOrderPool().catch(() => {});
    reconcileClaims().catch(() => {});

    return res.json({ ...newUser, isAdmin, createdAt: null });
  }

  promoteLiveToQueue().catch(() => {});
  fireQueuedSignals().catch(() => {});
  distributeOrderPool().catch(() => {});
  reconcileClaims().catch(() => {});

  res.json({ ...doc.data(), isAdmin });
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
      if (now - (data.lastStayAt || 0) < CONFIG.COOLDOWN_MS) throw new Error('Cooldown active');

      const days = data.silentDays || 0;
      const multiplier = getStayReward(days);

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

// ============ LEDGER ============
app.get('/api/ledger', async (req, res) => {
  const statsDoc = await db.collection('stats').doc('global').get();
  const stats = statsDoc.exists ? statsDoc.data() : {};

  const usersSnap = await db.collection('users').select('balance').get();
  let awaitingClaim = 0;
  usersSnap.forEach(doc => {
    awaitingClaim += doc.data().balance || 0;
  });

  res.json({
    totalDistributed: stats.totalDistributed || 0,
    totalMembers: stats.totalMembers || 0,
    awaitingClaim,
    orderPool: stats.orderPool || 0,
  });
});

// ============ FIRST 100 ============
app.get('/api/first100', async (req, res) => {
  const snapshot = await db.collection('users').orderBy('entryNumber', 'asc').limit(100).get();
  res.json(snapshot.docs.map(doc => ({
    secretEcho: doc.data().secretEcho,
    silentDays: doc.data().silentDays || 0,
  })));
});

// ============ REFERRAL CHAIN ============
app.get('/api/chain', validateTelegram, async (req, res) => {
  const telegramId = req.telegramUser.id.toString();
  const userRef = db.collection('users').doc(telegramId);
  const userDoc = await userRef.get();
  if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });

  const user = userDoc.data();

  const ancestors = [];
  let currentInviterId = user.invitedBy;

  for (let i = 0; i < 20 && currentInviterId; i++) {
    const inviterDoc = await db.collection('users').doc(currentInviterId).get();
    if (!inviterDoc.exists) break;
    const inviter = inviterDoc.data();
    ancestors.unshift({
      echo: inviter.secretEcho,
      entryNumber: inviter.entryNumber,
      silentDays: inviter.silentDays || 0,
    });
    currentInviterId = inviter.invitedBy;
  }

  const childrenSnap = await db.collection('users')
    .where('invitedBy', '==', telegramId)
    .limit(20)
    .get();

  const children = childrenSnap.docs.map(doc => {
    const d = doc.data();
    return {
      echo: d.secretEcho,
      entryNumber: d.entryNumber,
      silentDays: d.silentDays || 0,
    };
  });

  res.json({
    self: {
      echo: user.secretEcho,
      entryNumber: user.entryNumber,
      silentDays: user.silentDays || 0,
    },
    ancestors,
    children,
  });
});

// ============ WITNESS ============
app.post('/api/witness', validateTelegram, async (req, res) => {
  const reporterId = req.telegramUser.id.toString();
  const { link, violatorEcho, note } = req.body;
  if (!link) return res.status(400).json({ error: 'Missing link' });

  await db.collection('witnesses').add({
    reporterId,
    link,
    violatorEcho: (violatorEcho || '').trim().toUpperCase(),
    note: (note || '').trim(),
    status: 'pending',
    createdAt: FieldValue.serverTimestamp(),
  });

  res.json({ success: true });
});

// ============ DISAPPEARED ============
app.get('/api/disappeared', async (req, res) => {
  const snapshot = await db.collection('witnesses').where('status', '==', 'valid').limit(50).get();
  res.json(snapshot.docs.map(doc => ({
    echo: doc.data().violatorEcho || 'UNKNOWN',
    days: 0,
    reason: doc.data().note || 'Broke the silence',
  })));
});

// ============ ADMIN ============
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
  const { status } = req.body;
  if (!['valid', 'fake'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const witnessRef = db.collection('witnesses').doc(id);
  const witness = await witnessRef.get();
  if (!witness.exists) return res.status(404).json({ error: 'Witness not found' });

  const data = witness.data();
  await witnessRef.update({ status });

  if (status === 'valid') {
    await db.collection('users').doc(data.reporterId).update({
      balance: FieldValue.increment(REWARDS.witness),
    });
    await incrementStats({
      totalDistributed: FieldValue.increment(REWARDS.witness),
      totalWitnesses: FieldValue.increment(1),
    });

    if (data.violatorEcho) {
      const violators = await db.collection('users')
        .where('secretEcho', '==', data.violatorEcho)
        .limit(1)
        .get();
      if (!violators.empty) {
        await violators.docs[0].ref.update({ silentDays: 0 });
      }
    }
  }

  res.json({ success: true });
});

// ============ INVITE ============
app.post('/api/invite', validateTelegram, async (req, res) => {
  const telegramId = req.telegramUser.id.toString();
  const userRef = db.collection('users').doc(telegramId);
  const doc = await userRef.get();
  const data = doc.data();

  const canInvite = data.wasInvited || (data.silentDays || 0) >= CONFIG.INVITE_GATE_DAYS;
  if (!canInvite) return res.status(400).json({ error: 'Not eligible to invite yet' });

  const existing = await db.collection('invites')
    .where('fromUserId', '==', telegramId)
    .where('usedBy', '==', null)
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();

  if (!existing.empty) {
    const invite = existing.docs[0].data();
    const expiresAt = invite.expiresAt?.toDate?.();
    if (expiresAt && expiresAt.getTime() > Date.now()) {
      return res.json({
        code: invite.code,
        expiresAt: expiresAt.toISOString(),
        reused: true,
      });
    }
  }

  if (data.hasInvitedToday) {
    return res.status(400).json({ error: 'Already invited today' });
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + CONFIG.INVITE_TTL_MS);

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

// ============ SIGNAL — TAP ============
app.post('/api/signal/tap', validateTelegram, async (req, res) => {
  const senderId = req.telegramUser.id.toString();
  const senderRef = db.collection('users').doc(senderId);

  let result = { outcome: 'none' };

  try {
    await db.runTransaction(async (t) => {
      const senderDoc = await t.get(senderRef);
      if (!senderDoc.exists) throw new Error('User not found');
      const sender = senderDoc.data();

      const today = new Date().toISOString().split('T')[0];
      if (sender.lastSignalQueuedDate === today) {
        throw new Error('One signal per day');
      }

      const now = Date.now();

      const liveSnap = await db.collection('users')
        .where('signalLiveUntil', '>', now)
        .limit(20)
        .get();

      const liveOthers = liveSnap.docs.filter(d => d.id !== senderId);

      if (liveOthers.length > 0) {
        const partner = liveOthers[Math.floor(Math.random() * liveOthers.length)];

        t.update(senderRef, {
          signalLiveUntil: 0,
          lastSignalQueuedDate: today,
          signalsTraded: FieldValue.increment(1),
          balance: FieldValue.increment(REWARDS.signal),
        });
        t.update(partner.ref, {
          signalLiveUntil: 0,
          signalsTraded: FieldValue.increment(1),
          balance: FieldValue.increment(REWARDS.signal),
        });

        t.set(db.collection('signals').doc(), {
          fromUserId: senderId,
          toUserId: partner.id,
          traded: true,
          at: FieldValue.serverTimestamp(),
        });

        result = { outcome: 'traded' };
        return;
      }

      t.update(senderRef, {
        signalLiveUntil: now + CONFIG.SIGNAL_LIVE_WINDOW_MS,
        lastSignalQueuedDate: today,
      });

      result = { outcome: 'live' };
    });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }

  if (result.outcome === 'traded') {
    await incrementStats({
      totalDistributed: FieldValue.increment(REWARDS.signal * 2),
    });
  }

  res.json(result);
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

// ============ WALLET STATUS ============
app.get('/api/wallet/status', validateTelegram, async (req, res) => {
  const telegramId = req.telegramUser.id.toString();
  const userRef = db.collection('users').doc(telegramId);

  try {
    let result = null;

    await db.runTransaction(async (t) => {
      const doc = await t.get(userRef);
      if (!doc.exists) {
        result = { rejections: 0, blockedUntil: 0, reason: '' };
        return;
      }

      const data = doc.data();
      const now = Date.now();
      const blockedUntil = data.walletBlockedUntil || 0;

      if (blockedUntil > 0 && blockedUntil <= now) {
        t.update(userRef, {
          walletRejections: 0,
          walletBlockedUntil: 0,
          walletBlockReason: '',
        });
        result = { rejections: 0, blockedUntil: 0, reason: '' };
        return;
      }

      result = {
        rejections: data.walletRejections || 0,
        blockedUntil,
        reason: data.walletBlockReason || '',
      };
    });

    res.json(result);
  } catch (e) {
    console.error('[wallet/status]', e);
    res.status(500).json({ error: 'Could not read wallet status' });
  }
});

// ============ WALLET REJECTION ============
app.post('/api/wallet/reject', validateTelegram, async (req, res) => {
  const telegramId = req.telegramUser.id.toString();
  const { reason } = req.body || {};

  if (!['balance', 'declined', 'network'].includes(reason)) {
    return res.status(400).json({ error: 'Invalid reason' });
  }

  const userRef = db.collection('users').doc(telegramId);

  try {
    let result = null;

    await db.runTransaction(async (t) => {
      const doc = await t.get(userRef);
      if (!doc.exists) throw new Error('User not found');

      const data = doc.data();
      const now = Date.now();
      const currentBlockedUntil = data.walletBlockedUntil || 0;

      if (currentBlockedUntil > now) {
        result = {
          rejections: data.walletRejections || 0,
          blockedUntil: currentBlockedUntil,
          reason: data.walletBlockReason || reason,
        };
        return;
      }

      const current = data.walletRejections || 0;
      const next = current + 1;

      const updates = {
        walletRejections: next,
        walletBlockReason: reason,
      };

      if (next >= 4) {
        updates.walletBlockedUntil = now + CONFIG.WALLET_BLOCK_DURATION_MS;
      }

      t.update(userRef, updates);

      result = {
        rejections: next,
        blockedUntil: updates.walletBlockedUntil || 0,
        reason,
      };
    });

    res.json(result);
  } catch (e) {
    console.error('[wallet/reject]', e);
    res.status(400).json({ error: e.message });
  }
});

// ============ WALLET CLEAR ============
app.post('/api/wallet/clear', validateTelegram, async (req, res) => {
  const telegramId = req.telegramUser.id.toString();
  const userRef = db.collection('users').doc(telegramId);

  try {
    const doc = await userRef.get();
    if (!doc.exists) return res.json({ success: true });

    await userRef.update({
      walletRejections: 0,
      walletBlockedUntil: 0,
      walletBlockReason: '',
    });

    res.json({ success: true });
  } catch (e) {
    console.error('[wallet/clear]', e);
    res.status(500).json({ error: 'Could not clear wallet state' });
  }
});

// ============ CLAIM: INITIATE ============
app.post('/api/claim', validateTelegram, async (req, res) => {
  const telegramId = req.telegramUser.id.toString();
  const userRef = db.collection('users').doc(telegramId);

  try {
    let result = null;

    await db.runTransaction(async (t) => {
      const doc = await t.get(userRef);
      if (!doc.exists) throw new Error('User not found');

      const data = doc.data();
      const now = Date.now();

      if (!data.walletAddress) {
        throw new Error('No wallet linked');
      }

      const balance = data.balance || 0;
      if (balance < CONFIG.MIN_CLAIM_AMOUNT) {
        throw new Error(`Minimum claim is ${CONFIG.MIN_CLAIM_AMOUNT} $INDRI`);
      }

      const lastClaimAt = data.lastClaimAt || 0;
      if (now - lastClaimAt < CONFIG.CLAIM_COOLDOWN_MS) {
        throw new Error('Claim cooldown active');
      }

      const claimId = db.collection('claims').doc().id;
      const amount = balance;

      t.update(userRef, {
        balance: 0,
        lastClaimAt: now,
        pendingClaimId: claimId,
      });

      t.set(db.collection('claims').doc(claimId), {
        telegramId,
        walletAddress: data.walletAddress,
        amount,
        feeTON: CONFIG.CLAIM_FEE_TON,
        status: 'awaiting_payment',
        createdAt: now,
        transferAttempts: 0,
      });

      result = {
        claimId,
        amount,
        feeTON: CONFIG.CLAIM_FEE_TON,
        orderWallet: process.env.ORDER_TON_ADDRESS,
      };
    });

    res.json(result);
  } catch (e) {
    console.error('[claim/initiate]', e);
    res.status(400).json({ error: e.message });
  }
});

// ============ CLAIM: CONFIRM ============
app.post('/api/claim/confirm', validateTelegram, async (req, res) => {
  const telegramId = req.telegramUser.id.toString();
  const { claimId, txHash } = req.body;

  if (!claimId || !txHash) {
    return res.status(400).json({ error: 'Missing claimId or txHash' });
  }

  const claimRef = db.collection('claims').doc(claimId);

  try {
    const claimDoc = await claimRef.get();
    if (!claimDoc.exists) return res.status(404).json({ error: 'Claim not found' });

    const claim = claimDoc.data();
    if (claim.telegramId !== telegramId) {
      return res.status(403).json({ error: 'Not your claim' });
    }
    if (claim.status !== 'awaiting_payment') {
      return res.status(400).json({ error: 'Claim already processed' });
    }

    // Verify payment on-chain
    const verification = await verifyClaimPayment(
      txHash,
      claim.walletAddress,
      claimId
    );

    if (!verification.ok) {
      console.warn('[claim/confirm] verification failed:', verification.reason);
      await claimRef.update({
        status: 'payment_failed',
        failureReason: verification.reason,
        failedAt: Date.now(),
      });
      await db.collection('users').doc(telegramId).update({
        balance: FieldValue.increment(claim.amount),
        pendingClaimId: '',
        lastClaimAt: 0,
      });
      return res.status(400).json({ error: 'Payment not verified' });
    }

    // Mark payment verified, then attempt transfer
    await claimRef.update({
      status: 'payment_verified',
      paymentTxHash: txHash,
      verifiedAt: Date.now(),
    });

    const sent = await sendTreasuryTransfer(claimId, claim);

    if (!sent) {
      return res.status(202).json({
        success: false,
        status: 'pending_transfer',
        message: 'Payment received. Transfer is being processed.',
      });
    }

    res.json({ success: true, amount: claim.amount });
  } catch (e) {
    console.error('[claim/confirm]', e);
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`INDRI backend running on port ${PORT}`));