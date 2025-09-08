// Set correct configuration for OpenAI API
const correctConfig = {
  aiModel: {
    type: 'openai',
    baseUrl: 'https://api.siliconflow.cn/v1/',
    apiKey: 'sk-vdwulrqbzsrfibpeuwookejeiyfmizbwjpurarqoivoydkbc',
    model: 'Pro/deepseek-ai/DeepSeek-V3.1',
    temperature: 0.7,
    maxTokens: 2000,
    timeoutSeconds: 60
  },
  maxRounds: 5,
  roleGenerationMode: 'parallel'
};

// Save to localStorage
localStorage.setItem('intelliround-config', JSON.stringify(correctConfig));
console.log('Configuration set to OpenAI API');

// Start the application
setTimeout(() => {
  console.log('Starting application...');
}, 1000);