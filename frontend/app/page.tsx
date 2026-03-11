"use client";

import { useState } from "react";

type Coin = {
  coin_type: string;
  symbol: string;
  decimals: number;
  icon_url: string;
  amount: number;
  usd_value: number;
  price: number;
};

export default function Home() {
  const [address, setAddress] = useState("");
  const [coins, setCoins] = useState<Coin[]>([]);
  const [totalUsd, setTotalUsd] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPortfolio = async () => {
    if (!address) return;

    setLoading(true);

    const res = await fetch(
      `http://localhost:3000/api/v1/portfolio/coins?address=${address}`
    );

    const data = await res.json();

    setCoins(data.coins);
    setTotalUsd(data.total_usd);
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-100 p-10">
      <div className="max-w-4xl mx-auto">

        <h1 className="text-3xl font-bold mb-6">
          Sui Portfolio Viewer
        </h1>

        {/* Input */}
        <div className="flex gap-3 mb-8">
          <input
            className="flex-1 border rounded-lg p-3"
            placeholder="Enter wallet address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <button
            onClick={fetchPortfolio}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Fetch
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <p className="text-gray-500">Loading portfolio...</p>
        )}

        {/* Total */}
        {totalUsd !== null && (
          <div className="bg-white shadow rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold">
              Total Portfolio Value
            </h2>
            <p className="text-2xl font-bold text-green-600">
              ${totalUsd.toFixed(2)}
            </p>
          </div>
        )}

        {/* Coin List */}
        <div className="grid gap-4">
          {coins.map((coin) => (
            <div
              key={coin.coin_type}
              className="bg-white p-5 rounded-xl shadow flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <img
                  src={coin.icon_url}
                  alt={coin.symbol}
                  className="w-10 h-10"
                />

                <div>
                  <p className="font-semibold">{coin.symbol}</p>
                  <p className="text-sm text-gray-500">
                    Amount: {coin.amount}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-semibold">
                  ${coin.usd_value.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">
                  Price: ${coin.price}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}