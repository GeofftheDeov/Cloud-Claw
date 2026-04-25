# Check Market

This skill provides you with the ability to fetch the latest market quotes for a specific stock symbol via the Alpaca API.

Use this skill when you need to check the current bid, ask, and last trade price of an asset before deciding to make a trade.

## Usage

Use the `alpaca_tools.ts` script to query a stock's latest quote. You must provide the stock symbol (e.g., AAPL, TSLA, MSFT).

```bash
npx ts-node /workspace/cloudclaw-skills/alpaca_tools.ts getMarketData <SYMBOL>
```

Example:
```bash
npx ts-node /workspace/cloudclaw-skills/alpaca_tools.ts getMarketData AAPL
```

## Considerations
- If the symbol is invalid, the API will return an error. Handle it gracefully and ensure the symbol is correct.
- Ensure the market is open or that the returned quotes are recent enough for your trading strategy.
