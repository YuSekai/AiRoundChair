# 🤖 ai圆桌 - AI多角色智能讨论系统
---

## 📖 项目简介

ai圆桌 是一个创新的AI驱动桌面应用，旨在通过智能角色生成和多角色协作讨论，帮助用户深入分析复杂问题并达成共识。系统支持多种AI模型，提供专业化的角色分析和实时互动讨论功能。

### 特别感谢
**本项目基于IntelliRound项目进行深度定制和功能扩展，由Claude AI助手协助完成开发和优化。**

### 技术支持
感谢以下开源项目和技术：
- [Electron](https://electronjs.org/) - 跨平台桌面应用框架
- [TypeScript](https://www.typescriptlang.org/) - 类型安全的JavaScript
- [Ollama](https://ollama.ai/) - 本地AI模型运行平台
- [OpenAI](https://openai.com/) - AI模型API服务

## 🔄 更新记录

### v1.0.1 (2025-09-10)
**修复：单张角色卡重新生成功能**
- 修复了单张角色卡重新生成失败的问题
- 问题根源：前端直接调用外部API绕过后端接口，导致架构不一致
- 解决方案：
  - 在DebateManager中添加regenerateSingleRole方法
  - 在main.ts中添加对应的IPC处理程序
  - 在preload.ts中暴露新的API接口
  - 修改前端renderer.js使用IPC接口而非直接调用API
- 增强功能：
  - 添加了强大的数据解析容错机制
  - 支持从非标准JSON响应中手动提取角色信息
  - 增加了详细的调试日志输出
  - 提供了完整的字段验证和默认值处理
- 技术改进：
  - 修复了TypeScript类型错误
  - 统一了错误处理机制
  - 提升了系统稳定性和可维护性
