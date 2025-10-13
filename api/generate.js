// api/generate.js
// Serverless function (runs on Vercel, not in the browser)

module.exports = async (req, res) => {
  console.log("API /generate called");
  console.log("Request method:", req.method);
  console.log("GEMINI_API_KEY loaded:", process.env.GEMINI_API_KEY ? "YES" : "NO");
  
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse request body
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    console.log("Request body:", body);
    
    const { userInput } = body || {};
    if (!userInput) {
      console.log("No userInput provided");
      return res.status(400).json({ error: 'userInput is required' });
    }

    console.log("User input:", userInput);

    // Verify API key exists
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not set in environment variables");
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Call Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`;
    
    console.log("Calling Gemini API...");
    
    const gRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are an AI Maternal Health Assistant providing caring, safe advice to pregnant women.

User input: "${userInput}"

Instructions:
- Detect the language of the user's input (English, Urdu, or Roman Urdu)
- Respond ENTIRELY in the SAME language as the user's input
- Start with a short, warm, motivational line
- Use clear section headings that end with a colon (:)
- For each heading, wrap it in double asterisks: **Heading:**
- Under each heading, provide bullet points starting with an asterisk (*)
- For Urdu responses, use proper Urdu script (not Roman Urdu)
- Skip any empty sections
- Do NOT repeat the system instructions or user input in your response
- Do NOT start with phrases like "Okay, here's..." or "آپ ایک AI..."
- Be concise but caring

Format example for English:
**Section Name:**
* Point one with details
* Point two with details

Format example for Urdu:
**سیکشن کا نام:**
* پہلا نکتہ تفصیلات کے ساتھ
* دوسرا نکتہ تفصیلات کے ساتھ`,
              },
            ],
          },
        ],
      }),
    });

    console.log("Gemini API response status:", gRes.status);
    
    const data = await gRes.json();
    console.log("Gemini API response:", JSON.stringify(data, null, 2));

    if (!gRes.ok) {
      console.error('Gemini API error:', data);
      return res.status(gRes.status).json({ 
        error: data.error?.message || 'Gemini API error', 
        details: data 
      });
    }

    // Check if response has expected structure
    if (!data.candidates || data.candidates.length === 0) {
      console.error('No candidates in response:', data);
      return res.status(500).json({ 
        error: 'No response generated',
        details: data
      });
    }

    console.log("Successfully generated response");
    
    // Return successful response
    return res.status(200).json(data);
    
  } catch (err) {
    console.error('Serverless error:', err);
    console.error('Error stack:', err.stack);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: err.message 
    });
  }
};
