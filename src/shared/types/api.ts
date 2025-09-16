export type InitResponse = {
  type: 'init';
  postId: string;
  count: number;
  username: string;
  userFaction?: string;
  factionScores?: { [factionId: string]: number };
  userContribution?: number;
};

export type IncrementResponse = {
  type: 'increment';
  postId: string;
  count: number;
};

export type DecrementResponse = {
  type: 'decrement';
  postId: string;
  count: number;
};

export type SetFactionResponse = {
  type: 'setFaction';
  success: boolean;
  factionId: string;
};

export type AddKarmaResponse = {
  type: 'addKarma';
  success: boolean;
  factionId: string;
  newScore: number;
  karmaAdded: number;
};

export type GetFactionDataResponse = {
  type: 'factionData';
  factionScores: { [factionId: string]: number };
  userFaction?: string;
};
