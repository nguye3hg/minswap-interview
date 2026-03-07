import axios from "axios";

const SUI_RPC_URL = "https://fullnode.mainnet.sui.io:443";

type CoinBalance = {
  coinType: string;
  totalBalance: string;
};

export async function getWalletBalances(
  address: string
): Promise<CoinBalance[]> {
  const response = await axios.post(
    SUI_RPC_URL,
    {
      jsonrpc: "2.0",
      id: 1,
      method: "suix_getAllBalances",
      params: [address],
    },
    { timeout: 5000 }
  );

  return response.data.result;
}