# YAML配置文件使用说明

## 概述

为了方便配置管理，我创建了一个YAML配置文件系统来替代localStorage存储。这样你可以更容易地备份和迁移配置。

## 文件说明

### 1. config.yaml
这是主要的配置文件，包含所有AI服务和讨论设置的配置信息。

### 2. config-loader.js
配置加载器，用于：
- 从YAML文件加载配置
- 验证配置格式
- 转换为应用可用的格式
- 创建配置模板

## 使用方法

### 步骤1：编辑配置文件

打开 `config.yaml` 文件，修改以下内容：

```yaml
ai_config:
  base_url: "https://api.siliconflow.cn/v1/"
  api_key: "sk-your-real-api-key-here"  # 替换为你的真实API密钥
  model: "Pro/deepseek-ai/DeepSeek-V3.1"
```

### 步骤2：验证配置

在项目根目录运行：

```bash
node config-loader.js
```

如果配置正确，你会看到：
```
配置文件加载成功
配置验证通过
配置加载成功: {...}
```

### 步骤3：在应用中使用配置

在浏览器的开发者工具Console中运行：

```javascript
// 手动加载YAML配置到localStorage
fetch('file:///D:/CODE/AiRoundChair/config.yaml')
  .then(response => response.text())
  .then(yamlText => {
    // 这里需要手动解析YAML并转换为应用配置格式
    // 然后保存到localStorage
    const config = {
      aiModel: {
        type: 'openai',
        baseUrl: 'https://api.siliconflow.cn/v1/',
        apiKey: 'sk-your-real-api-key-here',
        model: 'Pro/deepseek-ai/DeepSeek-V3.1',
        temperature: 0.7,
        maxTokens: 2000,
        timeoutSeconds: 60
      },
      maxRounds: 5,
      roleGenerationMode: 'parallel',
      convergenceThreshold: 0.8,
      enableRealTimeAnalysis: true
    };
    
    localStorage.setItem('intelliround-config', JSON.stringify(config));
    console.log('配置已导入到localStorage');
  });
```

## 安全注意事项

⚠️ **重要提醒**：

1. **不要提交到GitHub**：`.gitignore`文件已配置，确保`config.yaml`不会被提交
2. **妥善保管**：API密钥具有访问权限，请妥善保管配置文件
3. **定期更换**：建议定期更换API密钥
4. **权限控制**：确保只有授权用户能访问此文件

## 配置备份

建议定期备份你的配置文件：

```bash
# 备份配置
cp config.yaml config-backup-$(date +%Y%m%d).yaml

# 恢复配置
cp config-backup-20240910.yaml config.yaml
```

## 故障排除

### 常见问题

1. **配置文件不存在**
   ```bash
   node config-loader.js
   ```
   这会自动创建一个配置模板

2. **YAML格式错误**
   - 检查缩进是否正确
   - 确保字符串用引号包围
   - 验证所有必需字段都存在

3. **API密钥无效**
   - 确认API密钥正确
   - 检查API服务是否可用
   - 验证账户余额

## 高级用法

### 多环境配置

你可以创建多个配置文件：
- `config-dev.yaml` - 开发环境
- `config-prod.yaml` - 生产环境

### 动态配置

在应用中添加配置切换功能：

```javascript
// 切换配置环境
function switchConfig(env) {
  fetch(`config-${env}.yaml`)
    .then(response => response.text())
    .then(loadConfigToApp);
}
```

---

**注意**：虽然现在有了YAML配置文件，但应用仍然主要使用localStorage存储运行时配置。你可以使用这个YAML文件作为配置的备份和迁移工具。