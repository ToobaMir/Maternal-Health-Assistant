// /api/fetchData.js

export default async function handler(req, res) {
  // Access the API key from environment variables
  const apiKey = process.env.GEMINI_API_KEY;

  try {
      // Example: Fetch data from an external API
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'GET',
          headers: {
              'Authorization': `Bearer ${apiKey}`,
          },
      });

      // Check if the request was successful
      if (!response.ok) {
          return res.status(500).json({ error: 'Failed to fetch data' });
      }

      // Parse the JSON response
      const data = await response.json();

      // Return the data to the client
      res.status(200).json(data);
  } catch (error) {
      res.status(500).json({ error: 'An error occurred while fetching data' });
  }
}
