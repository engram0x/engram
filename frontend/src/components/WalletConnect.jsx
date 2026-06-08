import { useWallet } from "../context/WalletContext";
import { ACTIVE_NETWORK } from "../config/contracts";

function truncate(addr) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function WalletConnect() {
  const { account, connect, disconnect, wrongNetwork, switchToBase } = useWallet();

  if (!account) {
    return (
      <button className="btn-primary-sm" onClick={connect}>
        Connect Wallet
      </button>
    );
  }

  if (wrongNetwork) {
    return (
      <button className="btn-primary-sm" onClick={switchToBase}>
        Switch to {ACTIVE_NETWORK.name}
      </button>
    );
  }

  return (
    <button className="addr-pill" onClick={disconnect} title="Click to disconnect">
      <span className="dot" />
      {truncate(account)}
    </button>
  );
}
