import { DebateRole, AIModelConfig } from '../types';
export declare class ParallelRoleGenerator {
    private baseConfig;
    constructor(baseConfig: AIModelConfig);
    private analyzeTopicForRoles;
    private getDefaultTopicAnalysis;
    generateRoles(topic: string, roleCount?: number): Promise<DebateRole[]>;
    private generateSingleRole;
    private generateSingleRoleWithDelay;
    private generateRolesSequentially;
    private buildSingleRolePrompt;
    private getSingleRoleSystemPrompt;
    private parseSingleRoleFromResponse;
    private getDefaultRole;
    private getFallbackRoles;
    private validateRoles;
    testConnection(): Promise<boolean>;
    generateRolesWithStats(topic: string, roleCount?: number): Promise<{
        roles: DebateRole[];
        stats: {
            totalTime: number;
            successCount: number;
            failureCount: number;
            averageTime: number;
        };
    }>;
}
//# sourceMappingURL=ParallelRoleGenerator.d.ts.map