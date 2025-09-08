import { DebateRole, AIModelConfig } from '../types';
import { BaseAIModel } from '../ai/AIModel';

export class RoleGenerator {
  private aiModel: BaseAIModel;
  private config: AIModelConfig;

  constructor(aiModel: BaseAIModel, config: AIModelConfig) {
    this.aiModel = aiModel;
    this.config = config;
  }

  async generateRoles(topic: string, roleCount: number = 3): Promise<DebateRole[]> {
    const roleGenerationPrompt = this.buildRoleGenerationPrompt(topic, roleCount);
    
    try {
      // 使用配置中的超时设置，默认30秒
      const timeoutMs = (this.config.timeoutSeconds || 30) * 1000;
      const response = await this.aiModel.generateResponse(
        roleGenerationPrompt,
        this.getRoleGenerationSystemPrompt(),
        timeoutMs // 使用配置的超时
      );

      const roles = this.parseRolesFromResponse(response.content);
      return roles;
    } catch (error) {
      throw new Error(`Failed to generate roles: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private buildRoleGenerationPrompt(topic: string, roleCount: number): string {
    return `请为辩论议题"${topic}"生成${roleCount}个不同立场的AI角色。

要求：
1. 每个角色都应该有明确且不同的立场
2. 角色背景要多样化（如：学者、企业家、政策制定者、普通民众等）
3. 确保角色之间存在观点分歧，能够形成有意义的辩论
4. 每个角色都要有专业知识领域

请按照以下JSON格式返回：
{
  "roles": [
    {
      "name": "角色名称",
      "background": "角色背景描述",
      "stance": "对议题的立场",
      "personality": "性格特点",
      "expertise": ["专业领域1", "专业领域2"]
    }
  ]
}`;
  }

  private getRoleGenerationSystemPrompt(): string {
    return `你是一个专业的辩论角色设计师。你的任务是为给定的辩论议题创建多个具有不同立场和背景的AI角色。

设计原则：
1. 角色多样性：确保角色来自不同的社会背景、职业和文化背景
2. 立场对立：角色之间应该有明确的观点分歧
3. 专业性：每个角色都应该有相关的专业知识
4. 真实性：角色应该基于现实中可能存在的人物类型
5. 平衡性：避免极端立场，保持理性辩论的可能性

请确保输出严格按照要求的JSON格式，不要包含任何额外的文本。`;
  }

  private parseRolesFromResponse(response: string): DebateRole[] {
    try {
      // 提取JSON部分
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const roles = parsed.roles || [];

      return roles.map((role: any, index: number) => ({
        id: `role_${index + 1}`,
        name: role.name || `角色${index + 1}`,
        background: role.background || '',
        stance: role.stance || '',
        personality: role.personality || '',
        expertise: Array.isArray(role.expertise) ? role.expertise : []
      }));
    } catch (error) {
      // 如果解析失败，返回默认角色
      console.warn('Failed to parse roles, using fallback roles:', error);
      return this.getFallbackRoles();
    }
  }

  private getFallbackRoles(): DebateRole[] {
    return [
      {
        id: 'role_1',
        name: '支持者',
        background: '倡导者和改革推动者',
        stance: '强烈支持这个议题',
        personality: '积极、乐观、创新思维',
        expertise: ['政策分析', '社会改革']
      },
      {
        id: 'role_2',
        name: '反对者',
        background: '传统主义者和风险评估专家',
        stance: '对这个议题持谨慎反对态度',
        personality: '谨慎、理性、重视稳定',
        expertise: ['风险管理', '传统价值']
      },
      {
        id: 'role_3',
        name: '中立者',
        background: '研究员和平衡观点倡导者',
        stance: '寻求平衡和折中方案',
        personality: '客观、分析性、寻求共识',
        expertise: ['研究分析', '调解协商']
      }
    ];
  }

  // 验证角色是否合适进行辩论
  validateRoles(roles: DebateRole[]): boolean {
    if (roles.length < 2) return false;
    
    // 检查是否有不同的立场
    const stances = roles.map(role => role.stance.toLowerCase());
    const uniqueStances = new Set(stances);
    
    return uniqueStances.size >= 2;
  }
}