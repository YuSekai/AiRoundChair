/**
 * 简单的功能测试 - 验证核心组件
 */

import { DebateManager } from '../src/core/DebateManager';
import { AIModelConfig } from '../src/types';

// 模拟 AI 配置（用于测试）
const mockOllamaConfig: AIModelConfig = {
  type: 'ollama',
  baseUrl: 'http://localhost:11434',
  model: 'llama2',
  temperature: 0.7,
  maxTokens: 1000
};

const mockOpenAIConfig: AIModelConfig = {
  type: 'openai',
  baseUrl: 'https://api.openai.com/v1',
  apiKey: 'test-key',
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 1000
};

async function testDebateManager() {
  console.log('🧪 测试 DebateManager 初始化...');
  
  try {
    const manager = new DebateManager();
    
    // 测试状态获取
    const initialStatus = manager.getStatus();
    console.log('✅ 初始状态:', initialStatus);
    
    // 测试配置模板
    const templates = manager.getAIConfigTemplates();
    console.log('✅ 配置模板数量:', Object.keys(templates).length);
    
    // 测试默认配置
    const defaultConfig = manager.getDefaultDebateConfig();
    console.log('✅ 默认配置:', defaultConfig);
    
    console.log('✅ DebateManager 基础功能测试通过');
    return true;
  } catch (error) {
    console.error('❌ DebateManager 测试失败:', error);
    return false;
  }
}

async function testAIModelFactories() {
  console.log('🧪 测试 AI 模型工厂...');
  
  try {
    const { AIModelFactory } = await import('../src/ai/AIModel');
    
    // 测试 Ollama 模型创建
    const ollamaModel = AIModelFactory.create(mockOllamaConfig);
    console.log('✅ Ollama 模型创建成功');
    
    // 测试 OpenAI 模型创建
    const openaiModel = AIModelFactory.create(mockOpenAIConfig);
    console.log('✅ OpenAI 模型创建成功');
    
    console.log('✅ AI 模型工厂测试通过');
    return true;
  } catch (error) {
    console.error('❌ AI 模型工厂测试失败:', error);
    return false;
  }
}

async function testRoleGenerator() {
  console.log('🧪 测试角色生成器...');
  
  try {
    const { RoleGenerator } = await import('../src/core/RoleGenerator');
    const { AIModelFactory } = await import('../src/ai/AIModel');
    
    // 创建模拟 AI 模型
    const mockModel = AIModelFactory.create(mockOllamaConfig);
    const generator = new RoleGenerator(mockModel);
    
    // 测试默认角色生成
    const fallbackRoles = (generator as any).getFallbackRoles();
    console.log('✅ 默认角色数量:', fallbackRoles.length);
    
    // 测试角色验证
    const isValid = generator.validateRoles(fallbackRoles);
    console.log('✅ 角色验证结果:', isValid);
    
    console.log('✅ 角色生成器测试通过');
    return true;
  } catch (error) {
    console.error('❌ 角色生成器测试失败:', error);
    return false;
  }
}

async function testFileExporter() {
  console.log('🧪 测试文件导出器...');
  
  try {
    const { FileExporter } = await import('../src/utils/FileExporter');
    
    // 创建模拟辩论数据
    const mockDebate = {
      id: 'test-debate',
      topic: '测试议题',
      roles: [
        {
          id: 'role1',
          name: '测试角色1',
          background: '测试背景',
          stance: '支持',
          personality: '积极',
          expertise: ['测试']
        }
      ],
      statements: [
        {
          id: 'stmt1',
          roleId: 'role1',
          roleName: '测试角色1',
          content: '这是一个测试发言',
          timestamp: Date.now(),
          round: 1,
          type: 'opening' as const
        }
      ],
      currentRound: 1,
      status: 'completed' as const,
      consensus: '测试共识',
      startTime: Date.now() - 60000,
      endTime: Date.now(),
      config: {
        maxRounds: 5,
        convergenceThreshold: 0.8,
        enableRealTimeAnalysis: true,
        aiModel: mockOllamaConfig
      }
    };
    
    // 测试文件路径验证
    const isValidJson = FileExporter.validateFilePath('test.json', 'json');
    const isValidMd = FileExporter.validateFilePath('test.md', 'markdown');
    console.log('✅ JSON 路径验证:', isValidJson);
    console.log('✅ Markdown 路径验证:', isValidMd);
    
    // 测试摘要生成
    const summary = FileExporter.generateSummary(mockDebate);
    console.log('✅ 摘要长度:', summary.length);
    
    console.log('✅ 文件导出器测试通过');
    return true;
  } catch (error) {
    console.error('❌ 文件导出器测试失败:', error);
    return false;
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('🚀 开始运行 IntelliRound 功能测试\n');
  
  const tests = [
    testDebateManager,
    testAIModelFactories,
    testRoleGenerator,
    testFileExporter
  ];
  
  let passedTests = 0;
  const totalTests = tests.length;
  
  for (let i = 0; i < tests.length; i++) {
    console.log(`\n--- 测试 ${i + 1}/${totalTests} ---`);
    try {
      const result = await tests[i]();
      if (result) {
        passedTests++;
      }
    } catch (error) {
      console.error(`❌ 测试 ${i + 1} 执行失败:`, error);
    }
  }
  
  console.log(`\n📊 测试结果: ${passedTests}/${totalTests} 通过`);
  
  if (passedTests === totalTests) {
    console.log('🎉 所有测试通过！IntelliRound 核心功能正常');
  } else {
    console.log('⚠️  部分测试失败，请检查相关功能');
  }
  
  return passedTests === totalTests;
}

// 如果直接运行此文件
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('测试执行失败:', error);
    process.exit(1);
  });
}

export { runAllTests };