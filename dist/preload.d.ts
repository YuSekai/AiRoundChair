interface ElectronAPI {
    startDebate: (topic: string, config: any) => Promise<any>;
    startDebateWithRoles: (topic: string, roles: any[], config: any) => Promise<any>;
    generateRoles: (topic: string, config: any) => Promise<any>;
    getDebateStatus: () => Promise<any>;
    testConnection: (aiConfig: any) => Promise<any>;
    diagnoseAI: (aiConfig: any) => Promise<any>;
    autoFixConnection: (aiConfig: any) => Promise<any>;
    quickConnectionTest: (aiConfig: any) => Promise<any>;
    setRoleGenerationMode: (useParallel: boolean) => Promise<any>;
    stopDebate: () => Promise<any>;
    exportDebate: (format: 'json' | 'markdown') => Promise<any>;
    onNewDebate: (callback: () => void) => void;
    onExportDebate: (callback: (format: string) => void) => void;
    onYAMLConfigLoaded: (callback: (config: any) => void) => void;
    onRoleThinking: (callback: (data: any) => void) => void;
    onRoleStatementReady: (callback: (statement: any) => void) => void;
    onRoleError: (callback: (data: any) => void) => void;
    onDebateCompleted: (callback: (session: any) => void) => void;
    onDebateStatusUpdate: (callback: (data: any) => void) => void;
    getHistory: (options?: any) => Promise<any>;
    getHistoryStats: () => Promise<any>;
    deleteHistoryItem: (id: string) => Promise<any>;
    clearAllHistory: () => Promise<any>;
    exportHistory: () => Promise<any>;
    importHistory: () => Promise<any>;
    getSessionChain: (sessionId: string) => Promise<any>;
    getRelatedSessions: (topic: string, limit?: number) => Promise<any>;
    scanAndImportFileHistory: () => Promise<any>;
    importYAMLConfig: () => Promise<any>;
    regenerateSingleRole: (topic: string, roleIndex: number, existingRoles: any[], config: any) => Promise<any>;
    onShowHistory: (callback: () => void) => void;
    onExportHistory: (callback: () => void) => void;
    onImportHistory: (callback: () => void) => void;
    onClearHistory: (callback: () => void) => void;
}
declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}
export {};
//# sourceMappingURL=preload.d.ts.map