export default async function handler(req, res) {
  console.log('API called');
  
  const dailyWishes = [
    "🌞 May your day be filled with positive energy!",
    "💫 Today is your day to shine!",
    "🚀 Take a leap of faith today!",
    "🌈 Something wonderful is about to happen!",
    "🎯 Your hard work is about to pay off!"
  ];

  const randomWish = dailyWishes[Math.floor(Math.random() * dailyWishes.length)];

  const response = `
<!DOCTYPE html>
<html>
<head>
    <meta property="og:image" content="https://i.imgur.com/8B3Vx2k.png" />
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="https://i.imgur.com/8B3Vx2k.png" />
    <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
    <meta property="fc:frame:button:1" content="🔮 Another Wish" />
    <meta property="fc:frame:post_url" content="https://daily-wishes-fixed.vercel.app/api/wish" />
</head>
<body>
    <p>${randomWish}</p>
</body>
</html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.send(response);
}
