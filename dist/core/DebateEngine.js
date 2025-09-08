"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebateEngine = void 0;
const events_1 = require("events");
class DebateEngine extends events_1.EventEmitter {
    constructor(aiModel) {
        super();
        this.session = null;
        this.isStopped = false; // 新增：停止标志
        this.aiModel = aiModel;
    }
    async startDebate(topic, roles, config, parentSession) {
        this.isStopped = false; // 重置停止标志
        // 生成会话ID和相关信息
        const sessionId = parentSession?.sessionId || this.generateSessionId();
        const parentSessionId = parentSession?.id;
        const continuationCount = (parentSession?.continuationCount || 0) + 1;
        const previousConsensus = parentSession?.consensus;
        this.session = {
            id: this.generateId(),
            topic,
            roles,
            statements: [],
            currentRound: 0,
            status: 'preparing',
            startTime: Date.now(),
            config,
            sessionId,
            parentSessionId,
            continuationCount,
            previousConsensus
        };
        this.emit('debate-started', this.session);
        try {
            // 第一轮：开场陈述
            await this.conductOpeningStatements();
            // 多轮辩论
            while (this.shouldContinueDebate() && !this.isStopped) {
                this.session.currentRound++;
                await this.conductDebateRound();
                // 检查是否被停止
                if (this.isStopped) {
                    this.session.status = 'completed';
                    this.session.endTime = Date.now();
                    this.emit('debate-stopped', this.session);
                    break;
                }
                // 检查是否需要进入共识阶段
                if (await this.checkForConvergence()) {
                    this.session.status = 'converging';
                    await this.conductConsensusRound();
                    break;
                }
            }
            // 如果没有被停止，生成最终总结
            if (!this.isStopped && this.session.status !== 'completed') {
                await this.generateFinalConsensus();
                this.session.status = 'completed';
                this.session.endTime = Date.now();
            }
        }
        catch (error) {
            this.session.status = 'error';
            throw error;
        }
        this.emit('debate-completed', this.session);
        return this.session;
    }
    async conductOpeningStatements() {
        this.session.status = 'in-progress';
        this.emit('debate-status-update', { status: 'in-progress', round: 0, message: '开始开场陈述...' });
        // 流式处理：一个角色一个角色地生成回答
        for (const role of this.session.roles) {
            // 检查是否被停止
            if (this.isStopped) {
                console.log('辩论已被停止，中断开场陈述');
                return;
            }
            try {
                const statement = await this.generateStatement(role, 'opening');
                this.addStatement(statement);
                // 注意：role-statement-ready 已经在 generateStatement 中发送了
            }
            catch (error) {
                console.error(`角色 ${role.name} 开场陈述失败:`, error);
                // 继续处理其他角色
            }
        }
    }
    async conductDebateRound() {
        this.emit('debate-status-update', {
            status: 'in-progress',
            round: this.session.currentRound,
            message: `第 ${this.session.currentRound} 轮讨论开始...`
        });
        // 流式处理：一个角色一个角色地生成回答
        for (const role of this.session.roles) {
            // 检查是否被停止
            if (this.isStopped) {
                console.log('辩论已被停止，中断当前轮次');
                return;
            }
            try {
                const statement = await this.generateStatement(role, 'argument');
                this.addStatement(statement);
                // 添加小延迟以模拟人类讨论节奏
                await this.delay(500);
            }
            catch (error) {
                console.error(`角色 ${role.name} 第${this.session.currentRound}轮发言失败:`, error);
                // 继续处理其他角色
            }
        }
    }
    async conductConsensusRound() {
        this.emit('debate-status-update', {
            status: 'converging',
            round: this.session.currentRound,
            message: '寻求共识中...'
        });
        // 流式处理：一个角色一个角色地生成共识
        for (const role of this.session.roles) {
            try {
                const statement = await this.generateStatement(role, 'consensus');
                this.addStatement(statement);
            }
            catch (error) {
                console.error(`角色 ${role.name} 共识发言失败:`, error);
                // 继续处理其他角色
            }
        }
    }
    async generateStatement(role, type) {
        // 发送角色开始生成的事件
        this.emit('role-thinking', {
            roleId: role.id,
            roleName: role.name,
            type: type,
            round: this.session.currentRound
        });
        const prompt = this.buildPromptForRole(role, type);
        const systemPrompt = this.buildSystemPromptForRole(role);
        try {
            const response = await this.aiModel.generateResponse(prompt, systemPrompt);
            const statement = {
                id: this.generateId(),
                roleId: role.id,
                roleName: role.name,
                content: response.content.trim(),
                timestamp: Date.now(),
                round: this.session.currentRound,
                type
            };
            // 立即发送角色完成生成的事件
            this.emit('role-statement-ready', statement);
            return statement;
        }
        catch (error) {
            // 发送角色生成失败的事件
            this.emit('role-error', {
                roleId: role.id,
                roleName: role.name,
                error: error instanceof Error ? error.message : String(error),
                round: this.session.currentRound
            });
            throw error;
        }
    }
    buildPromptForRole(role, type) {
        const session = this.session;
        const context = this.buildContextForRole(role);
        // 如果是连续讨论，添加前一轮讨论的上下文
        let continuationContext = '';
        if (session.previousConsensus && session.continuationCount && session.continuationCount > 1) {
            continuationContext = `
**前一轮讨论共识**：${session.previousConsensus}

**当前是第${session.continuationCount}轮深入讨论**，请基于前一轮的共识继续深入分析。
`;
        }
        switch (type) {
            case 'opening':
                // 检测是否包含答案
                const hasAnswer = session.topic.includes('答案：') || session.topic.includes('答:') || session.topic.includes('解答：');
                if (hasAnswer) {
                    return `讨论议题：${session.topic}
${continuationContext}
作为${role.name}，请从你的专业角度分析上述问题和答案。

你的专业背景：${role.background}
你的分析角度：${role.stance}

请重点回答：
1. 从你的专业角度看，这个答案是否正确？
2. 如果有问题，主要问题在哪里？
3. 你会如何改进或优化这个答案？

要求：控制在200字以内，体现你的专业性和针对性。`;
                }
                else {
                    return `讨论问题：${session.topic}
${continuationContext}
作为${role.name}，请从你的专业角度对这个问题提出你的解答和分析。

你的专业背景：${role.background}
你的分析角度：${role.stance}

请重点回答：
1. 从你的专业角度，你认为问题的答案是什么？
2. 你的分析依据和理由是什么？
3. 实施这个方案需要注意什么？

要求：控制在200字以内，体现你的专业性和针对性。`;
                }
            case 'argument':
                if (!context || context.trim() === '') {
                    // 如果没有上下文，返回等待其他专家发言的提示
                    return `讨论问题：${session.topic}

作为${role.name}，你是第一个在此轮发言的专家。

请从你的专业角度提出深入的分析和建议：
1. 基于你的专业经验，你对这个问题的核心观点是什么？
2. 你认为解决这个问题的关键点在哪里？
3. 你希望其他专家关注和讨论哪些方面？

要求：
- 提出明确的论点供其他专家讨论
- 控制在250字以内
- 体现你的专业特色和独到见解`;
                }
                // 有上下文时的深度互动提示
                return `讨论问题：${session.topic}

${context}

作为${role.name}，请针对上述专家发言进行深入的专业回应：

**互动要求**：
1. **直接回应**：明确指出你同意或质疑哪位专家的具体观点，并说明理由
2. **专业补充**：从你的专业角度，补充或修正其他专家可能忽略的重要方面
3. **建设性讨论**：提出具体的改进建议或解决方案
4. **关键问题**：针对其他专家提出的问题给出你的专业判断

**回应格式示例**：
"我认同[专家名]关于[具体观点]的分析，但从[你的专业领域]角度看..."
"对于[专家名]提到的[具体问题]，我的看法是..."

要求：
- 必须直接引用和回应其他专家的具体观点
- 避免泛泛而谈，要有针对性
- 控制在250字以内
- 保持专业性和建设性`;
            case 'consensus':
                return `讨论问题：${session.topic}

${context}

经过多轮深入讨论，现在需要寻求共识。作为${role.name}，请针对整个讨论进程提出你的最终建议：

**共识构建要求**：
1. **观点综合**：总结其他专家的合理观点，找出共同点
2. **立场调整**：适当调整你的初始立场，显示协作精神
3. **具体方案**：提出针对核心问题的具体、可行的解决方案
4. **实施路径**：说明如何在实践中落地这个共识方案

**回应格式示例**：
"综合各位专家的观点，我认为我们在[具体问题点]上已经达成了基本共识..."
"虽然我最初强调[原始观点]，但考虑到[其他专家的关切]，我建议..."

**最终建议结构**：
- 短期目标：立即可以实施的措施
- 中期规划：需要时间和资源的方案  
- 长期愿景：理想的终极目标

要求：
- 体现协作精神和灵活性
- 提出平衡各方关切的方案
- 控制在200字以内
- 着重实用性和可操作性`;
            default:
                return '';
        }
    }
    buildSystemPromptForRole(role) {
        return `你是${role.name}，背景：${role.background}。

个性特点：${role.personality}
专业领域：${role.expertise.join('、')}
分析角度：${role.stance}

在讨论中，你需要：

**角色设定**：
1. 始终保持你的专业身份和个性特点
2. 基于你的专业背景和经验发言
3. 体现你的分析角度和思维方式

**互动原则**：
1. **积极倾听**：仔细阅读其他专家的发言，理解他们的观点
2. **直接回应**：明确引用和回应具体的观点，避免泛泛而谈
3. **建设性互动**：既要指出分歧，也要寻找共同点和协作机会
4. **问题导向**：针对具体问题点进行深入讨论，不要"各说各的"

**表达要求**：
1. 保持理性和尊重的态度，但要有自己的立场
2. 避免重复之前已经说过的内容
3. 用简洁、有说服力的语言表达观点
4. 在保持专业性的同时，体现人性化和情理平衡

**特别提醒**：
- 这是一个协作讨论，不是个人展示
- 你的目标是与其他专家一起找到最佳解决方案
- 要在坚持专业立场和寻求共识之间找到平衡`;
    }
    buildContextForRole(role) {
        if (!this.session || this.session.statements.length === 0) {
            return '';
        }
        // 获取最近的发言，但排除自己的发言
        const recentStatements = this.session.statements
            .slice(-8) // 增加到考虑最近的8条发言，保证上下文充分
            .filter(stmt => stmt.roleId !== role.id); // 排除自己的发言
        if (recentStatements.length === 0) {
            return '';
        }
        // 按轮次和时间排序，构建清晰的上下文
        const contextStatements = recentStatements
            .sort((a, b) => {
            // 先按轮次排序，再按时间排序
            if (a.round !== b.round) {
                return a.round - b.round;
            }
            return a.timestamp - b.timestamp;
        })
            .map(stmt => {
            const roundInfo = stmt.round === 0 ? '开场' : `第${stmt.round}轮`;
            return `[${roundInfo}] ${stmt.roleName}：${stmt.content}`;
        });
        // 构建带有分析提示的上下文
        let contextText = `前面的讨论内容：\n${contextStatements.join('\n\n')}\n`;
        // 添加上下文分析提示
        if (recentStatements.length >= 2) {
            contextText += `\n——————————\n`;
            contextText += `**上下文分析提示**：\n`;
            // 识别主要争议点
            const currentRoundStatements = recentStatements.filter(stmt => stmt.round === this.session.currentRound);
            if (currentRoundStatements.length > 0) {
                contextText += `- 当前轮主要争议点：关注其他专家提出的具体观点和建议\n`;
            }
            // 识别不同观点
            const differentRoles = new Set(recentStatements.map(stmt => stmt.roleName));
            if (differentRoles.size >= 2) {
                contextText += `- 已有${differentRoles.size}位专家发表了不同视角的观点，需要针对性回应\n`;
            }
            // 提醒互动要求
            contextText += `- 请直接引用和回应上述具体观点，避免泛泛而谈\n`;
        }
        return contextText;
    }
    shouldContinueDebate() {
        if (!this.session)
            return false;
        return this.session.currentRound < this.session.config.maxRounds &&
            this.session.status === 'in-progress';
    }
    async checkForConvergence() {
        if (!this.session || this.session.currentRound < 2)
            return false;
        // 简单的收敛检测：如果已经进行了一定轮数的辩论
        const convergenceRound = Math.max(3, Math.floor(this.session.config.maxRounds * 0.7));
        return this.session.currentRound >= convergenceRound;
    }
    async generateFinalConsensus() {
        if (!this.session)
            return;
        const allStatements = this.session.statements
            .map(stmt => `${stmt.roleName}（第${stmt.round}轮）：${stmt.content}`)
            .join('\n\n');
        const consensusPrompt = `辩论议题：${this.session.topic}

完整辩论记录：
${allStatements}

请基于以上所有发言，生成一个各方都能接受的共识结论。要求：
1. 综合各方观点的合理部分
2. 提出平衡的解决方案
3. 控制在300字以内
4. 语言客观、理性`;
        const systemPrompt = `你是一位专业的辩论主持人和调解员。你的任务是：
1. 公正地总结各方观点
2. 找出共同点和分歧点
3. 提出各方都能接受的折中方案
4. 确保结论具有可操作性`;
        try {
            const response = await this.aiModel.generateResponse(consensusPrompt, systemPrompt);
            this.session.consensus = response.content.trim();
        }
        catch (error) {
            this.session.consensus = '由于技术原因，无法生成最终共识。建议各方继续沟通协商。';
        }
    }
    addStatement(statement) {
        if (this.session) {
            this.session.statements.push(statement);
        }
    }
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    generateSessionId() {
        // 生成会话ID，用于链接相关讨论
        return 'session_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    getCurrentSession() {
        return this.session;
    }
    getStatus() {
        return this.session?.status || 'idle';
    }
    // 新增：停止辩论方法
    stopDebate() {
        this.isStopped = true;
        if (this.session && this.session.status === 'in-progress') {
            this.session.status = 'completed';
            this.session.endTime = Date.now();
            console.log('辩论已被手动停止');
            this.emit('debate-stopped', this.session);
        }
    }
    // 新增：检查是否已停止
    isDebateStopped() {
        return this.isStopped;
    }
}
exports.DebateEngine = DebateEngine;
//# sourceMappingURL=DebateEngine.js.map