"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIConnectionFixer = void 0;
const AIDiagnosticTool_1 = require("./AIDiagnosticTool");
const AIModel_1 = require("../ai/AIModel");
class AIConnectionFixer {
    /**
     * 自动诊断并尝试修复AI连接问题
     */
    static async autoFixConnection(config) {
        const issues = [];
        const fixes = [];
        const suggestions = [];
        let fixedConfig = { ...config };
        let success = false;
        console.log('🔧 开始自动诊断和修复AI连接问题...');
        try {
            // 1. 基础诊断
            const diagnosis = await AIDiagnosticTool_1.AIDiagnosticTool.diagnoseConnection(config);
            issues.push(...diagnosis.issues);
            suggestions.push(...diagnosis.suggestions);
            if (diagnosis.success) {
                return { success: true, fixedConfig, issues, fixes, suggestions };
            }
            // 2. 尝试自动修复
            if (config.type === 'ollama') {
                const ollamaFix = await this.fixOllamaConnection(fixedConfig);
                if (ollamaFix.success) {
                    fixedConfig = ollamaFix.config;
                    fixes.push(...ollamaFix.fixes);
                    success = true;
                }
                else {
                    issues.push(...ollamaFix.issues);
                }
            }
            else if (config.type === 'openai') {
                const openAIFix = await this.fixOpenAIConnection(fixedConfig);
                if (openAIFix.success) {
                    fixedConfig = openAIFix.config;
                    fixes.push(...openAIFix.fixes);
                    success = true;
                }
                else {
                    issues.push(...openAIFix.issues);
                }
            }
            // 3. 最终验证
            if (success) {
                const finalTest = await AIDiagnosticTool_1.AIDiagnosticTool.diagnoseConnection(fixedConfig);
                success = finalTest.success;
                if (!success) {
                    issues.push('自动修复后连接仍然失败');
                }
            }
        }
        catch (error) {
            issues.push(`诊断过程出错: ${error instanceof Error ? error.message : String(error)}`);
        }
        return { success, fixedConfig, issues, fixes, suggestions };
    }
    /**
     * 修复Ollama连接问题
     */
    static async fixOllamaConnection(config) {
        const issues = [];
        const fixes = [];
        let fixedConfig = { ...config };
        try {
            // 检查可用模型并自动匹配
            const aiModel = AIModel_1.AIModelFactory.create(config);
            try {
                const response = await aiModel.validateConnection();
                if (response) {
                    return { success: true, config: fixedConfig, issues, fixes };
                }
            }
            catch (error) {
                // 继续尝试修复
            }
            // 尝试获取可用模型列表
            try {
                const client = aiModel.client;
                const response = await client.get('/api/tags');
                const models = response.data.models || [];
                if (models.length === 0) {
                    issues.push('Ollama没有可用模型');
                    return { success: false, config: fixedConfig, issues, fixes };
                }
                // 智能匹配模型名称
                const modelName = this.findBestModelMatch(config.model, models);
                if (modelName !== config.model) {
                    fixedConfig.model = modelName;
                    fixes.push(`自动修正模型名称: ${config.model} → ${modelName}`);
                }
                // 再次验证
                const fixedModel = AIModel_1.AIModelFactory.create(fixedConfig);
                const isValid = await fixedModel.validateConnection();
                return {
                    success: isValid,
                    config: fixedConfig,
                    issues: isValid ? [] : ['修复后仍无法连接'],
                    fixes
                };
            }
            catch (error) {
                issues.push('无法获取Ollama模型列表，请检查服务是否启动');
                return { success: false, config: fixedConfig, issues, fixes };
            }
        }
        catch (error) {
            issues.push(`Ollama修复失败: ${error instanceof Error ? error.message : String(error)}`);
            return { success: false, config: fixedConfig, issues, fixes };
        }
    }
    /**
     * 修复OpenAI连接问题
     */
    static async fixOpenAIConnection(config) {
        const issues = [];
        const fixes = [];
        let fixedConfig = { ...config };
        try {
            // 1. 检查常见的模型名称错误
            const commonModelFixes = this.getCommonModelNameFixes();
            const modelFix = commonModelFixes[config.model];
            if (modelFix) {
                fixedConfig.model = modelFix;
                fixes.push(`修正模型名称: ${config.model} → ${modelFix}`);
            }
            // 2. 检查API地址
            if (!config.baseUrl.startsWith('https://api.openai.com') &&
                !config.baseUrl.includes('localhost') &&
                !config.baseUrl.includes('127.0.0.1')) {
                // 可能是第三方API，尝试标准OpenAI格式
                const possibleUrls = [
                    config.baseUrl,
                    config.baseUrl + '/v1',
                    config.baseUrl.replace('/v1', '') + '/v1'
                ];
                for (const url of possibleUrls) {
                    try {
                        const testConfig = { ...fixedConfig, baseUrl: url };
                        const testModel = AIModel_1.AIModelFactory.create(testConfig);
                        const isValid = await testModel.validateConnection();
                        if (isValid) {
                            fixedConfig.baseUrl = url;
                            fixes.push(`修正API地址: ${config.baseUrl} → ${url}`);
                            return { success: true, config: fixedConfig, issues, fixes };
                        }
                    }
                    catch (error) {
                        // 继续尝试下一个URL
                    }
                }
            }
            // 3. 超时问题处理建议
            issues.push('OpenAI API连接超时，可能的原因:');
            issues.push('1. 网络连接问题或防火墙阻止');
            issues.push('2. API密钥无效或已过期');
            issues.push('3. API服务暂时不可用');
            return { success: false, config: fixedConfig, issues, fixes };
        }
        catch (error) {
            issues.push(`OpenAI修复失败: ${error instanceof Error ? error.message : String(error)}`);
            return { success: false, config: fixedConfig, issues, fixes };
        }
    }
    /**
     * 智能匹配最佳模型名称
     */
    static findBestModelMatch(targetModel, availableModels) {
        const target = targetModel.toLowerCase();
        const modelNames = availableModels.map(m => m.name);
        // 1. 完全匹配
        const exactMatch = modelNames.find(name => name.toLowerCase() === target);
        if (exactMatch)
            return exactMatch;
        // 2. 包含匹配
        const containsMatch = modelNames.find(name => name.toLowerCase().includes(target) || target.includes(name.toLowerCase()));
        if (containsMatch)
            return containsMatch;
        // 3. 模糊匹配常见模式
        const patterns = [
            { search: ['qwen', 'qw'], models: ['qwen3:14b', 'qwen3:8b', 'qwen2.5:14b'] },
            { search: ['llama', 'll'], models: ['llama2', 'llama3'] },
            { search: ['mistral', 'mis'], models: ['mistral'] },
            { search: ['gemma'], models: ['gemma'] }
        ];
        for (const pattern of patterns) {
            if (pattern.search.some(s => target.includes(s))) {
                const match = pattern.models.find(m => modelNames.includes(m));
                if (match)
                    return match;
            }
        }
        // 4. 返回第一个可用模型作为默认
        return modelNames[0] || targetModel;
    }
    /**
     * 常见模型名称修正映射
     */
    static getCommonModelNameFixes() {
        return {
            'Qwen/Qwen3-8B': 'qwen2.5-coder:7b',
            'Qwen/Qwen3-14B': 'qwen2.5:14b',
            'gpt-3.5': 'gpt-3.5-turbo',
            'gpt-4': 'gpt-4-turbo',
            'claude-3': 'claude-3-sonnet',
            'claude-3.5': 'claude-3-5-sonnet'
        };
    }
    /**
     * 生成修复建议
     */
    static generateFixSuggestions(config) {
        const suggestions = [];
        if (config.type === 'ollama') {
            suggestions.push('💡 Ollama修复建议:');
            suggestions.push('1. 确保Ollama服务运行: ollama serve');
            suggestions.push('2. 检查模型是否已下载: ollama list');
            suggestions.push('3. 下载推荐模型: ollama pull qwen2.5:14b');
            suggestions.push('4. 检查端口是否被占用: netstat -an | findstr 11434');
        }
        else {
            suggestions.push('💡 OpenAI API修复建议:');
            suggestions.push('1. 检查网络连接和DNS设置');
            suggestions.push('2. 验证API密钥是否正确和有效');
            suggestions.push('3. 尝试使用代理或VPN');
            suggestions.push('4. 检查防火墙和安全软件设置');
            suggestions.push('5. 联系API服务提供商确认服务状态');
        }
        return suggestions;
    }
    /**
     * 快速连接测试
     */
    static async quickConnectionTest(config) {
        const startTime = Date.now();
        try {
            const aiModel = AIModel_1.AIModelFactory.create(config);
            const success = await aiModel.validateConnection();
            const responseTime = Date.now() - startTime;
            return { success, responseTime };
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            return {
                success: false,
                responseTime,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
}
exports.AIConnectionFixer = AIConnectionFixer;
//# sourceMappingURL=AIConnectionFixer.js.map