import dotenv from 'dotenv';

dotenv.config();

const ALPACA_API_KEY = process.env.ALPACA_API_KEY || '';
const ALPACA_SECRET_KEY = process.env.ALPACA_SECRET_KEY || '';
const BASE_URL = 'https://paper-api.alpaca.markets/v2';

const headers = {
  'APCA-API-KEY-ID': ALPACA_API_KEY,
  'APCA-API-SECRET-KEY': ALPACA_SECRET_KEY,
  'Content-Type': 'application/json',
};

export async function getAccount() {
  const response = await fetch(`${BASE_URL}/account`, { headers });
  if (!response.ok) throw new Error(`Alpaca getAccount error: ${await response.text()}`);
  return response.json();
}

export async function getPositions() {
  const response = await fetch(`${BASE_URL}/positions`, { headers });
  if (!response.ok) throw new Error(`Alpaca getPositions error: ${await response.text()}`);
  return response.json();
}

export async function submitOrder(symbol: string, qty: number, side: 'buy' | 'sell', type: 'market' | 'limit' = 'market', time_in_force: 'day' | 'gtc' = 'day') {
  const body = JSON.stringify({ symbol, qty, side, type, time_in_force });
  const response = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers,
    body,
  });
  if (!response.ok) throw new Error(`Alpaca submitOrder error: ${await response.text()}`);
  return response.json();
}

export async function getMarketData(symbol: string) {
  // Using Alpaca Data API v2
  const dataHeaders = {
    'APCA-API-KEY-ID': ALPACA_API_KEY,
    'APCA-API-SECRET-KEY': ALPACA_SECRET_KEY,
  };
  const response = await fetch(`https://data.alpaca.markets/v2/stocks/${symbol}/quotes/latest`, { headers: dataHeaders });
  if (!response.ok) throw new Error(`Alpaca getMarketData error: ${await response.text()}`);
  return response.json();
}
