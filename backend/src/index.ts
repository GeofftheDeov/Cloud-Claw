import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import { getAccount, getPositions, submitOrder, getMarketData } from './alpacaService';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const tools = [
  {
    name: 'getAccount',
    description: 'Get the current Alpaca account details including buying power and portfolio value.',
    input_schema: { type: 'object' as const, properties: {} }
  },
  {
    name: 'getPositions',
    description: 'Get all current open positions in the Alpaca account.',
    input_schema: { type: 'object' as const, properties: {} }
  },
  {
    name: 'getMarketData',
    description: 'Get the latest quote for a specific stock symbol.',
    input_schema: {
      type: 'object' as const,
      properties: { symbol: { type: 'string' as const, description: 'The stock ticker symbol (e.g., AAPL)' } },
      required: ['symbol']
    }
  },
  {
    name: 'submitOrder',
    description: 'Submit a market order to buy or sell a stock.',
    input_schema: {
      type: 'object' as const,
      properties: {
        symbol: { type: 'string' as const, description: 'The stock ticker symbol' },
        qty: { type: 'number' as const, description: 'Number of shares to trade' },
        side: { type: 'string' as const, enum: ['buy', 'sell'], description: 'Whether to buy or sell' }
      },
      required: ['symbol', 'qty', 'side']
    }
  }
];

async function handleToolCall(toolName: string, input: any) {
  try {
    switch (toolName) {
      case 'getAccount': return await getAccount();
      case 'getPositions': return await getPositions();
      case 'getMarketData': return await getMarketData(input.symbol);
      case 'submitOrder': return await submitOrder(input.symbol, input.qty, input.side);
      default: return { error: `Unknown tool ${toolName}` };
    }
  } catch (error: any) {
    return { error: error.message };
  }
}

// Basic chat endpoint
app.post('/api/chat', async (req, res) => {
  let { messages } = req.body;

  try {
    let response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      system: "You are an expert autonomous trading agent connected to an Alpaca paper trading account. Use tools to analyze the market and make trades.",
      messages: messages,
      tools: tools as any
    });
    
    // Auto-handle tools if Claude requested them
    while (response.stop_reason === 'tool_use') {
      messages.push({ role: 'assistant', content: response.content });
      
      const toolResults = [];
      for (const block of response.content) {
        if (block.type === 'tool_use') {
          const result = await handleToolCall(block.name, block.input);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify(result)
          });
        }
      }
      
      messages.push({ role: 'user', content: toolResults as any });
      
      response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        system: "You are an expert autonomous trading agent connected to an Alpaca paper trading account. Use tools to analyze the market and make trades.",
        messages: messages,
        tools: tools as any
      });
    }

    res.json(response);
  } catch (error: any) {
    console.error('Error calling Claude API:', error);
    res.status(500).json({ error: error.message });
  }
});

// Autonomous Trading Loop
async function runAutonomousTradeCycle() {
  console.log('Running autonomous trade cycle...');
  try {
    const messages = [{
      role: 'user',
      content: 'Analyze the market. Check our account buying power and open positions. Look up quotes for popular stocks like AAPL, MSFT, or TSLA. Make 1 or 2 small safe trades if you see an opportunity, otherwise do nothing. Keep trades under $500 total value.'
    }];

    // Similar tool loop as chat endpoint
    let response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      system: "You are an expert autonomous trading agent connected to an Alpaca paper trading account. Execute a safe daily trading strategy.",
      messages: messages as any,
      tools: tools as any
    });

    while (response.stop_reason === 'tool_use') {
      messages.push({ role: 'assistant', content: response.content as any });
      const toolResults = [];
      for (const block of response.content) {
        if (block.type === 'tool_use') {
          console.log(`Autonomous agent using tool: ${block.name}`, block.input);
          const result = await handleToolCall(block.name, block.input);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify(result)
          });
        }
      }
      messages.push({ role: 'user', content: toolResults as any });
      
      response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        system: "You are an expert autonomous trading agent connected to an Alpaca paper trading account. Execute a safe daily trading strategy.",
        messages: messages as any,
        tools: tools as any
      });
    }
    console.log('Autonomous cycle complete. Final agent thought:', response.content);
  } catch (err) {
    console.error('Error in autonomous cycle:', err);
  }
}

// Scheduler: Run only between 9:30 AM and 10:30 AM EST, Monday-Friday
setInterval(() => {
  const now = new Date();
  
  // Get time in EST
  const estTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const day = estTime.getDay(); // 0 = Sunday, 1 = Monday...
  const hour = estTime.getHours();
  const minutes = estTime.getMinutes();

  const isWeekday = day >= 1 && day <= 5;
  const isAfterMarketOpen = hour === 9 && minutes >= 30;
  const isBeforeCutoff = hour === 10 && minutes <= 30;

  // Between 9:30 and 10:30 EST
  if (isWeekday && ((hour === 9 && minutes >= 30) || (hour === 10 && minutes < 30))) {
    // Only run every ~15 minutes to save tokens during the hour
    if (minutes % 15 === 0) {
      runAutonomousTradeCycle();
    }
  }
}, 60 * 1000); // check every 1 minute

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});

app.listen(port, () => {
  console.log(`Trading Agent Backend running on port ${port}`);
});
