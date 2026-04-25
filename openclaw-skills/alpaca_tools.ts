import dotenv from 'dotenv';

dotenv.config();

const ALPACA_API_KEY = process.env.ALPACA_API_KEY || '';
const ALPACA_SECRET_KEY = process.env.ALPACA_SECRET_KEY || '';
const BASE_URL = 'https://paper-api.alpaca.markets/v2';
const DATA_URL = 'https://data.alpaca.markets/v2';

const headers = {
  'APCA-API-KEY-ID': ALPACA_API_KEY,
  'APCA-API-SECRET-KEY': ALPACA_SECRET_KEY,
  'Content-Type': 'application/json',
};

async function getAccount() {
  const response = await fetch(`${BASE_URL}/account`, { headers });
  if (!response.ok) throw new Error(`Alpaca getAccount error: ${await response.text()}`);
  return response.json();
}

async function getPositions() {
  const response = await fetch(`${BASE_URL}/positions`, { headers });
  if (!response.ok) throw new Error(`Alpaca getPositions error: ${await response.text()}`);
  return response.json();
}

async function getMarketData(symbol: string) {
  const dataHeaders = {
    'APCA-API-KEY-ID': ALPACA_API_KEY,
    'APCA-API-SECRET-KEY': ALPACA_SECRET_KEY,
  };
  const response = await fetch(`${DATA_URL}/stocks/${symbol}/quotes/latest`, { headers: dataHeaders });
  if (!response.ok) throw new Error(`Alpaca getMarketData error: ${await response.text()}`);
  return response.json();
}

async function submitOrder(symbol: string, qty: number, side: string) {
  const body = JSON.stringify({ 
    symbol, 
    qty: Number(qty), 
    side, 
    type: 'market', 
    time_in_force: 'day' 
  });
  const response = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers,
    body,
  });
  if (!response.ok) throw new Error(`Alpaca submitOrder error: ${await response.text()}`);
  return response.json();
}

// CLI handler for OpenClaw integration
async function main() {
  const command = process.argv[2];
  
  if (!ALPACA_API_KEY || !ALPACA_SECRET_KEY) {
    console.error("Error: ALPACA_API_KEY and ALPACA_SECRET_KEY environment variables must be set.");
    process.exit(1);
  }

  try {
    switch (command) {
      case 'getAccount':
        console.log(JSON.stringify(await getAccount(), null, 2));
        break;
      case 'getPositions':
        console.log(JSON.stringify(await getPositions(), null, 2));
        break;
      case 'getMarketData':
        const symbol = process.argv[3];
        if (!symbol) throw new Error("Symbol is required for getMarketData");
        console.log(JSON.stringify(await getMarketData(symbol), null, 2));
        break;
      case 'submitOrder':
        const tradeSymbol = process.argv[3];
        const qty = Number(process.argv[4]);
        const side = process.argv[5];
        if (!tradeSymbol || !qty || !side) throw new Error("Symbol, qty, and side are required for submitOrder");
        console.log(JSON.stringify(await submitOrder(tradeSymbol, qty, side), null, 2));
        break;
      default:
        console.error(`Unknown command: ${command}`);
        console.log("Available commands: getAccount, getPositions, getMarketData <symbol>, submitOrder <symbol> <qty> <side>");
        process.exit(1);
    }
  } catch (err: any) {
    console.error(err.message);
    process.exit(1);
  }
}

main();
