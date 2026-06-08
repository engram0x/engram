import { useCallback } from "react";
import { getReadContract } from "./clients";

export function useGramScore() {
  const getScore = useCallback(async (agentId) => {
    const c = getReadContract("GramScore");
    return Number(await c.getScore(agentId));
  }, []);

  const getStats = useCallback(async (agentId) => {
    const c = getReadContract("GramScore");
    const [score, completed, failed] = await c.getStats(agentId);
    return {
      score: Number(score),
      jobsCompleted: Number(completed),
      jobsFailed: Number(failed),
    };
  }, []);

  return { getScore, getStats };
}
