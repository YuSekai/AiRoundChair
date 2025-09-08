export interface AIModelConfig {
    type: 'ollama' | 'openai';
    baseUrl: string;
    apiKey?: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
    timeoutSeconds?: number;
}
export interface DebateRole {
    id: string;
    name: string;
    background: string;
    stance: string;
    personality: string;
    expertise: string[];
}
export interface Statement {
    id: string;
    roleId: string;
    roleName: string;
    content: string;
    timestamp: number;
    round: number;
    type: 'opening' | 'argument' | 'rebuttal' | 'consensus' | 'final';
}
export interface DebateSession {
    id: string;
    topic: string;
    roles: DebateRole[];
    statements: Statement[];
    currentRound: number;
    status: 'preparing' | 'in-progress' | 'converging' | 'completed' | 'error';
    consensus?: string;
    startTime: number;
    endTime?: number;
    config: DebateConfig;
    sessionId?: string;
    parentSessionId?: string;
    continuationCount?: number;
    previousConsensus?: string;
}
export interface DebateConfig {
    maxRounds: number;
    convergenceThreshold: number;
    aiModel: AIModelConfig;
    enableRealTimeAnalysis: boolean;
}
export interface AIResponse {
    content: string;
    tokenUsage?: {
        prompt: number;
        completion: number;
        total: number;
    };
}
export interface DebateHistory {
    id: string;
    sessionId: string;
    topic: string;
    consensus?: string;
    startTime: number;
    endTime: number;
    duration: number;
    roleCount: number;
    statementCount: number;
    status: 'completed' | 'stopped' | 'error';
    isContinuation: boolean;
    parentSessionId?: string;
    continuationCount?: number;
    createdAt: number;
    updatedAt: number;
}
export interface HistoryStats {
    totalSessions: number;
    totalDuration: number;
    averageDuration: number;
    totalStatements: number;
    completedSessions: number;
    continuationChains: number;
}
export interface HistoryFilterOptions {
    search?: string;
    status?: 'all' | 'completed' | 'stopped' | 'error';
    dateRange?: {
        start: number;
        end: number;
    };
    isContinuation?: boolean;
    sortBy?: 'createdAt' | 'duration' | 'statementCount' | 'topic';
    sortOrder?: 'asc' | 'desc';
}
//# sourceMappingURL=index.d.ts.map