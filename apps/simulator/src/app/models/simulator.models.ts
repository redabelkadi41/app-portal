/** Candidate/list as entered in round 1, with votes and round 2 participation decisions */
export interface RoundOneCandidate {
  id: number;
  name: string;
  votes: number;
  willRunInRound2: boolean | null;
  willMerge: boolean;
  mergeTargetId: number | null;
}

/** Round 2 candidate: aggregates own votes and names of lists that merged into this one */
export interface Round2CandidateInfo {
  id: number;
  name: string;
  ownVotes: number;
  mergedFrom: string[];
}

/** A pool of votes available for redistribution in the round 2 simulation (candidate pool or abstention pool) */
export interface TransferPool {
  id: string;
  label: string;
  votes: number;
  type: 'r2' | 'merged' | 'eliminated' | 'abstention';
  mergeTarget?: string;
}
