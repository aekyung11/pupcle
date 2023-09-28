import {
  ApolloClient,
  ApolloLink,
  ApolloProvider,
  HttpLink,
} from "@apollo/client";
import { InMemoryCache } from "@apollo/client/cache";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import Constants from "expo-constants";
import * as React from "react";

import { useAuth } from "./auth";

function makeClientSideLink(
  ROOT_URL: string,
  credentials: string,
  _status,
  userToken
) {
  const httpLink = new HttpLink({
    uri: `${ROOT_URL}/graphql`,
    credentials,
  });

  // return the headers to the context
  const authLink = setContext(async (_, { headers }) => {
    return {
      headers: userToken
        ? {
            ...headers,
            authorization: "bearer " + userToken,
          }
        : headers,
    };
  });

  return authLink.concat(httpLink);
}

function getApolloClient(status: string, userToken: string): ApolloClient<any> {
  const ROOT_URL = Constants.expoConfig?.extra?.["ROOT_URL"];
  if (!ROOT_URL) {
    throw new Error("ROOT_URL envvar is not set");
  }

  const onErrorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors)
      graphQLErrors.map(({ message, locations, path }) =>
        console.error(
          `[GraphQL error]: message: ${message}, location: ${JSON.stringify(
            locations
          )}, path: ${JSON.stringify(path)}`
        )
      );
    if (networkError) console.error(`[Network error]: ${networkError}`);
  });

  const mainLink = makeClientSideLink(ROOT_URL, "include", status, userToken);

  const client = new ApolloClient({
    // NOTE: use for connecting to dev tools
    connectToDevTools: true,
    link: ApolloLink.from([onErrorLink, mainLink]),
    cache: new InMemoryCache({
      dataIdFromObject: (o) =>
        o.__typename === "Query"
          ? "ROOT_QUERY"
          : o.id
          ? `${o.__typename}:${o.id}`
          : undefined,
    }).restore({}),
  });

  return client;
}

type Props = {
  children?: React.ReactNode;
};
export const FederationProvider: React.FC<Props> = ({ children }) => {
  const { status, userToken } = useAuth();
  const client = getApolloClient(status, userToken || "");
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
};
