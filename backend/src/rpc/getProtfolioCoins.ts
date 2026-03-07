import axios from "axios";
import pkg from "pg";

const { Pool } = pkg;

const pool = new Pool({
  user: "dev",
  host: "localhost",
  database: "portfolio",
  password: "dev",
  port: 5432,
});

export async function getPortfolioCoins(address: string, limit?: number) {
  const client = await pool.connect();

  try {

    // Fetch balances from Sui RPC
    const rpc = await axios.post("https://fullnode.mainnet.sui.io:443", {
      jsonrpc: "2.0",
      id: 1,
      method: "suix_getAllBalances",
      params: [address]
    });

    const balances = rpc.data.result;

    const coins = [];

    for (const b of balances) {

      const coinType = b.coinType;
      const rawBalance = Number(b.totalBalance);

      // Get coin metadata
      const meta = await client.query(
        "SELECT * FROM coin WHERE coin_ident = $1",
        [coinType]
      );

      if (meta.rows.length === 0) continue;

      const coin = meta.rows[0];

      // Get latest price
      const priceRes = await client.query(
        `SELECT price
         FROM coin_price_history
         WHERE coin_ident = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [coinType]
      );

      const price = priceRes.rows[0]?.price || 0;

      // Convert decimals
      const amount = rawBalance / Math.pow(10, coin.decimals);

      // USD value
      const usd_value = amount * price;

      coins.push({
        coin_type: coinType,
        symbol: coin.symbol,
        decimals: coin.decimals,
        icon_url: coin.icon_url,
        amount,
        usd_value,
        price,
        pnl_today: 0,
        price_change_1d: 0,
        price_change_7d: 0,
        price_change_30d: 0
      });

    }

    // Sort by USD value
    coins.sort((a, b) => b.usd_value - a.usd_value);

    // Apply limit
    const finalCoins = limit ? coins.slice(0, limit) : coins;

    return finalCoins;

  } finally {
    client.release();
  }
}