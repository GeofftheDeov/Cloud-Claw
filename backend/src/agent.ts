import Anthropic from '@anthropic-ai/sdk';
import { getAccount, getPositions, submitOrder, getMarketData } from './alpacaService';

export const SYSTEM_PROMPT =
  'You are Cloud-Claw, an autonomous trading agent connected to an Alpaca paper trading account. ' +
  'You can check account details, inspect open positions, look up stock quotes, and submit market orders. ' +
  'Be concise and factual. Always confirm trade details before executing.';

export const MODEL = 'claude-3-5-sonnet-20241022';

export const tools: Anthropic.Tool[] = [
  {
    name: 'getAccount',
    description: 'Get the current Alpaca account details including buying power and portfolio value.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'getPositions',
    description: 'Get all current open positions in the Alpaca account.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'getMarketData',
    description: 'Get the latest quote for a specific stock symbol.',
    input_schema: {
      type: 'object',
      properties: { symbol: { type: 'string', description: 'The stock ticker symbol (e.g., AAPL)' } },
      required: ['symbol'],
    },
  },
  {
    name: 'submitOrder',
    description: 'Submit a market order to buy or sell a stock.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'The stock ticker symbol' },
        qty: { type: 'number', description: 'Number of shares to trade' },
        side: { type: 'string', enum: ['buy', 'sell'], description: 'Whether to buy or sell' },
      },
      required: ['symbol', 'qty', 'side'],
    },
  },
];

export async function handleToolCall(toolName: string, input: Record<string, unknown>): Promise<unknown> {
  try {
    switch (toolName) {
      case 'getAccount':    return await getAccount();
      case 'getPositions':  return await getPositions();
      case 'getMarketData': return await getMarketData(input.symbol as string);
      case 'submitOrder':   return await submitOrder(input.symbol as string, input.qty as number, input.side as 'buy' | 'sell');
      default:              return { error: `Unknown tool: ${toolName}` };
    }
  } catch (err: any) {
    return { error: err.message };
  }
}

/**
 * Run the full tool-use agentic loop and return the final text reply.
 * The caller owns `messages` and should append the returned assistant text to it.
 */
export async function runAgentLoop(
  anthropic: Anthropic,
  messages: Anthropic.MessageParam[],
): Promise<string> {
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

  const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
  return textBlock?.text ?? "I couldn't generate a response.";
}
