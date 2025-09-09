# AI配置模板

本项目需要配置AI服务才能正常工作。请按照以下步骤设置你的AI配置：

## 1. 获取API密钥

### DeepSeek V3.1 (推荐)
1. 访问 https://siliconflow.cn/
2. 注册账号并获取API密钥
3. 密钥格式：`sk-xxxxxxxxxxxxxxxxxxxxxxxx`

### OpenAI兼容服务
1. OpenAI: https://platform.openai.com/
2. 其他兼容服务：确保提供OpenAI兼容的API

## 2. 配置方法

### 方法一：界面配置（推荐）
1. 启动应用程序
2. 在界面中填写以下信息：
   - AI类型：选择 "openai"
   - 基础URL：`https://api.siliconflow.cn/v1/`
   - API密钥：你的API密钥
   - 模型名称：`Pro/deepseek-ai/DeepSeek-V3.1`
   - 温度：0.7
   - 最大令牌：2000
   - 超时时间：60

### 方法二：浏览器控制台配置
1. 启动应用程序
2. 打开开发者工具（F12）
3. 在控制台中运行：
```javascript
const config = {
  aiModel: {
    type: 'openai',
    baseUrl: 'https://api.siliconflow.cn/v1/',
    apiKey: '你的API密钥',
    model: 'Pro/deepseek-ai/DeepSeek-V3.1',
    temperature: 0.7,
    maxTokens: 2000,
    timeoutSeconds: 60
  },
  maxRounds: 5,
  roleGenerationMode: 'parallel'
};
localStorage.setItem('intelliround-config', JSON.stringify(config));
console.log('配置已保存');
```

## 3. 配置示例

### DeepSeek V3.1 配置
```json
{
  "aiModel": {
    "type": "openai",
    "baseUrl": "https://api.siliconflow.cn/v1/",
    "apiKey": "sk-your-api-key-here",
    "model": "Pro/deepseek-ai/DeepSeek-V3.1",
    "temperature": 0.7,
    "maxTokens": 2000,
    "timeoutSeconds": 60
  },
  "maxRounds": 5,
  "roleGenerationMode": "parallel"
}
```

### Ollama 本地配置
```json
{
  "aiModel": {
    "type": "ollama",
    "baseUrl": "http://localhost:11434",
    "model": "llama2",
    "temperature": 0.7,
    "maxTokens": 1000,
    "timeoutSeconds": 30
  },
  "maxRounds": 5,
  "roleGenerationMode": "parallel"
}
```

## 4. 测试配置

配置完成后，应用程序会自动测试AI连接。如果看到"OpenAI可用模型数量"的提示，说明配置成功。

## 5. 注意事项

⚠️ **安全提醒**：
- 不要将API密钥提交到代码仓库
- 不要分享你的API密钥
- 定期更换API密钥
- 监控API使用情况

🔧 **故障排除**：
- 如果连接失败，检查API密钥是否正确
- 确保网络连接正常
- 验证API服务是否可用
- 检查API余额是否充足

## 6. 支持的AI服务

- DeepSeek V3.1 (推荐)
- OpenAI GPT系列
- 任何OpenAI兼容的API服务
- Ollama (本地模型)

---

**注意**：配置信息会保存在浏览器的localStorage中，清除浏览器数据会丢失配置。