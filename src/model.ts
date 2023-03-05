import got from "got";
import { WIT_TOKEN, WIT_URL } from "./config";

export const getIntent = async (query: string) => {
  const response = (await got
    .get(WIT_URL, {
      headers: {
        Authorization: `Bearer ${WIT_TOKEN}`,
      },
      searchParams: { q: query },
    })
    .json()) as IResponse;

  if (Object.keys(response.entities).length < 3) {
    return [];
  }

  return response.intents
    .filter((intent) => intent.confidence > 0.95)
    .map((intent) => ({
      intent,
      entities: Object.fromEntries(
        Object.values(response.entities).map(([{ name, value }]) => [
          name,
          value,
        ])
      ),
    }));
};

export type IResponse = {
  entities: Record<
    string,
    {
      body: string;
      confidence: number; // [0,1]
      end: number;
      entities: Record<string, unknown>;
      id: string;
      name: string;
      role: string;
      start: number;
      type: string;
      value: string;
    }[]
  >;
  intents: {
    confidence: number; // [0,1]
    id: string;
    name: string;
  }[];
};
