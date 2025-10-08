// api/generate.js
// Serverless function (runs on Vercel, not in the browser)

module.exports = async (req, res) => {
  // Basic CORS support (handy if you preview from other local servers)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { userInput } = body || {};
    if (!userInput) {
      return res.status(400).json({ error: 'userInput is required' });
    }

    // Call Gemini from the server (key is hidden in env)
    const gRes = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY, // <-- hidden on Vercel
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text:
                    `You are an AI maternal health assistant. A woman says she is in the following stage: ${userInput}. ` +
                    `Provide brief, safe, and supportive advice relevant to her stage.`,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await gRes.json();

    if (!gRes.ok) {
      console.error('Gemini API error:', data);
      return res
        .status(gRes.status)
        .json({ error: data.error?.message || 'Gemini API error', raw: data });
    }

    // Pass Gemini’s JSON back to the browser
    return res.status(200).json(data);
  } catch (err) {
    console.error('Serverless error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
