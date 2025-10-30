import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { text, stats, voted } = req.query;

    // Create an SVG image for the frame
    const svg = `
      <svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="600" height="400" fill="url(#bg)"/>
        
        <text x="300" y="60" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle">
          Daily Wish
        </text>
        
        ${voted ? `
          <rect x="200" y="90" width="200" height="40" rx="20" fill="#10b981" opacity="0.9"/>
          <text x="300" y="115" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">
            Thank you!
          </text>
        ` : ''}
        
        <foreignObject x="50" y="${voted ? '150' : '100'}" width="500" height="150">
          <div xmlns="http://www.w3.org/1999/xhtml" style="color: white; font-family: Arial, sans-serif; font-size: 18px; text-align: center; line-height: 1.4; word-wrap: break-word;">
            ${text || 'Ready for your daily wish?'}
          </div>
        </foreignObject>
        
        ${stats ? `
          <rect x="100" y="320" width="400" height="50" rx="10" fill="rgba(255,255,255,0.2)"/>
          <text x="300" y="350" font-family="Arial, sans-serif" font-size="16" fill="white" text-anchor="middle">
            ${stats}
          </text>
        ` : ''}
      </svg>
    `;

    // Convert SVG to PNG using a simple approach
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    return res.status(200).send(svg);

  } catch (error) {
    console.error('Error generating OG image:', error);
    
    // Fallback simple SVG
    const fallbackSvg = `
      <svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
        <rect width="600" height="400" fill="#667eea"/>
        <text x="300" y="200" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle">
          Daily Wish Frame
        </text>
      </svg>
    `;
    
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.status(200).send(fallbackSvg);
  }
}