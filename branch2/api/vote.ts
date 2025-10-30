import { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';
import { wishes } from '../src/wishes';
import { getTodayDateString, getWishIndex, calculateVotePercentages } from '../src/utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const fid = req.body?.untrustedData?.fid;
    const buttonIndex = req.body?.untrustedData?.buttonIndex; // 1 for Like, 2 for Dislike

    if (!fid) {
      return res.status(400).json({ error: 'FID is required' });
    }

    if (!buttonIndex || (buttonIndex !== 1 && buttonIndex !== 2)) {
      return res.status(400).json({ error: 'Invalid button selection' });
    }

    const date = getTodayDateString();
    const wishIndex = getWishIndex(fid, date, wishes.length);
    const wish = wishes[wishIndex];

    // KV keys
    const likesKey = `dw:vote:${date}:${wishIndex}:likes`;
    const dislikesKey = `dw:vote:${date}:${wishIndex}:dislikes`;
    const votersKey = `dw:vote:${date}:${wishIndex}:voters`;

    // Check if user has already voted today
    const alreadyVoted = await kv.sismember(votersKey, fid.toString());

    if (alreadyVoted) {
      // User already voted, return current stats without incrementing
      const [likes, dislikes] = await Promise.all([
        kv.get<number>(likesKey) || 0,
        kv.get<number>(dislikesKey) || 0
      ]);

      const { likesPct, dislikesPct } = calculateVotePercentages(
        typeof likes === 'number' ? likes : 0,
        typeof dislikes === 'number' ? dislikes : 0
      );

      const totalVotes = (typeof likes === 'number' ? likes : 0) + (typeof dislikes === 'number' ? dislikes : 0);
      const statsText = totalVotes > 0 
        ? `Likes ${likesPct}% • Dislikes ${dislikesPct}% • ${totalVotes} votes`
        : 'Be the first to vote!';

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.vercel.app'}/api/og?text=${encodeURIComponent(wish)}&stats=${encodeURIComponent(statsText)}&voted=true" />
          <meta property="fc:frame:button:1" content="Like 👍" />
          <meta property="fc:frame:button:2" content="Dislike 👎" />
          <meta property="og:title" content="Daily Wish" />
          <meta property="og:description" content="${wish}" />
          <title>Daily Wish</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8fafc; border-radius: 12px; padding: 24px; text-align: center;">
            <div style="color: #10b981; font-weight: bold; margin: 10px 0;">Thank you!</div>
            <h2 style="color: #1e293b; margin-bottom: 16px;">Your Daily Wish</h2>
            <p style="color: #475569; font-size: 18px; line-height: 1.6; margin-bottom: 20px;">${wish}</p>
            <div style="background: #e2e8f0; border-radius: 8px; padding: 12px; margin-top: 20px;">
              <p style="color: #64748b; font-size: 14px; margin: 0;">${statsText}</p>
            </div>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 16px;">You've already voted today. Come back tomorrow!</p>
          </div>
        </body>
        </html>
      `;
      return res.status(200).setHeader('Content-Type', 'text/html').send(html);
    }

    // Record the vote atomically
    const choice = buttonIndex === 1 ? 'like' : 'dislike';
    
    // Use a transaction to ensure atomicity
    const transaction = kv.multi();
    
    if (choice === 'like') {
      transaction.incr(likesKey);
    } else {
      transaction.incr(dislikesKey);
    }
    
    transaction.sadd(votersKey, fid.toString());
    
    const results = await transaction.exec();

    // Check if the vote was successfully recorded
    const voteAdded = results[2][1] === 1; // SADD result

    if (!voteAdded) {
      // Race condition - someone else voted for this fid
      const [likes, dislikes] = await Promise.all([
        kv.get<number>(likesKey) || 0,
        kv.get<number>(dislikesKey) || 0
      ]);

      const { likesPct, dislikesPct } = calculateVotePercentages(
        typeof likes === 'number' ? likes : 0,
        typeof dislikes === 'number' ? dislikes : 0
      );

      const totalVotes = (typeof likes === 'number' ? likes : 0) + (typeof dislikes === 'number' ? dislikes : 0);
      const statsText = totalVotes > 0 
        ? `Likes ${likesPct}% • Dislikes ${dislikesPct}% • ${totalVotes} votes`
        : 'Be the first to vote!';

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.vercel.app'}/api/og?text=${encodeURIComponent(wish)}&stats=${encodeURIComponent(statsText)}&voted=true" />
          <meta property="fc:frame:button:1" content="Like 👍" />
          <meta property="fc:frame:button:2" content="Dislike 👎" />
          <meta property="og:title" content="Daily Wish" />
          <meta property="og:description" content="${wish}" />
          <title>Daily Wish</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8fafc; border-radius: 12px; padding: 24px; text-align: center;">
            <div style="color: #10b981; font-weight: bold; margin: 10px 0;">Thank you!</div>
            <h2 style="color: #1e293b; margin-bottom: 16px;">Your Daily Wish</h2>
            <p style="color: #475569; font-size: 18px; line-height: 1.6; margin-bottom: 20px;">${wish}</p>
            <div style="background: #e2e8f0; border-radius: 8px; padding: 12px; margin-top: 20px;">
              <p style="color: #64748b; font-size: 14px; margin: 0;">${statsText}</p>
            </div>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 16px;">You've already voted today. Come back tomorrow!</p>
          </div>
        </body>
        </html>
      `;
      return res.status(200).setHeader('Content-Type', 'text/html').send(html);
    }

    // Get updated vote counts
    const [likes, dislikes] = await Promise.all([
      kv.get<number>(likesKey) || 0,
      kv.get<number>(dislikesKey) || 0
    ]);

    const { likesPct, dislikesPct } = calculateVotePercentages(
      typeof likes === 'number' ? likes : 0,
      typeof dislikes === 'number' ? dislikes : 0
    );

    const totalVotes = (typeof likes === 'number' ? likes : 0) + (typeof dislikes === 'number' ? dislikes : 0);
    const statsText = totalVotes > 0 
      ? `Likes ${likesPct}% • Dislikes ${dislikesPct}% • ${totalVotes} votes`
      : 'Be the first to vote!';

    // Return thank you frame with updated stats
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.vercel.app'}/api/og?text=${encodeURIComponent(wish)}&stats=${encodeURIComponent(statsText)}&voted=true" />
        <meta property="fc:frame:button:1" content="Like 👍" />
        <meta property="fc:frame:button:2" content="Dislike 👎" />
        <meta property="og:title" content="Daily Wish" />
        <meta property="og:description" content="${wish}" />
        <title>Daily Wish</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f8fafc; border-radius: 12px; padding: 24px; text-align: center;">
          <div style="color: #10b981; font-weight: bold; margin: 10px 0;">Thank you!</div>
          <h2 style="color: #1e293b; margin-bottom: 16px;">Your Daily Wish</h2>
          <p style="color: #475569; font-size: 18px; line-height: 1.6; margin-bottom: 20px;">${wish}</p>
          <div style="background: #e2e8f0; border-radius: 8px; padding: 12px; margin-top: 20px;">
            <p style="color: #64748b; font-size: 14px; margin: 0;">${statsText}</p>
          </div>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 16px;">Your vote has been recorded. Come back tomorrow for a new wish!</p>
        </div>
      </body>
      </html>
    `;
    return res.status(200).setHeader('Content-Type', 'text/html').send(html);

  } catch (error) {
    console.error('Error in vote handler:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}