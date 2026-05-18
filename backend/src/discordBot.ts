import { Client, GatewayIntentBits, Events, ChannelType, Message } from 'discord.js';
import Anthropic from '@anthropic-ai/sdk';
import { runAgentLoop } from './agent';

const MAX_HISTORY = 20;      // message pairs to keep per user
const DISCORD_LIMIT = 2000;  // Discord character limit per message

// Per-user conversation history (survives within the process lifetime)
const conversations = new Map<string, Anthropic.MessageParam[]>();

function getHistory(userId: string): Anthropic.MessageParam[] {
  if (!conversations.has(userId)) conversations.set(userId, []);
  return conversations.get(userId)!;
}

function trimHistory(messages: Anthropic.MessageParam[]) {
  // Keep the array to at most MAX_HISTORY entries (each turn = 1 entry)
  while (messages.length > MAX_HISTORY) messages.shift();
}

async function sendChunked(message: Message, text: string) {
  if (text.length <= DISCORD_LIMIT) {
    await message.reply(text);
    return;
  }
  const chunks = text.match(new RegExp(`.{1,${DISCORD_LIMIT}}`, 'gs')) ?? [text];
  for (const chunk of chunks) await message.reply(chunk);
}

export function startDiscordBot(anthropic: Anthropic): void {
  const token = process.env.DISCORD_TOKEN;
  if (!token) {
    console.warn('[Discord] DISCORD_TOKEN not set — bot will not start.');
    return;
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,  // privileged — must be enabled in Discord Dev Portal
      GatewayIntentBits.DirectMessages,
    ],
  });

  client.once(Events.ClientReady, (c) => {
    console.log(`[Discord] Logged in as ${c.user.tag}`);
  });

  client.on(Events.MessageCreate, async (message: Message) => {
    if (message.author.bot) return;

    const isDM      = message.channel.type === ChannelType.DM;
    const mentioned = client.user ? message.mentions.has(client.user) : false;

    if (!isDM && !mentioned) return;

    // Strip the @mention and surrounding whitespace
    let content = message.content
      .replace(client.user ? `<@${client.user.id}>` : '', '')
      .trim();

    if (!content) return;

    // !clear resets this user's conversation history
    if (content.toLowerCase() === '!clear') {
      conversations.delete(message.author.id);
      await message.reply('Conversation history cleared.');
      return;
    }

    const history = getHistory(message.author.id);
    history.push({ role: 'user', content });
    trimHistory(history);

    try {
      if ('sendTyping' in message.channel) await message.channel.sendTyping();
      const reply = await runAgentLoop(anthropic, history);
      history.push({ role: 'assistant', content: reply });
      await sendChunked(message, reply);
    } catch (err: any) {
      console.error('[Discord] Error:', err);
      await message.reply('Sorry, something went wrong. Please try again.');
    }
  });

  client.on(Events.Error, (err) => console.error('[Discord] Client error:', err));

  client.login(token).catch((err) => console.error('[Discord] Login failed:', err));
}
