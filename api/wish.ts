import { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';
import { wishes } from '../src/wishes';
import { getTodayDateString, getWishIndex, calculateVotePercentages } from '../src/utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Parse fid from request body (Farcaster Frame POST data)
    const fid = req.body?.untrustedData?.fid || null;
    const date = getTodayDateString();
    const wishIndex = getWishIndex(fid, date, wishes.length);
    const wish = wishes[wishIndex];

    // Get vote stats for this wish
    const likesKey = `dw:vote:${date}:${wishIndex}:likes`;
    const dislikesKey = `dw:vote:${date}:${wishIndex}:dislikes`;
    const votersKey = `dw:vote:${date}:${wishIndex}:voters`;

    const [likes, dislikes, hasVoted] = await Promise.all([
      kv.get<number>(likesKey) || 0,
      kv.get<number>(dislikesKey) || 0,
      fid ? kv.sismember(votersKey, fid.toString()) : false
    ]);

    const { likesPct, dislikesPct } = calculateVotePercentages(
      typeof likes === 'number' ? likes : 0,
      typeof dislikes === 'number' ? dislikes : 0
    );

    const totalVotes = (typeof likes === 'number' ? likes : 0) + (typeof dislikes === 'number' ? dislikes : 0);

    // Determine frame state
    const isInitialRequest = !req.body?.untrustedData?.buttonIndex;
    
    if (isInitialRequest) {
      // Initial state - show "Tell me" button
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.vercel.app'}/api/og?text=Ready for your daily wish?" />
          <meta property="fc:frame:button:1" content="Tell me" />
          <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.vercel.app'}/api/wish" />
          <meta property="fc:frame:button:1:action" content="post" />
          <title>Daily Wish Frame</title>
        </head>
        <body>
          <h1>Daily Wish</h1>
          <p>Click "Tell me" to get your personalized daily wish!</p>
        </body>
        </html>
      `;
      return res.status(200).setHeader('Content-Type', 'text/html').send(html);
    } else {
      // Wish state - show wish and voting buttons (or thank you if already voted)
      const statsText = totalVotes > 0 
        ? `Likes ${likesPct}% • Dislikes ${dislikesPct}% • ${totalVotes} votes`
        : 'Be the first to vote!';

      const thankYouText = hasVoted ? '<div style="color: #10b981; font-weight: bold; margin: 10px 0;">Thank you!</div>' : '';

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.vercel.app'}/api/og?text=${encodeURIComponent(wish)}&stats=${encodeURIComponent(statsText)}" />
          ${!hasVoted ? `
            <meta property="fc:frame:button:1" content="Like 👍" />
            <meta property="fc:frame:button:2" content="Dislike 👎" />
            <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.vercel.app'}/api/vote" />
          ` : `
            <meta property="fc:frame:button:1" content="Like 👍" />
            <meta property="fc:frame:button:2" content="Dislike 👎" />
          `}
          <meta property="og:title" content="Daily Wish" />
          <meta property="og:description" content="${wish}" />
          <title>Daily Wish</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8fafc; border-radius: 12px; padding: 24px; text-align: center;">
            ${thankYouText}
            <h2 style="color: #1e293b; margin-bottom: 16px;">Your Daily Wish</h2>
            <p style="color: #475569; font-size: 18px; line-height: 1.6; margin-bottom: 20px;">${wish}</p>
            <div style="background: #e2e8f0; border-radius: 8px; padding: 12px; margin-top: 20px;">
              <p style="color: #64748b; font-size: 14px; margin: 0;">${statsText}</p>
            </div>
          </div>
        </body>
        </html>
      `;
      return res.status(200).setHeader('Content-Type', 'text/html').send(html);
    }
  } catch (error) {
    console.error('Error in wish handler:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}