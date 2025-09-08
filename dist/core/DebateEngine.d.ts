import { DebateRole, DebateSession, DebateConfig } from '../types';
import { BaseAIModel } from '../ai/AIModel';
import { EventEmitter } from 'events';
export declare class DebateEngine extends EventEmitter {
    private aiModel;
    private session;
    private isStopped;
    constructor(aiModel: BaseAIModel);
    startDebate(topic: string, roles: DebateRole[], config: DebateConfig, parentSession?: DebateSession): Promise<DebateSession>;
    private conductOpeningStatements;
    private conductDebateRound;
    private conductConsensusRound;
    private generateStatement;
    private buildPromptForRole;
    private buildSystemPromptForRole;
    private buildContextForRole;
    private shouldContinueDebate;
    private checkForConvergence;
    private generateFinalConsensus;
    private addStatement;
    private generateId;
    private generateSessionId;
    private delay;
    getCurrentSession(): DebateSession | null;
    getStatus(): string;
    stopDebate(): void;
    isDebateStopped(): boolean;
}
//# sourceMappingURL=DebateEngine.d.ts.map