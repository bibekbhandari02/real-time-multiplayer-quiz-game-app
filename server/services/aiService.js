const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-exp:generateContent';

async function callGeminiAPI(prompt, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }

      const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048
          }
        })
      });

      const data = await response.json();

      if (response.ok) {
        return data.candidates[0].content.parts[0].text;
      }

      if (response.status >= 400 && response.status < 500) {
        throw new Error(data.error?.message || 'AI request failed');
      }
    } catch (error) {
      if (attempt === maxRetries) throw error;
    }
  }
}

export const generateQuestions = async (category, difficulty, count = 5) => {
  try {
    const prompt = `Generate ${count} multiple choice quiz questions about ${category} with ${difficulty} difficulty.

Return ONLY valid JSON array (no markdown, no code blocks) with this exact format:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 2,
    "explanation": "Brief explanation of the correct answer"
  }
]

Requirements:
- Exactly 4 options per question
- correctAnswer is the index (0-3) of the correct option
- Questions should be clear and unambiguous
- Explanations should be concise (1-2 sentences)
- Return ONLY the JSON array, nothing else`;

    const result = await callGeminiAPI(prompt);
    
    // Clean the response
    let cleaned = result.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/```json\n?/g, '').replace(/```/g, '');
    }
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/```\n?/g, '');
    }
    
    const questions = JSON.parse(cleaned);
    return Array.isArray(questions) ? questions : [];
  } catch (error) {
    console.error('AI generation error:', error);
    return [];
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
  
  return { suspicious: flags.length > 0, flags };
};
