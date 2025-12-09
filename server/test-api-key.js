import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  console.log('🔍 Checking API key and listing available models...\n');
  
  if (!apiKey) {
    console.error('❌ No API key found in .env file');
    return;
  }
  
  console.log(`API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}\n`);
  
  // Try to list models
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  try {
    console.log('Fetching available models...\n');
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ API Error:', data.error);
      console.error('\n🔧 TROUBLESHOOTING:');
      console.error('1. Go to: https://aistudio.google.com/app/apikey');
      console.error('2. Make sure you are logged into the correct Google account');
      console.error('3. Delete the old API key');
      console.error('4. Create a NEW API key');
      console.error('5. Copy the new key and update .env file');
      console.error('6. Restart the server');
      return;
    }
    
    if (data.models && data.models.length > 0) {
      console.log('✅ API Key is valid!\n');
      console.log('📋 Available models that support generateContent:\n');
      
      const generateModels = data.models.filter(m => 
        m.supportedGenerationMethods?.includes('generateContent')
      );
      
      if (generateModels.length === 0) {
        console.log('❌ No models support generateContent');
        return;
      }
      
      generateModels.forEach(model => {
        console.log(`  • ${model.name}`);
      });
      
      // Find the best model to use
      const flash2_5 = generateModels.find(m => m.name.includes('gemini-2.5-flash'));
      const flash2_0 = generateModels.find(m => m.name.includes('gemini-2.0-flash'));
      const flash1_5 = generateModels.find(m => m.name.includes('gemini-1.5-flash'));
      const proModel = generateModels.find(m => m.name.includes('pro'));
      
      const recommended = flash2_5 || flash2_0 || flash1_5 || proModel || generateModels[0];
      
      console.log(`\n✨ RECOMMENDED MODEL: ${recommended.name}`);
      console.log(`\n📝 Update server/services/aiService.js to use:`);
      console.log(`const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/${recommended.name}:generateContent';`);
      
    } else {
      console.log('❌ No models available for this API key');
      console.log('\n🔧 Your API key might not be activated. Try:');
      console.log('1. Visit: https://aistudio.google.com/');
      console.log('2. Accept any terms of service');
      console.log('3. Create a new API key');
    }
    
  } catch (error) {
    console.error('❌ Network Error:', error.message);
  }
}

listModels();
