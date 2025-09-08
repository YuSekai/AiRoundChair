import { AIModelConfig } from '../types';
export declare class AIConnectionFixer {
    /**
     * 自动诊断并尝试修复AI连接问题
     */
    static autoFixConnection(config: AIModelConfig): Promise<{
        success: boolean;
        fixedConfig?: AIModelConfig;
        issues: string[];
        fixes: string[];
        suggestions: string[];
    }>;
    /**
     * 修复Ollama连接问题
     */
    private static fixOllamaConnection;
    /**
     * 修复OpenAI连接问题
     */
    private static fixOpenAIConnection;
    /**
     * 智能匹配最佳模型名称
     */
    private static findBestModelMatch;
    /**
     * 常见模型名称修正映射
     */
    private static getCommonModelNameFixes;
    /**
     * 生成修复建议
     */
    static generateFixSuggestions(config: AIModelConfig): string[];
    /**
     * 快速连接测试
     */
    static quickConnectionTest(config: AIModelConfig): Promise<{
        success: boolean;
        responseTime: number;
        error?: string;
    }>;
}
//# sourceMappingURL=AIConnectionFixer.d.ts.map