import express from "express";
import cors from "cors";
import { getWalletBalances } from "./rpc/suiClient.js";
import { getPortfolioCoins } from "./rpc/getProtfolioCoins.js";


const app = express();
app.use(cors());

const PORT = 3000;

app.get("/test-balances", async (req, res) => {
  const address = req.query.address as string;

  if (!address) {
    return res.status(400).json({ error: "address is required" });
  }

  try {
    const balances = await getWalletBalances(address);
    res.json(balances);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch balances" });
  }
});
app.get("/api/v1/portfolio/coins", async (req, res) => {
   const address = req.query.address as string;
  const limit = req.query.limit ? Number(req.query.limit) : undefined;

  if (!address) {
    return res.status(400).json({ error: "address is required" });
  }

  try {
    const coins = await getPortfolioCoins(address, limit);
    const totalUsd = coins.reduce((sum, c) => sum + c.usd_value, 0);

    res.json({
      coins,
      total_usd: totalUsd
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal server error" });
  }
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});