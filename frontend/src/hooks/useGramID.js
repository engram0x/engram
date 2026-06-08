import { useCallback } from "react";
import { parseEther } from "ethers";
import { useWallet } from "../context/WalletContext";
import { getReadContract, getWriteContract } from "./clients";
import { STAKE_AMOUNT_ETH } from "../config/contracts";

export function useGramID() {
  const { getSigner } = useWallet();

  const register = useCallback(
    async (name, metadata) => {
      const signer = await getSigner();
      const c = getWriteContract("GramID", signer);
      const tx = await c.register(name, metadata, { value: parseEther(STAKE_AMOUNT_ETH) });
      return tx.wait();
    },
    [getSigner]
  );

  const deregister = useCallback(
    async (id) => {
      const signer = await getSigner();
      const c = getWriteContract("GramID", signer);
      const tx = await c.deregister(id);
      return tx.wait();
    },
    [getSigner]
  );

  const updateMetadata = useCallback(
    async (id, metadata) => {
      const signer = await getSigner();
      const c = getWriteContract("GramID", signer);
      const tx = await c.updateMetadata(id, metadata);
      return tx.wait();
    },
    [getSigner]
  );

  const getAgentByAddress = useCallback(async (address) => {
    const c = getReadContract("GramID");
    const a = await c.getAgentByAddress(address);
    return normalizeAgent(a);
  }, []);

  const getAgent = useCallback(async (id) => {
    const c = getReadContract("GramID");
    const a = await c.getAgent(id);
    return normalizeAgent(a);
  }, []);

  const isRegistered = useCallback(async (address) => {
    const c = getReadContract("GramID");
    return c.isRegistered(address);
  }, []);

  const totalAgents = useCallback(async () => {
    const c = getReadContract("GramID");
    return Number(await c.totalAgents());
  }, []);

  return { register, deregister, updateMetadata, getAgent, getAgentByAddress, isRegistered, totalAgents };
}

export function normalizeAgent(a) {
  return {
    id: Number(a.id),
    owner: a.owner,
    name: a.name,
    metadata: a.metadata,
    registeredAt: Number(a.registeredAt),
    active: a.active,
  };
}
