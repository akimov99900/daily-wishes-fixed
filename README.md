# Daily Wish - Farcaster Frame

A personalized daily wish experience built as a Farcaster Frame with voting functionality powered by Vercel KV.

## Features

- 🎯 **Personalized Daily Wishes**: Each user gets a unique wish every day based on their FID
- 📊 **Live Voting Stats**: See real-time community feedback on wishes
- 🔒 **One Vote Per Day**: Fair voting system preventing duplicate votes
- 🎨 **Beautiful Frame Design**: Engaging visual experience with gradient backgrounds
- ⚡ **Real-time Updates**: Instant vote counting and statistics

## Tech Stack

- **Frontend**: Static HTML with modern CSS
- **Backend**: Vercel Serverless Functions (TypeScript)
- **Database**: Vercel KV for real-time vote storage
- **Frame Protocol**: Farcaster Frames vNext

## Setup Instructions

### 1. Deploy to Vercel

1. Fork this repository
2. Connect it to your Vercel account
3. Deploy the project

### 2. Configure Vercel KV

1. In your Vercel project dashboard, go to Storage → KV
2. Create a new KV database
3. Add the following environment variables in your project settings:
   - `KV_URL`: Your KV database URL
   - `KV_REST_API_URL`: Your KV REST API URL  
   - `KV_REST_API_TOKEN`: Your KV REST API token
   - `NEXT_PUBLIC_BASE_URL`: Your deployed URL (e.g., `https://your-app.vercel.app`)

### 3. Update Frame URLs

Replace `https://your-domain.vercel.app` in the following files with your actual deployed URL:
- `index.html` (meta tags)
- `api/wish.ts` (frame URLs)
- `api/vote.ts` (frame URLs)

## API Endpoints

### GET/POST `/api/wish`
Returns the frame HTML with appropriate state based on user interaction.

**Query Parameters:**
- No parameters required for initial request
- FID is extracted from frame POST data

**Response:**
- HTML with Farcaster Frame meta tags
- Dynamic content based on user state

### POST `/api/vote`
Handles voting on wishes with deduplication.

**Request Body:**
```json
{
  "untrustedData": {
    "fid": 12345,
    "buttonIndex": 1  // 1 for Like, 2 for Dislike
  }
}
```

**Response:**
- HTML with updated frame showing thank you message and stats

### GET `/api/og`
Generates OG images for frame cards.

**Query Parameters:**
- `text`: Wish text to display
- `stats`: Voting statistics (optional)
- `voted`: Whether user has voted (optional)

## KV Storage Structure

```
dw:vote:{date}:{wishIndex}:likes     -> integer count
dw:vote:{date}:{wishIndex}:dislikes  -> integer count  
dw:vote:{date}:{wishIndex}:voters    -> set of FIDs who voted
```

## How It Works

1. **Wish Selection**: Uses deterministic hashing (`FNV-1a`) of `fid + date` to select the same wish for each user per day
2. **Vote Tracking**: Stores votes in KV with atomic transactions to prevent race conditions
3. **Deduplication**: Uses Redis sets to ensure one vote per user per day
4. **Real-time Stats**: Calculates percentages and totals on-demand from KV data

## Development

### Local Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev
```

### Testing

The frame can be tested using:
- [Warpcast Frame DevTools](https://warpcast.com/~/developers/frames)
- [Neynar Frame Playground](https://neynar.com/frame-playground)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues or questions:
- Open an issue on GitHub
- Reach out on Farcaster