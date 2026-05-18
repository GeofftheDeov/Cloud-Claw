import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import { tools, handleToolCall, runAgentLoop, SYSTEM_PROMPT, MODEL } from './agent';
import { startDiscordBot } from './discordBot';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });

// ── HTTP chat endpoint ───────────────────────────────────────────────────────

app.post('/api/chat', async (req, res) => {
  let { messages } = req.body as { messages: Anthropic.MessageParam[] };

  try {
    // Run one pass through the agent loop, then return the full message object
    // so the caller can render all content blocks (text + tool_use).
    let response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
      tools,
    });

    while (response.stop_reason === 'tool_use') {
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type === 'tool_use') {
          const result = await handleToolCall(block.name, block.input as Record<string, unknown>);
          toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) });
        }
      }
      messages.push({ role: 'assistant', content: response.content });
      messages.push({ role: 'user', content: toolResults });

      response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages,
        tools,
      });
    }

    res.json(response);
  } catch (err: any) {
    console.error('[chat] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Autonomous trading loop ──────────────────────────────────────────────────

async function runAutonomousTradeCycle() {
  console.log('[auto] Running autonomous trade cycle...');
  try {
    const messages: Anthropic.MessageParam[] = [{
      role: 'user',
      content: 'Analyze the market. Check our account buying power and open positions. Look up quotes for popular stocks like AAPL, MSFT, or TSLA. Make 1 or 2 small safe trades if you see an opportunity, otherwise do nothing. Keep trades under $500 total value.',
    }];

    const reply = await runAgentLoop(anthropic, messages);
    console.log('[auto] Cycle complete. Final thought:', reply);
  } catch (err) {
    console.error('[auto] Error:', err);
  }
}

// Run between 9:30 – 10:30 AM EST on weekdays, every 15 minutes
setInterval(() => {
  const est  = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day  = est.getDay();
  const h    = est.getHours();
  const m    = est.getMinutes();

  const isWeekday       = day >= 1 && day <= 5;
  const inTradingWindow = (h === 9 && m >= 30) || (h === 10 && m < 30);

  if (isWeekday && inTradingWindow && m % 15 === 0) {
    runAutonomousTradeCycle();
  }
}, 60_000);

// ── Health check ─────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(port, () => {
  console.log(`[server] Trading Agent Backend running on port ${port}`);
});

startDiscordBot(anthropic);
