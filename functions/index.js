const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { setGlobalOptions } = require('firebase-functions/v2');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

initializeApp();
setGlobalOptions({ maxInstances: 20 });

// Ajustar para a regiao do Firestore se diferente (eur3 -> europe-west1).
const REGION = 'europe-west1';
const db = getFirestore();
const msg = getMessaging();
const DEAD_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token'
]);
const clip = (s, n) => String(s || '').trim().slice(0, n);

async function pushToUser(uid, { title, body, url, tag, data }) {
  const snap = await db.collection('users').doc(uid).collection('tokens').get();
  if (snap.empty) return;
  const entries = snap.docs.map(d => ({ ref: d.ref, token: d.data().token })).filter(x => x.token);
  if (!entries.length) return;

  for (let i = 0; i < entries.length; i += 500) {
    const chunk = entries.slice(i, i + 500);
    const res = await msg.sendEachForMulticast({
      tokens: chunk.map(x => x.token),
      notification: { title, body },
      data: { url, tag, ...data },
      webpush: { headers: { Topic: tag } },
      android: { collapseKey: tag, priority: 'high' },
      apns: { headers: { 'apns-collapse-id': tag }, payload: { aps: { sound: 'default' } } }
    });
    const stale = chunk.filter((_, idx) => {
      const r = res.responses[idx];
      return r && !r.success && DEAD_CODES.has(r.error && r.error.code);
    });
    if (stale.length) await Promise.all(stale.map(x => x.ref.delete().catch(() => {})));
  }
}

async function getPostTitle(owner, aid) {
  const doc = await db.doc(`activities/${owner}/items/${aid}`).get();
  return clip(doc.exists && doc.data().title ? doc.data().title : 'atividade', 80);
}

// 1) Pedido de amizade recebido
exports.onFriendRequest = onDocumentCreated({ document: 'requests/{id}', region: REGION }, async e => {
  const d = e.data && e.data.data();
  if (!d || d.status !== 'pending' || !d.to || !d.from || d.from === d.to) return;
  const actorName = clip(d.fromName || 'Atleta', 60);
  const nid = `req_${d.from}`;
  const t = Date.now();
  await db.doc(`users/${d.to}/notifications/${nid}`).set({
    type: 'friend_request', actorId: d.from, actorName, entityType: 'friendship',
    entityId: d.from, postTitle: '', text: '', count: 1, read: false, t
  });
  await pushToUser(d.to, {
    title: 'Novo pedido de amizade',
    body: `${actorName} quer ser teu amigo na KeepRun`,
    url: '?tab=groups',
    tag: nid,
    data: { nid, type: 'friend_request', entityId: d.from }
  });
});

// 2) Pedido de amizade aceite
exports.onFriendAccepted = onDocumentUpdated({ document: 'requests/{id}', region: REGION }, async e => {
  const bef = e.data && e.data.before.data();
  const aft = e.data && e.data.after.data();
  if (!bef || !aft || bef.status !== 'pending' || aft.status !== 'accepted') return;
  if (!aft.from || !aft.to || aft.from === aft.to) return;

  const uDoc = await db.doc(`users/${aft.to}`).get();
  const actorName = clip(uDoc.exists && uDoc.data().name ? uDoc.data().name : 'Amigo', 60);
  const nid = `acc_${aft.to}`;
  const t = Date.now();
  await db.doc(`users/${aft.from}/notifications/${nid}`).set({
    type: 'friend_accepted', actorId: aft.to, actorName, entityType: 'friendship',
    entityId: aft.to, postTitle: '', text: '', count: 1, read: false, t
  });
  await pushToUser(aft.from, {
    title: 'Pedido aceite',
    body: `${actorName} aceitou o teu pedido de amizade`,
    url: '?tab=groups',
    tag: nid,
    data: { nid, type: 'friend_accepted', entityId: aft.to }
  });
});

// 3) Novo Keep (like) com colapsamento transacional por atividade
exports.onPostLike = onDocumentCreated({ document: 'activities/{owner}/items/{aid}/kudos/{kid}', region: REGION }, async e => {
  const d = e.data && e.data.data();
  const { owner, aid, kid } = e.params;
  if (!d || !owner || !aid || kid === owner) return;

  const actorName = clip(d.name || 'Amigo', 60);
  const postTitle = await getPostTitle(owner, aid);
  const nid = `like_${aid}`;
  const ref = db.doc(`users/${owner}/notifications/${nid}`);
  const t = Date.now();

  const count = await db.runTransaction(async tx => {
    const cur = await tx.get(ref);
    const prev = cur.exists ? cur.data() : null;
    const next = prev && prev.read === false ? (Number(prev.count) || 1) + 1 : 1;
    tx.set(ref, {
      type: 'post_like', actorId: kid, actorName, entityType: 'post',
      entityId: aid, postTitle, text: '', count: next, read: false, t
    });
    return next;
  });

  const body = count > 1
    ? `${actorName} e mais ${count - 1} deram Keep em "${postTitle}"`
    : `${actorName} deu Keep em "${postTitle}"`;
  await pushToUser(owner, {
    title: 'Novo Keep!',
    body,
    url: `?post=${encodeURIComponent(aid)}`,
    tag: nid,
    data: { nid, type: 'post_like', entityId: aid }
  });
});

// 4) Novo comentário recebido numa atividade
exports.onPostComment = onDocumentCreated({ document: 'activities/{owner}/items/{aid}/comments/{cid}', region: REGION }, async e => {
  const d = e.data && e.data.data();
  const { owner, aid, cid } = e.params;
  if (!d || !d.uid || d.uid === owner) return;

  const actorName = clip(d.name || 'Amigo', 60);
  const text = clip(d.text, 120);
  const postTitle = await getPostTitle(owner, aid);
  const nid = `cmt_${aid}_${cid}`;
  const t = Date.now();

  await db.doc(`users/${owner}/notifications/${nid}`).set({
    type: 'post_comment', actorId: d.uid, actorName, entityType: 'post',
    entityId: aid, postTitle, text, count: 1, read: false, t
  });
  await pushToUser(owner, {
    title: `${actorName} comentou "${postTitle}"`,
    body: text || 'Novo comentário na tua atividade',
    url: `?post=${encodeURIComponent(aid)}`,
    tag: `cmt_${aid}`,
    data: { nid, type: 'post_comment', entityId: aid }
  });
});
