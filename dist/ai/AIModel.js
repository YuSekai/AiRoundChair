"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIModelFactory = exports.OpenAIModel = exports.OllamaModel = exports.BaseAIModel = void 0;
const axios_1 = __importDefault(require("axios"));
class BaseAIModel {
    constructor(config) {
        this.config = config;
        // 使用配置中的超时设置，默认30秒
        const timeoutMs = (config.timeoutSeconds || 30) * 1000;
        this.client = axios_1.default.create({
            baseURL: config.baseUrl,
            timeout: timeoutMs,
            headers: {
                'Content-Type': 'application/json',
                ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
            }
        });
    }
    // 为不同的任务类型设置不同的超时时间
    createClientWithTimeout(timeoutMs) {
        return axios_1.default.create({
            baseURL: this.config.baseUrl,
            timeout: timeoutMs,
            headers: {
                'Content-Type': 'application/json',
                ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
            }
        });
    }
}
exports.BaseAIModel = BaseAIModel;
class OllamaModel extends BaseAIModel {
    async generateResponse(prompt, systemPrompt, timeoutMs) {
        try {
            // 使用传入的超时或配置中的超时，默认30秒
            const timeout = timeoutMs || (this.config.timeoutSeconds || 30) * 1000;
            const client = this.createClientWithTimeout(timeout);
            const response = await client.post('/api/generate', {
                model: this.config.model,
                prompt: prompt,
                system: systemPrompt,
                stream: false,
                options: {
                    temperature: this.config.temperature || 0.7,
                    num_predict: this.config.maxTokens || 1000
                }
            });
            return {
                content: response.data.response,
                tokenUsage: {
                    prompt: response.data.prompt_eval_count || 0,
                    completion: response.data.eval_count || 0,
                    total: (response.data.prompt_eval_count || 0) + (response.data.eval_count || 0)
                }
            };
        }
        catch (error) {
            throw new Error(`Ollama API error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async validateConnection() {
        try {
            console.log(`正在验证 Ollama 连接: ${this.config.baseUrl}`);
            // 使用配置中的超时进行连接验证，默认30秒
            const timeoutMs = (this.config.timeoutSeconds || 30) * 1000;
            const client = this.createClientWithTimeout(timeoutMs);
            const response = await client.get('/api/tags');
            const models = response.data.models || [];
            console.log(`Ollama 可用模型:`, models.map((m) => m.name));
            const hasModel = models.some((model) => model.name === this.config.model);
            if (!hasModel) {
                console.warn(`模型 ${this.config.model} 不在可用模型列表中`);
            }
            return hasModel;
        }
        catch (error) {
            console.error('Ollama 连接验证失败:', error);
            return false;
        }
    }
}
exports.OllamaModel = OllamaModel;
class OpenAIModel extends BaseAIModel {
    async generateResponse(prompt, systemPrompt, timeoutMs) {
        try {
            // 使用传入的超时或配置中的超时，默认30秒
            const timeout = timeoutMs || (this.config.timeoutSeconds || 30) * 1000;
            const client = this.createClientWithTimeout(timeout);
            const messages = [];
            if (systemPrompt) {
                messages.push({ role: 'system', content: systemPrompt });
            }
            messages.push({ role: 'user', content: prompt });
            const response = await client.post('/chat/completions', {
                model: this.config.model,
                messages: messages,
                temperature: this.config.temperature || 0.7,
                max_tokens: this.config.maxTokens || 1000
            });
            const choice = response.data.choices[0];
            const usage = response.data.usage;
            return {
                content: choice.message.content,
                tokenUsage: {
                    prompt: usage?.prompt_tokens || 0,
                    completion: usage?.completion_tokens || 0,
                    total: usage?.total_tokens || 0
                }
            };
        }
        catch (error) {
            throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async validateConnection() {
        try {
            console.log(`正在验证 OpenAI 连接: ${this.config.baseUrl}`);
            // 使用配置中的超时进行连接验证，默认30秒
            const timeoutMs = (this.config.timeoutSeconds || 30) * 1000;
            const client = this.createClientWithTimeout(timeoutMs);
            const response = await client.get('/models');
            const models = response.data.data || [];
            console.log(`OpenAI 可用模型数量:`, models.length);
            const hasModel = models.some((model) => model.id === this.config.model);
            if (!hasModel) {
                console.warn(`模型 ${this.config.model} 不在可用模型列表中`);
            }
            return hasModel;
        }
        catch (error) {
            console.error('OpenAI 连接验证失败:', error);
            return false;
        }
    }
}
exports.OpenAIModel = OpenAIModel;
class AIModelFactory {
    static create(config) {
        switch (config.type) {
            case 'ollama':
                return new OllamaModel(config);
            case 'openai':
                return new OpenAIModel(config);
            default:
                throw new Error(`Unsupported AI model type: ${config.type}`);
        }
    }
}
exports.AIModelFactory = AIModelFactory;
//# sourceMappingURL=AIModel.js.map