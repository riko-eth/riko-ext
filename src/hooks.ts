import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { CHAIN_ID } from "./config";
import { getEtherscanGasPrice, getTxs } from "./ethescan";
import { getIntent } from "./model";
import { getToken } from "./tokens";
import { getWallet } from "./wallet";
import { ensureAllowance, getBalance, web3 } from "./web3";
import { getPrice, getQuote } from "./zeroex";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export const useIntent = (query = "") => {
  const value = useDebounce(query.trim(), 300);

  return useQuery({
    queryKey: [value],
    queryFn: () => getIntent(value),
    enabled: value.length > 0,
    initialData: () => [],
  });
};

export const useToken = (symbol: string, chainId: number) =>
  useMemo(() => getToken(symbol, chainId), [symbol, chainId]);

export const useWallet = () => useMemo(() => getWallet(), []);

export const usePrice = ({
  buyToken,
  buyAmount,
  sellToken,
  sellAmount,
}: {
  sellToken?: string;
  buyToken?: string;
  buyAmount: string | null;
  sellAmount: string | null;
}) =>
  useQuery({
    queryKey: [buyToken, sellToken, buyAmount, sellAmount],
    queryFn: () => getPrice({ buyToken, sellToken, buyAmount, sellAmount }),
    enabled: Boolean(sellToken && buyToken && (buyAmount || sellAmount)),
    refetchInterval: 10000,
  });

const { toBN } = web3.utils;

export type ISwapParams = {
  currency_amount?: string;
  wit$number?: string;
  source_currency: string;
  target_currency: string;
};

export const useSwapParams = (intent: string, params: ISwapParams) =>
  useMemo(() => {
    console.log({ intent, params });

    const sToken = getToken(params.source_currency, CHAIN_ID);
    const tToken = getToken(params.target_currency, CHAIN_ID);

    const buyToken = tToken?.address;
    const sellToken = sToken?.address;

    const token = intent === "ca_buy" ? tToken : sToken;
    const raw = params.wit$number || params.currency_amount || "0";

    const amountDecimals = (
      Number(raw) * Math.pow(10, token?.decimals || 1)
    ).toString();

    const buyAmount = intent === "ca_buy" ? amountDecimals : null;
    const sellAmount = intent === "ca_sell" ? amountDecimals : null;

    console.log({ sellToken, sellAmount, buyToken, buyAmount });

    return { sellToken, sellAmount, buyToken, buyAmount };
  }, [intent, params]);

const normalise = (num: string | number | undefined, dec: number | undefined) =>
  num
    ? (Number(num) / Math.pow(10, dec || 1)).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: dec || 4,
      })
    : 0;

export const sleep = (s = 1) => new Promise((r) => setTimeout(r, s * 1000));

export const useSwap = (
  intent: "ca_buy" | "ca_sell",
  params: ISwapParams,
  gasPriceGwei: number
) => {
  const quoteParams = useSwapParams(intent, params);
  const quote = usePrice(quoteParams);
  const wallet = useWallet();

  const performSwap = useMutation(async () => {
    // 1. optional: eth -> erc20 (weth)

    // 2. ensure erc20 allowance

    await ensureAllowance(
      quote.data!.sellTokenAddress,
      quote.data!.allowanceTarget,
      quote.data!.sellAmount,
      (gasPriceGwei * Math.pow(10, 9)).toString()
    );

    await sleep(2);

    // 3. exec order

    const q = await getQuote({
      ...quoteParams,
      takerAddress: wallet.address,
    });

    const tx = {
      chainId: q.chainId,
      from: wallet.address,
      to: q.to,
      data: q.data,
      value: q.value,
      gasPrice: (gasPriceGwei * Math.pow(10, 9)).toString(),
      gas: q.gas,
    };

    console.log({ tx });

    const res = await web3.eth.sendTransaction(tx);

    console.log({ res });

    // 4. optional: erc20 (weth) -> eth

    return res.transactionHash;
  });

  return useMemo(() => {
    const sourceToken = getToken(params.source_currency, CHAIN_ID);
    const targetToken = getToken(params.target_currency, CHAIN_ID);

    const fromAmount =
      normalise(
        quoteParams.sellAmount || quote.data?.sellAmount,
        sourceToken?.decimals
      ) || "⏳";

    const toAmount =
      normalise(
        quoteParams.buyAmount || quote.data?.buyAmount,
        targetToken?.decimals
      ) || "⏳";

    const fromToken = sourceToken?.symbol;
    const toToken = targetToken?.symbol;

    const price = quote.data ? "(1 → " + quote.data?.price + ")" : "";
    const title = `Swap ${fromAmount} ${fromToken} → ${toAmount} ${toToken} ${price}`;
    const sources = quote.data?.sources.filter((s) => s.proportion !== "0");
    const execute = () => performSwap.mutateAsync();

    return { title, sources, execute };
  }, [quoteParams, quote.data]);
};

export const useBalance = () => {
  const wallet = useWallet();

  const balances = useQuery({
    queryKey: [wallet.address],
    queryFn: async () => {
      const [usdc, dai, weth, eth] = await Promise.all([
        getBalance(wallet.address, "USDC"),
        getBalance(wallet.address, "DAI"),
        getBalance(wallet.address, "WETH"),
        web3.eth
          .getBalance(wallet.address)
          .then((wei) => web3.utils.fromWei(wei)),
      ]);

      return { usdc, dai, weth, eth };
    },
    initialData: { usdc: "⏳", dai: "⏳", weth: "⏳", eth: "⏳" },
    refetchInterval: 60000,
  });

  return balances;
};

export const useGasPrice = () =>
  useQuery({
    queryKey: ["gasPrice"],
    queryFn: getEtherscanGasPrice,
    initialData: {
      fastPrice: 0,
      avgPrice: 0,
      safePrice: 0,
      avgTime: 0,
      fastTime: 0,
      safeTime: 0,
    },
    refetchInterval: 60000,
  });

export const useTxs = () => {
  const wallet = useWallet();

  return useQuery({
    queryKey: ["txs", wallet.address],
    queryFn: () => getTxs(wallet.address),
    initialData: () => [],
    refetchInterval: 10000,
  });
};
