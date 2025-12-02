import Powerup from '../models/Powerup.js';
import User from '../models/User.js';

// Initialize default powerups
export const initializePowerups = async () => {
  const defaultPowerups = [
    {
      key: 'time_freeze',
      name: 'Time Freeze',
      description: 'Freeze the timer for 5 seconds',
      icon: '⏸️',
      type: 'time_freeze',
      cost: 50,
      duration: 5,
      usesPerGame: 1,
      rarity: 'rare'
    },
    {
      key: 'fifty_fifty',
      name: '50/50',
      description: 'Remove two wrong answers',
      icon: '🎯',
      type: 'fifty_fifty',
      cost: 30,
      usesPerGame: 2,
      rarity: 'common'
    },
    {
      key: 'skip_question',
      name: 'Skip Question',
      description: 'Skip the current question without penalty',
      icon: '⏭️',
      type: 'skip_question',
      cost: 75,
      usesPerGame: 1,
      rarity: 'epic'
    },
    {
      key: 'double_points',
      name: 'Double Points',
      description: 'Get double points for the next correct answer',
      icon: '💎',
      type: 'double_points',
      cost: 100,
      usesPerGame: 1,
      rarity: 'legendary'
    },
    {
      key: 'hint',
      name: 'Hint',
      description: 'Get a hint about the correct answer',
      icon: '💡',
      type: 'hint',
      cost: 40,
      usesPerGame: 2,
      rarity: 'common'
    }
  ];

  for (const powerup of defaultPowerups) {
    await Powerup.findOneAndUpdate(
      { key: powerup.key },
      powerup,
      { upsert: true, new: true }
    );
  }

  console.log('✅ Powerups initialized');
};

// Purchase powerup
export const purchasePowerup = async (userId, powerupKey, quantity = 1) => {
  try {
    const user = await User.findById(userId);
    const powerup = await Powerup.findOne({ key: powerupKey, isActive: true });

    if (!powerup) {
      throw new Error('Powerup not found');
    }

    const totalCost = powerup.cost * quantity;

    if (user.coins < totalCost) {
      throw new Error('Insufficient coins');
    }

    // Deduct coins
    user.coins -= totalCost;

    // Add powerup to inventory
    const existingPowerup = user.powerups.find(p => p.powerupKey === powerupKey);
    if (existingPowerup) {
      existingPowerup.quantity += quantity;
    } else {
      user.powerups.push({ powerupKey, quantity });
    }

    await user.save();

    return {
      success: true,
      user,
      powerup,
      quantityPurchased: quantity,
      totalCost
    };
  } catch (error) {
    throw error;
  }
};

// Use powerup in game
export const usePowerup = async (userId, powerupKey) => {
  try {
    const user = await User.findById(userId);
    const powerup = await Powerup.findOne({ key: powerupKey });

    if (!powerup) {
      throw new Error('Powerup not found');
    }

    const userPowerup = user.powerups.find(p => p.powerupKey === powerupKey);
    
    if (!userPowerup || userPowerup.quantity <= 0) {
      throw new Error('You don\'t have this powerup');
    }

    // Decrease quantity
    userPowerup.quantity -= 1;
    
    // Remove if quantity is 0
    if (userPowerup.quantity === 0) {
      user.powerups = user.powerups.filter(p => p.powerupKey !== powerupKey);
    }

    await user.save();

    return {
      success: true,
      powerup,
      remainingQuantity: userPowerup.quantity
    };
  } catch (error) {
    throw error;
  }
};

// Get user powerups
export const getUserPowerups = async (userId) => {
  try {
    const user = await User.findById(userId);
    const allPowerups = await Powerup.find({ isActive: true });

    // Merge user inventory with powerup details
    const powerupsWithDetails = allPowerups.map(powerup => {
      const userPowerup = user.powerups.find(p => p.powerupKey === powerup.key);
      return {
        ...powerup.toObject(),
        quantity: userPowerup ? userPowerup.quantity : 0
      };
    });

    return powerupsWithDetails;
  } catch (error) {
    throw error;
  }
};

export default {
  initializePowerups,
  purchasePowerup,
  usePowerup,
  getUserPowerups
};
