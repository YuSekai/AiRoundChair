"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileExporter = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
class FileExporter {
    static async export(debate, filePath, format) {
        switch (format) {
            case 'json':
                await this.exportToJSON(debate, filePath);
                break;
            case 'markdown':
                await this.exportToMarkdown(debate, filePath);
                break;
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }
    static async exportToJSON(debate, filePath) {
        try {
            const jsonData = JSON.stringify(debate, null, 2);
            await fs.writeFile(filePath, jsonData, 'utf-8');
        }
        catch (error) {
            throw new Error(`Failed to export to JSON: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    static async exportToMarkdown(debate, filePath) {
        try {
            const markdown = this.generateMarkdown(debate);
            await fs.writeFile(filePath, markdown, 'utf-8');
        }
        catch (error) {
            throw new Error(`Failed to export to Markdown: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    static generateMarkdown(debate) {
        const startTime = new Date(debate.startTime).toLocaleString('zh-CN');
        const endTime = debate.endTime ? new Date(debate.endTime).toLocaleString('zh-CN') : '进行中';
        const duration = debate.endTime ?
            Math.round((debate.endTime - debate.startTime) / 1000 / 60) :
            Math.round((Date.now() - debate.startTime) / 1000 / 60);
        let markdown = `# IntelliRound 辩论记录

## 基本信息

- **议题**: ${debate.topic}
- **辩论ID**: ${debate.id}
- **开始时间**: ${startTime}
- **结束时间**: ${endTime}
- **持续时长**: ${duration} 分钟
- **状态**: ${this.getStatusText(debate.status)}
- **总轮数**: ${debate.currentRound}

## 参与角色

`;
        // 添加角色信息
        debate.roles.forEach((role, index) => {
            markdown += `### ${index + 1}. ${role.name}

- **背景**: ${role.background}
- **立场**: ${role.stance}
- **性格**: ${role.personality}
- **专业领域**: ${role.expertise.join('、')}

`;
        });
        markdown += `## 辩论过程

`;
        // 按轮次组织发言
        const roundGroups = this.groupStatementsByRound(debate.statements);
        for (const [round, statements] of roundGroups) {
            if (round === 0) {
                markdown += `### 开场陈述\n\n`;
            }
            else {
                markdown += `### 第 ${round} 轮辩论\n\n`;
            }
            statements.forEach(statement => {
                const timestamp = new Date(statement.timestamp).toLocaleTimeString('zh-CN');
                markdown += `#### ${statement.roleName} (${timestamp})\n\n${statement.content}\n\n`;
            });
        }
        // 添加共识部分
        if (debate.consensus) {
            markdown += `## 最终共识\n\n${debate.consensus}\n\n`;
        }
        // 添加统计信息
        markdown += `## 统计信息

- **总发言数**: ${debate.statements.length}
- **每个角色发言数**:
`;
        const speakingStats = this.calculateSpeakingStats(debate.statements, debate.roles);
        speakingStats.forEach(stat => {
            markdown += `  - ${stat.roleName}: ${stat.count} 次\n`;
        });
        markdown += `
- **AI 模型**: ${debate.config.aiModel.type.toUpperCase()} (${debate.config.aiModel.model})
- **最大轮数**: ${debate.config.maxRounds}

---

*本记录由 IntelliRound AI 辩论系统生成于 ${new Date().toLocaleString('zh-CN')}*
`;
        return markdown;
    }
    static getStatusText(status) {
        const statusMap = {
            'preparing': '准备中',
            'in-progress': '进行中',
            'converging': '寻求共识',
            'completed': '已完成',
            'error': '发生错误'
        };
        return statusMap[status] || status;
    }
    static groupStatementsByRound(statements) {
        const groups = new Map();
        statements.forEach(statement => {
            const round = statement.round;
            if (!groups.has(round)) {
                groups.set(round, []);
            }
            groups.get(round).push(statement);
        });
        return groups;
    }
    static calculateSpeakingStats(statements, roles) {
        const stats = new Map();
        statements.forEach(statement => {
            const count = stats.get(statement.roleName) || 0;
            stats.set(statement.roleName, count + 1);
        });
        return roles.map(role => ({
            roleName: role.name,
            count: stats.get(role.name) || 0
        }));
    }
    // 生成简化的摘要
    static generateSummary(debate) {
        const duration = debate.endTime ?
            Math.round((debate.endTime - debate.startTime) / 1000 / 60) :
            Math.round((Date.now() - debate.startTime) / 1000 / 60);
        return `辩论议题：${debate.topic}
参与角色：${debate.roles.map(r => r.name).join('、')}
辩论轮数：${debate.currentRound}
总发言数：${debate.statements.length}
持续时长：${duration} 分钟
状态：${this.getStatusText(debate.status)}`;
    }
    // 检查文件路径是否有效
    static validateFilePath(filePath, format) {
        const ext = path.extname(filePath).toLowerCase();
        const expectedExt = format === 'json' ? '.json' : '.md';
        return ext === expectedExt;
    }
}
exports.FileExporter = FileExporter;
//# sourceMappingURL=FileExporter.js.map