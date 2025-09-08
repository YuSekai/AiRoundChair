import { DebateRole, AIModelConfig } from '../types';
import { BaseAIModel, AIModelFactory } from '../ai/AIModel';

export class ParallelRoleGenerator {
  private baseConfig: AIModelConfig;

  constructor(baseConfig: AIModelConfig) {
    this.baseConfig = baseConfig;
  }

  // 新增：分析问题类型和相关专业领域
  private async analyzeTopicForRoles(topic: string): Promise<any> {
    const aiModel = AIModelFactory.create(this.baseConfig);
    
    const analysisPrompt = `请分析以下问题或议题，确定相关的专业领域和适合的专家角色类型：

问题："${topic}"

请按照以下 JSON 格式返回分析结果，只返回 JSON，不要额外文字：
{
  "category": "问题分类（如：技术、管理、教育、医疗、金融等）",
  "hasAnswer": false,
  "relevantFields": ["相关专业领域1", "相关专业领域2", "相关专业领域3"],
  "suggestedRoles": [
    {
      "type": "专家类型1",
      "field": "专业领域",
      "perspective": "分析角度和焦点"
    },
    {
      "type": "专家类型2",
      "field": "专业领域",
      "perspective": "分析角度和焦点"
    },
    {
      "type": "专家类型3",
      "field": "专业领域",
      "perspective": "分析角度和焦点"
    }
  ]
}`;

    const systemPrompt = `你是一个专业的问题分析师和专家配置顾问。你的任务是：

1. 分析问题的主要类别和领域
2. 检测问题中是否包含答案（关键词："答案："、"答:"、"解答："等）
3. 确定相关的专业领域
4. 推荐三个不同的专家角色，确保他们：
   - 来自相关但不同的专业领域
   - 有不同的分析角度和关注点
   - 能够对问题进行有意义的讨论
   - 具有互补性和多样性

请确保输出是严格的 JSON 格式。`;

    try {
      const timeoutMs = (this.baseConfig.timeoutSeconds || 30) * 1000;
      const response = await aiModel.generateResponse(analysisPrompt, systemPrompt, timeoutMs);
      
      // 解析 JSON 响应
      const jsonMatch = response.content.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        // 检测问题中是否包含答案
        analysis.hasAnswer = topic.includes('答案：') || topic.includes('答:') || topic.includes('解答：');
        return analysis;
      }
    } catch (error) {
      console.warn('问题分析失败，使用默认分析:', error);
    }
    
    // 如果分析失败，返回默认分析
    return this.getDefaultTopicAnalysis(topic);
  }

  // 智能问题分析 - 根据关键词推断专业领域
  private getDefaultTopicAnalysis(topic: string): any {
    const hasAnswer = topic.includes('答案：') || topic.includes('答:') || topic.includes('解答：');
    
    // 智能分析关键词，推断相关专业领域
    const topicLower = topic.toLowerCase();
    let category = '通用讨论';
    let relevantFields: string[] = [];
    let suggestedRoles: any[] = [];
    
    // 技术相关
    if (topicLower.includes('ai') || topicLower.includes('人工智能') || topicLower.includes('算法') || 
        topicLower.includes('编程') || topicLower.includes('软件') || topicLower.includes('技术') ||
        topicLower.includes('系统') || topicLower.includes('数据')) {
      category = '技术领域';
      relevantFields = ['计算机科学', '软件工程', '数据科学'];
      suggestedRoles = [
        { type: '技术架构师', field: '软件工程', perspective: '从技术实现和系统设计角度分析' },
        { type: '数据科学家', field: '数据科学', perspective: '从数据分析和算法角度分析' },
        { type: '产品经理', field: '产品管理', perspective: '从用户需求和商业价值角度分析' }
      ];
    }
    // 医疗健康相关
    else if (topicLower.includes('医疗') || topicLower.includes('健康') || topicLower.includes('病') ||
             topicLower.includes('治疗') || topicLower.includes('药') || topicLower.includes('疫苗')) {
      category = '医疗健康';
      relevantFields = ['医学', '公共卫生', '心理学'];
      suggestedRoles = [
        { type: '临床医师', field: '临床医学', perspective: '从医疗实践和患者安全角度分析' },
        { type: '公共卫生专家', field: '公共卫生', perspective: '从人群健康和疾病预防角度分析' },
        { type: '医疗伦理学家', field: '医学伦理', perspective: '从伦理道德和社会责任角度分析' }
      ];
    }
    // 教育相关
    else if (topicLower.includes('教育') || topicLower.includes('学') || topicLower.includes('培训') ||
             topicLower.includes('学生') || topicLower.includes('老师') || topicLower.includes('课程')) {
      category = '教育领域';
      relevantFields = ['教育学', '心理学', '社会学'];
      suggestedRoles = [
        { type: '教育学者', field: '教育学', perspective: '从教育理论和教学方法角度分析' },
        { type: '发展心理学家', field: '发展心理学', perspective: '从学习认知和心理发展角度分析' },
        { type: '教育政策专家', field: '公共政策', perspective: '从教育政策和制度设计角度分析' }
      ];
    }
    // 经济金融相关
    else if (topicLower.includes('经济') || topicLower.includes('金融') || topicLower.includes('投资') ||
             topicLower.includes('股票') || topicLower.includes('市场') || topicLower.includes('货币')) {
      category = '经济金融';
      relevantFields = ['经济学', '金融学', '统计学'];
      suggestedRoles = [
        { type: '宏观经济学家', field: '宏观经济学', perspective: '从整体经济运行和政策影响角度分析' },
        { type: '金融分析师', field: '金融学', perspective: '从市场机制和风险管理角度分析' },
        { type: '行为经济学家', field: '行为经济学', perspective: '从人类决策行为和市场心理角度分析' }
      ];
    }
    // 环境相关
    else if (topicLower.includes('环境') || topicLower.includes('气候') || topicLower.includes('污染') ||
             topicLower.includes('绿色') || topicLower.includes('可持续') || topicLower.includes('生态')) {
      category = '环境科学';
      relevantFields = ['环境科学', '生态学', '公共政策'];
      suggestedRoles = [
        { type: '环境科学家', field: '环境科学', perspective: '从生态系统和环境影响角度分析' },
        { type: '气候政策专家', field: '环境政策', perspective: '从政策制定和国际合作角度分析' },
        { type: '可持续发展顾问', field: '可持续发展', perspective: '从经济发展和环境平衡角度分析' }
      ];
    }
    // 社会政治相关
    else if (topicLower.includes('社会') || topicLower.includes('政策') || topicLower.includes('法律') ||
             topicLower.includes('管理') || topicLower.includes('组织') || topicLower.includes('制度')) {
      category = '社会治理';
      relevantFields = ['社会学', '公共管理', '法学'];
      suggestedRoles = [
        { type: '社会学家', field: '社会学', perspective: '从社会结构和群体行为角度分析' },
        { type: '公共政策专家', field: '公共管理', perspective: '从政策效果和治理机制角度分析' },
        { type: '法律学者', field: '法学', perspective: '从法律框架和权利保护角度分析' }
      ];
    }
    // 商业管理相关
    else if (topicLower.includes('企业') || topicLower.includes('商业') || topicLower.includes('营销') ||
             topicLower.includes('品牌') || topicLower.includes('战略') || topicLower.includes('创业')) {
      category = '商业管理';
      relevantFields = ['工商管理', '市场营销', '战略管理'];
      suggestedRoles = [
        { type: '战略管理专家', field: '战略管理', perspective: '从企业战略和竞争优势角度分析' },
        { type: '市场营销专家', field: '市场营销', perspective: '从消费者行为和品牌价值角度分析' },
        { type: '创业导师', field: '创业学', perspective: '从创新机会和风险控制角度分析' }
      ];
    }
    // 默认通用分析
    else {
      category = '跨领域讨论';
      relevantFields = ['系统思维', '批判性思维', '创新思维'];
      suggestedRoles = [
        { type: '系统分析师', field: '系统科学', perspective: '从系统性和整体性角度分析问题' },
        { type: '创新思维专家', field: '创新学', perspective: '从创新机会和变革可能性角度分析' },
        { type: '跨学科研究者', field: '跨学科研究', perspective: '从多学科融合和综合视角分析' }
      ];
    }
    
    return {
      category: category,
      hasAnswer: hasAnswer,
      relevantFields: relevantFields,
      suggestedRoles: suggestedRoles
    };
  }

  async generateRoles(topic: string, roleCount: number = 3): Promise<DebateRole[]> {
    console.log(`开始并行生成 ${roleCount} 个角色...`);
    
    try {
      // 首先分析问题类型和相关专业领域
      const topicAnalysis = await this.analyzeTopicForRoles(topic);
      console.log('问题分析结果:', topicAnalysis);
      
      // 为了避免AI负载过高，采用错峰生成策略
      const roles: DebateRole[] = [];
      
      // 方案1：尝试并行生成
      try {
        const rolePromises: Promise<DebateRole>[] = [];
        
        for (let i = 0; i < roleCount; i++) {
          // 添加小延迟避免同时请求
          const delay = i * 200; // 200ms间隔
          const rolePromise = this.generateSingleRoleWithDelay(topic, i + 1, roleCount, delay, topicAnalysis);
          rolePromises.push(rolePromise);
        }

        const parallelRoles = await Promise.allSettled(rolePromises);
        
        // 检查并行生成结果
        const successfulRoles = parallelRoles
          .filter((result): result is PromiseFulfilledResult<DebateRole> => result.status === 'fulfilled')
          .map(result => result.value);
        
        if (successfulRoles.length >= 2) {
          // 如果有足够的成功角色，补齐剩余的
          while (roles.length < roleCount) {
            if (successfulRoles.length > 0) {
              roles.push(successfulRoles.shift()!);
            } else {
              roles.push(this.getDefaultRole(roles.length + 1, topic));
            }
          }
        } else {
          // 如果并行生成失败太多，采用串行重试
          console.log('并行生成成功率低，切换到串行生成...');
          return await this.generateRolesSequentially(topic, roleCount, topicAnalysis);
        }
      } catch (error) {
        console.warn('并行生成失败，切换到串行生成:', error);
        return await this.generateRolesSequentially(topic, roleCount, topicAnalysis);
      }

      // 验证生成的角色
      if (!this.validateRoles(roles)) {
        console.warn('生成的角色可能不够多样化，使用备用角色');
        return this.getFallbackRoles(topic, topicAnalysis);
      }

      console.log('并行角色生成完成:', roles.map(r => r.name));
      return roles;

    } catch (error) {
      console.error('并行角色生成失败:', error);
      return this.getFallbackRoles(topic);
    }
  }

  private async generateSingleRole(topic: string, roleIndex: number, totalRoles: number, topicAnalysis?: any): Promise<DebateRole> {
    // 为每个角色创建独立的AI模型实例
    const aiModel = AIModelFactory.create(this.baseConfig);
    
    const prompt = this.buildSingleRolePrompt(topic, roleIndex, totalRoles, topicAnalysis);
    const systemPrompt = this.getSingleRoleSystemPrompt(roleIndex, topicAnalysis);

    try {
      console.log(`正在生成第 ${roleIndex} 个角色...`);
      // 使用配置中的超时设置，默认30秒
      const timeoutMs = (this.baseConfig.timeoutSeconds || 30) * 1000;
      const response = await aiModel.generateResponse(prompt, systemPrompt, timeoutMs);
      
      const role = this.parseSingleRoleFromResponse(response.content, roleIndex);
      console.log(`第 ${roleIndex} 个角色生成完成: ${role.name}`);
      
      return role;
    } catch (error) {
      console.warn(`第 ${roleIndex} 个角色生成失败，使用默认角色:`, error);
      return this.getDefaultRole(roleIndex, topic, topicAnalysis);
    }
  }

  private async generateSingleRoleWithDelay(topic: string, roleIndex: number, totalRoles: number, delay: number, topicAnalysis?: any): Promise<DebateRole> {
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    return this.generateSingleRole(topic, roleIndex, totalRoles, topicAnalysis);
  }

  // 串行生成方法（备用方案）
  private async generateRolesSequentially(topic: string, roleCount: number, topicAnalysis?: any): Promise<DebateRole[]> {
    console.log('开始串行生成角色...');
    const roles: DebateRole[] = [];
    
    for (let i = 0; i < roleCount; i++) {
      try {
        const role = await this.generateSingleRole(topic, i + 1, roleCount, topicAnalysis);
        roles.push(role);
        // 串行生成时添加间隔避免过载
        if (i < roleCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.warn(`串行生成第${i + 1}个角色失败，使用默认角色`);
        roles.push(this.getDefaultRole(i + 1, topic, topicAnalysis));
      }
    }
    
    return roles;
  }

  private buildSingleRolePrompt(topic: string, roleIndex: number, totalRoles: number, topicAnalysis?: any): string {
    // 使用问题分析结果来生成相关专业角色
    let roleInfo;
    
    if (topicAnalysis && topicAnalysis.suggestedRoles && topicAnalysis.suggestedRoles[roleIndex - 1]) {
      roleInfo = topicAnalysis.suggestedRoles[roleIndex - 1];
    } else {
      // 如果没有分析结果，使用默认角色类型
      const defaultRoles = [
        { type: '管理专家', field: '管理学', perspective: '从效率和成本角度分析' },
        { type: '技术专家', field: '技术领域', perspective: '从技术实现和可行性角度分析' },
        { type: '用户体验专家', field: '用户研究', perspective: '从用户需求和体验角度分析' }
      ];
      roleInfo = defaultRoles[roleIndex - 1] || defaultRoles[2];
    }
    
    // 检测是否包含答案
    const hasAnswer = topicAnalysis?.hasAnswer || topic.includes('答案：') || topic.includes('答:') || topic.includes('解答：');
    const roleTask = hasAnswer ? 
      '分析给出的答案是否正确，并提出优化建议' : 
      '为问题提出解答方案并讨论其可行性';

    return `请为讨论议题"${topic}"设计一个${roleInfo.type}角色。

角色要求：
1. 专业领域：${roleInfo.field}
2. 分析角度：${roleInfo.perspective}
3. 任务：${roleTask}
4. 需要有具体的职业背景和专业领域
5. 性格特点要鲜明且符合角色定位
6. 确保这是第${roleIndex}个角色，总共${totalRoles}个角色参与讨论
7. 角色应该能够与其他专家进行有意义的互动讨论

请按照以下JSON格式返回，只返回JSON，不要额外文字：
{
  "name": "具体的角色名称（如：数据分析专家、项目经理等）",
  "background": "详细的角色背景描述（包含职业、经历、专业领域）",
  "stance": "对议题的具体角度和分析方式",
  "personality": "性格特点和思维方式",
  "expertise": ["专业领域1", "专业领域2", "专业领域3"]
}`;
  }

  private getSingleRoleSystemPrompt(roleIndex: number, topicAnalysis?: any): string {
    let instruction;
    
    if (topicAnalysis && topicAnalysis.category) {
      // 基于问题分类的角色设计指导
      instruction = `你是一个专业的${topicAnalysis.category}领域角色设计师。你需要设计一个在${topicAnalysis.category}领域具有专业背景的角色，能够从独特的专业角度分析问题。`;
    } else {
      // 默认指导
      const roleInstructions = [
        '你是一个专注于理性分析的角色设计师。设计的角色应该侧重数据、验证和逻辑分析。',
        '你是一个专注于实际应用的角色设计师。设计的角色应该侧重可操作性、可行性和实际效果。',
        '你是一个专注于综合考虑的角色设计师。设计的角色应该侧重全局视野、平衡各方因素和长远规划。'
      ];
      instruction = roleInstructions[roleIndex - 1] || roleInstructions[2];
    }

    return `${instruction}

设计原则：
1. 角色必须真实可信，基于现实中存在的职业和背景
2. 专业背景要与议题相关，具有针对性
3. 分析角度要明确且有特色，保持专业性和建设性
4. 性格特点要有助于角色在讨论中的贡献
5. 输出必须是严格的JSON格式，不包含任何其他文本
6. 角色应该具有互补性，能够与其他专家进行有意义的互动讨论

请确保角色具有独特性和代表性，能够从不同角度分析问题。`;
  }

  private parseSingleRoleFromResponse(response: string, roleIndex: number): DebateRole {
    try {
      // 提取JSON部分
      const jsonMatch = response.match(/\{[\s\S]*?\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        id: `role_${roleIndex}`,
        name: parsed.name || `角色${roleIndex}`,
        background: parsed.background || '专业背景人士',
        stance: parsed.stance || '对议题有明确观点',
        personality: parsed.personality || '理性、专业',
        expertise: Array.isArray(parsed.expertise) ? parsed.expertise : ['专业分析']
      };
    } catch (error) {
      console.warn(`解析第${roleIndex}个角色响应失败:`, error);
      return this.getDefaultRole(roleIndex, '');
    }
  }

  private getDefaultRole(roleIndex: number, topic: string, topicAnalysis?: any): DebateRole {
    // 如果有问题分析结果，优先使用
    if (topicAnalysis && topicAnalysis.suggestedRoles && topicAnalysis.suggestedRoles[roleIndex - 1]) {
      const suggested = topicAnalysis.suggestedRoles[roleIndex - 1];
      return {
        id: `role_${roleIndex}`,
        name: suggested.type,
        background: `专业的${suggested.field}专家，在该领域具有丰富的理论和实践经验`,
        stance: suggested.perspective,
        personality: '专业、严谨、善于分析',
        expertise: [suggested.field, '问题分析', '专业咨询']
      };
    }
    
    // 默认角色（如果没有分析结果）
    const defaultRoles = [
      {
        id: 'role_1',
        name: '数据分析专家',
        background: '专业数据分析师，擅长通过数据挖掘和统计分析揭示问题本质',
        stance: '从数据角度理性分析问题，重视实证支持',
        personality: '严谨理性、数据驱动、善于发现规律',
        expertise: ['数据分析', '统计学', '预测建模']
      },
      {
        id: 'role_2',
        name: '实施经理',
        background: '项目管理和实施专家，专注于将理论方案转化为可执行的实际操作',
        stance: '从实际可行性角度评估方案，关注执行难度和成本',
        personality: '务实高效、结果导向、善于协调资源',
        expertise: ['项目管理', '运营优化', '风险控制']
      },
      {
        id: 'role_3',
        name: '战略顾问',
        background: '管理咨询和战略规划专家，擅长从全局视角综合考虑问题',
        stance: '从长远发展和全局视角衡量各种因素和影响',
        personality: '全局思维、战略导向、善于平衡利益',
        expertise: ['战略规划', '商业分析', '综合评估']
      }
    ];

    const role = defaultRoles[roleIndex - 1] || defaultRoles[0];
    return {
      ...role,
      id: `role_${roleIndex}`
    };
  }

  private getFallbackRoles(topic: string, topicAnalysis?: any): DebateRole[] {
    return [
      this.getDefaultRole(1, topic, topicAnalysis),
      this.getDefaultRole(2, topic, topicAnalysis),
      this.getDefaultRole(3, topic, topicAnalysis)
    ];
  }

  private validateRoles(roles: DebateRole[]): boolean {
    if (roles.length < 2) return false;
    
    // 检查角色名称的唯一性
    const names = roles.map(role => role.name.toLowerCase());
    const uniqueNames = new Set(names);
    if (uniqueNames.size !== roles.length) {
      console.warn('发现重复的角色名称');
      return false;
    }

    // 改进的多样性检查 - 检查角色的专业领域和分析角度
    const backgrounds = roles.map(role => role.background.toLowerCase());
    const stances = roles.map(role => role.stance.toLowerCase());
    const personalities = roles.map(role => role.personality.toLowerCase());
    
    // 检查背景的多样性
    const uniqueBackgroundKeywords = new Set();
    backgrounds.forEach(bg => {
      // 提取关键专业词汇
      if (bg.includes('技术') || bg.includes('系统') || bg.includes('架构') || bg.includes('工程')) uniqueBackgroundKeywords.add('tech');
      if (bg.includes('数据') || bg.includes('分析') || bg.includes('科学')) uniqueBackgroundKeywords.add('data');
      if (bg.includes('管理') || bg.includes('经理') || bg.includes('项目')) uniqueBackgroundKeywords.add('management');
      if (bg.includes('研究') || bg.includes('学者') || bg.includes('教授')) uniqueBackgroundKeywords.add('research');
      if (bg.includes('咨询') || bg.includes('顾问') || bg.includes('策略')) uniqueBackgroundKeywords.add('consulting');
      if (bg.includes('创新') || bg.includes('设计') || bg.includes('产品')) uniqueBackgroundKeywords.add('innovation');
      if (bg.includes('用户') || bg.includes('体验') || bg.includes('交互')) uniqueBackgroundKeywords.add('ux');
      if (bg.includes('跨学科') || bg.includes('综合') || bg.includes('传播')) uniqueBackgroundKeywords.add('interdisciplinary');
    });
    
    // 检查分析角度的多样性
    const uniqueStanceKeywords = new Set();
    stances.forEach(stance => {
      if (stance.includes('系统') || stance.includes('整体') || stance.includes('全局')) uniqueStanceKeywords.add('systematic');
      if (stance.includes('创新') || stance.includes('变革') || stance.includes('机会')) uniqueStanceKeywords.add('innovative');
      if (stance.includes('跨学科') || stance.includes('融合') || stance.includes('综合')) uniqueStanceKeywords.add('interdisciplinary');
      if (stance.includes('实际') || stance.includes('可行') || stance.includes('操作')) uniqueStanceKeywords.add('practical');
      if (stance.includes('理论') || stance.includes('学术') || stance.includes('研究')) uniqueStanceKeywords.add('theoretical');
      if (stance.includes('用户') || stance.includes('体验') || stance.includes('需求')) uniqueStanceKeywords.add('user-focused');
      if (stance.includes('数据') || stance.includes('证据') || stance.includes('分析')) uniqueStanceKeywords.add('data-driven');
      if (stance.includes('战略') || stance.includes('长远') || stance.includes('规划')) uniqueStanceKeywords.add('strategic');
    });
    
    // 至少要有2个不同的专业领域或2个不同的分析角度
    const totalUniqueAspects = uniqueBackgroundKeywords.size + uniqueStanceKeywords.size;
    const isValid = totalUniqueAspects >= 3; // 至少3个不同的方面
    
    if (!isValid) {
      console.warn('角色多样性不足:', {
        背景关键词: Array.from(uniqueBackgroundKeywords),
        立场关键词: Array.from(uniqueStanceKeywords),
        总多样性: totalUniqueAspects
      });
    } else {
      console.log('角色验证通过:', {
        背景多样性: uniqueBackgroundKeywords.size,
        立场多样性: uniqueStanceKeywords.size,
        总多样性: totalUniqueAspects
      });
    }
    
    return isValid;
  }

  // 测试连接功能
  async testConnection(): Promise<boolean> {
    try {
      const testModel = AIModelFactory.create(this.baseConfig);
      return await testModel.validateConnection();
    } catch (error) {
      return false;
    }
  }

  // 获取角色生成统计信息
  async generateRolesWithStats(topic: string, roleCount: number = 3): Promise<{
    roles: DebateRole[];
    stats: {
      totalTime: number;
      successCount: number;
      failureCount: number;
      averageTime: number;
    };
  }> {
    const startTime = Date.now();
    const roles = await this.generateRoles(topic, roleCount);
    const totalTime = Date.now() - startTime;

    // 改进成功率计算 - 基于角色验证结果而不是名称
    const isValidGeneration = this.validateRoles(roles);
    const successCount = isValidGeneration ? roleCount : 0;

    return {
      roles,
      stats: {
        totalTime,
        successCount,
        failureCount: roleCount - successCount,
        averageTime: totalTime / roleCount
      }
    };
  }
}