import { ApolloError } from "@apollo/client";
import { Text } from "@app/cpapp/design/typography";
import { View } from "@app/cpapp/design/view";
import { RefreshCcw } from "@tamagui/lucide-icons";
import React from "react";
import { Link } from "solito/link";
import { Button } from "tamagui";

export interface ErrorAlertProps {
  error: ApolloError | Error;
}

export function ErrorAlert({ error }: ErrorAlertProps) {
  const code: string | undefined = (error as any)?.networkError?.result
    ?.errors?.[0]?.code;
  if (code === "EBADCSRFTOKEN") {
    return (
      <View>
        <Text>status="403" title="Invalid CSRF token"</Text>
        <>
          <Text>
            type="secondary" Our security protections have failed to
            authenticate your request; to solve this you need to refresh the
            page:
          </Text>
          <Text>
            <Button
              // type="primary"
              onClick={() => window.location.reload()}
              icon={<RefreshCcw />}
            >
              <Text>Refresh page</Text>
            </Button>
          </Text>
        </>
      </View>
    );
  }
  return (
    <View>
      <Text>status="error" title="Unexpected error occurred" subTitle=</Text>
      <Text>
        We&apos;re really sorry, but an unexpected error occurred. Please{" "}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <Link href="/">return to the homepage</Link> and try again.
      </Text>
      <Text>
        type="error"
        {error.message}
      </Text>
    </View>
  );
}
