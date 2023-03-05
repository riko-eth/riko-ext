import {
  Action,
  ActionPanel,
  clearSearchBar,
  Icon,
  List,
  open,
  OpenInBrowserAction,
  popToRoot,
  showToast,
  Toast,
} from "@raycast/api";

import { useCallback, useMemo, useState } from "react";
import {
  ISwapParams,
  sleep,
  useBalance,
  useGasPrice,
  useSwap,
  useTxs,
  useWallet,
} from "../hooks";
import { getToken } from "../tokens";

export const Swap: React.FC<{
  intent: "ca_buy" | "ca_sell";
  entities: ISwapParams;
}> = ({ intent, entities }) => {
  const wallet = useWallet();

  const [state, setState] = useState<"swap" | "activities">("swap");

  const balance = useBalance();
  const gasPrice = useGasPrice();
  const txs = useTxs();

  const [lastTx, setLastTx] = useState<string>();

  const [gasPriceValue, setGasPriceValue] = useState(gasPrice.data.avgPrice);
  const swap = useSwap(intent, entities, gasPriceValue);

  const setGas = useCallback((val: number) => () => setGasPriceValue(val), []);

  const [loading, setLoading] = useState(false);

  const swapIcon = useMemo(() => {
    if (loading) return Icon.WristWatch;
    else return { source: "swap.png" };
  }, [loading]);

  const accessories = useMemo(
    () =>
      (swap.sources || [])
        .map((s) => s.name)
        .map((name) => ({
          text: name.replace("_", " "),
          icon: { source: `${name}.png` },
        })),
    [swap.sources]
  );

  const onAction = useCallback(async () => {
    if (!loading) {
      setLoading(true);
      await showToast({ title: "Swapping", style: Toast.Style.Animated });

      setState("activities");

      const txHash = await swap.execute();
      setLastTx(txHash);

      await showToast({
        title: "Success",
        style: Toast.Style.Success,
        primaryAction: {
          title: "View on Etherscan",
          onAction: () => {
            open(`https://etherscan.com/tx/${txHash}`, "com.google.Chrome");
          },
        },
      });

      balance.refetch();
      setLoading(false);
    }
  }, [swap, loading]);

  const actions = (
    <ActionPanel>
      <Action title={swap.title} icon={swapIcon} onAction={onAction} />
      <Action.CopyToClipboard
        title={"Wallet address: " + wallet.address}
        content={wallet.address}
      />
      <ActionPanel.Section title="Balance">
        <Action title={"ETH " + balance.data.eth} icon={Icon.Coin} />
        <Action
          title={"WETH " + balance.data.weth}
          icon={{ source: getToken("WETH")!.logoURI }}
        />
        <Action
          title={"USDC " + balance.data.usdc}
          icon={{ source: getToken("USDC")!.logoURI }}
        />
        <Action
          title={"DAI " + balance.data.dai}
          icon={{ source: getToken("DAI")!.logoURI }}
        />
      </ActionPanel.Section>

      <ActionPanel.Section title="Gas Preference">
        <Action
          title={
            "🏎️ Fast: " +
            gasPrice.data.fastPrice +
            " gwei, " +
            gasPrice.data.fastTime +
            "sec"
          }
          onAction={setGas(gasPrice.data.fastPrice)}
        />
        <Action
          title={
            "🏃🏻‍♂️ Regular: " +
            gasPrice.data.avgPrice +
            " gwei, " +
            gasPrice.data.avgTime +
            "sec"
          }
          onAction={setGas(gasPrice.data.avgPrice)}
        />
        <Action
          title={
            "🐌 Slow: " +
            gasPrice.data.safePrice +
            " gwei, " +
            gasPrice.data.safeTime +
            "sec"
          }
          onAction={setGas(gasPrice.data.safePrice)}
        />
      </ActionPanel.Section>
    </ActionPanel>
  );

  const intentView = (
    <List.Item
      title={swap.title}
      icon={swapIcon}
      accessories={accessories}
      actions={actions}
    />
  );

  const activityView = useMemo(
    () => (
      <>
        <List.Item
          id={"loading"}
          key={"loading"}
          title={lastTx?.slice(0, 10) || ""}
          accessories={[
            {
              text: "pending",
              icon: Icon.Clock,
            },
          ]}
          icon={{
            source: lastTx ? "status_ok.png" : "status_pending.png",
          }}
          actions={
            <ActionPanel>
              <Action.OpenInBrowser
                url={"https://etherscan.io/tx/" + lastTx}
                title={lastTx?.slice(0, 10) || "Open in etherscan"}
              />
            </ActionPanel>
          }
        />

        {txs.data.map((tx) => (
          <List.Item
            id={tx.hash}
            key={tx.hash}
            title={tx.hash.slice(0, 10) + "..."}
            accessories={[
              {
                text: new Date(Number(tx.timeStamp) * 1000).toLocaleTimeString(
                  "en-US"
                ),
                icon: Icon.Clock,
              },
              {
                text: tx.confirmations + " confirmations",
                icon: Icon.Checkmark,
              },
            ]}
            icon={{
              source:
                tx.confirmations === "0"
                  ? "status_pending.png"
                  : tx.isError === "0"
                  ? "status_ok.png"
                  : "status_error.png",
            }}
            actions={
              <ActionPanel>
                <Action.OpenInBrowser
                  url={"https://etherscan.io/tx/" + tx.hash}
                  title={
                    tx.hash.slice(0, 10) +
                    " " +
                    new Date(Number(tx.timeStamp) * 1000).toLocaleTimeString(
                      "en-US"
                    )
                  }
                />
              </ActionPanel>
            }
          />
        ))}
      </>
    ),
    [txs.data]
  );

  if (lastTx) {
    return (
      <>
        <List.EmptyView
          title="Transaction Submitted"
          icon={{ source: "done.png" }}
          actions={
            <ActionPanel>
              <Action.OpenInBrowser
                title={"View on Etherscan"}
                url={"https://etherscan.io/tx/" + lastTx}
              />
            </ActionPanel>
          }
        />
      </>
    );
  }

  return state === "swap" ? intentView : activityView;
};
