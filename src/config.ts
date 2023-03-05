import { environment } from "@raycast/api";
import "dotenv/config";
import * as env from "./env";

export const keychainPath = [environment.supportPath, "default.keystore"].join(
  "/"
);

export const CHAIN_ID = parseInt(env.CHAIN_ID || process.env.CHAIN_ID!);

export const {
  ZERO_EX_API,
  RPC_URL,
  ZERO_EX_ADDRESS,
  WIT_TOKEN,
  WIT_URL,
  ETHERSCAN_API_KEY,
  ETHERSCAN_API_URL,
  PAPERWALLET_PASS,
} = env;
