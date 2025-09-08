import { AxiosInstance } from 'axios';
import { AIModelConfig, AIResponse } from '../types';
export declare abstract class BaseAIModel {
    protected config: AIModelConfig;
    protected client: AxiosInstance;
    constructor(config: AIModelConfig);
    protected createClientWithTimeout(timeoutMs: number): AxiosInstance;
    abstract generateResponse(prompt: string, systemPrompt?: string, timeoutMs?: number): Promise<AIResponse>;
    abstract validateConnection(): Promise<boolean>;
}
export declare class OllamaModel extends BaseAIModel {
    generateResponse(prompt: string, systemPrompt?: string, timeoutMs?: number): Promise<AIResponse>;
    validateConnection(): Promise<boolean>;
}
export declare class OpenAIModel extends BaseAIModel {
    generateResponse(prompt: string, systemPrompt?: string, timeoutMs?: number): Promise<AIResponse>;
    validateConnection(): Promise<boolean>;
}
export declare class AIModelFactory {
    static create(config: AIModelConfig): BaseAIModel;
}
//# sourceMappingURL=AIModel.d.ts.map