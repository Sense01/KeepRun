// KeepRun Free Web Push Worker (Cloudflare Workers Free + KV + Web Crypto RFC 8291/8292).
// Zero dependências externas, zero plano Blaze, zero cartão de crédito.
const TE = new TextEncoder(), TD = new TextDecoder();
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = s => Uint8Array.from(atob(String(s).replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), c => c.charCodeAt(0));
const concat = (...arrs) => { const out = new Uint8Array(arrs.reduce((n, a) => n + a.length, 0)); let o = 0; for (const a of arrs) { out.set(a, o); o += a.length; } return out; };
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type,Authorization' };
const json = (d, status = 200) => new Response(JSON.stringify(d), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

let jwkCache = { exp: 0, keys: null };
async function getFirebaseKeys() {
  if (jwkCache.keys && Date.now() < jwkCache.exp) return jwkCache.keys;
  const r = await fetch('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com');
  if (!r.ok) throw new Error('JWKS fetch failed');
  const cc = r.headers.get('cache-control') || '', m = cc.match(/max-age=(\d+)/);
  const { keys } = await r.json();
  jwkCache = { keys: Object.fromEntries(keys.map(k => [k.kid, k])), exp: Date.now() + (m ? +m[1] * 1000 : 3600000) };
  return jwkCache.keys;
}

async function verifyFirebaseJwt(token, projectId) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;
  const hdr = JSON.parse(TD.decode(unb64u(parts[0])));
  const pay = JSON.parse(TD.decode(unb64u(parts[1])));
  const now = Math.floor(Date.now() / 1000);
  if (hdr.alg !== 'RS256' || !hdr.kid) return null;
  if (pay.aud !== projectId || pay.iss !== `https://securetoken.google.com/${projectId}`) return null;
  if (!pay.sub || pay.exp <= now || pay.iat > now + 300) return null;
  const keys = await getFirebaseKeys(), jwk = keys[hdr.kid];
  if (!jwk) return null;
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, unb64u(parts[2]), TE.encode(`${parts[0]}.${parts[1]}`));
  return ok ? String(pay.sub) : null;
}

async function signVapidJwt(aud, pubB64, privB64) {
  const pub = unb64u(pubB64);
  if (pub.length !== 65 || pub[0] !== 4) throw new Error('Invalid VAPID public key');
  const jwk = { kty: 'EC', crv: 'P-256', x: b64u(pub.slice(1, 33)), y: b64u(pub.slice(33, 65)), d: privB64 };
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const exp = Math.floor(Date.now() / 1000) + 43200;
  const input = `${b64u(TE.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })))}.${b64u(TE.encode(JSON.stringify({ aud, exp, sub: 'mailto:push@keeprun.app' })))}`;
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, TE.encode(input));
  return `${input}.${b64u(sig)}`;
}

// Cifragem Web Push RFC 8291 (aes128gcm) 100% em Web Crypto nativo.
async function encryptWebPush(payloadObj, sub) {
  const uaPub = unb64u(sub.keys.p256dh), authSec = unb64u(sub.keys.auth);
  if (uaPub.length !== 65 || uaPub[0] !== 4 || authSec.length !== 16) throw new Error('Invalid subscription keys');
  const asPair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asPub = new Uint8Array(await crypto.subtle.exportKey('raw', asPair.publicKey));
  const uaKey = await crypto.subtle.importKey('raw', uaPub, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const shared = await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, asPair.privateKey, 256);

  const prkKey = await crypto.subtle.importKey('raw', shared, 'HKDF', false, ['deriveBits']);
  const ikm = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: authSec, info: concat(TE.encode('WebPush: info\x00'), uaPub, asPub) }, prkKey, 256);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const ikmKey = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  const cekBits = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info: TE.encode('Content-Encoding: aes128gcm\x00') }, ikmKey, 128);
  const nonce = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info: TE.encode('Content-Encoding: nonce\x00') }, ikmKey, 96);

  const cek = await crypto.subtle.importKey('raw', cekBits, { name: 'AES-GCM' }, false, ['encrypt']);
  const plain = concat(TE.encode(JSON.stringify(payloadObj)), new Uint8Array([2]));
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce, tagLength: 128 }, cek, plain));
  const rs = new Uint8Array([0, 0, 16, 0, asPub.length]);
  return concat(salt, rs, asPub, cipher);
}

async function authorizedPush(projectId, token, fromUid, toUid, type, entityId) {
  const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
  const seg = s => encodeURIComponent(String(s || ''));
  let path = '';
  if (type === 'friend_request') path = `/requests/${seg(toUid + '_' + fromUid)}`;
  else if (type === 'friend_accepted') path = `/users/${seg(fromUid)}/friends/${seg(toUid)}`;
  else if ((type === 'post_like' || type === 'post_comment') && entityId) path = `/activities/${seg(toUid)}/items/${seg(entityId)}`;
  else return false;
  const r = await fetch(base + path, { headers: { Authorization: `Bearer ${token}` } });
  return r.ok;
}

const validSub = s => {
  try {
    if (!s || !s.endpoint || !s.keys) return false;
    if (new URL(s.endpoint).protocol !== 'https:') return false;
    const p = unb64u(s.keys.p256dh), a = unb64u(s.keys.auth);
    return p.length === 65 && p[0] === 4 && a.length === 16;
  } catch (e) { return false; }
};

export { encryptWebPush, signVapidJwt, verifyFirebaseJwt, validSub };

export default {
  async fetch(req, env, ctx) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    if (!env.SUBS || !env.FIREBASE_PROJECT || !env.VAPID_PUBLIC || !env.VAPID_PRIVATE) return json({ error: 'Worker not configured' }, 500);

    const auth = req.headers.get('Authorization') || '', token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    const uid = await verifyFirebaseJwt(token, env.FIREBASE_PROJECT).catch(() => null);
    if (!uid) return json({ error: 'Unauthorized' }, 401);

    let body = {};
    try { body = await req.json(); } catch (e) { return json({ error: 'Invalid JSON' }, 400); }
    const path = new URL(req.url).pathname;

    if (path === '/subscribe') {
      const s = body.subscription;
      if (!validSub(s)) return json({ error: 'Invalid subscription' }, 400);
      const cur = (await env.SUBS.get('u:' + uid, 'json')) || [];
      const next = [...cur.filter(x => x.endpoint !== s.endpoint), { endpoint: s.endpoint, keys: { p256dh: s.keys.p256dh, auth: s.keys.auth } }].slice(-5);
      await env.SUBS.put('u:' + uid, JSON.stringify(next));
      return json({ ok: true, count: next.length });
    }

    if (path === '/unsubscribe') {
      const ep = body.endpoint;
      if (!ep) { await env.SUBS.delete('u:' + uid); return json({ ok: true }); }
      const cur = (await env.SUBS.get('u:' + uid, 'json')) || [];
      const next = cur.filter(x => x.endpoint !== ep);
      next.length ? await env.SUBS.put('u:' + uid, JSON.stringify(next)) : await env.SUBS.delete('u:' + uid);
      return json({ ok: true });
    }

    if (path === '/push') {
      const { to, type, entityId, title, body: msgBody, url, tag, nid } = body;
      if (!to || to === uid) return json({ error: 'Invalid target' }, 400);
      if (!(await authorizedPush(env.FIREBASE_PROJECT, token, uid, to, type, entityId))) return json({ error: 'Forbidden' }, 403);
      const subs = (await env.SUBS.get('u:' + to, 'json')) || [];
      if (!subs.length) return json({ ok: true, sent: 0 });

      const payload = { notification: { title: String(title || 'KeepRun').slice(0, 80), body: String(msgBody || '').slice(0, 180) }, data: { url: String(url || './').slice(0, 120), tag: String(tag || 'kr').slice(0, 60), type: String(type || ''), entityId: String(entityId || ''), nid: String(nid || '') } };
      const topic = String(tag || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32);
      const stale = new Set();
      let sent = 0;

      await Promise.all(subs.map(async s => {
        try {
          const aud = new URL(s.endpoint).origin;
          const [jwt, enc] = await Promise.all([signVapidJwt(aud, env.VAPID_PUBLIC, env.VAPID_PRIVATE), encryptWebPush(payload, s)]);
          const headers = { Authorization: `vapid t=${jwt}, k=${env.VAPID_PUBLIC}`, 'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream', TTL: '86400', Urgency: 'high' };
          if (topic) headers.Topic = topic;
          const res = await fetch(s.endpoint, { method: 'POST', headers, body: enc });
          if (res.ok || res.status === 201) sent++;
          else if (res.status === 404 || res.status === 410) stale.add(s.endpoint);
        } catch (e) {}
      }));

      if (stale.size) {
        const kept = subs.filter(s => !stale.has(s.endpoint));
        ctx.waitUntil(kept.length ? env.SUBS.put('u:' + to, JSON.stringify(kept)) : env.SUBS.delete('u:' + to));
      }
      return json({ ok: true, sent });
    }

    return json({ error: 'Not found' }, 404);
  }
};
