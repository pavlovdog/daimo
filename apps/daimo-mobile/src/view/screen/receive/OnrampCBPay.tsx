import { generateOnRampURL } from "@coinbase/cbpay-js";
import { daimoChainFromId } from "@daimo/contract";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { WebView, WebViewMessageEvent } from "react-native-webview";

import "react-native-url-polyfill/auto";
import { env } from "../../../logic/env";
import { Account } from "../../../model/account";

export function CBPayWebView({
  destAccount,
  onExit,
}: {
  destAccount: Account;
  onExit: () => void;
}) {
  const coinbaseURL = useMemo(
    () =>
      generateOnRampURL({
        appId: "2be3ccd9-6ee4-4dba-aba8-d4b458fe476d",
        destinationWallets: [
          {
            address: destAccount.address,
            blockchains: ["base"],
            assets: ["USDC"],
            supportedNetworks: ["base"],
          },
        ],
        handlingRequestedUrls: true,
        defaultExperience: "send",
      }),
    [destAccount.address]
  );

  // Track timing and outcome
  const startMs = useRef(performance.now());
  const routeReached = useRef("initial");
  const succeeded = useRef(false);

  // On exit, log result
  useEffect(
    () => () => {
      console.log("[CB] onramp exit");
      const error = succeeded.current
        ? undefined
        : `reached ${routeReached.current}`;
      logOnramp(destAccount, "onramp-cbpay", startMs.current, error);
    },
    []
  );

  const onMessage = useCallback((event: WebViewMessageEvent) => {
    // Check for Success and Error Messages here
    console.log("[CB] webview message", event.nativeEvent.data);
    const { data } = JSON.parse(event.nativeEvent.data);
    switch (data.eventName) {
      case "open":
        break;
      case "request_open_url":
        console.log(`[CB] UNHANDLED request_open_url ${data.url}`);
        break;
      case "transition_view":
        console.log(`[CB] transition to ${data.pageRoute}`);
        routeReached.current = data.pageRoute;
        break;
      case "success":
        console.log(`[CB] onramp success`);
        succeeded.current = true;
        break;
      case "exit": {
        onExit();
        break;
      }
      default:
        console.warn(`[CB] unknown event ${data.eventName}`);
    }
  }, []);

  return (
    <WebView
      source={{ uri: coinbaseURL }}
      onMessage={onMessage}
      originWhitelist={["*"]}
    />
  );
}

function logOnramp(
  account: Account,
  actionName: string,
  startMs: number,
  error?: string
) {
  // Fire and forget
  const rpcFunc = env(daimoChainFromId(account.homeChainId)).rpcFunc;
  rpcFunc.logAction.mutate({
    action: {
      name: actionName,
      accountName: account.name,
      startMs,
      durationMs: performance.now() - startMs,
      error,
    },
  });
}