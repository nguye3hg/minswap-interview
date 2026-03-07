# Backend Interview Challenge: Portfolio Coin Balance Calculator

## Overview

Build an API that calculates the USD balance of all coins held by a wallet address on the Sui blockchain.

**What you'll build:**
1. Fetch wallet coin balances from Sui RPC
2. Query a local database for coin metadata and prices
3. Calculate USD values and price changes for each coin
4. Return a portfolio summary
5. Build a simple UI that uses the API

---

## Part 1: Fetch Wallet Balances from RPC

Call the Sui RPC endpoint `suix_getAllBalances` to get all coins held by a wallet.

### RPC Request Example

```bash
curl --location 'https://fullnode.mainnet.sui.io:443' \
--header 'Content-Type: application/json' \
--data '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "suix_getAllBalances",
    "params": [
        "0x200e6f6dd7e974904cab77e52761f8f0e4e27aabe29f44c7b0e272e8e5ecf543"
    ]
}'
```

### Response Format

```json
{
  "jsonrpc": "2.0",
  "result": [
    {
      "coinType": "0x2::sui::SUI",
      "totalBalance": "1000000000"
    },
    {
      "coinType": "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
      "totalBalance": "50000000"
    }
  ],
  "id": 1
}
```

### Key Fields
- `coinType`: Unique identifier for the coin (format: `package_id::module::name`)
- `totalBalance`: Raw balance as string (NOT decimal normalized)

### Tasks
- Implement HTTP client to call the RPC endpoint
- Parse JSON response
- Handle errors (rate limits, timeouts, invalid addresses)

---

## Part 2: Set Up Local Database

You will run your own PostgreSQL instance and seed it with the data provided below.

### Requirements

Use **PostgreSQL 14+** or any compatible alternative (e.g. [Supabase](https://supabase.com), [Neon](https://neon.tech), Docker). The schema and seed data are plain SQL — any Postgres-compatible engine works.

**Quick start with Docker:**
```bash
docker run --name portfolio-db \
  -e POSTGRES_USER=dev \
  -e POSTGRES_PASSWORD=dev \
  -e POSTGRES_DB=portfolio \
  -p 5432:5432 \
  -d postgres:16
```

### Schema

```sql
BEGIN;

CREATE TABLE coin
(
    coin_ident TEXT PRIMARY KEY, -- Unique coin identifier (e.g., "0x2::sui::SUI")
    decimals   INTEGER NOT NULL, -- Decimal places (e.g., 9 for SUI)
    symbol     TEXT    NOT NULL, -- Ticker symbol (e.g., "SUI")
    icon_url   TEXT    NOT NULL  -- URL to coin logo/icon
);

-- Historical price snapshots per coin (multiple rows per coin over time)
CREATE TABLE coin_price_history
(
    coin_ident TEXT                     NOT NULL, -- Coin identifier
    price      DOUBLE PRECISION         NOT NULL, -- USD price at this point in time
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (coin_ident, created_at)
);

COMMIT;
```

### Seed Data

Run the following SQL to populate your database:

```sql
BEGIN;

-- Coin metadata
INSERT INTO coin (coin_ident, decimals, symbol, icon_url) VALUES
(
    '0x2::sui::SUI',
    9,
    'SUI',
    'https://hop.ag/tokens/SUI.svg'
),
(
    '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN',
    6,
    'wUSDC',
    'https://imagedelivery.net/cBNDGgkrsEA-b_ixIp9SkQ/wusdc.png/public'
),
(
    '0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP',
    6,
    'DEEP',
    'https://coin-images.coingecko.com/coins/images/36083/large/deep.jpg'
),
(
    '0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS',
    9,
    'CETUS',
    'https://assets.coingecko.com/coins/images/30256/standard/cetus.png'
);

-- Historical price snapshots
-- SUI
INSERT INTO coin_price_history (coin_ident, price, created_at) VALUES
('0x2::sui::SUI', 2.85, NOW()),
('0x2::sui::SUI', 2.84, NOW() - INTERVAL '5 minutes'),
('0x2::sui::SUI', 2.83, NOW() - INTERVAL '30 minutes'),
('0x2::sui::SUI', 2.80, NOW() - INTERVAL '1 hour'),
('0x2::sui::SUI', 2.78, NOW() - INTERVAL '4 hours'),
('0x2::sui::SUI', 2.76, NOW() - INTERVAL '6 hours'),
('0x2::sui::SUI', 2.71, NOW() - INTERVAL '1 day'),
('0x2::sui::SUI', 2.60, NOW() - INTERVAL '7 days'),
('0x2::sui::SUI', 2.45, NOW() - INTERVAL '30 days');

-- wUSDC
INSERT INTO coin_price_history (coin_ident, price, created_at) VALUES
('0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN', 1.0002, NOW()),
('0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN', 1.0001, NOW() - INTERVAL '5 minutes'),
('0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN', 1.0001, NOW() - INTERVAL '30 minutes'),
('0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN', 0.9999, NOW() - INTERVAL '1 hour'),
('0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN', 1.0000, NOW() - INTERVAL '4 hours'),
('0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN', 0.9998, NOW() - INTERVAL '6 hours'),
('0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN', 1.0003, NOW() - INTERVAL '1 day'),
('0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN', 0.9997, NOW() - INTERVAL '7 days'),
('0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN', 1.0001, NOW() - INTERVAL '30 days');

-- DEEP
INSERT INTO coin_price_history (coin_ident, price, created_at) VALUES
('0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP', 0.1423, NOW()),
('0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP', 0.1418, NOW() - INTERVAL '5 minutes'),
('0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP', 0.1410, NOW() - INTERVAL '30 minutes'),
('0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP', 0.1400, NOW() - INTERVAL '1 hour'),
('0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP', 0.1395, NOW() - INTERVAL '4 hours'),
('0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP', 0.1380, NOW() - INTERVAL '6 hours'),
('0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP', 0.1350, NOW() - INTERVAL '1 day'),
('0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP', 0.1100, NOW() - INTERVAL '7 days'),
('0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP', 0.0850, NOW() - INTERVAL '30 days');

-- CETUS
INSERT INTO coin_price_history (coin_ident, price, created_at) VALUES
('0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS', 0.2031, NOW()),
('0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS', 0.2028, NOW() - INTERVAL '5 minutes'),
('0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS', 0.2020, NOW() - INTERVAL '30 minutes'),
('0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS', 0.2015, NOW() - INTERVAL '1 hour'),
('0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS', 0.2040, NOW() - INTERVAL '4 hours'),
('0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS', 0.2060, NOW() - INTERVAL '6 hours'),
('0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS', 0.2150, NOW() - INTERVAL '1 day'),
('0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS', 0.1980, NOW() - INTERVAL '7 days'),
('0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS', 0.1750, NOW() - INTERVAL '30 days');

COMMIT;
```

---

## Part 3: Calculate USD Values

### Step 1: Normalize Coin Amounts

Raw balance from RPC needs to be divided by `10^decimals`:

```
Normalized Amount = Raw Balance / (10 ^ decimals)

Example:
Raw Balance: "1000000000"
Decimals: 9
Normalized: 1000000000 / 10^9 = 1.0 SUI
```

### Step 2: Calculate USD Value

```
USD Value = Normalized Amount × Current Price

Example:
Amount: 1.0 SUI
Price: $2.85
USD Value: 1.0 × 2.85 = $2.85
```

### Step 3: Calculate P&L Today

P&L today is the USD gain/loss over the past 24 hours. The current price is the latest record in `coin_price_history`.

```
Current Price    = price from the most recent coin_price_history record
Price 24h Ago    = price from the coin_price_history record closest to NOW() - 24 hours

PNL Today = (Current Price - Price 24h Ago) × Amount

Example:
Current Price: $2.85
Price 24h Ago:  $2.71
Amount: 100 SUI
PNL Today = (2.85 - 2.71) × 100 = $14.00
```

### Step 4: Calculate Price Change Percentages

Price change percentages are **not** pre-computed — derive them from `coin_price_history`.

```
price_change_Xd = ((current_price - price_Xd_ago) / price_Xd_ago) × 100
```

---

## Part 4: API Response Format

### Endpoint
```
GET /api/v1/portfolio/coins?address=<wallet_address>
```

### Query Parameters
- `address` (required): Sui wallet address
- `limit` (optional): Maximum number of coins to return

### Response Schema

```json
{
  "coins": [
    {
      "coin_type": "0x2::sui::SUI",
      "symbol": "SUI",
      "decimals": 9,
      "icon_url": "https://hop.ag/tokens/SUI.svg",
      "amount": 1000.5,
      "usd_value": 2851.43,
      "price": 2.85,
      "pnl_today": 140.07,
      "price_change_1d": 5.17,
      "price_change_7d": 9.62,
      "price_change_30d": 16.33
    },
    {
      "coin_type": "0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP",
      "symbol": "DEEP",
      "decimals": 6,
      "icon_url": "https://coin-images.coingecko.com/coins/images/36083/large/deep.jpg",
      "amount": 50000.0,
      "usd_value": 7115.00,
      "price": 0.1423,
      "pnl_today": 365.00,
      "price_change_1d": 5.41,
      "price_change_7d": 29.36,
      "price_change_30d": 67.41
    }
  ],
  "total_usd": 25678.90
}
```

### Response Fields

**Per Coin:**
- `coin_type`: Coin identifier from RPC
- `symbol`: Display symbol (from `coin` table)
- `decimals`: Decimal places
- `icon_url`: Logo URL
- `amount`: Normalized balance
- `usd_value`: Total USD value (`amount × price`)
- `price`: Current USD price (latest record from `coin_price_history`)
- `pnl_today`: Profit/loss vs 24 hours ago (in USD)
- `price_change_1d/7d/30d`: Price change percentages (computed from `coin_price_history`)

**Summary:**
- `total_usd`: Sum of USD values of all returned coins

### Sorting
Sort coins by `usd_value` descending (highest value first).

---

## Part 5: Frontend UI

Build a polished, user-friendly frontend that consumes your API to display the user's wallet portfolio. While the specific design is entirely up to you, we value clean UI/UX, responsive layouts, and good attention to detail.

### Core Requirements

1. **Address Input:** Provide a clear way for the user to enter or paste a Sui wallet address to look up.
2. **Portfolio Summary:** Display the wallet's overall `total_usd` balance prominently at the top.
3. **Asset List:** Render a visually appealing list or dataset (e.g., table, cards) for the coins held, displaying:
    - Name, Symbol, and Icon
    - Held Amount and its calculated USD Value
    - Current Price
    - Price Changes (1D, 7D, 30D) and P&L Today, styled dynamically (e.g., green for positive, red for negative).
4. **Resilience:** Show appropriate loading indicators while fetching data, and handle invalid addresses or API errors gracefully.

### Tech Stack

- **Framework:** Next.js (App Router preferred, but Pages Router is acceptable)
- **Styling:** TailwindCSS

---

## Testing

### Test Wallets

**Wallet 1:**
```
0x200e6f6dd7e974904cab77e52761f8f0e4e27aabe29f44c7b0e272e8e5ecf543
```

**Wallet 2:**
```
0xdaf1c8ed29d89cd8f217f609bad0a668fa6f158c12000bfa5f93e670c99e24ff
```

---

## Resources

**Sui RPC Docs:**
- https://docs.sui.io/sui-api-ref#suix_getallbalances


