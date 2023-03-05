import got from "got";
import { ZERO_EX_API } from "./config";

export const getQuote = ({
  buyToken,
  sellToken,
  buyAmount,
  sellAmount,
  takerAddress,
}: {
  buyToken?: string;
  sellToken?: string;
  buyAmount: string | null;
  sellAmount: string | null;
  takerAddress?: string;
}): Promise<IQuote> =>
  got
    .get(`${ZERO_EX_API}/quote`, {
      searchParams: {
        buyToken,
        sellToken,
        ...(buyAmount && { buyAmount }),
        ...(sellAmount && { sellAmount }),
        ...(takerAddress && { takerAddress }),
      },
    })
    .json()
    .catch((e) => {
      console.log(e.response.statusCode, e.response.body);
      throw e;
    }) as any;

export const getPrice = ({
  buyToken,
  sellToken,
  buyAmount,
  sellAmount,
}: {
  buyToken?: string;
  sellToken?: string;
  buyAmount: string | null;
  sellAmount: string | null;
}): Promise<IPrice> =>
  got
    .get(`${ZERO_EX_API}/price`, {
      searchParams: {
        buyToken,
        sellToken,
        ...(buyAmount && { buyAmount }),
        ...(sellAmount && { sellAmount }),
      },
    })
    .json()
    .catch((e) => {
      console.log(e.response.statusCode, e.response.body);
      throw e;
    }) as any;

export type IQuote = {
  chainId: number;
  price: string;
  guaranteedPrice: string;
  estimatedPriceImpact: string;
  to: string;
  data: string;
  value: string;
  gas: string;
  estimatedGas: string;
  gasPrice: string;
  protocolFee: string;
  minimumProtocolFee: string;
  buyTokenAddress: string;
  sellTokenAddress: string;
  buyAmount: string;
  sellAmount: string;
  sources: { name: string; proportion: string }[];
  orders: {
    type: number;
    source: string;
    makerToken: string;
    takerToken: string;
    makerAmount: string;
    takerAmount: string;
    fillData: {
      tokenAddressPath: string[];
      router: string;
    };
    fill: {
      input: string;
      output: string;
      adjustedOutput: string;
      gas: number;
    };
  }[];
  allowanceTarget: string;
  decodedUniqueId: string;
  sellTokenToEthRate: string;
  buyTokenToEthRate: string;
  expectedSlippage: string | null;
};

export type IPrice = Exclude<
  IQuote,
  "decodedUniqueId" | "orders" | "data" | "to" | "guaranteedPrice"
>;
