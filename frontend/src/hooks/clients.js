import { Contract, JsonRpcProvider } from "ethers";
import { CONTRACTS, ACTIVE_NETWORK } from "../config/contracts";

// Read-only provider so the dApp can query chain state without a connected wallet.
let _readProvider;
export function getReadProvider() {
  if (!_readProvider) {
    _readProvider = new JsonRpcProvider(ACTIVE_NETWORK.rpcUrl, ACTIVE_NETWORK.chainId);
  }
  return _readProvider;
}

export function getReadContract(name) {
  const { address, abi } = CONTRACTS[name];
  if (!address) throw new Error(`${name} address not configured. Deploy and update contracts.js.`);
  return new Contract(address, abi, getReadProvider());
}

export function getWriteContract(name, signer) {
  const { address, abi } = CONTRACTS[name];
  if (!address) throw new Error(`${name} address not configured. Deploy and update contracts.js.`);
  return new Contract(address, abi, signer);
}
