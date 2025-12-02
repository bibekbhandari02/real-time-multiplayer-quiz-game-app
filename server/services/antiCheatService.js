import { getRedisClient } from '../config/redis.js';

const CHEAT_THRESHOLDS = {
  PERFECT_ACCURACY_FAST: { accuracy: 0.95, avgTime: 2 },
  INSTANT_ANSWERS: { maxTime: 0.5 },
  PATTERN_DETECTION: { similarityThreshold: 0.9 },
  TAB_SWITCHES: { maxSwitches: 5 }
};

export class AntiCheatDetector {
  constructor() {
    this.playerBehavior = new Map();
  }

  trackAnswer(userId, questionId, answer, timeSpent, isCorrect) {
    if (!this.playerBehavior.has(userId)) {
      this.playerBehavior.set(userId, {
        answers: [],
        tabSwitches: 0,
        suspiciousEvents: [],
        startTime: Date.now()
      });
    }

    const behavior = this.playerBehavior.get(userId);
    behavior.answers.push({
      questionId,
      answer,
      timeSpent,
      isCorrect,
      timestamp: Date.now()
    });
  }

  trackTabSwitch(userId) {
    if (!this.playerBehavior.has(userId)) return;
    
    const behavior = this.playerBehavior.get(userId);
    behavior.tabSwitches++;
    
    if (behavior.tabSwitches > CHEAT_THRESHOLDS.TAB_SWITCHES.maxSwitches) {
      behavior.suspiciousEvents.push({
        type: 'EXCESSIVE_TAB_SWITCHES',
        count: behavior.tabSwitches,
        timestamp: Date.now()
      });
    }
  }

  trackClipboard(userId) {
    if (!this.playerBehavior.has(userId)) return;
    
    const behavior = this.playerBehavior.get(userId);
    behavior.suspiciousEvents.push({
      type: 'CLIPBOARD_USAGE',
      timestamp: Date.now()
    });
  }

  async analyzePlayer(userId) {
    const behavior = this.playerBehavior.get(userId);
    if (!behavior || behavior.answers.length === 0) {
      return { suspicious: false, flags: [] };
    }

    const flags = [];
    const answers = behavior.answers;
    
    // Calculate statistics
    const correctAnswers = answers.filter(a => a.isCorrect).length;
    const accuracy = correctAnswers / answers.length;
    const avgTime = answers.reduce((sum, a) => sum + a.timeSpent, 0) / answers.length;
    
    // Check for perfect accuracy with fast answers
    if (accuracy >= CHEAT_THRESHOLDS.PERFECT_ACCURACY_FAST.accuracy && 
        avgTime < CHEAT_THRESHOLDS.PERFECT_ACCURACY_FAST.avgTime) {
      flags.push({
        type: 'SUSPICIOUSLY_FAST_PERFECT',
        severity: 'HIGH',
        details: { accuracy, avgTime }
      });
    }

    // Check for instant answers
    const instantAnswers = answers.filter(a => a.timeSpent < CHEAT_THRESHOLDS.INSTANT_ANSWERS.maxTime);
    if (instantAnswers.length > answers.length * 0.5) {
      flags.push({
        type: 'INSTANT_ANSWERS',
        severity: 'HIGH',
        details: { count: instantAnswers.length, total: answers.length }
      });
    }

    // Check for answer patterns
    const answerPattern = this.detectPatterns(answers.map(a => a.answer));
    if (answerPattern.suspicious) {
      flags.push({
        type: 'PATTERN_DETECTED',
        severity: 'MEDIUM',
        details: answerPattern
      });
    }

    // Check tab switches
    if (behavior.tabSwitches > CHEAT_THRESHOLDS.TAB_SWITCHES.maxSwitches) {
      flags.push({
        type: 'EXCESSIVE_TAB_SWITCHES',
        severity: 'MEDIUM',
        details: { count: behavior.tabSwitches }
      });
    }

    // Add any other suspicious events
    behavior.suspiciousEvents.forEach(event => {
      flags.push({
        type: event.type,
        severity: 'LOW',
        details: event
      });
    });

    const suspicious = flags.some(f => f.severity === 'HIGH');
    
    // Store in Redis for admin review
    if (suspicious) {
      await this.logSuspiciousActivity(userId, flags);
    }

    return { suspicious, flags, accuracy, avgTime };
  }

  detectPatterns(answers) {
    if (answers.length < 5) return { suspicious: false };

    // Check for repeating patterns (e.g., always choosing same option)
    const answerCounts = answers.reduce((acc, ans) => {
      acc[ans] = (acc[ans] || 0) + 1;
      return acc;
    }, {});

    const maxCount = Math.max(...Object.values(answerCounts));
    const dominantRatio = maxCount / answers.length;

    if (dominantRatio > 0.7) {
      return {
        suspicious: true,
        pattern: 'DOMINANT_ANSWER',
        ratio: dominantRatio
      };
    }

    // Check for sequential patterns (0,1,2,3 or 3,2,1,0)
    let sequential = 0;
    for (let i = 1; i < answers.length; i++) {
      if (Math.abs(answers[i] - answers[i-1]) === 1) {
        sequential++;
      }
    }

    if (sequential / answers.length > 0.8) {
      return {
        suspicious: true,
        pattern: 'SEQUENTIAL',
        ratio: sequential / answers.length
      };
    }

    return { suspicious: false };
  }

  async logSuspiciousActivity(userId, flags) {
    try {
      const redis = getRedisClient();
      if (redis) {
        const key = `suspicious:${userId}:${Date.now()}`;
        await redis.set(key, JSON.stringify(flags), { EX: 86400 * 7 }); // 7 days
      }
    } catch (error) {
      console.error('Failed to log suspicious activity:', error);
    }
  }

  clearPlayer(userId) {
    this.playerBehavior.delete(userId);
  }

  getPlayerStats(userId) {
    return this.playerBehavior.get(userId) || null;
  }
}

export const antiCheatDetector = new AntiCheatDetector();
