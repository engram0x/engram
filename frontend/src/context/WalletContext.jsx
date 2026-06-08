import { createContext, useContext, useCallback, useEffect, useState } from "react";
import { BrowserProvider } from "ethers";
import { ACTIVE_NETWORK } from "../config/contracts";

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [provider, setProvider] = useState(null);
  const [error, setError] = useState("");

  const hasMetaMask = typeof window !== "undefined" && window.ethereum;

  const refresh = useCallback(async () => {
    if (!window.ethereum) return;
    const p = new BrowserProvider(window.ethereum);
    setProvider(p);
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    setAccount(accounts[0] ?? null);
    const net = await p.getNetwork();
    setChainId(Number(net.chainId));
  }, []);

  const connect = useCallback(async () => {
    setError("");
    if (!window.ethereum) {
      setError("No wallet found. Install MetaMask to continue.");
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0] ?? null);
      await refresh();
    } catch (e) {
      setError(e?.message || "Failed to connect wallet.");
    }
  }, [refresh]);

  const disconnect = useCallback(() => {
    setAccount(null);
  }, []);

  const switchToBase = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ACTIVE_NETWORK.chainIdHex }],
      });
    } catch (e) {
      // 4902 = chain not added to wallet
      if (e?.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: ACTIVE_NETWORK.chainIdHex,
              chainName: ACTIVE_NETWORK.name,
              rpcUrls: [ACTIVE_NETWORK.rpcUrl],
              nativeCurrency: ACTIVE_NETWORK.currency,
              blockExplorerUrls: [ACTIVE_NETWORK.explorer],
            },
          ],
        });
      } else {
        setError(e?.message || "Failed to switch network.");
      }
    }
  }, []);

  const getSigner = useCallback(async () => {
    if (!window.ethereum) throw new Error("No wallet found.");
    const p = new BrowserProvider(window.ethereum);
    return p.getSigner();
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;
    refresh();
    const onAccounts = (accs) => setAccount(accs[0] ?? null);
    const onChain = () => refresh();
    window.ethereum.on("accountsChanged", onAccounts);
    window.ethereum.on("chainChanged", onChain);
    return () => {
      window.ethereum.removeListener("accountsChanged", onAccounts);
      window.ethereum.removeListener("chainChanged", onChain);
    };
  }, [refresh]);

  const wrongNetwork = account && chainId !== null && chainId !== ACTIVE_NETWORK.chainId;

  return (
    <WalletContext.Provider
      value={{
        account,
        chainId,
        provider,
        error,
        hasMetaMask,
        wrongNetwork,
        connect,
        disconnect,
        switchToBase,
        getSigner,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
