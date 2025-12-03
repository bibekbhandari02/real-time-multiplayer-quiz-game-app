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
            temperature: 0.8, // Slightly higher for more creative questions
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 4096, // Increased for more detailed questions
            candidateCount: 1
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
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

/**
 * Generate questions with smart difficulty distribution
 * @param {string} category - Question category
 * @param {string} difficultyMode - 'mixed', 'progressive', 'easy', 'medium', 'hard'
 * @param {number} count - Number of questions
 * @returns {Array} - Generated questions
 */
export const generateQuestions = async (category, difficultyMode = 'mixed', count = 5) => {
  try {
    // Determine difficulty distribution based on mode
    let difficultyDistribution = [];
    
    switch (difficultyMode) {
      case 'easy':
        difficultyDistribution = Array(count).fill('easy');
        break;
      case 'medium':
        difficultyDistribution = Array(count).fill('medium');
        break;
      case 'hard':
        difficultyDistribution = Array(count).fill('hard');
        break;
      case 'progressive':
        // Start easy, gradually increase difficulty
        const third = Math.floor(count / 3);
        difficultyDistribution = [
          ...Array(third).fill('easy'),
          ...Array(third).fill('medium'),
          ...Array(count - (third * 2)).fill('hard')
        ];
        break;
      case 'mixed':
      default:
        // Balanced mix: 30% easy, 50% medium, 20% hard
        const easyCount = Math.ceil(count * 0.3);
        const hardCount = Math.floor(count * 0.2);
        const mediumCount = count - easyCount - hardCount;
        
        difficultyDistribution = [
          ...Array(easyCount).fill('easy'),
          ...Array(mediumCount).fill('medium'),
          ...Array(hardCount).fill('hard')
        ];
        
        // Shuffle for variety
        difficultyDistribution = difficultyDistribution.sort(() => Math.random() - 0.5);
        break;
    }

    console.log(`🎲 Difficulty distribution for ${count} questions:`, 
      difficultyDistribution.reduce((acc, d) => {
        acc[d] = (acc[d] || 0) + 1;
        return acc;
      }, {})
    );

    // Enhanced category prompts with more specific guidance
    const categoryPrompts = {
      'General Knowledge': {
        context: 'diverse topics including history, geography, science, culture, and current events',
        examples: 'world capitals, historical events, famous landmarks, scientific discoveries, cultural traditions'
      },
      'Science': {
        context: 'scientific concepts, discoveries, experiments, and famous scientists',
        examples: 'physics laws, chemical reactions, biological processes, scientific method, Nobel Prize winners'
      },
      'History': {
        context: 'historical events, figures, civilizations, and time periods',
        examples: 'ancient civilizations, world wars, revolutions, historical leaders, important dates'
      },
      'Geography': {
        context: 'countries, cities, landmarks, natural features, and world cultures',
        examples: 'capital cities, mountain ranges, rivers, continents, flags, cultural landmarks'
      },
      'Technology': {
        context: 'modern technology, innovations, tech companies, and digital trends',
        examples: 'tech giants, inventions, software, hardware, internet history, AI developments'
      },
      'Mathematics': {
        context: 'mathematical concepts, famous mathematicians, and problem-solving',
        examples: 'number theory, geometry, algebra, famous theorems, mathematical constants'
      },
      'Biology': {
        context: 'living organisms, ecosystems, human body, and biological processes',
        examples: 'cell biology, genetics, evolution, anatomy, ecosystems, species classification'
      },
      'Music': {
        context: 'music artists, genres, instruments, music theory, and music history',
        examples: 'famous musicians, hit songs, music genres, instruments, composers, music awards'
      },
      'Anime': {
        context: 'anime series, characters, studios, voice actors, and anime culture',
        examples: 'popular anime titles, iconic characters, anime studios, manga adaptations, anime tropes'
      },
      'Movies': {
        context: 'films, actors, directors, movie franchises, and cinema history',
        examples: 'blockbuster movies, Oscar winners, famous directors, movie quotes, film genres'
      },
      'Sports': {
        context: 'sports, athletes, teams, championships, and sporting records',
        examples: 'Olympic sports, world records, famous athletes, sports rules, championships'
      },
      'Video Games': {
        context: 'video game franchises, characters, developers, and gaming history',
        examples: 'iconic games, game characters, gaming consoles, game developers, esports'
      },
      'Literature': {
        context: 'books, authors, literary movements, and famous works',
        examples: 'classic novels, famous authors, literary genres, book characters, poetry'
      },
      'Art': {
        context: 'artists, art movements, famous paintings, and art history',
        examples: 'famous painters, art styles, iconic artworks, museums, sculptures'
      },
      'Food': {
        context: 'cuisines, cooking techniques, ingredients, and culinary traditions',
        examples: 'world cuisines, cooking methods, famous dishes, ingredients, food history'
      },
      'Nature': {
        context: 'animals, plants, ecosystems, and natural phenomena',
        examples: 'animal species, plant life, habitats, weather patterns, natural wonders'
      },
      'Space': {
        context: 'astronomy, space exploration, celestial bodies, and the universe',
        examples: 'planets, stars, galaxies, space missions, astronauts, cosmic phenomena'
      },
      'Mythology': {
        context: 'myths, legends, gods, heroes, and ancient stories',
        examples: 'Greek gods, Norse mythology, legendary creatures, mythical heroes, ancient tales'
      },
      'Politics': {
        context: 'political systems, world leaders, governments, and political history',
        examples: 'political leaders, government types, elections, political movements, international relations'
      },
      'Business': {
        context: 'companies, entrepreneurs, business concepts, and economic principles',
        examples: 'Fortune 500 companies, famous CEOs, business strategies, economic terms, startups'
      },
      'Fashion': {
        context: 'fashion designers, trends, fashion history, and style icons',
        examples: 'fashion brands, designers, fashion weeks, style trends, iconic outfits'
      },
      'Cars': {
        context: 'car brands, models, automotive history, and racing',
        examples: 'car manufacturers, iconic models, racing events, automotive innovations, car culture'
      },
      'Programming': {
        context: 'programming languages, algorithms, software development, and tech concepts',
        examples: 'coding languages, frameworks, algorithms, software engineering, tech pioneers'
      },
      'Marvel': {
        context: 'Marvel superheroes, villains, MCU movies, comics, and Marvel universe',
        examples: 'Marvel characters, MCU phases, comic storylines, superpowers, Marvel teams'
      },
      'DC': {
        context: 'DC superheroes, villains, movies, comics, and DC universe',
        examples: 'DC characters, Justice League, DC movies, comic arcs, DC locations'
      },
      'Pokemon': {
        context: 'Pokémon species, games, moves, types, regions, and Pokémon lore',
        examples: 'Pokémon types, evolution, legendary Pokémon, gym leaders, Pokémon regions'
      },
      'Harry Potter': {
        context: 'Harry Potter books, movies, characters, spells, locations, and wizarding world',
        examples: 'Hogwarts houses, spells, magical creatures, characters, plot events'
      },
      'Star Wars': {
        context: 'Star Wars movies, characters, planets, lore, and the Force',
        examples: 'Jedi, Sith, Star Wars episodes, planets, starships, iconic quotes'
      },
      'Lord of the Rings': {
        context: 'Middle-earth, characters, races, locations, and Tolkien lore',
        examples: 'Fellowship members, Middle-earth races, locations, battles, artifacts'
      }
    };

    const categoryInfo = categoryPrompts[category] || {
      context: category,
      examples: `various aspects of ${category}`
    };

    // Build difficulty-specific instructions for each question
    const difficultyInstructions = difficultyDistribution.map((diff, index) => {
      const guidance = {
        'easy': 'basic knowledge, well-known facts, popular information',
        'medium': 'moderate knowledge, mix of common and less obvious facts',
        'hard': 'deep knowledge, obscure facts, critical thinking required'
      };
      return `Question ${index + 1}: ${diff.toUpperCase()} - ${guidance[diff]}`;
    }).join('\n');

    const prompt = `You are an expert quiz master creating high-quality trivia questions for a competitive multiplayer quiz game.

TOPIC: ${category}
CONTEXT: ${categoryInfo.context}
EXAMPLES: ${categoryInfo.examples}
MODE: ${difficultyMode.toUpperCase()}
COUNT: ${count} questions

DIFFICULTY REQUIREMENTS FOR EACH QUESTION:
${difficultyInstructions}

IMPORTANT: Each question MUST match its assigned difficulty level exactly.

QUESTION QUALITY REQUIREMENTS:
1. Questions must be factually accurate and verifiable
2. Each question should test a specific piece of knowledge
3. Avoid ambiguous wording - questions should have ONE clear correct answer
4. Make questions engaging and interesting, not boring
5. Use varied question formats (What, Which, Who, When, Where, How many, etc.)
6. Include a mix of recognition, recall, and reasoning questions
7. Wrong answers should be plausible but clearly incorrect
8. Avoid trick questions or overly obscure trivia

WRONG ANSWER GUIDELINES:
- Make distractors (wrong answers) believable and related to the topic
- Don't use obviously silly or impossible answers
- Use common misconceptions as wrong answers when appropriate
- Ensure wrong answers are from the same category/domain as the correct answer

EXPLANATION REQUIREMENTS:
- Provide a clear, concise explanation (1-2 sentences)
- Include interesting context or additional facts when relevant
- Help players learn something new

OUTPUT FORMAT:
Return ONLY a valid JSON array with NO markdown, NO code blocks, NO extra text.
[
  {
    "question": "Clear, engaging question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 2,
    "explanation": "Brief explanation with interesting context",
    "difficulty": "easy|medium|hard",
    "category": "${category}"
  }
]

CRITICAL: The "difficulty" field MUST match the assigned difficulty for each question position.

CRITICAL RULES:
- Exactly 4 options per question
- correctAnswer is the index (0-3) of the correct option in the options array
- All questions must be about ${category}
- Return ONLY the JSON array, nothing else
- No markdown formatting (no \`\`\`json or \`\`\`)
- Ensure valid JSON syntax

Generate ${count} questions now:`;

    console.log(`🤖 Generating ${count} questions (${difficultyMode} mode) for ${category}...`);
    
    const result = await callGeminiAPI(prompt);
    
    // Enhanced cleaning
    let cleaned = result.trim();
    
    // Remove markdown code blocks
    cleaned = cleaned.replace(/```json\n?/gi, '').replace(/```\n?/g, '');
    
    // Remove any leading/trailing whitespace
    cleaned = cleaned.trim();
    
    // Find JSON array boundaries
    const startIndex = cleaned.indexOf('[');
    const endIndex = cleaned.lastIndexOf(']');
    
    if (startIndex !== -1 && endIndex !== -1) {
      cleaned = cleaned.substring(startIndex, endIndex + 1);
    }
    
    const questions = JSON.parse(cleaned);
    
    // Validate questions
    const validQuestions = questions.filter(q => 
      q.question && 
      Array.isArray(q.options) && 
      q.options.length === 4 &&
      typeof q.correctAnswer === 'number' &&
      q.correctAnswer >= 0 &&
      q.correctAnswer <= 3 &&
      q.explanation
    );
    
    console.log(`✅ Successfully generated ${validQuestions.length}/${questions.length} valid questions`);
    
    if (validQuestions.length < questions.length) {
      console.warn(`⚠️ Filtered out ${questions.length - validQuestions.length} invalid questions`);
    }
    
    return validQuestions;
  } catch (error) {
    console.error('❌ AI generation error:', error.message);
    console.error('Stack:', error.stack);
    return [];
  }
};

// Generate questions with quality control and fallback
export const generateQuestionsWithFallback = async (category, difficultyMode = 'mixed', count = 5) => {
  try {
    // Try AI generation first
    const aiQuestions = await generateQuestions(category, difficultyMode, count);
    
    if (aiQuestions.length >= count) {
      return aiQuestions;
    }
    
    // If AI didn't generate enough, try again with a simpler prompt
    console.log(`⚠️ Only got ${aiQuestions.length}/${count} questions, retrying...`);
    const retryQuestions = await generateQuestions(category, difficultyMode, count - aiQuestions.length);
    
    return [...aiQuestions, ...retryQuestions];
  } catch (error) {
    console.error('❌ Failed to generate questions:', error);
    return [];
  }
};

// Validate and enhance question quality
export const validateQuestion = (question) => {
  const issues = [];
  
  // Check required fields
  if (!question.question || question.question.length < 10) {
    issues.push('Question text too short');
  }
  
  if (!Array.isArray(question.options) || question.options.length !== 4) {
    issues.push('Must have exactly 4 options');
  }
  
  if (typeof question.correctAnswer !== 'number' || question.correctAnswer < 0 || question.correctAnswer > 3) {
    issues.push('Invalid correctAnswer index');
  }
  
  // Check for duplicate options
  const uniqueOptions = new Set(question.options);
  if (uniqueOptions.size !== 4) {
    issues.push('Duplicate options detected');
  }
  
  // Check option lengths
  const tooShort = question.options.some(opt => opt.length < 1);
  const tooLong = question.options.some(opt => opt.length > 200);
  if (tooShort) issues.push('Option too short');
  if (tooLong) issues.push('Option too long');
  
  // Check explanation
  if (!question.explanation || question.explanation.length < 10) {
    issues.push('Explanation too short');
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
};

// Enhance question with additional metadata
export const enhanceQuestion = (question, category, difficulty) => {
  return {
    ...question,
    category: question.category || category,
    difficulty: question.difficulty || difficulty,
    points: difficulty === 'easy' ? 100 : difficulty === 'medium' ? 150 : 200,
    timeLimit: 15, // seconds
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
  
  // Check for pattern in answer selection
  const answerPattern = answers.map(a => a.selected).join('');
  if (/^(.)\1+$/.test(answerPattern)) {
    flags.push('SAME_ANSWER_PATTERN');
  }
  
  return { suspicious: flags.length > 0, flags };
};
