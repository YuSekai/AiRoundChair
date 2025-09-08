import { AIModelConfig } from '../types';
import axios from 'axios';

export class AIDiagnosticTool {
  static async diagnoseConnection(config: AIModelConfig): Promise<{
    success: boolean;
    issues: string[];
    suggestions: string[];
  }> {
    const issues: string[] = [];
    const suggestions: string[] = [];

    try {
      // 基础配置检查
      if (!config.baseUrl) {
        issues.push('API 地址未配置');
        suggestions.push('请在配置中设置正确的 API 地址');
      }

      if (!config.model) {
        issues.push('模型名称未配置');
        suggestions.push('请指定要使用的 AI 模型名称');
      }

      if (config.type === 'openai' && !config.apiKey) {
        issues.push('OpenAI API Key 未配置');
        suggestions.push('使用 OpenAI 格式 API 需要提供有效的 API Key');
      }

      // 网络连通性检查
      if (config.type === 'ollama') {
        await this.diagnoseOllama(config, issues, suggestions);
      } else if (config.type === 'openai') {
        await this.diagnoseOpenAI(config, issues, suggestions);
      }

      return {
        success: issues.length === 0,
        issues,
        suggestions
      };
    } catch (error) {
      issues.push('诊断过程出现错误');
      suggestions.push('请检查网络连接和配置信息');
      return { success: false, issues, suggestions };
    }
  }

  private static async diagnoseOllama(
    config: AIModelConfig, 
    issues: string[], 
    suggestions: string[]
  ): Promise<void> {
    try {
      // 检查基础连接
      const client = axios.create({
        baseURL: config.baseUrl,
        timeout: 5000
      });

      try {
        await client.get('/api/tags');
      } catch (error: any) {
        if (error.code === 'ECONNREFUSED') {
          issues.push('Ollama 服务未启动或无法连接');
          suggestions.push('请启动 Ollama 服务，确保运行在 http://localhost:11434');
        } else if (error.code === 'ENOTFOUND') {
          issues.push('无法解析主机地址');
          suggestions.push('请检查 API 地址是否正确');
        } else {
          issues.push(`连接错误: ${error.message}`);
          suggestions.push('请检查 Ollama 服务状态和网络连接');
        }
        return;
      }

      // 检查模型是否可用
      try {
        const response = await client.get('/api/tags');
        const models = response.data.models || [];
        const hasModel = models.some((model: any) => model.name === config.model);
        
        if (!hasModel) {
          issues.push(`模型 "${config.model}" 未安装`);
          suggestions.push(`请运行 "ollama pull ${config.model}" 下载模型`);
          suggestions.push(`可用模型: ${models.map((m: any) => m.name).join(', ')}`);
        }
      } catch (error) {
        issues.push('无法获取模型列表');
        suggestions.push('请检查 Ollama 服务是否正常运行');
      }

    } catch (error) {
      issues.push('Ollama 连接诊断失败');
      suggestions.push('请检查 Ollama 服务配置');
    }
  }

  private static async diagnoseOpenAI(
    config: AIModelConfig, 
    issues: string[], 
    suggestions: string[]
  ): Promise<void> {
    try {
      const client = axios.create({
        baseURL: config.baseUrl,
        timeout: 8000,
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      try {
        await client.get('/models');
      } catch (error: any) {
        if (error.response?.status === 401) {
          issues.push('API Key 无效或已过期');
          suggestions.push('请检查 API Key 是否正确设置');
        } else if (error.response?.status === 403) {
          issues.push('API Key 权限不足');
          suggestions.push('请确保 API Key 有访问模型的权限');
        } else if (error.code === 'ENOTFOUND') {
          issues.push('无法解析 API 地址');
          suggestions.push('请检查 API 地址是否正确');
        } else {
          issues.push(`API 连接错误: ${error.message}`);
          suggestions.push('请检查网络连接和 API 配置');
        }
        return;
      }

      // 检查模型是否可用
      try {
        const response = await client.get('/models');
        const models = response.data.data || [];
        const hasModel = models.some((model: any) => model.id === config.model);
        
        if (!hasModel) {
          issues.push(`模型 "${config.model}" 不可用`);
          suggestions.push('请检查模型名称是否正确');
          suggestions.push('常用模型: gpt-3.5-turbo, gpt-4');
        }
      } catch (error) {
        issues.push('无法获取模型列表');
        suggestions.push('请检查 API 权限设置');
      }

    } catch (error) {
      issues.push('OpenAI API 连接诊断失败');
      suggestions.push('请检查 API 配置和网络连接');
    }
  }

  static generateDiagnosticReport(diagnosis: {
    success: boolean;
    issues: string[];
    suggestions: string[];
  }): string {
    let report = '# AI 连接诊断报告\n\n';
    
    if (diagnosis.success) {
      report += '✅ **状态**: 连接正常\n';
      report += '所有检查项目均通过，AI 模型可以正常使用。\n';
    } else {
      report += '❌ **状态**: 发现问题\n\n';
      
      if (diagnosis.issues.length > 0) {
        report += '## 发现的问题\n';
        diagnosis.issues.forEach((issue, index) => {
          report += `${index + 1}. ${issue}\n`;
        });
        report += '\n';
      }
      
      if (diagnosis.suggestions.length > 0) {
        report += '## 解决建议\n';
        diagnosis.suggestions.forEach((suggestion, index) => {
          report += `${index + 1}. ${suggestion}\n`;
        });
        report += '\n';
      }
    }
    
    report += '---\n';
    report += `*诊断时间: ${new Date().toLocaleString('zh-CN')}*\n`;
    
    return report;
  }
}