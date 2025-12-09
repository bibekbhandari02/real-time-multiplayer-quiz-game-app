import { getFallbackQuestions } from '../data/fallbackQuestions.js';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

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
    generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
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
    const prompt = `You are an expert quiz master creating high-quality trivia questions.

Generate ${count} questions about ${category}.

Return ONLY a valid JSON array:
[
  {
    "question": "Question text?",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": 0,
    "explanation": "Brief explanation",
    "difficulty": "easy",
    "category": "${category}"
  }
]

Rules:
- Exactly 4 options per question
- correctAnswer is index 0-3
- Return ONLY JSON array, no markdown
- No \`\`\`json or \`\`\``;

    console.log(`🤖 Generating ${count} questions for ${category}...`);
    
    const result = await callGeminiAPI(prompt);
    let cleaned = result.trim().replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
    
    const startIndex = cleaned.indexOf('[');
    const endIndex = cleaned.lastIndexOf(']');
    
    if (startIndex !== -1 && endIndex !== -1) {
      cleaned = cleaned.substring(startIndex, endIndex + 1);
    }
    
    const questions = JSON.parse(cleaned);
    
    const validQuestions = questions.filter(q => 
      q.question && 
      Array.isArray(q.options) && 
      q.options.length === 4 &&
      typeof q.correctAnswer === 'number' &&
      q.correctAnswer >= 0 &&
      q.correctAnswer <= 3 &&
      q.explanation
    );
    
    console.log(`✅ Generated ${validQuestions.length}/${questions.length} valid questions`);
    
    return validQuestions;
  } catch (error) {
    console.error('❌ AI generation error:', error.message);
    return [];
  }
};

export const generateQuestionsWithFallback = async (category, difficultyMode = 'mixed', count = 5) => {
  try {
    const aiQuestions = await generateQuestions(category, difficultyMode, count);
    
    if (aiQuestions.length >= count) {
      return aiQuestions;
    }
    
    console.log(`⚠️ Only got ${aiQuestions.length}/${count} questions, retrying...`);
    const retryQuestions = await generateQuestions(category, difficultyMode, count - aiQuestions.length);
    
    const totalQuestions = [...aiQuestions, ...retryQuestions];
    
    if (totalQuestions.length >= count) {
      return totalQuestions;
    }
    
    console.log(`⚠️ Using fallback questions for ${category}`);
    return getFallbackQuestions(category, count);
  } catch (error) {
    console.error('❌ AI generation failed, using fallback:', error.message);
    return getFallbackQuestions(category, count);
  }
};

export const validateQuestion = (question) => {
  const issues = [];
  
  if (!question.question || question.question.length < 10) {
    issues.push('Question text too short');
  }
  
  if (!Array.isArray(question.options) || question.options.length !== 4) {
    issues.push('Must have exactly 4 options');
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
