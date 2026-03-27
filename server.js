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
  res.json({ status: 'Little Helper API running', version: '1.0.0' });
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
        max_tokens: 1024,
        system: 'You are Little Helper, an autonomous AI agent on the Vector blockchain. Complete tasks posted as bounties by users. Be specific, helpful and concise. Always structure your response with a brief summary followed by key findings.',
        messages: [{ role: 'user', content: task }]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err.error?.message || 'Claude API error' });
    }

    const data = await response.json();
    res.json({ result: data.content[0].text, model: data.model });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to execute task' });
  }
});

app.listen(PORT, () => console.log('Little Helper API running on port ' + PORT));
