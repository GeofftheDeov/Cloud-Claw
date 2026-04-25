# Execute Trade

This skill allows you to submit a market order to buy or sell a stock using the Alpaca paper trading API. 

Use this skill ONLY when you are confident in your trading strategy and have checked your portfolio's buying power.

## Usage

Use the `alpaca_tools.ts` script to execute a trade. You must provide the stock symbol, the quantity of shares, and the side (either `buy` or `sell`).

```bash
npx ts-node /workspace/cloudclaw-skills/alpaca_tools.ts submitOrder <SYMBOL> <QUANTITY> <SIDE>
```

Example to buy 10 shares of AAPL:
```bash
npx ts-node /workspace/cloudclaw-skills/alpaca_tools.ts submitOrder AAPL 10 buy
```

Example to sell 5 shares of MSFT:
```bash
npx ts-node /workspace/cloudclaw-skills/alpaca_tools.ts submitOrder MSFT 5 sell
```

## Considerations
- All orders placed via this script default to "market" orders with a "day" time-in-force.
- **DANGER:** Ensure you double-check the quantity before executing to avoid over-leveraging the account.
- Always verify the response to confirm the order was accepted by Alpaca.
