export default async function handler(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;

  try {
    if (!apiKey) {
      throw new Error('API Key not found in environment variables');
    }

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Hello, world!" }] }]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({ error: 'Failed to fetch data', details: errorText });
    }

    const data = await response.json();

    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching data', message: error.message });
  }
}

