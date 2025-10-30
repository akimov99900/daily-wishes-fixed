// Daily Wish Frame endpoint
// Expects GET (entry) or POST (reveal + voting options)
// Vercel KV is used in /api/vote, but this endpoint reads stats to render live counts.
// Env vars for Vercel KV (read-only usage here):
// - KV_URL (optional in serverless runtime)
// - KV_REST_API_URL (required for @vercel/kv outside of Edge)
// - KV_REST_API_TOKEN

import { wishes } from '../data/wishes';
import { getTodayUtc } from '../utils/date';
import { wishIndex } from '../utils/selection';

let kv;
try {
  // Lazy import — avoid breaking locally if KV is not configured
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

function parseFid(req) {
  try {
    const body = parseBody(req);
    // Neynar-style wrapper
    if (body && body.trustedData && body.untrustedData) {
      const fid = body.untrustedData.fid;
      if (typeof fid === 'number') return fid;
    }
    // Farcaster spec examples often include untrustedData at root
    if (body && body.untrustedData && typeof body.untrustedData.fid === 'number') {
      return body.untrustedData.fid;
    }
  } catch (_) {}
  // Also allow query param for local testing
  const q = req.query || {};
  const qfid = q.fid;
  if (qfid != null) {
    const n = Number(qfid);
    if (!Number.isNaN(n)) return n;
    return String(qfid);
  }
  return undefined;
}

async function getStats(date, idx) {
  const base = `dw:vote:${date}:${idx}`;
  if (!kv) return { likes: 0, dislikes: 0, voted: false };
  try {
    const [likes, dislikes] = await Promise.all([
      kv.get(`${base}:likes`).then((v) => Number(v || 0)),
      kv.get(`${base}:dislikes`).then((v) => Number(v || 0))
    ]);
    return { likes, dislikes, voted: false };
  } catch (_) {
    return { likes: 0, dislikes: 0, voted: false };
  }
}

function pct(likes, dislikes) {
  const total = Math.max(1, likes + dislikes);
  const likesPct = Math.round((likes / total) * 100);
  const dislikesPct = 100 - likesPct;
  const votes = likes + dislikes;
  return { likesPct, dislikesPct, votes };
}

function renderEntry() {
  return html`<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Daily Wish</title>
      <meta property="fc:frame" content="vNext" />
      <meta property="fc:frame:post_url" content="/api/wish" />
      <meta property="fc:frame:button:1" content="Tell me" />
      <meta property="og:title" content="Get your daily wish" />
      <meta property="og:description" content="Tap the button to reveal a personalized wish for today." />
    </head>
    <body></body>
  </html>`;
}

function renderWish({
  date,
  wish,
  fid,
  likes,
  dislikes,
  canVote,
  thanks
}) {
  const { likesPct, dislikesPct, votes } = pct(likes, dislikes);
  const statsLine = `Likes ${likesPct}% • Dislikes ${dislikesPct}% • ${votes} votes`;
  const hasFid = fid !== undefined && fid !== null && fid !== '';

  const baseHead = html`<meta property="fc:frame" content="vNext" />
  ${canVote ? '<meta property="fc:frame:post_url" content="/api/vote" />' : ''}
  ${canVote ? '<meta property="fc:frame:button:1" content="👍 Like" />' : ''}
  ${canVote ? '<meta property="fc:frame:button:2" content="👎 Dislike" />' : ''}
  <meta property="og:title" content="Today\'s Wish" />
  <meta property="og:description" content="' + wish.replace(/"/g, '\\"') + '" />`;

  // Basic HTML doc with meta only; Frames clients read meta for UI
  return html`<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      ${baseHead}
    </head>
    <body>
      <!-- Non-frame fallback text -->
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
  const method = (req.method || 'GET').toUpperCase();
  if (method === 'GET') {
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(renderEntry());
  }

  const fid = parseFid(req);
  const date = getTodayUtc();
  const idx = wishIndex(fid, date, wishes.length);
  const wish = wishes[idx];

  const stats = await getStats(date, idx);

  let canVote = true;
  let voted = false;

  // Check if already voted
  if (kv && fid != null) {
    try {
      const base = `dw:vote:${date}:${idx}`;
      voted = await kv.sismember(`${base}:voters`, String(fid));
    } catch (_) {
      voted = false;
    }
  }

  if (fid == null) {
    canVote = false;
  }
  if (voted) {
    canVote = false;
  }

  res.setHeader('Content-Type', 'text/html');
  return res.status(200).send(
    renderWish({
      date,
      wish,
      fid,
      likes: stats.likes,
      dislikes: stats.dislikes,
      canVote,
      thanks: false
    })
  );
}
