import { useCallback } from "react";
import { parseEther } from "ethers";
import { useWallet } from "../context/WalletContext";
import { getReadContract, getWriteContract } from "./clients";

export function useGramLink() {
  const { getSigner } = useWallet();

  const createJob = useCallback(
    async (hirerAgentId, workerAgentId, taskHash, paymentEth) => {
      const signer = await getSigner();
      const c = getWriteContract("GramLink", signer);
      const tx = await c.createJob(hirerAgentId, workerAgentId, taskHash, {
        value: parseEther(String(paymentEth)),
      });
      return tx.wait();
    },
    [getSigner]
  );

  const acceptJob = useCallback(
    async (jobId) => {
      const signer = await getSigner();
      const c = getWriteContract("GramLink", signer);
      return (await c.acceptJob(jobId)).wait();
    },
    [getSigner]
  );

  const completeJob = useCallback(
    async (jobId, resultHash) => {
      const signer = await getSigner();
      const c = getWriteContract("GramLink", signer);
      return (await c.completeJob(jobId, resultHash)).wait();
    },
    [getSigner]
  );

  const failJob = useCallback(
    async (jobId) => {
      const signer = await getSigner();
      const c = getWriteContract("GramLink", signer);
      return (await c.failJob(jobId)).wait();
    },
    [getSigner]
  );

  const disputeJob = useCallback(
    async (jobId) => {
      const signer = await getSigner();
      const c = getWriteContract("GramLink", signer);
      return (await c.disputeJob(jobId)).wait();
    },
    [getSigner]
  );

  const getJob = useCallback(async (jobId) => {
    const c = getReadContract("GramLink");
    return normalizeJob(await c.getJob(jobId));
  }, []);

  const getJobsByAgent = useCallback(async (agentId) => {
    const c = getReadContract("GramLink");
    const ids = await c.getJobsByAgent(agentId);
    return ids.map((x) => Number(x));
  }, []);

  const totalJobs = useCallback(async () => {
    const c = getReadContract("GramLink");
    return Number(await c.totalJobs());
  }, []);

  return {
    createJob,
    acceptJob,
    completeJob,
    failJob,
    disputeJob,
    getJob,
    getJobsByAgent,
    totalJobs,
  };
}

export function normalizeJob(j) {
  return {
    id: Number(j.id),
    hirerAgentId: Number(j.hirerAgentId),
    workerAgentId: Number(j.workerAgentId),
    payment: j.payment, // bigint wei
    status: Number(j.status),
    taskHash: j.taskHash,
    resultHash: j.resultHash,
    createdAt: Number(j.createdAt),
    completedAt: Number(j.completedAt),
  };
}
