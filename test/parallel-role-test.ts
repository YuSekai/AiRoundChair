/**
 * 并行角色生成器测试
 */

import { ParallelRoleGenerator } from '../src/core/ParallelRoleGenerator';
import { AIModelConfig } from '../src/types';

// 测试配置
const testOllamaConfig: AIModelConfig = {
  type: 'ollama',
  baseUrl: 'http://localhost:11434',
  model: 'qwen2.5:14b', // 使用您系统中可用的模型
  temperature: 0.7,
  maxTokens: 1000
};

async function testParallelRoleGeneration() {
  console.log('🚀 开始测试并行角色生成功能\n');

  try {
    const generator = new ParallelRoleGenerator(testOllamaConfig);

    // 测试连接
    console.log('📡 测试AI连接...');
    const isConnected = await generator.testConnection();
    if (!isConnected) {
      console.error('❌ AI连接失败，请检查配置');
      return;
    }
    console.log('✅ AI连接成功\n');

    // 测试议题
    const topics = [
      '是否应全面推行远程办公？',
      '人工智能是否会取代人类工作？',
      '是否应该对社交媒体平台实施更严格的监管？'
    ];

    for (const topic of topics) {
      console.log(`🎯 测试议题: "${topic}"`);
      console.log('='.repeat(50));

      try {
        const startTime = Date.now();
        const result = await generator.generateRolesWithStats(topic, 3);
        const endTime = Date.now();

        console.log(`📊 生成统计:`);
        console.log(`   总耗时: ${result.stats.totalTime}ms`);
        console.log(`   成功数: ${result.stats.successCount}/3`);
        console.log(`   失败数: ${result.stats.failureCount}/3`);
        console.log(`   平均耗时: ${Math.round(result.stats.averageTime)}ms`);

        console.log(`\n👥 生成的角色:`);
        result.roles.forEach((role, index) => {
          console.log(`\n   ${index + 1}. ${role.name}`);
          console.log(`      背景: ${role.background}`);
          console.log(`      立场: ${role.stance}`);
          console.log(`      性格: ${role.personality}`);
          console.log(`      专长: ${role.expertise.join(', ')}`);
        });

        // 验证角色多样性
        const names = result.roles.map(r => r.name);
        const uniqueNames = new Set(names);
        const isUnique = uniqueNames.size === result.roles.length;
        
        console.log(`\n✅ 角色验证:`);
        console.log(`   名称唯一性: ${isUnique ? '通过' : '失败'}`);
        console.log(`   角色数量: ${result.roles.length}/3`);

      } catch (error: any) {
        console.error(`❌ 生成失败: ${error?.message || String(error)}`);
      }

      console.log('\n' + '='.repeat(50) + '\n');
    }

    console.log('🎉 并行角色生成测试完成！');

  } catch (error) {
    console.error('💥 测试执行失败:', error);
  }
}

// 对比测试：并行 vs 传统
async function compareGenerationMethods() {
  console.log('🔄 开始对比测试：并行生成 vs 传统生成\n');

  try {
    const { RoleGenerator } = await import('../src/core/RoleGenerator');
    const { AIModelFactory } = await import('../src/ai/AIModel');

    const topic = '是否应该全面推行电动汽车？';
    
    // 传统生成测试
    console.log('🐌 传统生成测试:');
    const traditionalStart = Date.now();
    const aiModel = AIModelFactory.create(testOllamaConfig);
    const traditionalGenerator = new RoleGenerator(aiModel);
    
    try {
      const traditionalRoles = await traditionalGenerator.generateRoles(topic, 3);
      const traditionalTime = Date.now() - traditionalStart;
      console.log(`   耗时: ${traditionalTime}ms`);
      console.log(`   成功生成: ${traditionalRoles.length} 个角色`);
      console.log(`   角色: ${traditionalRoles.map(r => r.name).join(', ')}`);
    } catch (error: any) {
      console.log(`   失败: ${error?.message || String(error)}`);
    }

    console.log('');

    // 并行生成测试
    console.log('🚀 并行生成测试:');
    const parallelGenerator = new ParallelRoleGenerator(testOllamaConfig);
    const result = await parallelGenerator.generateRolesWithStats(topic, 3);
    
    console.log(`   耗时: ${result.stats.totalTime}ms`);
    console.log(`   成功生成: ${result.stats.successCount} 个角色`);
    console.log(`   角色: ${result.roles.map(r => r.name).join(', ')}`);

    console.log('\n📈 对比结果:');
    console.log(`   并行生成成功率: ${(result.stats.successCount / 3 * 100).toFixed(1)}%`);
    console.log(`   角色质量: ${result.roles.every(r => r.name && r.background && r.stance) ? '优秀' : '一般'}`);

  } catch (error) {
    console.error('💥 对比测试失败:', error);
  }
}

// 运行测试
async function runAllTests() {
  await testParallelRoleGeneration();
  console.log('\n' + '='.repeat(80) + '\n');
  await compareGenerationMethods();
}

// 如果直接运行此文件
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('测试执行失败:', error);
    process.exit(1);
  });
}

export { testParallelRoleGeneration, compareGenerationMethods };