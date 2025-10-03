import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { PetraWallet } from "petra-plugin-wallet-adapter";
import { PropsWithChildren } from "react";
// Wallets that are known to be stable and have correct package exports
const wallets = [
  new PetraWallet(),
];
export const AptosWalletProvider = ({ children }: PropsWithChildren) => {
  return (
    <AptosWalletAdapterProvider
      // FIX: Reverting to the correct `wallets` prop to resolve the build error.
      // The type definition for the provider expects `wallets`.
      wallets={wallets}
      autoConnect={true}
      onError={(error) => {
        console.log("Wallet error", error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
};