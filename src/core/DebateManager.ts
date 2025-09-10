import { DebateSession, DebateConfig, AIModelConfig } from '../types';
import { AIModelFactory, BaseAIModel } from '../ai/AIModel';
import { RoleGenerator } from './RoleGenerator';
import { ParallelRoleGenerator } from './ParallelRoleGenerator';
import { DebateEngine } from './DebateEngine';
import { HistoryManager } from '../utils/HistoryManager';
import { EventEmitter } from 'events';

export class DebateManager extends EventEmitter {
  private aiModel: BaseAIModel | null = null;
  private roleGenerator: RoleGenerator | null = null;
  private parallelRoleGenerator: ParallelRoleGenerator | null = null;
  private debateEngine: DebateEngine | null = null;
  private currentSession: DebateSession | null = null;
  private useParallelGeneration: boolean = true; // 默认使用并行生成

  constructor() {
    super();
  }

  async initializeAI(config: AIModelConfig): Promise<void> {
    try {
      console.log('开始初始化 AI 模型...', config);
      this.emit('ai-initialization-progress', '创建 AI 模型实例...');
      
      this.aiModel = AIModelFactory.create(config);
      
      // 验证AI连接
      this.emit('ai-initialization-progress', '验证 AI 模型连接...');
      console.log('开始验证 AI 连接...');
      
      const isConnected = await this.aiModel.validateConnection();
      if (!isConnected) {
        const errorMsg = `无法连接到 ${config.type.toUpperCase()} 模型 ${config.model}。请检查：\n1. ${config.type === 'ollama' ? 'Ollama 服务是否启动' : 'API 地址和密钥是否正确'}\n2. 模型名称是否正确\n3. 网络连接是否正常`;
        throw new Error(errorMsg);
      }
      
      console.log('AI 模型连接验证成功');
      this.emit('ai-initialization-progress', '初始化组件...');

      this.roleGenerator = new RoleGenerator(this.aiModel, config);
      this.parallelRoleGenerator = new ParallelRoleGenerator(config);
      this.debateEngine = new DebateEngine(this.aiModel);

      // 转发辩论引擎的事件
      this.debateEngine.on('debate-started', (session) => {
        this.emit('debate-started', session);
      });

      this.debateEngine.on('statement-added', (statement) => {
        this.emit('statement-added', statement);
      });

      this.debateEngine.on('debate-completed', (session) => {
        // 自动保存到历史记录
        HistoryManager.saveDebateSession(session);
        this.emit('debate-completed', session);
      });
      
      // 新增：转发实时角色事件
      this.debateEngine.on('role-thinking', (data) => {
        this.emit('role-thinking', data);
      });
      
      this.debateEngine.on('role-statement-ready', (statement) => {
        this.emit('role-statement-ready', statement);
      });
      
      this.debateEngine.on('role-error', (data) => {
        this.emit('role-error', data);
      });
      
      // 新增：转发辩论状态更新事件
      this.debateEngine.on('debate-status-update', (data) => {
        this.emit('debate-status-update', data);
      });

      console.log('AI 模型初始化完成');
      this.emit('ai-initialized', { type: config.type, model: config.model });
    } catch (error) {
      console.error('AI 模型初始化失败:', error);
      this.emit('error', error);
      throw error;
    }
  }

  async startDebate(topic: string, config: DebateConfig): Promise<DebateSession> {
    if (!this.aiModel || !this.roleGenerator || !this.debateEngine) {
      throw new Error('AI 模型尚未初始化，请先配置 AI 模型');
    }

    if (!topic.trim()) {
      throw new Error('辩论议题不能为空');
    }

    try {
      this.emit('debate-preparation-started', { topic });

      // 生成角色 - 使用并行生成或传统生成
      this.emit('generating-roles');
      let roles;
      
      if (this.useParallelGeneration && this.parallelRoleGenerator) {
        console.log('使用并行角色生成器...');
        try {
          const result = await this.parallelRoleGenerator.generateRolesWithStats(topic, 3);
          roles = result.roles;
          console.log('并行生成统计:', result.stats);
          this.emit('role-generation-stats', result.stats);
        } catch (error) {
          console.warn('并行生成失败，回退到传统生成:', error);
          roles = await this.roleGenerator!.generateRoles(topic, 3);
        }
      } else {
        console.log('使用传统角色生成器...');
        roles = await this.roleGenerator!.generateRoles(topic, 3);
      }
      
      if (!this.validateRoles(roles)) {
        throw new Error('生成的角色不足以支持有效的辩论');
      }

      this.emit('roles-generated', { roles });

      // 开始辩论
      this.emit('debate-starting');
      this.currentSession = await this.debateEngine.startDebate(topic, roles, config);

      return this.currentSession;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  // 只生成角色，不开始辩论
  async generateRolesOnly(topic: string, config: DebateConfig): Promise<{roles: any[], stats?: any}> {
    if (!this.aiModel || !this.roleGenerator) {
      throw new Error('AI 模型尚未初始化，请先配置 AI 模型');
    }

    if (!topic.trim()) {
      throw new Error('辩论议题不能为空');
    }

    try {
      this.emit('generating-roles');
      let roles;
      let stats;
      
      if (this.useParallelGeneration && this.parallelRoleGenerator) {
        console.log('使用并行角色生成器...');
        try {
          const result = await this.parallelRoleGenerator.generateRolesWithStats(topic, 3);
          roles = result.roles;
          stats = result.stats;
          console.log('并行生成统计:', result.stats);
          this.emit('role-generation-stats', result.stats);
        } catch (error) {
          console.warn('并行生成失败，回退到传统生成:', error);
          roles = await this.roleGenerator!.generateRoles(topic, 3);
        }
      } else {
        console.log('使用传统角色生成器...');
        roles = await this.roleGenerator!.generateRoles(topic, 3);
      }
      
      if (!this.validateRoles(roles)) {
        throw new Error('生成的角色不足以支持有效的辩论');
      }

      this.emit('roles-generated', { roles });
      return { roles, stats };
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  // 使用已生成的角色开始辩论
  async startDebateWithRoles(topic: string, roles: any[], config: DebateConfig, parentSession?: DebateSession): Promise<DebateSession> {
    if (!this.aiModel || !this.debateEngine) {
      throw new Error('AI 模型尚未初始化，请先配置 AI 模型');
    }

    if (!topic.trim()) {
      throw new Error('辩论议题不能为空');
    }

    if (!roles || roles.length < 2) {
      throw new Error('需要至少 2 个角色才能开始辩论');
    }

    try {
      this.emit('debate-starting');
      
      // 如果是连续讨论，传递前一轮的上下文
      if (parentSession) {
        this.currentSession = await this.debateEngine.startDebate(topic, roles, config, parentSession);
      } else {
        this.currentSession = await this.debateEngine.startDebate(topic, roles, config);
      }
      
      return this.currentSession;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  getCurrentDebate(): DebateSession | null {
    return this.currentSession;
  }

  getStatus(): {
    aiInitialized: boolean;
    currentDebate: DebateSession | null;
    debateStatus: string;
  } {
    return {
      aiInitialized: this.aiModel !== null,
      currentDebate: this.currentSession,
      debateStatus: this.debateEngine?.getStatus() || 'idle'
    };
  }

  async testAIConnection(config: AIModelConfig): Promise<boolean> {
    try {
      const testModel = AIModelFactory.create(config);
      return await testModel.validateConnection();
    } catch (error) {
      return false;
    }
  }

  // 获取预设的AI配置模板
  getAIConfigTemplates(): { [key: string]: Partial<AIModelConfig> } {
    return {
      'ollama-llama2': {
        type: 'ollama',
        baseUrl: 'http://localhost:11434',
        model: 'llama2',
        temperature: 0.7,
        maxTokens: 1000
      },
      'ollama-mistral': {
        type: 'ollama',
        baseUrl: 'http://localhost:11434',
        model: 'mistral',
        temperature: 0.7,
        maxTokens: 1000
      },
      'openai-gpt-3.5': {
        type: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 1000
      },
      'openai-gpt-4': {
        type: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1000
      }
    };
  }

  // 获取默认辩论配置
  getDefaultDebateConfig(): DebateConfig {
    return {
      maxRounds: 5,
      convergenceThreshold: 0.8,
      enableRealTimeAnalysis: true,
      aiModel: {
        type: 'ollama',
        baseUrl: 'http://localhost:11434',
        model: 'llama2',
        temperature: 0.7,
        maxTokens: 1000
      }
    };
  }

  // 重置辩论管理器
  reset(): void {
    this.currentSession = null;
    this.emit('reset');
  }

  // 停止当前辩论
  stopDebate(): void {
    // 停止辩论引擎
    if (this.debateEngine) {
      this.debateEngine.stopDebate();
    }
    
    // 更新当前会话状态
    if (this.currentSession && this.currentSession.status === 'in-progress') {
      this.currentSession.status = 'completed';
      this.currentSession.endTime = Date.now();
      this.emit('debate-stopped', this.currentSession);
    }
  }

  // 角色验证方法（从RoleGenerator移过来）
  private validateRoles(roles: any[]): boolean {
    if (roles.length < 2) return false;
    
    // 检查是否有不同的立场
    const stances = roles.map(role => role.stance.toLowerCase());
    const uniqueStances = new Set(stances);
    
    return uniqueStances.size >= 2;
  }

  // 设置角色生成模式
  setRoleGenerationMode(useParallel: boolean): void {
    this.useParallelGeneration = useParallel;
    console.log(`角色生成模式设置为: ${useParallel ? '并行生成' : '传统生成'}`);
  }

  // 生成后续讨论问题建议
  async generateFollowUpQuestions(session: DebateSession): Promise<string[]> {
    if (!this.aiModel) {
      throw new Error('AI 模型尚未初始化');
    }

    try {
      const context = session.statements
        .map(stmt => `${stmt.roleName}: ${stmt.content}`)
        .join('\n\n');

      const prompt = `基于以下讨论内容，生成3-5个有价值的后续深入讨论问题：

讨论议题：${session.topic}
讨论共识：${session.consensus || '尚未达成共识'}

完整讨论记录：
${context}

请生成能够推动讨论深入的后续问题，要求：
1. 基于已有讨论的薄弱环节或未充分探讨的方面
2. 能够从新的角度或更深层次分析问题
3. 具有实际讨论价值和可操作性
4. 每个问题都应该能够引导出新的见解

请以JSON数组格式返回，例如：
["问题1", "问题2", "问题3"]`;

      const response = await this.aiModel.generateResponse(prompt);
      
      try {
        // 尝试解析JSON响应
        const questions = JSON.parse(response.content.trim());
        if (Array.isArray(questions) && questions.length > 0) {
          return questions.slice(0, 5); // 最多返回5个问题
        }
      } catch (parseError) {
        // 如果JSON解析失败，尝试从文本中提取问题
        const lines = response.content.split('\n');
        const questions = lines
          .filter(line => line.includes('？') || line.includes('?'))
          .map(line => line.replace(/^\d+[\.\、]\s*/, '').replace(/^["\*\-\•]\s*/, '').trim())
          .filter(q => q.length > 10);
        
        return questions.slice(0, 5);
      }
      
      return [];
    } catch (error) {
      console.error('生成后续问题失败:', error);
      return [];
    }
  }

  // 基于共识生成新的深入讨论议题
  async generateContinuationTopic(session: DebateSession, userQuestion?: string): Promise<string> {
    if (!this.aiModel) {
      throw new Error('AI 模型尚未初始化');
    }

    try {
      const consensus = session.consensus || '';
      const context = session.statements
        .slice(-10) // 使用最近的10条发言
        .map(stmt => `${stmt.roleName}: ${stmt.content}`)
        .join('\n\n');

      let prompt = `基于以下讨论的共识内容，生成一个新的深入讨论议题：

原议题：${session.topic}
讨论共识：${consensus}

相关讨论背景：
${context}`;

      if (userQuestion) {
        prompt += `\n用户希望深入探讨的方向：${userQuestion}`;
      }

      prompt += `

请生成一个新的讨论议题，要求：
1. 基于已有共识，但从新的角度或更深层次进行探讨
2. 能够推动讨论向更具体、更实用的方向发展
3. 议题应该明确、具体，便于专家们进行针对性讨论
4. 保持与原议题的相关性，但要有新的深度

请直接返回新的议题，不要添加其他说明。`;

      const response = await this.aiModel.generateResponse(prompt);
      return response.content.trim();
    } catch (error) {
      console.error('生成连续讨论议题失败:', error);
      throw new Error('无法生成新的讨论议题');
    }
  }

  // 历史记录管理方法
  getHistory() {
    return HistoryManager.getHistory();
  }

  getFilteredHistory(options?: any) {
    return HistoryManager.getFilteredHistory(options);
  }

  getHistoryStats() {
    return HistoryManager.getStats();
  }

  deleteHistoryItem(id: string) {
    return HistoryManager.deleteHistoryItem(id);
  }

  clearAllHistory() {
    return HistoryManager.clearAllHistory();
  }

  exportHistory() {
    return HistoryManager.exportHistory();
  }

  importHistory(jsonData: string) {
    return HistoryManager.importHistory(jsonData);
  }

  getSessionChain(sessionId: string) {
    return HistoryManager.getSessionChain(sessionId);
  }

  getRelatedSessions(topic: string, limit?: number) {
    return HistoryManager.getRelatedSessions(topic, limit);
  }

  // 扫描并导入文件系统历史记录
  scanAndImportFileHistory() {
    return HistoryManager.scanAndImportFileHistory();
  }

  // 重新生成单个角色
  async regenerateSingleRole(topic: string, roleIndex: number, existingRoles: any[]): Promise<any> {
    if (!this.aiModel) {
      throw new Error('AI 模型尚未初始化');
    }

    try {
      // 获取其他角色的信息，避免重复
      const otherRoles = existingRoles.filter((_, index) => index !== roleIndex);
      
      // 构建重新生成提示
      const regeneratePrompt = `
基于以下讨论议题和其他已生成的角色，请重新生成一个不同的角色：
讨论议题：${topic}
已生成的其他角色：
${otherRoles.map(r => `- ${r.name}: ${r.background}，立场：${r.stance}，性格：${r.personality}，专业：${r.expertise.join('、')}`).join('\n')}
请生成一个与现有角色不同但能够形成有效讨论的新角色。
返回JSON格式的角色数据，包含name, background, stance, personality, expertise, avatar字段。
确保角色背景详实，立场明确，性格鲜明，专业领域具体。
`;

      const response = await this.aiModel.generateResponse(regeneratePrompt);
      console.log('AI响应内容:', response.content);
      
      // 尝试解析JSON响应
      let newRole;
      try {
        // 尝试从响应中提取JSON
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          newRole = JSON.parse(jsonMatch[0]);
          console.log('解析的角色数据:', newRole);
        } else {
          throw new Error('No JSON found in response');
        }
        
        // 确保角色包含必要字段
        if (!newRole.name || !newRole.background || !newRole.stance || !newRole.personality || !newRole.expertise) {
          throw new Error('生成的角色数据不完整');
        }
        
        // 确保expertise是数组
        if (!Array.isArray(newRole.expertise)) {
          newRole.expertise = [newRole.expertise];
        }
        
        // 添加avatar字段（如果不存在）
        if (!newRole.avatar) {
          newRole.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(newRole.name)}&background=random`;
        }
        
        return newRole;
      } catch (parseError) {
        console.error('解析角色数据失败:', parseError);
        console.log('尝试手动提取信息...');
        
        // 如果解析失败，尝试手动提取信息
        const extractField = (text: string, fieldName: string) => {
          const patterns = [
            new RegExp(`"${fieldName}"\\s*:\\s*"([^"]+)"`, 'i'),
            new RegExp(`${fieldName}\\s*[:：]\\s*([^\\n,]+)`, 'i'),
            new RegExp(`${fieldName}\\s*[:：]\\s*([^\\n]+)`, 'i')
          ];
          
          for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
              return match[1].trim();
            }
          }
          return null;
        };
        
        // 手动提取角色信息
        newRole = {
          name: extractField(response.content, 'name') || extractField(response.content, '角色名') || '新角色',
          background: extractField(response.content, 'background') || extractField(response.content, '背景') || '待补充',
          stance: extractField(response.content, 'stance') || extractField(response.content, '立场') || '中立',
          personality: extractField(response.content, 'personality') || extractField(response.content, '性格') || '理性',
          expertise: extractField(response.content, 'expertise') ? extractField(response.content, 'expertise')!.split(',').map((s: string) => s.trim()) : ['综合'],
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(extractField(response.content, 'name') || '新角色')}&background=random`
        };
        
        console.log('手动提取的角色数据:', newRole);
        return newRole;
      }
    } catch (error) {
      console.error('重新生成角色失败:', error);
      throw error;
    }
  }
}