import { AIModelConfig } from '../types';
export declare class AIDiagnosticTool {
    static diagnoseConnection(config: AIModelConfig): Promise<{
        success: boolean;
        issues: string[];
        suggestions: string[];
    }>;
    private static diagnoseOllama;
    private static diagnoseOpenAI;
    static generateDiagnosticReport(diagnosis: {
        success: boolean;
        issues: string[];
        suggestions: string[];
    }): string;
}
//# sourceMappingURL=AIDiagnosticTool.d.ts.map