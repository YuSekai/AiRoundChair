import { DebateSession, DebateConfig, AIModelConfig } from '../types';
import { EventEmitter } from 'events';
export declare class DebateManager extends EventEmitter {
    private aiModel;
    private roleGenerator;
    private parallelRoleGenerator;
    private debateEngine;
    private currentSession;
    private useParallelGeneration;
    constructor();
    initializeAI(config: AIModelConfig): Promise<void>;
    startDebate(topic: string, config: DebateConfig): Promise<DebateSession>;
    generateRolesOnly(topic: string, config: DebateConfig): Promise<{
        roles: any[];
        stats?: any;
    }>;
    startDebateWithRoles(topic: string, roles: any[], config: DebateConfig, parentSession?: DebateSession): Promise<DebateSession>;
    getCurrentDebate(): DebateSession | null;
    getStatus(): {
        aiInitialized: boolean;
        currentDebate: DebateSession | null;
        debateStatus: string;
    };
    testAIConnection(config: AIModelConfig): Promise<boolean>;
    getAIConfigTemplates(): {
        [key: string]: Partial<AIModelConfig>;
    };
    getDefaultDebateConfig(): DebateConfig;
    reset(): void;
    stopDebate(): void;
    private validateRoles;
    setRoleGenerationMode(useParallel: boolean): void;
    generateFollowUpQuestions(session: DebateSession): Promise<string[]>;
    generateContinuationTopic(session: DebateSession, userQuestion?: string): Promise<string>;
    getHistory(): import("../types").DebateHistory[];
    getFilteredHistory(options?: any): import("../types").DebateHistory[];
    getHistoryStats(): import("../types").HistoryStats;
    deleteHistoryItem(id: string): boolean;
    clearAllHistory(): boolean;
    exportHistory(): string;
    importHistory(jsonData: string): boolean;
    getSessionChain(sessionId: string): import("../types").DebateHistory[];
    getRelatedSessions(topic: string, limit?: number): import("../types").DebateHistory[];
    scanAndImportFileHistory(): {
        success: number;
        failed: number;
    };
    regenerateSingleRole(topic: string, roleIndex: number, existingRoles: any[]): Promise<any>;
}
//# sourceMappingURL=DebateManager.d.ts.map