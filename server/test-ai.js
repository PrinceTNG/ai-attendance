// Quick test script for AI services
require('dotenv').config();

const { isHuggingFaceAvailable, generateAIText, callHuggingFaceAPI } = require('./services/huggingFaceAI');
const { isOpenAIAvailable, generateConversationalResponse } = require('./services/openAIService');

async function testAI() {
  console.log('\n🧪 Testing AI Services...\n');
  
  // Test HuggingFace
  console.log('1. Testing HuggingFace...');
  console.log('   Available:', isHuggingFaceAvailable());
  if (isHuggingFaceAvailable()) {
    try {
      console.log('   Testing text generation...');
      const hfResult = await generateAIText('Hello, how are you?', {
        userRole: 'employee',
        userName: 'Test User'
      });
      console.log('   ✅ Result:', hfResult ? hfResult.substring(0, 100) : 'No response');
    } catch (error) {
      console.log('   ❌ Error:', error.message);
    }
  } else {
    console.log('   ⚠️ HuggingFace not configured');
  }
  
  // Test OpenAI
  console.log('\n2. Testing OpenAI...');
  console.log('   Available:', isOpenAIAvailable());
  if (isOpenAIAvailable()) {
    try {
      console.log('   Testing conversation...');
      const openAIResult = await generateConversationalResponse('Hello, how are you?', {
        userRole: 'employee',
        userName: 'Test User',
        conversationHistory: []
      });
      console.log('   ✅ Result:', openAIResult ? openAIResult.substring(0, 100) : 'No response');
    } catch (error) {
      console.log('   ❌ Error:', error.message);
    }
  } else {
    console.log('   ⚠️ OpenAI not configured');
  }
  
  console.log('\n✅ Test complete!\n');
  process.exit(0);
}

testAI();
