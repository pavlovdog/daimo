import { AddrLabel } from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";
import Octicons from "@expo/vector-icons/Octicons";
import * as Clipboard from "expo-clipboard";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableHighlight, View } from "react-native";
import { Address, getAddress } from "viem";

import { CBPayWebView } from "./OnrampCBPay";
import { env } from "../../../logic/env";
import { Account, useAccount } from "../../../model/account";
import { ButtonMed } from "../../shared/Button";
import { ScreenHeader, useExitToHome } from "../../shared/ScreenHeader";
import Spacer from "../../shared/Spacer";
import { color, ss, touchHighlightUnderlay } from "../../shared/style";
import { TextBody, TextBold, TextLight } from "../../shared/text";

export default function DepositScreen() {
  const [onramp, setOnramp] = useState<"cbpay" | null>(null);
  const exitOnramp = () => {
    // TODO: add a placeholder "pendng op" for the onramp transfer
    // Onramp doesn't give us the amount, and tx may be sent later
    setOnramp(null);
  };

  const goHome = useExitToHome();
  const [account] = useAccount();
  if (account == null) return null;

  const { chainL2, tokenSymbol } = env(
    daimoChainFromId(account.homeChainId)
  ).chainConfig;
  // Overwrite to test CBPay
  const testnet = chainL2.testnet;

  if (onramp === "cbpay") {
    return <CBPayWebView destAccount={account} onExit={exitOnramp} />;
  }

  return (
    <View style={ss.container.screen}>
      <ScreenHeader title="Deposit" onExit={goHome} />
      <Spacer h={16} />
      {testnet && (
        <TestnetFaucet account={account} recipient={account.address} />
      )}
      {testnet && <Spacer h={32} />}
      {!testnet && (
        <ButtonMed
          type="primary"
          title="Deposit from Coinbase"
          onPress={() => setOnramp("cbpay")}
        />
      )}
      <Spacer h={32} />
      <View style={styles.padH16}>
        <TextBody>
          <TextBold>
            Deposit {tokenSymbol} on {chainL2.name} only.
          </TextBold>{" "}
          Use the following address.
        </TextBody>
        <Spacer h={16} />
        <AddressCopier addr={account.address} />
      </View>
    </View>
  );
}

/** Request token from testnet faucet. */
function TestnetFaucet({
  account,
  recipient,
}: {
  account: Account;
  recipient: Address;
}) {
  const [, setAccount] = useAccount();

  const rpcHook = env(daimoChainFromId(account.homeChainId)).rpcHook;

  const faucetStatus = rpcHook.testnetFaucetStatus.useQuery({ recipient });

  const mutation = rpcHook.testnetRequestFaucet.useMutation();
  const request = useCallback(() => {
    mutation.mutate({ recipient });
  }, [recipient]);

  // Show faucet payment in history promptly
  useEffect(() => {
    if (!mutation.isSuccess) return;
    const newAccount = {
      ...account,
      recentTransfers: [...account.recentTransfers, mutation.data],
      namedAccounts: [
        ...account.namedAccounts,
        { addr: getAddress(mutation.data.from), label: AddrLabel.Faucet },
      ],
    };
    setAccount(newAccount);
  }, [mutation.isSuccess]);

  // Display
  let canRequest = false;
  let buttonType = "primary" as "primary" | "success" | "danger";
  let message = "Request $50 from faucet";
  if (mutation.isLoading) {
    message = "Loading...";
  } else if (mutation.isSuccess) {
    message = "Faucet payment sent";
    buttonType = "success";
  } else if (mutation.isError) {
    message = "Error";
    buttonType = "danger";
  } else if (faucetStatus.isError) {
    message = "Faucet unavailable";
  } else if (faucetStatus.isSuccess) {
    switch (faucetStatus.data) {
      case "unavailable":
        message = "Faucet unavailable";
        break;
      case "alreadyRequested":
        message = "Requested";
        break;
      case "alreadySent":
        message = "Faucet payment sent";
        buttonType = "success";
        break;
      case "canRequest":
        canRequest = true;
        break;
    }
  }

  return (
    <View style={styles.callout}>
      <TextBody>
        <Octicons name="alert" size={16} color="black" />{" "}
        <TextBold>Testnet account.</TextBold> Your account is on the{" "}
        {env(daimoChainFromId(account.homeChainId)).chainConfig.chainL2.name}{" "}
        testnet.
      </TextBody>
      <Spacer h={16} />
      <ButtonMed
        title={message}
        onPress={request}
        type={buttonType}
        disabled={!canRequest}
      />
    </View>
  );
}

function AddressCopier({ addr }: { addr: string }) {
  const [justCopied, setJustCopied] = useState(false);
  const copy = useCallback(async () => {
    await Clipboard.setStringAsync(addr);
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 1000);
  }, [addr]);

  return (
    <View style={styles.address}>
      <TouchableHighlight
        style={styles.addressButton}
        onPress={copy}
        {...touchHighlightUnderlay.subtle}
      >
        <View style={styles.addressView}>
          <Text style={styles.addressMono} numberOfLines={1}>
            {addr}
          </Text>
          <Octicons name="copy" size={16} color="black" />
        </View>
      </TouchableHighlight>
      <TextLight>{justCopied ? "Copied" : " "}</TextLight>
    </View>
  );
}

const styles = StyleSheet.create({
  padH16: {
    paddingHorizontal: 16,
  },
  address: {
    flexDirection: "column",
    gap: 16,
    alignItems: "center",
  },
  addressButton: {
    borderRadius: 8,
    backgroundColor: color.ivoryDark,
    padding: 16,
  },
  addressView: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  addressMono: {
    ...ss.text.mono,
    flexShrink: 1,
  },
  callout: {
    backgroundColor: color.ivoryDark,
    padding: 16,
    borderRadius: 24,
  },
});
