import User from '../models/User.js';
import Achievement from '../models/Achievement.js';

const ACHIEVEMENTS = {
  FIRST_WIN: {
    id: 'first_win',
    name: 'First Victory',
    description: 'Win your first game',
    icon: '🏆',
    xpReward: 100,
    coinsReward: 50
  },
  SPEED_DEMON: {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Answer 50 questions in under 3 seconds',
    icon: '⚡',
    xpReward: 200,
    coinsReward: 100
  },
  PERFECT_GAME: {
    id: 'perfect_game',
    name: 'Perfect Game',
    description: 'Get 100% accuracy in a game',
    icon: '💯',
    xpReward: 300,
    coinsReward: 150
  },
  STREAK_MASTER: {
    id: 'streak_master',
    name: 'Streak Master',
    description: 'Maintain a 10-day streak',
    icon: '🔥',
    xpReward: 500,
    coinsReward: 250
  },
  SOCIAL_BUTTERFLY: {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Add 10 friends',
    icon: '🦋',
    xpReward: 150,
    coinsReward: 75
  },
  QUIZ_MASTER: {
    id: 'quiz_master',
    name: 'Quiz Master',
    description: 'Win 100 games',
    icon: '👑',
    xpReward: 1000,
    coinsReward: 500
  },
  UNSTOPPABLE: {
    id: 'unstoppable',
    name: 'Unstoppable',
    description: 'Win 10 games in a row',
    icon: '🚀',
    xpReward: 750,
    coinsReward: 400
  },
  KNOWLEDGE_SEEKER: {
    id: 'knowledge_seeker',
    name: 'Knowledge Seeker',
    description: 'Answer 1000 questions',
    icon: '📚',
    xpReward: 600,
    coinsReward: 300
  }
};

export const checkAchievements = async (userId, gameData) => {
  const user = await User.findById(userId);
  const newAchievements = [];

  // First Win
  if (gameData.won && user.stats.gamesWon === 1 && !user.badges.includes('first_win')) {
    newAchievements.push(await unlockAchievement(user, ACHIEVEMENTS.FIRST_WIN));
  }

  // Perfect Game
  if (gameData.accuracy === 100 && !user.badges.includes('perfect_game')) {
    newAchievements.push(await unlockAchievement(user, ACHIEVEMENTS.PERFECT_GAME));
  }

  // Streak Master
  if (user.stats.streak >= 10 && !user.badges.includes('streak_master')) {
    newAchievements.push(await unlockAchievement(user, ACHIEVEMENTS.STREAK_MASTER));
  }

  // Quiz Master
  if (user.stats.gamesWon >= 100 && !user.badges.includes('quiz_master')) {
    newAchievements.push(await unlockAchievement(user, ACHIEVEMENTS.QUIZ_MASTER));
  }

  return newAchievements;
};

const unlockAchievement = async (user, achievement) => {
  user.badges.push(achievement.id);
  user.xp += achievement.xpReward;
  user.coins += achievement.coinsReward;
  
  const newLevel = calculateLevel(user.xp);
  if (newLevel > user.level) {
    user.level = newLevel;
  }

  await user.save();

  const achievementRecord = new Achievement({
    userId: user._id,
    achievementId: achievement.id,
    unlockedAt: new Date()
  });
  await achievementRecord.save();

  return achievement;
};

const calculateLevel = (xp) => {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
};

export const getAllAchievements = () => Object.values(ACHIEVEMENTS);

export const getUserProgress = async (userId) => {
  const user = await User.findById(userId);
  const allAchievements = getAllAchievements();
  
  return allAchievements.map(achievement => ({
    ...achievement,
    unlocked: user.badges.includes(achievement.id)
  }));
};
