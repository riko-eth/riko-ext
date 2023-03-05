import { List } from "@raycast/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Swap } from "./components/Swap";
import { useIntent, ISwapParams } from "./hooks";

const queryClient = new QueryClient();

export const Item: React.FC<{
  intent: string;
  entities: Record<string, unknown>;
}> = ({ intent, entities }) => {
  if (["ca_buy", "ca_sell"].includes(intent)) {
    return <Swap intent={intent as any} entities={entities as ISwapParams} />;
  } else {
    return <div>unknown intent</div>;
  }
};

export default function Command(props: { fallbackText: string }) {
  const icon = { source: "splash.png" };

  const SubCmd = () => {
    const [query, setQuery] = useState(props.fallbackText || "");
    const { isFetching, data } = useIntent(query);

    return (
      <List isLoading={isFetching} onSearchTextChange={setQuery}>
        {isFetching ? null : !query.length ? (
          <List.EmptyView icon={icon} title="Type something to get started" />
        ) : !isFetching && !data.length ? (
          <List.EmptyView icon={icon} title="Try: 'buy 1 eth using usdc'" />
        ) : (
          data.map((item) => (
            <Item
              key={item.intent.id}
              intent={item.intent.name}
              entities={item.entities}
            />
          ))
        )}
      </List>
    );
  };

  return (
    <QueryClientProvider client={queryClient}>
      <SubCmd />
    </QueryClientProvider>
  );
}
