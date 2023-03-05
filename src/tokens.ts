import tokens from "./tokens.json";

export const getToken = (symbol?: string, chainId = 1) => {
  if (symbol?.toLowerCase() === "eth") {
    return {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
      address: "0x0000000000000000000000000000000000000000",
      logoURI: "",
    };
  }

  return tokens.find(
    (token) =>
      symbol?.toLowerCase() ===
        token.symbol.toLowerCase() &&
      token.chainId === chainId
  );
};
