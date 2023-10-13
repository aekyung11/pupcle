import { NetworkStatus, useApolloClient } from "@apollo/client";
import { Text } from "@app/cpapp/design/typography";
// import { SharedLayout } from "@app/cpapp/layouts/SharedLayout";
import React, { useEffect } from "react";
import { useRouter } from "solito/navigation";

export interface RedirectProps {
  href: string;
  as?: string;
  layout?: boolean;
}

export function Redirect({ href, as: _as, layout }: RedirectProps) {
  const _client = useApolloClient();
  const { push } = useRouter();

  useEffect(() => {
    push(href);
  }, [href, push]);
  if (layout) {
    return (
      <Text>Redirecting...</Text>
      // <SharedLayout
      //   title="Redirecting..."
      //   query={{
      //     loading: true,
      //     data: undefined,
      //     error: undefined,
      //     networkStatus: NetworkStatus.loading,
      //     client,
      //     refetch: (async () => {
      //       throw new Error("Redirecting...");
      //     }) as any,
      //   }}
      // >
      //   <Skeleton />
      // </SharedLayout>
    );
  } else {
    return (
      // <StandardWidth>
      // <H3>Redirecting...</H3>
      <Text>Redirecting...</Text>
      /* <Skeleton /> */
      // </StandardWidth>
    );
  }
}
