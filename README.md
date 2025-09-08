# 🤖 ai圆桌 - AI多角色智能讨论系统

<div align="center">

![ai圆桌 Logo](https://img.shields.io/badge/ai圆桌-v1.0.0-blue?style=for-the-badge&logo=electron)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-37.3.1-191970?style=for-the-badge&logo=Electron&logoColor=white)
![AI](https://img.shields.io/badge/AI_Powered-00D4AA?style=for-the-badge&logo=openai&logoColor=white)

**基于AI的多角色协作讨论与共识生成桌面应用**

[功能特性](#-功能特性) • [快速开始](#-快速开始) • [使用指南](#-使用指南) • [配置说明](#-配置说明) • [开发指南](#-开发指南)

</div>

---

## 📖 项目简介

ai圆桌 是一个创新的AI驱动桌面应用，旨在通过智能角色生成和多角色协作讨论，帮助用户深入分析复杂问题并达成共识。系统支持多种AI模型，提供专业化的角色分析和实时互动讨论功能。

### 🎯 核心理念

- **智能角色生成**：根据问题内容自动生成相关专业领域的专家角色
- **协作讨论模式**：从对抗性辩论转向协作性专业分析
- **实时交互体验**：类微信聊天界面的实时讨论展示
- **共识收敛机制**：通过多轮讨论自动生成平衡的解决方案

## ✨ 功能特性

### 🧠 智能AI角色生成
- **动态角色分析**：基于问题内容智能识别相关专业领域
- **专业角色生成**：自动生成技术、管理、研究等不同背景的专家
- **并行生成机制**：3个独立AI连接同时生成角色，提升质量和速度
- **容错降级策略**：并行→串行→默认角色的多层保障机制

### 💬 实时协作讨论
- **统一上下文**：所有角色针对同一问题点进行互动讨论
- **实时聊天界面**：类微信消息气泡的实时讨论展示
- **角色互动机制**：专家之间直接引用和回应，避免"各说各的"
- **流式输出**：每个角色完成发言后立即显示，无需等待全部完成

### 🎯 多模式支持
- **问题分析模式**：针对开放性问题生成多种解决方案
- **答案评估模式**：对已有答案进行多角度专业分析
- **共识收敛模式**：通过多轮讨论自动生成综合性结论

### 🔧 灵活配置系统
- **多AI模型支持**：Ollama本地模型 + OpenAI兼容API
- **动态超时管理**：根据任务复杂度自动调整超时时间
- **角色生成模式**：支持并行生成和传统生成两种模式
- **参数自定义**：温度、Token数、轮数等全面可配置

### 📊 强大的导出功能
- **JSON格式**：完整的结构化讨论数据
- **Markdown格式**：适合阅读和分享的文档格式
- **讨论统计**：角色发言统计、时间分析等详细数据

## 🚀 快速开始

### 环境要求

- **Node.js** 16.0 或更高版本
- **npm** 或 **yarn** 包管理器
- **AI服务**：Ollama本地服务 或 OpenAI兼容API

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/your-repo/intelliround.git
   cd intelliround
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **构建项目**
   ```bash
   npm run build
   ```

4. **启动应用**
   ```bash
   npm start
   ```

### AI服务配置

#### 选项1：本地Ollama（推荐）
```bash
# 安装Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# 启动服务
ollama serve

# 下载模型（推荐）
ollama pull qwen2.5:14b
ollama pull llama3.1:8b
```

#### 选项2：OpenAI兼容API
- 支持OpenAI官方API
- 支持国内API服务商（如硅谷流量、模型范围等）
- 配置API密钥和基础URL即可使用

## 📋 使用指南

### 1. 配置AI模型

点击右上角"配置设置"按钮：

- **AI模型类型**：选择Ollama或OpenAI
- **基础URL**：设置API服务地址
- **API密钥**：填入API密钥（Ollama无需）
- **模型名称**：指定具体模型
- **超时时间**：根据网络环境调整（推荐30-60秒）
- **角色生成模式**：选择并行生成（质量更高）或传统生成（兼容性更好）

### 2. 开始智能讨论

1. **输入议题**：在输入框中描述您的问题或议题
2. **生成角色**：系统自动分析并生成相关专业角色
3. **预览确认**：查看生成的角色信息，可重新生成
4. **开始讨论**：确认后开始多角色协作讨论
5. **实时观看**：在聊天界面实时查看讨论过程
6. **获得共识**：系统自动生成最终共识结论

### 3. 导出和分享

讨论完成后，点击"导出"按钮：
- **JSON格式**：完整的数据结构，适合后续分析
- **Markdown格式**：易读的文档格式，适合分享

## ⚙️ 配置说明

### AI模型配置

```typescript
interface AIModelConfig {
  type: 'ollama' | 'openai';      // AI服务类型
  baseUrl: string;                // API基础URL
  apiKey?: string;                // API密钥（可选）
  model: string;                  // 模型名称
  temperature: number;            // 创造性参数 (0.0-2.0)
  maxTokens: number;              // 最大输出长度
  timeoutSeconds: number;         // 超时时间（秒）
}
```

### 推荐配置

#### 高性能环境
```json
{
  "type": "ollama",
  "baseUrl": "http://localhost:11434",
  "model": "qwen2.5:14b",
  "temperature": 0.7,
  "maxTokens": 1000,
  "timeoutSeconds": 60,
  "roleGenerationMode": "parallel"
}
```

#### 资源受限环境
```json
{
  "type": "ollama", 
  "baseUrl": "http://localhost:11434",
  "model": "llama3.1:8b",
  "temperature": 0.6,
  "maxTokens": 800,
  "timeoutSeconds": 30,
  "roleGenerationMode": "traditional"
}
```

## 🛠️ 开发指南

### 项目结构

```
ai圆桌/
├── src/
│   ├── main.ts              # Electron主进程
│   ├── preload.ts           # 预加载脚本
│   ├── renderer/            # 渲染进程（前端）
│   │   ├── index.html       # 主界面
│   │   ├── renderer.js      # 前端逻辑
│   │   └── styles.css       # 样式文件
│   ├── core/                # 核心业务逻辑
│   │   ├── DebateManager.ts # 讨论管理器
│   │   ├── DebateEngine.ts  # 讨论引擎
│   │   ├── RoleGenerator.ts # 传统角色生成
│   │   └── ParallelRoleGenerator.ts # 并行角色生成
│   ├── ai/                  # AI模型接口
│   │   └── AIModel.ts       # AI模型抽象层
│   ├── utils/               # 工具函数
│   │   ├── FileExporter.ts  # 文件导出
│   │   ├── AIDiagnosticTool.ts # AI诊断
│   │   └── AIConnectionFixer.ts # 连接修复
│   └── types/               # TypeScript类型定义
│       └── index.ts
├── dist/                    # 构建输出
├── test/                    # 测试文件
└── docs/                    # 文档文件
```

### 开发命令

```bash
# 安装依赖
npm install

# 开发模式（自动重启）
npm run dev

# 构建项目
npm run build

# 生产模式启动
npm start

# 清理构建文件
npm run clean

# 运行测试
npm test
```

### 核心组件说明

#### DebateManager
- 讨论会话管理
- AI模型初始化
- 角色生成协调
- 事件分发中心

#### DebateEngine  
- 多轮讨论控制
- 角色发言生成
- 共识收敛算法
- 实时事件推送

#### ParallelRoleGenerator
- 智能问题分析
- 并行角色生成
- 多层容错机制
- 角色质量验证

### 扩展开发

#### 添加新的AI模型
1. 在`src/ai/AIModel.ts`中实现新的AI模型类
2. 更新`AIModelFactory`以支持新模型
3. 在配置界面添加相应选项

#### 自定义角色生成逻辑
1. 修改`ParallelRoleGenerator.ts`中的分析逻辑
2. 扩展`getDefaultTopicAnalysis`方法
3. 添加新的专业领域映射

#### 增强讨论功能
1. 扩展`DebateEngine.ts`的生成逻辑
2. 自定义提示词模板
3. 添加新的讨论阶段

## 🔧 故障排除

### 常见问题

#### AI连接问题
- **检查服务状态**：确认Ollama服务或API服务正常
- **验证配置**：检查URL、密钥、模型名称是否正确
- **网络连接**：确认网络畅通，考虑代理设置
- **超时设置**：适当增加超时时间（推荐60秒）

#### 角色生成失败
- **模型选择**：推荐使用性能较好的模型（如qwen2.5:14b）
- **生成模式**：网络不稳定时可切换到传统生成模式
- **重试机制**：系统会自动重试，耐心等待
- **降级方案**：最终会使用高质量的默认角色

#### 性能优化
- **模型选择**：根据硬件性能选择合适的模型大小
- **并发控制**：资源受限时使用传统生成模式
- **参数调优**：适当调整温度和Token数量

### 技术支持

如遇到问题，请参考项目文档：
- [AI连接故障排除指南](AI_CONNECTION_TROUBLESHOOTING.md)
- [角色生成问题解决方案](ROLE_GENERATION_SOLUTION.md)
- [配置示例](CONFIG_EXAMPLE.md)
- [使用示例](USAGE_EXAMPLES.md)

## 📈 性能特色

### 智能优化
- **错峰请求**：200ms间隔避免服务器过载
- **并行处理**：多角色同时生成，提升效率
- **智能重试**：失败时自动切换生成策略
- **实时反馈**：角色完成即显示，提升用户体验

### 质量保证
- **专业化角色**：基于问题内容生成相关专业角色
- **多样性检验**：自动验证角色的专业领域多样性
- **互动机制**：确保角色间真正的对话而非独立发言
- **共识算法**：智能的观点综合和平衡

## 🎯 应用场景

### 商业决策
- **产品策略讨论**：从技术、市场、用户多角度分析
- **投资评估分析**：风险评估、市场分析、财务建模
- **组织变革规划**：管理学、心理学、策略学专家协作

### 学术研究
- **跨学科问题分析**：多领域专家协作讨论
- **论文观点验证**：不同角度的学术观点碰撞
- **研究方案设计**：理论与实践的结合分析

### 教育培训
- **案例教学**：多角色分析复杂案例
- **思维训练**：培养多元化思考能力
- **辩论练习**：提供专业的辩论对手

### 个人决策
- **职业规划**：从多个维度分析职业选择
- **投资决策**：理性分析投资机会和风险
- **生活选择**：重大决策的全面分析

## 🤝 贡献指南

我们欢迎社区贡献！请阅读以下指南：

### 贡献方式
1. **报告问题**：通过GitHub Issues报告bug或提出功能建议
2. **代码贡献**：Fork项目，创建feature分支，提交Pull Request
3. **文档改进**：完善文档，添加使用示例
4. **测试反馈**：在不同环境下测试应用，提供反馈

### 开发规范
- 遵循TypeScript严格模式
- 使用ESLint和Prettier保持代码风格
- 编写详细的提交信息
- 添加适当的单元测试

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源协议。

## 🙏 致谢

### 特别感谢
**本项目基于IntelliRound项目进行深度定制和功能扩展，由Claude AI助手协助完成开发和优化。**

### 技术支持
感谢以下开源项目和技术：
- [Electron](https://electronjs.org/) - 跨平台桌面应用框架
- [TypeScript](https://www.typescriptlang.org/) - 类型安全的JavaScript
- [Ollama](https://ollama.ai/) - 本地AI模型运行平台
- [OpenAI](https://openai.com/) - AI模型API服务

---

<div align="center">

**🌟 如果这个项目对您有帮助，请给我们一个Star！**

Made with ❤️ by ai圆桌 Team

</div>