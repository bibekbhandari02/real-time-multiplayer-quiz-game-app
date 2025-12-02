export const calculateScore = (timeSpent, maxTime) => {
  const baseScore = 100;
  const timeBonus = Math.max(0, (maxTime - timeSpent) / maxTime * 50);
  return Math.round(baseScore + timeBonus);
};

export const updateElo = (winnerElo, loserElo, kFactor = 32) => {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const expectedLoser = 1 / (1 + Math.pow(10, (winnerElo - loserElo) / 400));
  
  return {
    winner: Math.round(winnerElo + kFactor * (1 - expectedWinner)),
    loser: Math.round(loserElo + kFactor * (0 - expectedLoser))
  };
};
