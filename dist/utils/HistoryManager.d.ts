import { DebateSession, DebateHistory, HistoryStats, HistoryFilterOptions } from '../types';
export declare class HistoryManager {
    private static readonly STORAGE_KEY;
    private static readonly STATS_KEY;
    private static readonly MAX_HISTORY_ITEMS;
    private static readonly HISTORY_DIR;
    static saveDebateSession(session: DebateSession): void;
    static getFilteredHistory(options?: HistoryFilterOptions): DebateHistory[];
    static getHistoryItem(id: string): DebateHistory | null;
    static deleteHistoryItem(id: string): boolean;
    static clearAllHistory(): boolean;
    static getStats(): HistoryStats;
    private static calculateStats;
    private static updateStats;
    static getSessionChain(sessionId: string): DebateHistory[];
    static exportHistory(): string;
    static importHistory(jsonData: string): boolean;
    static getRelatedSessions(topic: string, limit?: number): DebateHistory[];
    private static saveToFileSystem;
    private static loadFromFileSystem;
    static getHistory(): DebateHistory[];
    private static removeDuplicates;
    static scanAndImportFileHistory(): {
        success: number;
        failed: number;
    };
}
//# sourceMappingURL=HistoryManager.d.ts.map