import { getFallbackQuestions } from '../data/fallbackQuestions.js';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// Cache to track recently generated questions (in memory for now)
const recentQuestions = new Map(); // category -> Set of question hashes
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [category, data] of recentQuestions.entries()) {
    if (now - data.timestamp > CACHE_DURATION) {
      recentQuestions.delete(category);
    }
  }
}, 5 * 60 * 1000); // Clean every 5 minutes

async function callGeminiAPI(prompt, options = {}) {
  const { maxRetries = 2, timeout = 30000 } = options;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in environment');
    throw new Error('GEMINI_API_KEY not configured');
  }

  console.log('✅ Using Gemini API key:', GEMINI_API_KEY.substring(0, 10) + '...');
  const url = `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`;

  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { 
      temperature: 0.7, // Balanced temperature for variety with consistency
      maxOutputTokens: 2048, // Reduced for more concise responses
      topP: 0.8, // More focused sampling
      topK: 20 // More controlled randomness for consistent quality
    }
  };

  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Gemini API Error:', errorData);
        
        if (response.status >= 400 && response.status < 500) {
          throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
        }
        
        lastError = new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
        continue;
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response from Gemini API');
      }

      return data.candidates[0].content.parts[0].text;
      
    } catch (error) {
      console.error(`Gemini API call failed (attempt ${attempt + 1}):`, error.message);
      lastError = error;
      
      if (error.message.includes('Gemini API error:')) {
        throw error;
      }
    }
  }
  
  throw lastError || new Error('Failed to generate content after retries');
}

export const generateQuestions = async (category, difficultyMode = 'mixed', count = 5) => {
  try {
    // Add randomization elements to ensure variety
    const randomSeed = Math.floor(Math.random() * 10000);
    const currentTime = new Date().toISOString();
    const varietyTopics = getVarietyTopics(category);
    const questionTypes = ['factual', 'analytical', 'historical', 'current', 'comparative', 'definitional'];
    const randomType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
    
    // Get recently used topics to avoid repetition
    const recentTopics = getRecentTopics(category);
    const avoidanceNote = recentTopics.length > 0 ? 
      `\nAVOID these recently used topics: ${recentTopics.join(', ')}` : '';

    const prompt = `STRICT REQUIREMENTS: Generate ${count} trivia questions ONLY about ${category}. DO NOT generate questions about other topics.

CATEGORY REQUIREMENT: ALL questions MUST be about ${category} ONLY. No general knowledge, history, geography, or other topics unless they are specifically related to ${category}.

QUESTION LENGTH STANDARDS:
- Easy: 5-10 words maximum (e.g., "What is the capital of France?")
- Medium: 8-15 words maximum (e.g., "Which planet is known as the Red Planet?")
- Hard: 10-20 words maximum (e.g., "What chemical element has the atomic number 79?")

DIFFICULTY GUIDELINES:
- Easy: Basic, widely known facts that most people learn in school
- Medium: Requires some specialized knowledge or thinking
- Hard: Specialized knowledge, technical terms, or complex concepts

ANSWER OPTIONS:
- Keep all options short and concise (1-4 words each)
- Make wrong answers plausible but clearly incorrect
- Avoid obviously wrong or silly options

${getDifficultyInstructions(difficultyMode, count)}

CATEGORY FOCUS: Cover different ${category} subtopics: ${varietyTopics.slice(0, 5).join(', ')}${avoidanceNote}

Return ONLY a valid JSON array:
[
  {
    "question": "What is the capital of France?",
    "options": ["Paris", "London", "Berlin", "Madrid"],
    "correctAnswer": 0,
    "explanation": "Paris is the capital and largest city of France.",
    "difficulty": "easy",
    "category": "${category}"
  }
]

Rules:
- Keep questions SHORT and CLEAR
- Exactly 4 options per question
- correctAnswer is index 0-3
- Brief explanations (1-2 sentences)
- Return ONLY JSON array, no markdown
- Return ONLY JSON array, no markdown`;

    console.log(`🤖 Generating ${count} concise questions for ${category} (seed: ${randomSeed})...`);
    
    const result = await callGeminiAPI(prompt);
    let cleaned = result.trim().replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
    
    const startIndex = cleaned.indexOf('[');
    const endIndex = cleaned.lastIndexOf(']');
    
    if (startIndex !== -1 && endIndex !== -1) {
      cleaned = cleaned.substring(startIndex, endIndex + 1);
    }
    
    const questions = JSON.parse(cleaned);
    
    const validQuestions = questions.filter(q => {
      // Basic validation
      const basicValid = q.question && 
        Array.isArray(q.options) && 
        q.options.length === 4 &&
        typeof q.correctAnswer === 'number' &&
        q.correctAnswer >= 0 &&
        q.correctAnswer <= 3 &&
        q.explanation;
      
      if (!basicValid) return false;
      
      // Category validation - ensure question is about the requested category
      if (q.category && q.category.toLowerCase() !== category.toLowerCase()) {
        console.warn(`⚠️ Question category mismatch: expected ${category}, got ${q.category}`);
        return false;
      }
      
      // Difficulty validation for single difficulty modes
      if (difficultyMode === 'easy' && q.difficulty !== 'easy') {
        console.warn(`⚠️ Question difficulty mismatch: expected easy, got ${q.difficulty}`);
        return false;
      }
      if (difficultyMode === 'medium' && q.difficulty !== 'medium') {
        console.warn(`⚠️ Question difficulty mismatch: expected medium, got ${q.difficulty}`);
        return false;
      }
      if (difficultyMode === 'hard' && q.difficulty !== 'hard') {
        console.warn(`⚠️ Question difficulty mismatch: expected hard, got ${q.difficulty}`);
        return false;
      }
      
      return true;
    });
    
    console.log(`✅ Generated ${validQuestions.length}/${questions.length} valid questions`);
    
    // Ensure all questions have correct category and difficulty
    const finalQuestions = validQuestions.map(q => ({
      ...q,
      category: category, // Force correct category
      difficulty: difficultyMode === 'mixed' || difficultyMode === 'progressive' ? q.difficulty : difficultyMode // Force correct difficulty for single modes
    }));
    
    // Track generated questions to avoid repetition
    if (finalQuestions.length > 0) {
      trackGeneratedQuestions(category, finalQuestions);
    }
    
    console.log(`📊 Final questions - Category: ${category}, Difficulty mode: ${difficultyMode}`);
    finalQuestions.forEach((q, i) => {
      console.log(`  Q${i+1}: ${q.difficulty} - ${q.question.substring(0, 50)}...`);
    });
    
    return finalQuestions;
  } catch (error) {
    console.error('❌ AI generation error:', error.message);
    return [];
  }
};

export const generateQuestionsWithFallback = async (category, difficultyMode = 'mixed', count = 5) => {
  try {
    const aiQuestions = await generateQuestions(category, difficultyMode, count);
    
    if (aiQuestions.length >= count) {
      // Remove any potential duplicates based on question text similarity
      const uniqueQuestions = removeSimilarQuestions(aiQuestions);
      if (uniqueQuestions.length >= count) {
        return uniqueQuestions.slice(0, count);
      }
    }
    
    console.log(`⚠️ Only got ${aiQuestions.length}/${count} unique questions, generating more...`);
    
    // Generate additional questions with different approach
    const additionalNeeded = count - aiQuestions.length;
    const retryQuestions = await generateQuestions(category, difficultyMode, additionalNeeded);
    
    // Combine and remove duplicates
    const allQuestions = [...aiQuestions, ...retryQuestions];
    const uniqueQuestions = removeSimilarQuestions(allQuestions);
    
    if (uniqueQuestions.length >= count) {
      return uniqueQuestions.slice(0, count);
    }
    
    console.log(`⚠️ Using fallback questions for ${category} (got ${uniqueQuestions.length}/${count})`);
    const fallbackQuestions = getFallbackQuestions(category, count - uniqueQuestions.length, difficultyMode);
    
    return [...uniqueQuestions, ...fallbackQuestions].slice(0, count);
  } catch (error) {
    console.error('❌ AI generation failed, using fallback:', error.message);
    return getFallbackQuestions(category, count, difficultyMode);
  }
};

// Helper function to remove similar questions
const removeSimilarQuestions = (questions) => {
  const unique = [];
  const seenQuestions = new Set();
  
  for (const question of questions) {
    // Create a normalized version of the question for comparison
    const normalized = question.question
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // Check for similarity with existing questions
    let isSimilar = false;
    for (const seen of seenQuestions) {
      if (calculateSimilarity(normalized, seen) > 0.7) { // 70% similarity threshold
        isSimilar = true;
        break;
      }
    }
    
    if (!isSimilar) {
      unique.push(question);
      seenQuestions.add(normalized);
    } else {
      console.log(`🔄 Filtered similar question: ${question.question.substring(0, 50)}...`);
    }
  }
  
  return unique;
};

// Simple similarity calculation using Jaccard similarity
const calculateSimilarity = (str1, str2) => {
  const words1 = new Set(str1.split(' '));
  const words2 = new Set(str2.split(' '));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
};

// Helper function to get recent topics for a category
const getRecentTopics = (category) => {
  const data = recentQuestions.get(category);
  if (!data || Date.now() - data.timestamp > CACHE_DURATION) {
    return [];
  }
  return Array.from(data.topics);
};

// Helper function to track generated questions
const trackGeneratedQuestions = (category, questions) => {
  const topics = questions.map(q => {
    // Extract key topics from question text
    const words = q.question.toLowerCase().split(' ');
    return words.filter(word => word.length > 4).slice(0, 3); // Get first 3 significant words
  }).flat();
  
  recentQuestions.set(category, {
    topics: new Set(topics),
    timestamp: Date.now()
  });
  
  console.log(`📝 Tracked ${topics.length} topics for ${category}`);
};

export const validateQuestion = (question) => {
  const issues = [];
  
  if (!question.question || question.question.length < 10) {
    issues.push('Question text too short');
  }
  
  // Check question length based on difficulty
  const wordCount = question.question.split(' ').length;
  const difficulty = question.difficulty || 'medium';
  
  if (difficulty === 'easy' && wordCount > 10) {
    issues.push('Easy question too long (max 10 words)');
  } else if (difficulty === 'medium' && wordCount > 15) {
    issues.push('Medium question too long (max 15 words)');
  } else if (difficulty === 'hard' && wordCount > 20) {
    issues.push('Hard question too long (max 20 words)');
  }
  
  if (!Array.isArray(question.options) || question.options.length !== 4) {
    issues.push('Must have exactly 4 options');
  }
  
  // Check option lengths
  const longOptions = question.options?.filter(opt => opt && opt.split(' ').length > 4);
  if (longOptions && longOptions.length > 0) {
    issues.push('Options too long (max 4 words each)');
  }
  
  if (typeof question.correctAnswer !== 'number' || question.correctAnswer < 0 || question.correctAnswer > 3) {
    issues.push('Invalid correctAnswer index');
  }
  
  const uniqueOptions = new Set(question.options);
  if (uniqueOptions.size !== 4) {
    issues.push('Duplicate options detected');
  }
  
  if (!question.explanation || question.explanation.length < 10) {
    issues.push('Explanation too short');
  }
  
  return { valid: issues.length === 0, issues };
};

export const enhanceQuestion = (question, category, difficulty) => {
  return {
    ...question,
    category: question.category || category,
    difficulty: question.difficulty || difficulty,
    points: difficulty === 'easy' ? 100 : difficulty === 'medium' ? 150 : 200,
    timeLimit: 15,
    createdAt: new Date().toISOString()
  };
};

// Helper function to get variety topics for different categories
const getVarietyTopics = (category) => {
  const topicMap = {
    'General Knowledge': ['history', 'science', 'geography', 'literature', 'arts', 'sports', 'technology', 'culture', 'nature', 'inventions'],
    'Science': ['physics', 'chemistry', 'biology', 'astronomy', 'geology', 'medicine', 'technology', 'discoveries', 'scientists', 'experiments'],
    'History': ['ancient civilizations', 'world wars', 'revolutions', 'explorers', 'empires', 'inventions', 'cultural movements', 'political events', 'social changes', 'archaeological discoveries'],
    'Geography': ['countries', 'capitals', 'rivers', 'mountains', 'deserts', 'oceans', 'climate', 'natural disasters', 'landmarks', 'cultures'],
    'Sports': ['football', 'basketball', 'tennis', 'olympics', 'records', 'athletes', 'teams', 'championships', 'rules', 'equipment'],
    'Entertainment': ['movies', 'music', 'television', 'celebrities', 'awards', 'genres', 'directors', 'actors', 'bands', 'games'],
    'Literature': ['novels', 'poetry', 'authors', 'genres', 'classics', 'modern works', 'literary movements', 'characters', 'themes', 'awards'],
    'Anime': ['popular series', 'characters', 'studios', 'directors', 'voice actors', 'manga adaptations', 'genres', 'release years', 'awards', 'cultural impact'],
    'Movies': ['directors', 'actors', 'genres', 'awards', 'box office', 'cinematography', 'franchises', 'studios', 'release years', 'cultural impact'],
    'Music': ['artists', 'genres', 'albums', 'instruments', 'composers', 'bands', 'awards', 'music theory', 'history', 'cultural movements'],
    'Technology': ['programming', 'hardware', 'software', 'internet', 'AI', 'mobile devices', 'gaming', 'cybersecurity', 'innovations', 'companies']
  };
  
  return topicMap[category] || topicMap['General Knowledge'];
};

// Helper function to create difficulty distribution instructions
const getDifficultyInstructions = (difficultyMode, count) => {
  if (difficultyMode === 'easy') {
    return 'DIFFICULTY REQUIREMENT: ALL questions MUST be "easy" difficulty - basic facts everyone knows. Set "difficulty": "easy" for ALL questions.';
  } else if (difficultyMode === 'medium') {
    return 'DIFFICULTY REQUIREMENT: ALL questions MUST be "medium" difficulty - some thinking required. Set "difficulty": "medium" for ALL questions.';
  } else if (difficultyMode === 'hard') {
    return 'DIFFICULTY REQUIREMENT: ALL questions MUST be "hard" difficulty - specialized knowledge needed. Set "difficulty": "hard" for ALL questions.';
  } else if (difficultyMode === 'progressive') {
    return `DIFFICULTY REQUIREMENT: Start easy, get harder - Questions 1-${Math.ceil(count/3)}: set "difficulty": "easy", ${Math.ceil(count/3)+1}-${Math.ceil(2*count/3)}: set "difficulty": "medium", ${Math.ceil(2*count/3)+1}-${count}: set "difficulty": "hard"`;
  } else { // mixed
    const easy = Math.ceil(count * 0.4);
    const medium = Math.ceil(count * 0.4);
    const hard = count - easy - medium;
    return `DIFFICULTY REQUIREMENT: Mix of ${easy} questions with "difficulty": "easy", ${medium} questions with "difficulty": "medium", ${hard} questions with "difficulty": "hard"`;
  }
};

export const detectCheating = async (playerData) => {
  const { answers, avgResponseTime, accuracy } = playerData;
  const flags = [];
  
  if (accuracy > 0.95 && avgResponseTime < 2) {
    flags.push('SUSPICIOUSLY_FAST_PERFECT');
  }
  
  if (answers.every(a => a.time < 1)) {
    flags.push('INSTANT_ANSWERS');
  }
  
  const answerPattern = answers.map(a => a.selected).join('');
  if (/^(.)\1+$/.test(answerPattern)) {
    flags.push('SAME_ANSWER_PATTERN');
  }
  
  return { suspicious: flags.length > 0, flags };
};
