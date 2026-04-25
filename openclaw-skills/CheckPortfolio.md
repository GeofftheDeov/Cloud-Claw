# Check Portfolio

This skill allows you to check the current Alpaca paper trading account balance and view all open stock positions.

Use this skill whenever you need to understand the current financial state of the portfolio or check your buying power before making trades.

## Usage

You can use the `alpaca_tools.ts` script to query the portfolio.

To get the account summary (buying power, portfolio value):
```bash
npx ts-node /workspace/cloudclaw-skills/alpaca_tools.ts getAccount
```

To get a list of current open positions:
```bash
npx ts-node /workspace/cloudclaw-skills/alpaca_tools.ts getPositions
```

## Considerations
- Make sure to review the `buying_power` before executing any trades to ensure you have enough funds.
- If the positions array is empty, it means there are no active stock holdings.
