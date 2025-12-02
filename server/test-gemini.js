import dotenv from 'dotenv';
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-exp:generateContent';

async function testGemini() {
  try {
    console.log('🧪 Testing Gemini API...\n');

    const prompt = 'Generate 2 multiple choice quiz questions about Science with easy difficulty. Return as JSON array with format: [{ question, options: [4 options], correctAnswer: index, explanation }]';

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
      console.log('✅ Success! Gemini API is working\n');
      console.log('Response:', data.candidates[0].content.parts[0].text);
    } else {
      console.error('❌ Error:', data.error?.message || 'Unknown error');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testGemini();
