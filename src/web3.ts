import { BigNumber } from "@0x/utils";
import Web3 from "web3";
import { AbiItem } from "web3-utils";
import { RPC_URL, ZERO_EX_ADDRESS } from "./config";
import ERC20ABI from "./erc20abi.json";
import { getToken } from "./tokens";
import { getWallet } from "./wallet";

export const maxApproval = new BigNumber(2).pow(256).minus(1);
export const provider = new Web3.providers.HttpProvider(RPC_URL);

export const web3 = new Web3(provider);

export const simulate = (wallet: string, tx: any) => {
  return new Promise((resolve, reject) => {
    provider.send(
      {
        method: "alchemy_simulateExecution",
        params: [
          {
            from: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
            to: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            value: "0x0",
            data: "0xa9059cbb000000000000000000000000fc43f5f9dd45258b3aff31bdbe6561d97e8b71de00000000000000000000000000000000000000000000000000000000000f4240",
          },
          "latest",
        ],
        jsonrpc: "2.0",
        id: 5,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
};

export const ERC20 = (address: string) =>
  new web3.eth.Contract(ERC20ABI as AbiItem[], address);

export const zeroex = ERC20(ZERO_EX_ADDRESS);

export const ensureAllowance = async (
  contractAddress: string,
  allowanceTarget: string,
  amount: string,
  gasPrice: string
) => {
  const contract = ERC20(contractAddress);
  const wallet = getWallet();

  const currentAllowance = new BigNumber(
    await contract.methods
      .allowance(wallet.address, ZERO_EX_ADDRESS)
      .call({ from: wallet.address })
  );

  if (currentAllowance.isLessThan(amount)) {
    const [gasLimit, _gasPrice] = await Promise.all([
      contract.methods
        .approve(allowanceTarget, amount)
        .estimateGas({ from: wallet.address }),
      web3.eth.getGasPrice(),
    ]);

    const tx = await contract.methods
      .approve(allowanceTarget, amount)
      .send({ from: wallet.address, gasLimit, gasPrice: gasPrice || _gasPrice })
      .on("transactionHash", function (hash: string) {
        console.log({ hash });
      })
      .on("receipt", function (receipt: any) {
        console.log({ receipt });
      })
      .on("confirmation", function (confirmationNumber: any, receipt: any) {
        console.log({ confirmationNumber, receipt });
      })
      .on("error", function (error: any, receipt: any) {
        console.log({ error, receipt });
      });

    console.log({ tx });
  } else {
    console.log("current allowance:", currentAllowance);
  }
};

export const getBalance = async (wallet: string, symbol: string) => {
  const token = getToken(symbol)!;
  const contract = ERC20(token.address);
  const res = await contract.methods.balanceOf(wallet).call();
  return (res / Math.pow(10, token.decimals)).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: token.decimals,
  });
};
