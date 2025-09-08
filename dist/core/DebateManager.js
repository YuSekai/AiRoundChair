"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebateManager = void 0;
const AIModel_1 = require("../ai/AIModel");
const RoleGenerator_1 = require("./RoleGenerator");
const ParallelRoleGenerator_1 = require("./ParallelRoleGenerator");
const DebateEngine_1 = require("./DebateEngine");
const HistoryManager_1 = require("../utils/HistoryManager");
const events_1 = require("events");
class DebateManager extends events_1.EventEmitter {
    constructor() {
        super();
        this.aiModel = null;
        this.roleGenerator = null;
        this.parallelRoleGenerator = null;
        this.debateEngine = null;
        this.currentSession = null;
        this.useParallelGeneration = true; // 默认使用并行生成
    }
    async initializeAI(config) {
        try {
            console.log('开始初始化 AI 模型...', config);
            this.emit('ai-initialization-progress', '创建 AI 模型实例...');
            this.aiModel = AIModel_1.AIModelFactory.create(config);
            // 验证AI连接
            this.emit('ai-initialization-progress', '验证 AI 模型连接...');
            console.log('开始验证 AI 连接...');
            const isConnected = await this.aiModel.validateConnection();
            if (!isConnected) {
                const errorMsg = `无法连接到 ${config.type.toUpperCase()} 模型 ${config.model}。请检查：\n1. ${config.type === 'ollama' ? 'Ollama 服务是否启动' : 'API 地址和密钥是否正确'}\n2. 模型名称是否正确\n3. 网络连接是否正常`;
                throw new Error(errorMsg);
            }
            console.log('AI 模型连接验证成功');
            this.emit('ai-initialization-progress', '初始化组件...');
            this.roleGenerator = new RoleGenerator_1.RoleGenerator(this.aiModel, config);
            this.parallelRoleGenerator = new ParallelRoleGenerator_1.ParallelRoleGenerator(config);
            this.debateEngine = new DebateEngine_1.DebateEngine(this.aiModel);
            // 转发辩论引擎的事件
            this.debateEngine.on('debate-started', (session) => {
                this.emit('debate-started', session);
            });
            this.debateEngine.on('statement-added', (statement) => {
                this.emit('statement-added', statement);
            });
            this.debateEngine.on('debate-completed', (session) => {
                // 自动保存到历史记录
                HistoryManager_1.HistoryManager.saveDebateSession(session);
                this.emit('debate-completed', session);
            });
            // 新增：转发实时角色事件
            this.debateEngine.on('role-thinking', (data) => {
                this.emit('role-thinking', data);
            });
            this.debateEngine.on('role-statement-ready', (statement) => {
                this.emit('role-statement-ready', statement);
            });
            this.debateEngine.on('role-error', (data) => {
                this.emit('role-error', data);
            });
            // 新增：转发辩论状态更新事件
            this.debateEngine.on('debate-status-update', (data) => {
                this.emit('debate-status-update', data);
            });
            console.log('AI 模型初始化完成');
            this.emit('ai-initialized', { type: config.type, model: config.model });
        }
        catch (error) {
            console.error('AI 模型初始化失败:', error);
            this.emit('error', error);
            throw error;
        }
    }
    async startDebate(topic, config) {
        if (!this.aiModel || !this.roleGenerator || !this.debateEngine) {
            throw new Error('AI 模型尚未初始化，请先配置 AI 模型');
        }
        if (!topic.trim()) {
            throw new Error('辩论议题不能为空');
        }
        try {
            this.emit('debate-preparation-started', { topic });
            // 生成角色 - 使用并行生成或传统生成
            this.emit('generating-roles');
            let roles;
            if (this.useParallelGeneration && this.parallelRoleGenerator) {
                console.log('使用并行角色生成器...');
                try {
                    const result = await this.parallelRoleGenerator.generateRolesWithStats(topic, 3);
                    roles = result.roles;
                    console.log('并行生成统计:', result.stats);
                    this.emit('role-generation-stats', result.stats);
                }
                catch (error) {
                    console.warn('并行生成失败，回退到传统生成:', error);
                    roles = await this.roleGenerator.generateRoles(topic, 3);
                }
            }
            else {
                console.log('使用传统角色生成器...');
                roles = await this.roleGenerator.generateRoles(topic, 3);
            }
            if (!this.validateRoles(roles)) {
                throw new Error('生成的角色不足以支持有效的辩论');
            }
            this.emit('roles-generated', { roles });
            // 开始辩论
            this.emit('debate-starting');
            this.currentSession = await this.debateEngine.startDebate(topic, roles, config);
            return this.currentSession;
        }
        catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
    // 只生成角色，不开始辩论
    async generateRolesOnly(topic, config) {
        if (!this.aiModel || !this.roleGenerator) {
            throw new Error('AI 模型尚未初始化，请先配置 AI 模型');
        }
        if (!topic.trim()) {
            throw new Error('辩论议题不能为空');
        }
        try {
            this.emit('generating-roles');
            let roles;
            let stats;
            if (this.useParallelGeneration && this.parallelRoleGenerator) {
                console.log('使用并行角色生成器...');
                try {
                    const result = await this.parallelRoleGenerator.generateRolesWithStats(topic, 3);
                    roles = result.roles;
                    stats = result.stats;
                    console.log('并行生成统计:', result.stats);
                    this.emit('role-generation-stats', result.stats);
                }
                catch (error) {
                    console.warn('并行生成失败，回退到传统生成:', error);
                    roles = await this.roleGenerator.generateRoles(topic, 3);
                }
            }
            else {
                console.log('使用传统角色生成器...');
                roles = await this.roleGenerator.generateRoles(topic, 3);
            }
            if (!this.validateRoles(roles)) {
                throw new Error('生成的角色不足以支持有效的辩论');
            }
            this.emit('roles-generated', { roles });
            return { roles, stats };
        }
        catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
    // 使用已生成的角色开始辩论
    async startDebateWithRoles(topic, roles, config, parentSession) {
        if (!this.aiModel || !this.debateEngine) {
            throw new Error('AI 模型尚未初始化，请先配置 AI 模型');
        }
        if (!topic.trim()) {
            throw new Error('辩论议题不能为空');
        }
        if (!roles || roles.length < 2) {
            throw new Error('需要至少 2 个角色才能开始辩论');
        }
        try {
            this.emit('debate-starting');
            // 如果是连续讨论，传递前一轮的上下文
            if (parentSession) {
                this.currentSession = await this.debateEngine.startDebate(topic, roles, config, parentSession);
            }
            else {
                this.currentSession = await this.debateEngine.startDebate(topic, roles, config);
            }
            return this.currentSession;
        }
        catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
    getCurrentDebate() {
        return this.currentSession;
    }
    getStatus() {
        return {
            aiInitialized: this.aiModel !== null,
            currentDebate: this.currentSession,
            debateStatus: this.debateEngine?.getStatus() || 'idle'
        };
    }
    async testAIConnection(config) {
        try {
            const testModel = AIModel_1.AIModelFactory.create(config);
            return await testModel.validateConnection();
        }
        catch (error) {
            return false;
        }
    }
    // 获取预设的AI配置模板
    getAIConfigTemplates() {
        return {
            'ollama-llama2': {
                type: 'ollama',
                baseUrl: 'http://localhost:11434',
                model: 'llama2',
                temperature: 0.7,
                maxTokens: 1000
            },
            'ollama-mistral': {
                type: 'ollama',
                baseUrl: 'http://localhost:11434',
                model: 'mistral',
                temperature: 0.7,
                maxTokens: 1000
            },
            'openai-gpt-3.5': {
                type: 'openai',
                baseUrl: 'https://api.openai.com/v1',
                model: 'gpt-3.5-turbo',
                temperature: 0.7,
                maxTokens: 1000
            },
            'openai-gpt-4': {
                type: 'openai',
                baseUrl: 'https://api.openai.com/v1',
                model: 'gpt-4',
                temperature: 0.7,
                maxTokens: 1000
            }
        };
    }
    // 获取默认辩论配置
    getDefaultDebateConfig() {
        return {
            maxRounds: 5,
            convergenceThreshold: 0.8,
            enableRealTimeAnalysis: true,
            aiModel: {
                type: 'ollama',
                baseUrl: 'http://localhost:11434',
                model: 'llama2',
                temperature: 0.7,
                maxTokens: 1000
            }
        };
    }
    // 重置辩论管理器
    reset() {
        this.currentSession = null;
        this.emit('reset');
    }
    // 停止当前辩论
    stopDebate() {
        // 停止辩论引擎
        if (this.debateEngine) {
            this.debateEngine.stopDebate();
        }
        // 更新当前会话状态
        if (this.currentSession && this.currentSession.status === 'in-progress') {
            this.currentSession.status = 'completed';
            this.currentSession.endTime = Date.now();
            this.emit('debate-stopped', this.currentSession);
        }
    }
    // 角色验证方法（从RoleGenerator移过来）
    validateRoles(roles) {
        if (roles.length < 2)
            return false;
        // 检查是否有不同的立场
        const stances = roles.map(role => role.stance.toLowerCase());
        const uniqueStances = new Set(stances);
        return uniqueStances.size >= 2;
    }
    // 设置角色生成模式
    setRoleGenerationMode(useParallel) {
        this.useParallelGeneration = useParallel;
        console.log(`角色生成模式设置为: ${useParallel ? '并行生成' : '传统生成'}`);
    }
    // 生成后续讨论问题建议
    async generateFollowUpQuestions(session) {
        if (!this.aiModel) {
            throw new Error('AI 模型尚未初始化');
        }
        try {
            const context = session.statements
                .map(stmt => `${stmt.roleName}: ${stmt.content}`)
                .join('\n\n');
            const prompt = `基于以下讨论内容，生成3-5个有价值的后续深入讨论问题：

讨论议题：${session.topic}
讨论共识：${session.consensus || '尚未达成共识'}

完整讨论记录：
${context}

请生成能够推动讨论深入的后续问题，要求：
1. 基于已有讨论的薄弱环节或未充分探讨的方面
2. 能够从新的角度或更深层次分析问题
3. 具有实际讨论价值和可操作性
4. 每个问题都应该能够引导出新的见解

请以JSON数组格式返回，例如：
["问题1", "问题2", "问题3"]`;
            const response = await this.aiModel.generateResponse(prompt);
            try {
                // 尝试解析JSON响应
                const questions = JSON.parse(response.content.trim());
                if (Array.isArray(questions) && questions.length > 0) {
                    return questions.slice(0, 5); // 最多返回5个问题
                }
            }
            catch (parseError) {
                // 如果JSON解析失败，尝试从文本中提取问题
                const lines = response.content.split('\n');
                const questions = lines
                    .filter(line => line.includes('？') || line.includes('?'))
                    .map(line => line.replace(/^\d+[\.\、]\s*/, '').replace(/^["\*\-\•]\s*/, '').trim())
                    .filter(q => q.length > 10);
                return questions.slice(0, 5);
            }
            return [];
        }
        catch (error) {
            console.error('生成后续问题失败:', error);
            return [];
        }
    }
    // 基于共识生成新的深入讨论议题
    async generateContinuationTopic(session, userQuestion) {
        if (!this.aiModel) {
            throw new Error('AI 模型尚未初始化');
        }
        try {
            const consensus = session.consensus || '';
            const context = session.statements
                .slice(-10) // 使用最近的10条发言
                .map(stmt => `${stmt.roleName}: ${stmt.content}`)
                .join('\n\n');
            let prompt = `基于以下讨论的共识内容，生成一个新的深入讨论议题：

原议题：${session.topic}
讨论共识：${consensus}

相关讨论背景：
${context}`;
            if (userQuestion) {
                prompt += `\n用户希望深入探讨的方向：${userQuestion}`;
            }
            prompt += `

请生成一个新的讨论议题，要求：
1. 基于已有共识，但从新的角度或更深层次进行探讨
2. 能够推动讨论向更具体、更实用的方向发展
3. 议题应该明确、具体，便于专家们进行针对性讨论
4. 保持与原议题的相关性，但要有新的深度

请直接返回新的议题，不要添加其他说明。`;
            const response = await this.aiModel.generateResponse(prompt);
            return response.content.trim();
        }
        catch (error) {
            console.error('生成连续讨论议题失败:', error);
            throw new Error('无法生成新的讨论议题');
        }
    }
    // 历史记录管理方法
    getHistory() {
        return HistoryManager_1.HistoryManager.getHistory();
    }
    getFilteredHistory(options) {
        return HistoryManager_1.HistoryManager.getFilteredHistory(options);
    }
    getHistoryStats() {
        return HistoryManager_1.HistoryManager.getStats();
    }
    deleteHistoryItem(id) {
        return HistoryManager_1.HistoryManager.deleteHistoryItem(id);
    }
    clearAllHistory() {
        return HistoryManager_1.HistoryManager.clearAllHistory();
    }
    exportHistory() {
        return HistoryManager_1.HistoryManager.exportHistory();
    }
    importHistory(jsonData) {
        return HistoryManager_1.HistoryManager.importHistory(jsonData);
    }
    getSessionChain(sessionId) {
        return HistoryManager_1.HistoryManager.getSessionChain(sessionId);
    }
    getRelatedSessions(topic, limit) {
        return HistoryManager_1.HistoryManager.getRelatedSessions(topic, limit);
    }
    // 扫描并导入文件系统历史记录
    scanAndImportFileHistory() {
        return HistoryManager_1.HistoryManager.scanAndImportFileHistory();
    }
}
exports.DebateManager = DebateManager;
//# sourceMappingURL=DebateManager.js.map