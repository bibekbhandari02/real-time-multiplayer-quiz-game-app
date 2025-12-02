const API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent';

async function callGeminiAPI(prompt, maxRetries = 2) {
  // Get API key at runtime (after dotenv has loaded)
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in environment');
    console.error('Current env keys:', Object.keys(process.env).filter(k => k.includes('GEMINI')));
    throw new Error('GEMINI_API_KEY not configured');
  }

  console.log('✅ Using Gemini API key:', GEMINI_API_KEY.substring(0, 10) + '...');
  const url = `${API_URL}?key=${GEMINI_API_KEY}`;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise(r => setTimeout(r, Math.pow(2, attempt - 1) * 1000));
      }

      const response = await fetch(url, {
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

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Gemini API Error:', errorData);
        
        if (response.status >= 400 && response.status < 500) {
          throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
        }
        continue;
      }

      const data = await response.json();

      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response from Gemini API');
      }

      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error(`Gemini API call failed (attempt ${attempt + 1}):`, error.message);
      if (attempt === maxRetries) throw error;
    }
  }
}

export const generateQuestions = async (category, difficulty, count = 5) => {
  try {
    const categoryPrompts = {
      'Anime': 'popular anime series, characters, plot points, and anime culture',
      'Music': 'music artists, songs, albums, music theory, and music history',
      'Video Games': 'video game franchises, characters, gameplay mechanics, and gaming history',
      'Pokemon': 'Pokémon species, games, moves, types, and Pokémon lore',
      'Marvel': 'Marvel superheroes, villains, movies, comics, and MCU',
      'Harry Potter': 'Harry Potter books, movies, characters, spells, and wizarding world',
      'Programming': 'programming languages, coding concepts, algorithms, and software development',
      'Space': 'astronomy, planets, stars, space exploration, and the universe',
      'Movies': 'movies, actors, directors, film history, and cinema',
      'Sports': 'sports, athletes, teams, championships, and sporting events'
    };

    const categoryContext = categoryPrompts[category] || category;

    const prompt = `Generate ${count} engaging multiple choice quiz questions about ${categoryContext}.

Make the questions interesting, fun, and appropriate for a quiz game. Mix easy and challenging questions.

Return ONLY valid JSON array (no markdown, no code blocks, no extra text) with this exact format:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 2,
    "explanation": "Brief explanation of the correct answer"
  }
]

CRITICAL Requirements:
- Exactly 4 options per question
- correctAnswer is the index (0-3) of the correct option
- Questions should be clear and unambiguous
- Make questions engaging and fun
- Explanations should be concise (1-2 sentences)
- Return ONLY the JSON array, absolutely nothing else
- No markdown formatting, no code blocks, just pure JSON`;

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
    console.log(`✅ Successfully parsed ${questions.length} AI questions`);
    return Array.isArray(questions) ? questions : [];
  } catch (error) {
    console.error('AI generation error:', error.message);
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
