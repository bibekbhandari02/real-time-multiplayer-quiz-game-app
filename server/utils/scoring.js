/**
 * Enhanced scoring system for competitive trivia
 * @param {number} timeSpent - Time taken to answer (seconds)
 * @param {number} maxTime - Maximum time allowed (seconds)
 * @param {string} difficulty - Question difficulty ('easy', 'medium', 'hard')
 * @param {number} streak - Current correct answer streak
 * @param {boolean} isCorrect - Whether the answer was correct
 * @returns {number} - Calculated score
 */
export const calculateScore = (timeSpent, maxTime, difficulty = 'medium', streak = 0, isCorrect = true) => {
  // Wrong answer - no points awarded (no negative scoring)
  if (!isCorrect) {
    return 0; // No penalty, just no points for wrong answers
  }

  // Base score by difficulty
  const baseScores = {
    easy: 100,
    medium: 200,
    hard: 300
  };
  const baseScore = baseScores[difficulty] || baseScores.medium;

  // Speed multiplier (exponential curve rewards very fast answers)
  // Uses exponential decay: faster answers get disproportionately higher bonuses
  const speedRatio = Math.max(0, Math.min(1, (maxTime - timeSpent) / maxTime));
  const speedMultiplier = Math.pow(speedRatio, 0.7); // 0.7 exponent creates better curve
  const speedBonus = Math.round(baseScore * 0.5 * speedMultiplier); // Up to 50% bonus

  // Streak bonus (rewards consistency)
  // Increases with each consecutive correct answer
  const streakBonus = streak >= 2 ? Math.min(streak * 25, 150) : 0; // Max 150 bonus at 6+ streak

  // Perfect answer bonus (answered in first 20% of time)
  const perfectBonus = (timeSpent <= maxTime * 0.2) ? 50 : 0;

  const totalScore = baseScore + speedBonus + streakBonus + perfectBonus;
  
  return Math.round(totalScore);
};

/**
 * Calculate score breakdown for display
 */
export const getScoreBreakdown = (timeSpent, maxTime, difficulty = 'medium', streak = 0, isCorrect = true) => {
  if (!isCorrect) {
    return {
      total: 0,
      base: 0,
      speed: 0,
      streak: 0,
      perfect: 0,
      penalty: 0
    };
  }

  const baseScores = { easy: 100, medium: 200, hard: 300 };
  const baseScore = baseScores[difficulty] || baseScores.medium;

  const speedRatio = Math.max(0, Math.min(1, (maxTime - timeSpent) / maxTime));
  const speedMultiplier = Math.pow(speedRatio, 0.7);
  const speedBonus = Math.round(baseScore * 0.5 * speedMultiplier);

  const streakBonus = streak >= 2 ? Math.min(streak * 25, 150) : 0;
  const perfectBonus = (timeSpent <= maxTime * 0.2) ? 50 : 0;

  return {
    total: baseScore + speedBonus + streakBonus + perfectBonus,
    base: baseScore,
    speed: speedBonus,
    streak: streakBonus,
    perfect: perfectBonus,
    penalty: 0
  };
};

export const updateElo = (winnerElo, loserElo, kFactor = 32) => {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const expectedLoser = 1 / (1 + Math.pow(10, (winnerElo - loserElo) / 400));
  
  return {
    winner: Math.round(winnerElo + kFactor * (1 - expectedWinner)),
    loser: Math.round(loserElo + kFactor * (0 - expectedLoser))
  };
};
