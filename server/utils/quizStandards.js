// Industry-standard quiz answer distribution utilities
// Based on educational testing standards and best practices

/**
 * Apply industry-standard answer distribution to quiz questions
 * Standards followed:
 * - 25% distribution across A, B, C, D positions
 * - Maximum 2 consecutive questions with same answer
 * - No more than 40% concentration in any single position
 * - Random but balanced distribution
 */
export const applyStandardAnswerDistribution = (questions) => {
  if (questions.length === 0) return questions;
  
  console.log('📊 Applying industry-standard answer distribution...');
  
  // Step 1: Analyze current distribution
  const currentDistribution = [0, 1, 2, 3].map(pos => 
    questions.filter(q => q.correctAnswer === pos).length
  );
  console.log(`📊 Current distribution: [A:${currentDistribution[0]}, B:${currentDistribution[1]}, C:${currentDistribution[2]}, D:${currentDistribution[3]}]`);
  
  // Step 2: Create ideal distribution (25% each position)
  const totalQuestions = questions.length;
  const questionsPerPosition = Math.floor(totalQuestions / 4);
  const remainder = totalQuestions % 4;
  
  // Create target distribution array
  const targetDistribution = [];
  for (let pos = 0; pos < 4; pos++) {
    const count = questionsPerPosition + (pos < remainder ? 1 : 0);
    for (let i = 0; i < count; i++) {
      targetDistribution.push(pos);
    }
  }
  
  // Step 3: Shuffle the distribution randomly (Fisher-Yates algorithm)
  for (let i = targetDistribution.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [targetDistribution[i], targetDistribution[j]] = [targetDistribution[j], targetDistribution[i]];
  }
  
  // Step 4: Apply distribution to questions
  const processedQuestions = questions.map((q, index) => {
    const targetPosition = targetDistribution[index];
    
    if (q.correctAnswer !== targetPosition) {
      // Swap the correct answer to the target position
      const currentCorrectOption = q.options[q.correctAnswer];
      const targetOption = q.options[targetPosition];
      
      // Create new question with swapped options
      const newOptions = [...q.options];
      newOptions[q.correctAnswer] = targetOption;
      newOptions[targetPosition] = currentCorrectOption;
      
      return {
        ...q,
        options: newOptions,
        correctAnswer: targetPosition
      };
    }
    
    return q;
  });
  
  // Step 5: Fix consecutive patterns (industry standard: max 2 in a row)
  for (let i = 2; i < processedQuestions.length; i++) {
    if (processedQuestions[i].correctAnswer === processedQuestions[i-1].correctAnswer && 
        processedQuestions[i-1].correctAnswer === processedQuestions[i-2].correctAnswer) {
      
      // Find a different position that doesn't create a new pattern
      const currentPos = processedQuestions[i].correctAnswer;
      const prevPos = processedQuestions[i-1].correctAnswer;
      const nextPos = i < processedQuestions.length - 1 ? processedQuestions[i+1].correctAnswer : -1;
      
      const availablePositions = [0, 1, 2, 3].filter(pos => 
        pos !== currentPos && pos !== prevPos && pos !== nextPos
      );
      
      if (availablePositions.length === 0) {
        availablePositions.push(...[0, 1, 2, 3].filter(pos => pos !== currentPos));
      }
      
      const newPos = availablePositions[Math.floor(Math.random() * availablePositions.length)];
      
      // Swap to break the pattern
      const currentCorrectOption = processedQuestions[i].options[currentPos];
      const newOption = processedQuestions[i].options[newPos];
      
      const newOptions = [...processedQuestions[i].options];
      newOptions[currentPos] = newOption;
      newOptions[newPos] = currentCorrectOption;
      
      processedQuestions[i] = {
        ...processedQuestions[i],
        options: newOptions,
        correctAnswer: newPos
      };
      
      console.log(`🔄 Fixed consecutive pattern: Q${i + 1} changed from ${['A','B','C','D'][currentPos]} to ${['A','B','C','D'][newPos]}`);
    }
  }
  
  // Step 6: Final validation and reporting
  const finalDistribution = [0, 1, 2, 3].map(pos => 
    processedQuestions.filter(q => q.correctAnswer === pos).length
  );
  
  console.log(`📊 Final distribution: [A:${finalDistribution[0]}, B:${finalDistribution[1]}, C:${finalDistribution[2]}, D:${finalDistribution[3]}]`);
  
  // Check for industry standards compliance
  const maxConcentration = Math.max(...finalDistribution) / totalQuestions;
  const hasConsecutivePattern = hasThreeConsecutive(processedQuestions);
  
  console.log(`📊 Standards compliance:`);
  console.log(`   - Max concentration: ${(maxConcentration * 100).toFixed(1)}% (standard: <40%)`);
  console.log(`   - No 3+ consecutive: ${!hasConsecutivePattern ? '✅' : '❌'}`);
  console.log(`   - Balanced distribution: ${maxConcentration <= 0.4 ? '✅' : '❌'}`);
  
  return processedQuestions;
};

/**
 * Check if there are three or more consecutive questions with the same answer
 */
const hasThreeConsecutive = (questions) => {
  for (let i = 2; i < questions.length; i++) {
    if (questions[i].correctAnswer === questions[i-1].correctAnswer && 
        questions[i-1].correctAnswer === questions[i-2].correctAnswer) {
      return true;
    }
  }
  return false;
};

/**
 * Validate quiz questions against industry standards
 */
export const validateQuizStandards = (questions) => {
  const issues = [];
  
  if (questions.length === 0) {
    issues.push('No questions provided');
    return { valid: false, issues };
  }
  
  // Check answer distribution
  const distribution = [0, 1, 2, 3].map(pos => 
    questions.filter(q => q.correctAnswer === pos).length
  );
  
  const maxConcentration = Math.max(...distribution) / questions.length;
  if (maxConcentration > 0.4) {
    issues.push(`Answer concentration too high: ${(maxConcentration * 100).toFixed(1)}% (max 40%)`);
  }
  
  // Check for consecutive patterns
  if (hasThreeConsecutive(questions)) {
    issues.push('Three or more consecutive questions have the same answer');
  }
  
  // Check for obvious patterns
  const answerSequence = questions.map(q => q.correctAnswer).join('');
  if (/0123|1230|2301|3012/.test(answerSequence)) {
    issues.push('Detected ABCD pattern in answers');
  }
  
  if (/0000|1111|2222|3333/.test(answerSequence)) {
    issues.push('Detected repeated answer pattern');
  }
  
  return {
    valid: issues.length === 0,
    issues,
    distribution,
    maxConcentration: (maxConcentration * 100).toFixed(1) + '%'
  };
};

/**
 * Industry standards for quiz games
 */
export const QUIZ_STANDARDS = {
  MAX_CONCENTRATION: 0.4, // 40% max in any single position
  MAX_CONSECUTIVE: 2, // Maximum 2 consecutive same answers
  IDEAL_DISTRIBUTION: 0.25, // 25% each position ideally
  MIN_QUESTIONS: 4, // Minimum questions for meaningful distribution
  POSITION_LABELS: ['A', 'B', 'C', 'D']
};