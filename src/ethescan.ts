import got from "got";
import { ETHERSCAN_API_KEY, ETHERSCAN_API_URL } from "./config";
import { web3 } from "./web3";

const getTimeEstimate = (price: number) =>
  got
    .get(ETHERSCAN_API_URL, {
      searchParams: {
        module: "gastracker",
        action: "gasestimate",
        gasprice: web3.utils.toWei(price.toString(), "gwei"),
        apikey: ETHERSCAN_API_KEY,
      },
    })
    .json<{ result: string }>()
    .then((r) => Number(r.result));

export const getEtherscanGasPrice = () =>
  got
    .get(ETHERSCAN_API_URL, {
      searchParams: {
        module: "gastracker",
        action: "gasoracle",
        apikey: ETHERSCAN_API_KEY,
      },
    })
    .json<IEtherscanGasPrice>()
    .then(async (r) => {
      const [fastPrice, avgPrice, safePrice] = [
        Number(r.result.FastGasPrice),
        Number(r.result.ProposeGasPrice),
        Number(r.result.SafeGasPrice),
      ];

      const [fastTime, avgTime, safeTime] = await Promise.all([
        getTimeEstimate(fastPrice),
        getTimeEstimate(avgPrice),
        getTimeEstimate(safePrice),
      ]);

      return {
        fastPrice,
        fastTime,
        avgPrice,
        avgTime,
        safePrice,
        safeTime,
      };
    });

export type IEtherscanGasPrice = {
  status: string;
  message: string; // OK
  result: {
    LastBlock: string;
    SafeGasPrice: string;
    ProposeGasPrice: string;
    FastGasPrice: string;
    suggestBaseFee: string;
    gasUsedRatio: string;
  };
};

export const getTxs = async (address: string) => {
  const endblock = await web3.eth.getBlockNumber();

  const response = (await got
    .get(ETHERSCAN_API_URL, {
      searchParams: {
        module: "account",
        action: "txlist",
        address,
        startblock: endblock - 10000,
        endblock,
        page: 1,
        sort: "desc",
        apikey: ETHERSCAN_API_KEY,
      },
    })
    .json()) as unknown as IEtherscanAddressTxs;

  return response.result;
};

export type IEtherscanAddressTxs = {
  status: string;
  message: string;
  result: {
    blockNumber: string;
    timeStamp: string;
    hash: string;
    nonce: string;
    blockHash: string;
    transactionIndex: string;
    from: string;
    to: string;
    value: string;
    gas: string;
    gasPrice: string;
    isError: string;
    txreceipt_status: string;
    input: string;
    contractAddress: string;
    cumulativeGasUsed: string;
    gasUsed: string;
    confirmations: string;
    methodId: string;
    functionName: string;
  }[];
};
