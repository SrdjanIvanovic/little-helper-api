const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

app.use(cors({
  origin: ['https://srdjanivanovic.github.io', 'http://localhost:3000', 'http://127.0.0.1:5500']
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'Little Helper API running', version: '1.1.0' });
});

app.post('/execute', async (req, res) => {
  const { task, type } = req.body;
  if (!task) return res.status(400).json({ error: 'Task is required' });
  if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: 'API key not configured' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: `You are Little Helper, an autonomous AI agent on the Vector blockchain. 
You have access to web search and can browse the internet to complete tasks.
Always search for current information when asked about recent events, prices, news, or live data.
For Vector/AP3X blockchain tasks, search for the latest on-chain data.
Be specific, helpful and concise. Structure responses clearly.
Task type: ${type || 'general'}.`,
        tools: [
          {
            type: 'web_search_20250305',
            name: 'web_search'
          }
        ],
        messages: [{ role: 'user', content: task }]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err.error?.message || 'Claude API error' });
    }

    const data = await response.json();

    // Extract text from all content blocks (web search may return multiple blocks)
    const result = data.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n\n');

    res.json({ result, model: data.model, usage: data.usage });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to execute task' });
  }
});

app.get('/favicon.ico', (req, res) => {   // ← add here
  res.set('Content-Type', 'image/svg+xml');
  res.send('<svg xmlns="http://www.w3.org/2000/svg"><text y="32" font-size="32">🫴</text></svg>');
});

app.listen(PORT, () => console.log('Little Helper API v1.1.0 with web search running on port ' + PORT));
