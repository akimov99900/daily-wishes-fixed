// Daily Wish vote endpoint
// Validates fid/date and increments counters in Vercel KV using SADD/INCR.
// Env vars for Vercel KV:
// - KV_REST_API_URL
// - KV_REST_API_TOKEN
// - KV_URL (optional)

import { wishes } from '../data/wishes';
import { getTodayUtc } from '../utils/date';
import { wishIndex } from '../utils/selection';

let kv;
try {
  ({ kv } = await import('@vercel/kv'));
} catch (e) {
  kv = null;
}

function html(strings, ...values) {
  return String.raw({ raw: strings }, ...values);
}

function parseBody(req) {
  const anyReq = req;
  const body = anyReq.body;
  if (!body) return {};
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch (_) {
      return {};
    }
  }
  return body;
}

function parseFidAndChoice(req) {
  const body = parseBody(req);
  let fid;
  let choice;
  try {
    if (body && body.untrustedData) {
      if (typeof body.untrustedData.fid === 'number') fid = body.untrustedData.fid;
      const idx = body.untrustedData.buttonIndex;
      if (idx === 1) choice = 'like';
      if (idx === 2) choice = 'dislike';
    }
  } catch (_) {}
  const q = req.query || {};
  if (fid == null && q.fid != null) {
    const n = Number(q.fid);
    fid = Number.isNaN(n) ? String(q.fid) : n;
  }
  if (!choice && q.choice) {
    const c = String(q.choice);
    if (c === 'like' || c === 'dislike') choice = c;
  }
  return { fid, choice };
}

async function getStats(date, idx) {
  const base = `dw:vote:${date}:${idx}`;
  if (!kv) return { likes: 0, dislikes: 0 };
  try {
    const [likes, dislikes] = await Promise.all([
      kv.get(`${base}:likes`).then((v) => Number(v || 0)),
      kv.get(`${base}:dislikes`).then((v) => Number(v || 0))
    ]);
    return { likes, dislikes };
  } catch (_) {
    return { likes: 0, dislikes: 0 };
  }
}

function pct(likes, dislikes) {
  const total = Math.max(1, likes + dislikes);
  const likesPct = Math.round((likes / total) * 100);
  const dislikesPct = 100 - likesPct;
  const votes = likes + dislikes;
  return { likesPct, dislikesPct, votes };
}

function renderWish({ date, wish, fid, likes, dislikes, thanks, canVote }) {
  const { likesPct, dislikesPct, votes } = pct(likes, dislikes);
  const statsLine = `Likes ${likesPct}% • Dislikes ${dislikesPct}% • ${votes} votes`;
  const hasFid = fid !== undefined && fid !== null && fid !== '';

  const baseHead = html`<meta property="fc:frame" content="vNext" />
  ${canVote ? '<meta property="fc:frame:post_url" content="/api/vote" />' : ''}
  ${canVote ? '<meta property="fc:frame:button:1" content="👍 Like" />' : ''}
  ${canVote ? '<meta property="fc:frame:button:2" content="👎 Dislike" />' : ''}
  <meta property="og:title" content="Today\'s Wish" />
  <meta property="og:description" content="' + wish.replace(/"/g, '\\"') + '" />`;

  return html`<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      ${baseHead}
    </head>
    <body>
      <main>
        <h1>Daily Wish for ${date}</h1>
        <p>${wish}</p>
        <p>${statsLine}</p>
        ${thanks ? '<p>Thank you!</p>' : ''}
        ${!hasFid ? '<p>(Sign-in not detected; voting disabled)</p>' : ''}
      </main>
    </body>
  </html>`;
}

export default async function handler(req, res) {
  const method = (req.method || 'POST').toUpperCase();
  if (method !== 'POST') {
    // Treat non-POST as non-voting flow
    req.method = 'POST';
  }

  let date = getTodayUtc();
  const { fid, choice } = parseFidAndChoice(req);
  try {
    const q = (req as any).query || {};
    if (typeof q.date === 'string') date = q.date;
    const body = parseBody(req);
    if (body && typeof body.date === 'string') date = body.date;
  } catch (_) {}

  const idx = wishIndex(fid, date, wishes.length);
  const wish = wishes[idx];

  let likes = 0;
  let dislikes = 0;

  let voted = false;

  if (kv && fid != null) {
    try {
      const base = `dw:vote:${date}:${idx}`;
      // unique voter attempt
      const added = await kv.sadd(`${base}:voters`, String(fid));
      if (added === 1 && (choice === 'like' || choice === 'dislike')) {
        voted = true;
        if (choice === 'like') await kv.incr(`${base}:likes`);
        if (choice === 'dislike') await kv.incr(`${base}:dislikes`);
      }
    } catch (_) {
      // ignore KV errors; fall through
    }
  }

  const stats = await getStats(date, idx);
  likes = stats.likes;
  dislikes = stats.dislikes;

  const canVote = false; // After vote (or missing fid), always disable

  res.setHeader('Content-Type', 'text/html');
  return res.status(200).send(
    renderWish({
      date,
      wish,
      fid,
      likes,
      dislikes,
      thanks: true,
      canVote
    })
  );
}
