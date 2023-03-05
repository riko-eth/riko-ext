import { keychainPath } from "./config";
import { web3 } from "./web3";
import fs from "fs";
import { PAPERWALLET_PASS } from "./config";

export const getWallet = (pass = PAPERWALLET_PASS) => {
  if (!fs.existsSync(keychainPath)) {
    const account = web3.eth.accounts.create();
    const wallet = web3.eth.accounts.wallet.add(account);
    const keystore = wallet.encrypt(pass);
    fs.writeFileSync(keychainPath, JSON.stringify(keystore));
  }

  const keystore = JSON.parse(fs.readFileSync(keychainPath).toString());

  const account = web3.eth.accounts.decrypt(keystore, pass);
  const wallet = web3.eth.accounts.wallet.add(account);

  return wallet;
};
