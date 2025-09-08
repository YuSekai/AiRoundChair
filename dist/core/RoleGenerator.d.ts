import { DebateRole, AIModelConfig } from '../types';
import { BaseAIModel } from '../ai/AIModel';
export declare class RoleGenerator {
    private aiModel;
    private config;
    constructor(aiModel: BaseAIModel, config: AIModelConfig);
    generateRoles(topic: string, roleCount?: number): Promise<DebateRole[]>;
    private buildRoleGenerationPrompt;
    private getRoleGenerationSystemPrompt;
    private parseRolesFromResponse;
    private getFallbackRoles;
    validateRoles(roles: DebateRole[]): boolean;
}
//# sourceMappingURL=RoleGenerator.d.ts.map