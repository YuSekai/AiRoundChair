import { DebateSession } from '../types';
export declare class FileExporter {
    static export(debate: DebateSession, filePath: string, format: 'json' | 'markdown'): Promise<void>;
    private static exportToJSON;
    private static exportToMarkdown;
    private static generateMarkdown;
    private static getStatusText;
    private static groupStatementsByRound;
    private static calculateSpeakingStats;
    static generateSummary(debate: DebateSession): string;
    static validateFilePath(filePath: string, format: 'json' | 'markdown'): boolean;
}
//# sourceMappingURL=FileExporter.d.ts.map