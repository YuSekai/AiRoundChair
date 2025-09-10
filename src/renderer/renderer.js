// 应用状态
let currentConfig = null;
let currentDebate = null;
let isDebating = false;
let currentEditingRoleIndex = -1; // 当前编辑的角色索引

// DOM 元素
const elements = {
  // 配置相关
  openConfig: document.getElementById('openConfig'),
  closeConfig: document.getElementById('closeConfig'),
  configModal: document.getElementById('configModal'),
  aiType: document.getElementById('aiType'),
  baseUrl: document.getElementById('baseUrl'),
  apiKey: document.getElementById('apiKey'),
  modelName: document.getElementById('modelName'),
  temperature: document.getElementById('temperature'),
  temperatureValue: document.getElementById('temperatureValue'),
  maxTokens: document.getElementById('maxTokens'),
  timeoutSeconds: document.getElementById('timeoutSeconds'),
  maxRounds: document.getElementById('maxRounds'),
  roleGenerationMode: document.getElementById('roleGenerationMode'),
  testConnection: document.getElementById('testConnection'),
  saveConfig: document.getElementById('saveConfig'),
  
  // 辩论相关
  debateTopic: document.getElementById('debateTopic'),
  startDebate: document.getElementById('startDebate'),
  
  // 界面区域
  debateInput: document.getElementById('debateInput'),
  debateArea: document.getElementById('debateArea'),
  rolePreviewArea: document.getElementById('rolePreviewArea'),
  
  // 角色预览相关
  previewTopic: document.getElementById('previewTopic'),
  rolesPreviewGrid: document.getElementById('rolesPreviewGrid'),
  generationStats: document.getElementById('generationStats'),
  generationTime: document.getElementById('generationTime'),
  successRate: document.getElementById('successRate'),
  generationMode: document.getElementById('generationMode'),
  confirmRoles: document.getElementById('confirmRoles'),
  regenerateRoles: document.getElementById('regenerateRoles'),
  backToInput: document.getElementById('backToInput'),
  
  // 辩论显示
  currentTopic: document.getElementById('currentTopic'),
  rolesGrid: document.getElementById('rolesGrid'),
  statusText: document.getElementById('statusText'),
  roundInfo: document.getElementById('roundInfo'),
  statementsList: document.getElementById('statementsList'),
  
  // 新增：聊天界面元素
  chatMessages: document.getElementById('chatMessages'),
  thinkingIndicator: document.getElementById('thinkingIndicator'),
  thinkingText: document.getElementById('thinkingText'),
  
  consensusSection: document.getElementById('consensusSection'),
  consensusContent: document.getElementById('consensusContent'),
  
  // 操作按钮
  stopDebate: document.getElementById('stopDebate'),
  exportJson: document.getElementById('exportJson'),
  exportMarkdown: document.getElementById('exportMarkdown'),
  newDebate: document.getElementById('newDebate'),
  
  // 新增：连续讨论相关
  continueDebate: document.getElementById('continueDebate'),
  continueDebateModal: document.getElementById('continueDebateModal'),
  closeContinueModal: document.getElementById('closeContinueModal'),
  previousConsensusText: document.getElementById('previousConsensusText'),
  suggestedQuestions: document.getElementById('suggestedQuestions'),
  customQuestion: document.getElementById('customQuestion'),
  autoGenerateTopic: document.getElementById('autoGenerateTopic'),
  confirmContinue: document.getElementById('confirmContinue'),
  cancelContinue: document.getElementById('cancelContinue'),
  
  // 状态
  aiStatus: document.getElementById('aiStatus'),
  loadingOverlay: document.getElementById('loadingOverlay'),
  loadingText: document.getElementById('loadingText'),
  toastContainer: document.getElementById('toastContainer'),
  
  // 历史记录相关
  showHistory: document.getElementById('showHistory'),
  historyModal: document.getElementById('historyModal'),
  closeHistoryModal: document.getElementById('closeHistoryModal'),
  historyStats: document.getElementById('historyStats'),
  totalSessions: document.getElementById('totalSessions'),
  completedSessions: document.getElementById('completedSessions'),
  averageDuration: document.getElementById('averageDuration'),
  continuationChains: document.getElementById('continuationChains'),
  historySearch: document.getElementById('historySearch'),
  statusFilter: document.getElementById('statusFilter'),
  sortBy: document.getElementById('sortBy'),
  sortOrder: document.getElementById('sortOrder'),
  refreshHistory: document.getElementById('refreshHistory'),
  scanFileHistory: document.getElementById('scanFileHistory'),
  exportHistory: document.getElementById('exportHistory'),
  importHistory: document.getElementById('importHistory'),
  clearHistory: document.getElementById('clearHistory'),
  historyList: document.getElementById('historyList'),
  emptyHistoryState: document.getElementById('emptyHistoryState'),
  
  // 角色编辑相关
  roleEditModal: document.getElementById('roleEditModal'),
  closeRoleEditModal: document.getElementById('closeRoleEditModal'),
  editRoleName: document.getElementById('editRoleName'),
  editRoleBackground: document.getElementById('editRoleBackground'),
  editRoleStance: document.getElementById('editRoleStance'),
  editRolePersonality: document.getElementById('editRolePersonality'),
  editRoleExpertise: document.getElementById('editRoleExpertise'),
  saveRoleEdit: document.getElementById('saveRoleEdit'),
  cancelRoleEdit: document.getElementById('cancelRoleEdit')
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  initializeEventListeners();
  loadDefaultConfig();
  updateAITypeFields();
  // 自动检测AI连接状态
  checkInitialAIStatus();
  
  // 监听主进程事件
  if (window.electronAPI) {
    // 监听 YAML 配置加载事件
    window.electronAPI.onYAMLConfigLoaded((config) => {
      console.log('收到来自 YAML 文件的配置:', config);
      // 将配置保存到 localStorage
      localStorage.setItem('intelliround-config', JSON.stringify(config));
      // 如果当前没有配置，或者配置不完整，则应用新配置
      const currentConfig = getCurrentConfig();
      if (!currentConfig.aiModel.apiKey) {
        applyConfig(config);
        showToast('配置已加载', '已从 config.yaml 文件加载配置', 'success');
      }
    });
    
    window.electronAPI.onNewDebate(() => {
      resetToNewDebate();
    });
    
    window.electronAPI.onExportDebate((format) => {
      exportDebate(format);
    });
    
    // 历史记录相关事件
    window.electronAPI.onShowHistory(() => {
      showHistoryModal();
    });
    
    window.electronAPI.onExportHistory(() => {
      exportHistoryData();
    });
    
    window.electronAPI.onImportHistory(() => {
      importHistoryData();
    });
    
    window.electronAPI.onClearHistory(() => {
      clearHistoryData();
    });
    
    // 新增：实时辩论事件监听
    window.electronAPI.onRoleThinking((data) => {
      showRoleThinking(data);
    });
    
    window.electronAPI.onRoleStatementReady((statement) => {
      addChatMessage(statement);
      hideRoleThinking();
    });
    
    window.electronAPI.onRoleError((data) => {
      hideRoleThinking();
      showToast('角色错误', `${data.roleName}: ${data.error}`, 'error');
    });
    
    window.electronAPI.onDebateCompleted((session) => {
      hideRoleThinking();
      // 更新当前辩论数据
      currentDebate = session;
      if (session.consensus) {
        showConsensus(session.consensus);
      }
      showToast('辩论完成', '所有角色已完成讨论', 'success');
      isDebating = false;
    });
    
    // 新增：辩论状态更新监听
    window.electronAPI.onDebateStatusUpdate((data) => {
      updateDebateStatus(data.status, data.round);
      if (data.message) {
        console.log('辩论状态:', data.message);
      }
    });
  }
});

// 事件监听器设置
function initializeEventListeners() {
  // 模态对话框相关
  elements.openConfig.addEventListener('click', openConfigModal);
  elements.closeConfig.addEventListener('click', closeConfigModal);
  elements.configModal.addEventListener('click', (e) => {
    if (e.target === elements.configModal) {
      closeConfigModal();
    }
  });
  
  // 配置相关
  elements.aiType.addEventListener('change', updateAITypeFields);
  elements.temperature.addEventListener('input', updateTemperatureDisplay);
  elements.testConnection.addEventListener('click', testConnection);
  elements.saveConfig.addEventListener('click', saveConfiguration);
  
  // 添加自动修复按钮事件监听器
  const autoFixBtn = document.getElementById('autoFixConnection');
  if (autoFixBtn) {
    autoFixBtn.addEventListener('click', autoFixConnection);
  }
  
  // 添加YAML配置导入按钮事件监听器
  const importYAMLBtn = document.getElementById('importYAMLConfig');
  if (importYAMLBtn) {
    importYAMLBtn.addEventListener('click', importYAMLConfiguration);
  }
  
  // 辩论相关
  elements.startDebate.addEventListener('click', startDebate);
  elements.stopDebate.addEventListener('click', stopDebate);
  elements.exportJson.addEventListener('click', () => exportDebate('json'));
  elements.exportMarkdown.addEventListener('click', () => exportDebate('markdown'));
  elements.newDebate.addEventListener('click', resetToNewDebate);
  
  // 连续讨论相关
  elements.continueDebate.addEventListener('click', showContinueDebateModal);
  elements.closeContinueModal.addEventListener('click', closeContinueDebateModal);
  elements.cancelContinue.addEventListener('click', closeContinueDebateModal);
  elements.confirmContinue.addEventListener('click', startContinuationDebate);
  
  // 连续讨论模态框点击外部关闭
  elements.continueDebateModal.addEventListener('click', (e) => {
    if (e.target === elements.continueDebateModal) {
      closeContinueDebateModal();
    }
  });
  
  // 历史记录相关
  elements.showHistory.addEventListener('click', showHistoryModal);
  elements.closeHistoryModal.addEventListener('click', closeHistoryModal);
  elements.refreshHistory.addEventListener('click', loadHistory);
  elements.scanFileHistory.addEventListener('click', scanAndImportFileHistory);
  elements.exportHistory.addEventListener('click', exportHistoryData);
  elements.importHistory.addEventListener('click', importHistoryData);
  elements.clearHistory.addEventListener('click', clearHistoryData);
  
  // 历史记录筛选
  elements.historySearch.addEventListener('input', filterHistory);
  elements.statusFilter.addEventListener('change', filterHistory);
  elements.sortBy.addEventListener('change', filterHistory);
  elements.sortOrder.addEventListener('change', filterHistory);
  
  // 历史记录模态框点击外部关闭
  elements.historyModal.addEventListener('click', (e) => {
    if (e.target === elements.historyModal) {
      closeHistoryModal();
    }
  });
  
  // 角色编辑相关
  elements.closeRoleEditModal.addEventListener('click', closeRoleEditModal);
  elements.cancelRoleEdit.addEventListener('click', closeRoleEditModal);
  elements.saveRoleEdit.addEventListener('click', saveRoleEditChanges);
  
  // 角色编辑模态框点击外部关闭
  elements.roleEditModal.addEventListener('click', (e) => {
    if (e.target === elements.roleEditModal) {
      closeRoleEditModal();
    }
  });
  
  // 角色预览相关
  elements.confirmRoles.addEventListener('click', confirmRoles);
  elements.regenerateRoles.addEventListener('click', regenerateRoles);
  elements.backToInput.addEventListener('click', backToInput);

  // 键盘事件
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && elements.configModal.style.display !== 'none') {
      closeConfigModal();
    }
  });
}

// 打开配置模态框
function openConfigModal() {
  // 加载当前配置到表单
  const config = getCurrentConfig();
  console.log('加载配置到表单:', config);
  
  if (config && config.aiModel) {
    document.getElementById('aiType').value = config.aiModel.type || 'openai';
    document.getElementById('baseUrl').value = config.aiModel.baseUrl || 'https://api.siliconflow.cn/v1/';
    document.getElementById('apiKey').value = config.aiModel.apiKey || '';
    document.getElementById('modelName').value = config.aiModel.model || 'Pro/deepseek-ai/DeepSeek-V3.1';
    document.getElementById('temperature').value = config.aiModel.temperature || 0.7;
    document.getElementById('maxTokens').value = config.aiModel.maxTokens || 1000;
    document.getElementById('timeoutSeconds').value = config.aiModel.timeoutSeconds || 30;
    document.getElementById('maxRounds').value = config.maxRounds || 5;
    
    // 更新温度显示
    document.getElementById('temperatureValue').textContent = config.aiModel.temperature || 0.7;
    
    // 设置角色生成模式
    document.getElementById('roleGenerationMode').value = config.roleGenerationMode || 'parallel';
    
    // 更新AI类型相关字段显示
    updateAITypeFields();
  }
  
  elements.configModal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

// 关闭配置模态框
function closeConfigModal() {
  elements.configModal.style.display = 'none';
  document.body.style.overflow = '';
}

// 更新AI类型相关字段
function updateAITypeFields() {
  const aiType = elements.aiType.value;
  
  if (aiType === 'ollama') {
    // 只在URL为空或为OpenAI默认URL时才设置默认URL
    if (!elements.baseUrl.value || elements.baseUrl.value === 'https://api.openai.com/v1') {
      elements.baseUrl.value = 'http://localhost:11434';
    }
    elements.apiKey.style.display = 'none';
    elements.apiKey.previousElementSibling.style.display = 'none';
    elements.modelName.placeholder = 'llama2';
  } else {
    // 只在URL为空或为Ollama默认URL时才设置默认URL
    if (!elements.baseUrl.value || elements.baseUrl.value === 'http://localhost:11434') {
      elements.baseUrl.value = 'https://api.openai.com/v1';
    }
    elements.apiKey.style.display = 'block';
    elements.apiKey.previousElementSibling.style.display = 'block';
    elements.modelName.placeholder = 'gpt-3.5-turbo';
  }
}

// 只更新字段可见性，不修改URL值
function updateAITypeFieldsVisibility() {
  const aiType = elements.aiType.value;
  
  if (aiType === 'ollama') {
    elements.apiKey.style.display = 'none';
    elements.apiKey.previousElementSibling.style.display = 'none';
    elements.modelName.placeholder = 'llama2';
  } else {
    elements.apiKey.style.display = 'block';
    elements.apiKey.previousElementSibling.style.display = 'block';
    elements.modelName.placeholder = 'gpt-3.5-turbo';
  }
}

// 更新温度显示
function updateTemperatureDisplay() {
  elements.temperatureValue.textContent = elements.temperature.value;
}

// 加载默认配置
function loadDefaultConfig() {
  const saved = localStorage.getItem('intelliround-config');
  if (saved) {
    try {
      const config = JSON.parse(saved);
      applyConfig(config);
    } catch (error) {
      console.warn('Failed to load saved config:', error);
    }
  }
}

// 应用配置到界面
function applyConfig(config) {
  if (config.aiModel) {
    elements.aiType.value = config.aiModel.type || 'ollama';
    // 先更新字段可见性，但不设置URL默认值
    updateAITypeFieldsVisibility();
    // 再应用保存的配置值
    elements.baseUrl.value = config.aiModel.baseUrl || (config.aiModel.type === 'ollama' ? 'http://localhost:11434' : 'https://api.openai.com/v1');
    elements.apiKey.value = config.aiModel.apiKey || '';
    elements.modelName.value = config.aiModel.model || (config.aiModel.type === 'ollama' ? 'llama2' : 'gpt-3.5-turbo');
    elements.temperature.value = config.aiModel.temperature || 0.7;
    elements.maxTokens.value = config.aiModel.maxTokens || 1000;
    elements.timeoutSeconds.value = config.aiModel.timeoutSeconds || 30;
    updateTemperatureDisplay();
  }
  
  if (config.maxRounds) {
    elements.maxRounds.value = config.maxRounds;
  }
  
  if (config.roleGenerationMode !== undefined) {
    elements.roleGenerationMode.value = config.roleGenerationMode;
  }
}

// 测试连接
async function testConnection() {
  const config = getCurrentConfig();
  
  console.log('测试连接配置:', config.aiModel);
  showLoading('测试连接中...');
  elements.testConnection.disabled = true;
  
  // 设置超时处理，使用配置中的超时 + 2秒缓冲
  const configTimeoutMs = (config.aiModel.timeoutSeconds || 30) * 1000;
  const frontendTimeoutMs = configTimeoutMs + 2000; // 前端超时比后端多2秒
  const timeoutId = setTimeout(() => {
    hideLoading();
    elements.testConnection.disabled = false;
    showToast('连接超时', '测试连接超时，请检查配置', 'error');
    updateAIStatus(false);
  }, frontendTimeoutMs);
  
  try {
    const result = await window.electronAPI.testConnection(config.aiModel);
    clearTimeout(timeoutId);
    hideLoading();
    
    console.log('测试连接结果:', result);
    
    if (result.success) {
      showToast('连接成功', '成功连接到 AI 模型', 'success');
      updateAIStatus(true);
    } else {
      const errorMsg = result.error || '无法连接到 AI 模型';
      showToast('连接失败', errorMsg, 'error');
      updateAIStatus(false);
      
      // 显示详细诊断信息
      if (result.diagnosis) {
        console.log('诊断结果:', result.diagnosis);
        if (result.diagnosis.issues && result.diagnosis.issues.length > 0) {
          showToast('诊断报告', `发现 ${result.diagnosis.issues.length} 个问题，请查看控制台获取详细信息`, 'warning');
          
          // 显示详细问题和建议
          console.group('🔍 详细诊断报告');
          console.log('问题:');
          result.diagnosis.issues.forEach((issue, index) => {
            console.log(`  ${index + 1}. ${issue}`);
          });
          console.log('建议:');
          result.diagnosis.suggestions.forEach((suggestion, index) => {
            console.log(`  ${index + 1}. ${suggestion}`);
          });
          console.groupEnd();
        }
      }
      
      // 提供具体的解决建议
      if (config.aiModel.type === 'ollama') {
        console.log('💡 Ollama 故障排查:');
        console.log('1. 检查 Ollama 服务: ollama list');
        console.log('2. 启动 Ollama: ollama serve');
        console.log(`3. 下载模型: ollama pull ${config.aiModel.model}`);
      } else {
        console.log('💡 OpenAI API 故障排查:');
        console.log('1. 检查 API Key 是否正确');
        console.log('2. 检查 API 地址是否正确');
        console.log('3. 检查网络连接');
      }
    }
  } catch (error) {
    clearTimeout(timeoutId);
    hideLoading();
    console.error('测试连接异常:', error);
    showToast('连接错误', error.message, 'error');
    updateAIStatus(false);
  }
  
  elements.testConnection.disabled = false;
}

// 自动修复连接
async function autoFixConnection() {
  const config = getCurrentConfig();
  
  console.log('开始自动修复连接:', config.aiModel);
  showLoading('自动诊断和修复连接问题...');
  
  const autoFixBtn = document.getElementById('autoFixConnection');
  if (autoFixBtn) {
    autoFixBtn.disabled = true;
  }
  
  // 设置超时处理，使用配置中的超时 * 3（修复可能需要更长时间）
  const configTimeoutMs = (config.aiModel.timeoutSeconds || 30) * 1000;
  const fixTimeoutMs = configTimeoutMs * 3; // 修复时间为配置超时的3倍
  const timeoutId = setTimeout(() => {
    hideLoading();
    if (autoFixBtn) {
      autoFixBtn.disabled = false;
    }
    showToast('修复超时', '自动修复超时，请手动检查配置', 'error');
  }, fixTimeoutMs);
  
  try {
    const result = await window.electronAPI.autoFixConnection(config.aiModel);
    clearTimeout(timeoutId);
    hideLoading();
    
    console.log('自动修复结果:', result);
    
    if (result.success && result.fixedConfig) {
      // 应用修复后的配置
      applyAIConfig(result.fixedConfig);
      
      let successMsg = '自动修复成功！';
      if (result.fixes && result.fixes.length > 0) {
        successMsg += '\n修复项目: ' + result.fixes.join(', ');
      }
      
      showToast('修复成功', successMsg, 'success');
      
      // 显示修复详情
      console.group('🔧 自动修复报告');
      if (result.issues && result.issues.length > 0) {
        console.log('检测到的问题:');
        result.issues.forEach((issue, index) => {
          console.log(`  ${index + 1}. ${issue}`);
        });
      }
      if (result.fixes && result.fixes.length > 0) {
        console.log('已应用的修复:');
        result.fixes.forEach((fix, index) => {
          console.log(`  ${index + 1}. ${fix}`);
        });
      }
      if (result.suggestions && result.suggestions.length > 0) {
        console.log('建议:');
        result.suggestions.forEach((suggestion, index) => {
          console.log(`  ${index + 1}. ${suggestion}`);
        });
      }
      console.groupEnd();
      
      // 自动测试修复后的连接
      setTimeout(() => {
        testConnection();
      }, 1000);
      
    } else {
      let errorMsg = '自动修复未能解决所有问题';
      if (result.issues && result.issues.length > 0) {
        errorMsg += '\n发现问题: ' + result.issues.join(', ');
      }
      
      showToast('修复部分成功', errorMsg, 'warning');
      
      // 显示详细诊断信息
      console.group('🔍 诊断报告');
      if (result.issues && result.issues.length > 0) {
        console.log('仍存在的问题:');
        result.issues.forEach((issue, index) => {
          console.log(`  ${index + 1}. ${issue}`);
        });
      }
      if (result.suggestions && result.suggestions.length > 0) {
        console.log('建议手动处理:');
        result.suggestions.forEach((suggestion, index) => {
          console.log(`  ${index + 1}. ${suggestion}`);
        });
      }
      console.groupEnd();
    }
  } catch (error) {
    clearTimeout(timeoutId);
    hideLoading();
    console.error('自动修复异常:', error);
    showToast('修复错误', error.message, 'error');
  }
  
  if (autoFixBtn) {
    autoFixBtn.disabled = false;
  }
}

// 应用AI配置到界面
function applyAIConfig(aiConfig) {
  if (aiConfig.type) elements.aiType.value = aiConfig.type;
  if (aiConfig.baseUrl) elements.baseUrl.value = aiConfig.baseUrl;
  if (aiConfig.apiKey) elements.apiKey.value = aiConfig.apiKey;
  if (aiConfig.model) elements.modelName.value = aiConfig.model;
  if (aiConfig.temperature !== undefined) {
    elements.temperature.value = aiConfig.temperature;
    updateTemperatureDisplay();
  }
  if (aiConfig.maxTokens) elements.maxTokens.value = aiConfig.maxTokens;
  
  updateAITypeFields();
}

// 检查初始AI连接状态
async function checkInitialAIStatus() {
  try {
    const config = getCurrentConfig();
    if (config && config.aiModel && config.aiModel.apiKey) {
      console.log('检测到API密钥，开始测试连接...');
      // 静默检测AI连接状态
      const result = await window.electronAPI.testConnection(config.aiModel);
      updateAIStatus(result.success);
    } else {
      console.log('未设置API密钥，跳过连接测试');
      updateAIStatus(false);
    }
  } catch (error) {
    // 静默失败，保持默认的"未连接"状态
    console.log('初始AI状态检测失败:', error.message);
    updateAIStatus(false);
  }
}

// 保存配置
async function saveConfiguration() {
  try {
    // 从表单字段获取配置值
    const config = {
      aiModel: {
        type: document.getElementById('aiType').value,
        baseUrl: document.getElementById('baseUrl').value,
        apiKey: document.getElementById('apiKey').value,
        model: document.getElementById('modelName').value,
        temperature: parseFloat(document.getElementById('temperature').value),
        maxTokens: parseInt(document.getElementById('maxTokens').value),
        timeoutSeconds: parseInt(document.getElementById('timeoutSeconds').value)
      },
      maxRounds: parseInt(document.getElementById('maxRounds').value),
      roleGenerationMode: document.getElementById('roleGenerationMode').value,
      convergenceThreshold: 0.8,
      enableRealTimeAnalysis: true
    };
    
    console.log('保存配置:', config);
    localStorage.setItem('intelliround-config', JSON.stringify(config));
    currentConfig = config;
    
    // 保存配置后自动检测AI连接状态
    try {
      const result = await window.electronAPI.testConnection(config.aiModel);
      updateAIStatus(result.success);
    } catch (error) {
      updateAIStatus(false);
    }
    
    // 设置角色生成模式
    const useParallel = config.roleGenerationMode === 'parallel';
    await window.electronAPI.setRoleGenerationMode(useParallel);
    
    showToast('配置已保存', '配置信息已成功保存', 'success');
    closeConfigModal();
  } catch (error) {
    showToast('保存失败', error.message, 'error');
  }
}

// 导入YAML配置文件
async function importYAMLConfiguration() {
  try {
    const result = await window.electronAPI.importYAMLConfig();
    
    if (result.success) {
      const config = result.data;
      
      // 将配置应用到表单
      document.getElementById('aiType').value = config.aiModel.type;
      document.getElementById('baseUrl').value = config.aiModel.baseUrl;
      document.getElementById('apiKey').value = config.aiModel.apiKey;
      document.getElementById('modelName').value = config.aiModel.model;
      document.getElementById('temperature').value = config.aiModel.temperature;
      document.getElementById('maxTokens').value = config.aiModel.maxTokens;
      document.getElementById('timeoutSeconds').value = config.aiModel.timeoutSeconds;
      document.getElementById('maxRounds').value = config.maxRounds;
      document.getElementById('roleGenerationMode').value = config.roleGenerationMode;
      
      // 更新温度显示
      updateTemperatureDisplay();
      
      // 更新AI类型字段
      updateAITypeFields();
      
      // 保存配置到localStorage
      localStorage.setItem('intelliround-config', JSON.stringify(config));
      currentConfig = config;
      
      // 测试连接
      try {
        const connectionResult = await window.electronAPI.testConnection(config.aiModel);
        updateAIStatus(connectionResult.success);
      } catch (error) {
        updateAIStatus(false);
      }
      
      // 设置角色生成模式
      const useParallel = config.roleGenerationMode === 'parallel';
      await window.electronAPI.setRoleGenerationMode(useParallel);
      
      showToast('YAML配置已导入', '配置文件已成功导入并应用', 'success');
    } else {
      showToast('导入失败', result.error, 'error');
    }
  } catch (error) {
    showToast('导入失败', error.message, 'error');
  }
}

// 获取当前配置
function getCurrentConfig() {
  // 首先尝试从localStorage获取配置
  const saved = localStorage.getItem('intelliround-config');
  if (saved) {
    try {
      const config = JSON.parse(saved);
      console.log('使用localStorage中的配置:', config);
      return config;
    } catch (error) {
      console.warn('解析localStorage配置失败:', error);
    }
  }
  
  // 如果没有保存的配置，使用默认的DeepSeek配置
  const defaultConfig = {
    aiModel: {
      type: 'openai',
      baseUrl: 'https://api.siliconflow.cn/v1/',
      apiKey: '', // 用户需要设置自己的API密钥
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
  
  console.log('使用默认DeepSeek配置:', defaultConfig);
  return defaultConfig;
}

// 开始辩论 - 修改为先生成角色预览
async function startDebate() {
  const topic = elements.debateTopic.value.trim();
  if (!topic) {
    showToast('输入错误', '请输入辩论议题', 'warning');
    return;
  }
  
  const config = getCurrentConfig();
  
  showLoading('正在生成AI角色...');
  elements.startDebate.disabled = true;
  
  // 设置超时处理，使用配置中的超时时间
  const configTimeoutMs = (config.aiModel.timeoutSeconds || 30) * 1000;
  const timeoutId = setTimeout(() => {
    hideLoading();
    elements.startDebate.disabled = false;
    showToast('生成超时', '角色生成超时，请检查AI配置和网络连接', 'error');
  }, configTimeoutMs);
  
  try {
    // 只生成角色，不开始辩论
    console.log('发送角色生成请求:', { topic, config });
    
    // 调用后端的角色生成接口
    const result = await window.electronAPI.generateRoles(topic, config);
    
    clearTimeout(timeoutId);
    
    if (result.success) {
      // 显示角色预览界面
      showRolePreview(topic, result.data.roles, result.data.stats);
      showToast('角色生成成功', `已成功生成${result.data.roles.length}个角色`, 'success');
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('角色生成失败:', error);
    showToast('生成失败', error.message, 'error');
  }
  
  hideLoading();
  elements.startDebate.disabled = false;
}

// 显示角色预览界面
function showRolePreview(topic, roles, stats) {
  // 隐藏输入区域，显示预览区域
  elements.debateInput.style.display = 'none';
  elements.debateArea.style.display = 'none';
  elements.rolePreviewArea.style.display = 'block';
  
  // 设置议题
  elements.previewTopic.textContent = topic;
  
  // 显示角色卡片
  displayRolePreviewCards(roles);
  
  // 显示统计信息
  if (stats) {
    displayGenerationStats(stats);
  }
  
  // 存储当前数据供后续使用
  window.currentPreviewData = {
    topic: topic,
    roles: roles,
    stats: stats
  };
}

// 显示角色预览卡片
function displayRolePreviewCards(roles) {
  elements.rolesPreviewGrid.innerHTML = '';
  
  roles.forEach((role, index) => {
    const roleCard = document.createElement('div');
    roleCard.className = 'role-preview-card';
    roleCard.innerHTML = `
      <div class="role-header">
        <div class="role-name">${role.name}</div>
        <div class="role-actions">
          <button class="btn btn-small btn-secondary" onclick="editRole(${index})">编辑</button>
          <button class="btn btn-small btn-warning" onclick="regenerateSingleRole(${index})">重新生成</button>
        </div>
      </div>
      <div class="role-info"><strong>背景：</strong>${role.background}</div>
      <div class="role-info"><strong>立场：</strong>${role.stance}</div>
      <div class="role-info"><strong>性格：</strong>${role.personality}</div>
      <div class="role-expertise">
        ${role.expertise.map(exp => `<span class="expertise-tag">${exp}</span>`).join('')}
      </div>
    `;
    elements.rolesPreviewGrid.appendChild(roleCard);
  });
}

// 更新单个角色卡片
function updateSingleRoleCard(roleIndex, role) {
  const roleCards = elements.rolesPreviewGrid.querySelectorAll('.role-preview-card');
  if (roleCards[roleIndex]) {
    const card = roleCards[roleIndex];
    card.innerHTML = `
      <div class="role-header">
        <div class="role-name">${role.name}</div>
        <div class="role-actions">
          <button class="btn btn-small btn-secondary" onclick="editRole(${roleIndex})">编辑</button>
          <button class="btn btn-small btn-warning" onclick="regenerateSingleRole(${roleIndex})">重新生成</button>
        </div>
      </div>
      <div class="role-info"><strong>背景：</strong>${role.background}</div>
      <div class="role-info"><strong>立场：</strong>${role.stance}</div>
      <div class="role-info"><strong>性格：</strong>${role.personality}</div>
      <div class="role-expertise">
        ${role.expertise.map(exp => `<span class="expertise-tag">${exp}</span>`).join('')}
      </div>
    `;
    
    // 添加更新动画效果
    card.style.transform = 'scale(0.95)';
    card.style.transition = 'transform 0.2s ease-in-out';
    setTimeout(() => {
      card.style.transform = 'scale(1)';
    }, 100);
  } else {
    console.warn('找不到要更新的角色卡片:', roleIndex);
  }
}

// 显示生成统计
function displayGenerationStats(stats) {
  if (!stats) return;
  
  elements.generationStats.style.display = 'block';
  
  // 格式化时间
  const timeInSeconds = (stats.totalTime / 1000).toFixed(1);
  elements.generationTime.textContent = `${timeInSeconds}秒`;
  
  // 计算成功率
  const totalRoles = stats.successCount + stats.failureCount;
  const successRate = totalRoles > 0 ? ((stats.successCount / totalRoles) * 100).toFixed(1) : '0';
  elements.successRate.textContent = `${successRate}%`;
  
  // 获取当前配置的生成模式
  const config = getCurrentConfig();
  const mode = config.roleGenerationMode === 'parallel' ? '并行生成' : '传统生成';
  elements.generationMode.textContent = mode;
}

// 确认角色，开始正式辩论
async function confirmRoles() {
  if (!window.currentPreviewData) {
    showToast('错误', '没有可用的角色数据', 'error');
    return;
  }
  
  const { topic, roles } = window.currentPreviewData;
  const config = getCurrentConfig();
  
  showLoading('开始辩论...');
  elements.confirmRoles.disabled = true;
  
  try {
    // 先显示辩论界面
    const config = getCurrentConfig();
    currentDebate = {
      id: 'temp_' + Date.now(),
      topic: topic,
      roles: roles,
      statements: [],
      currentRound: 0,
      status: 'preparing',
      startTime: Date.now(),
      config: config
    };
    isDebating = true;
    showDebateArea();
    hideLoading();
    
    // 再调用后端开始辩论（使用已生成的角色）
    // 这里不等待结果，直接返回，让实时事件处理显示
    window.electronAPI.startDebateWithRoles(topic, roles, config).then(result => {
      if (result.success) {
        console.log('辩论成功启动');
      } else {
        showToast('启动失败', result.error, 'error');
        isDebating = false;
      }
    }).catch(error => {
      console.error('辩论启动异常:', error);
      showToast('启动失败', error.message, 'error');
      isDebating = false;
    });
    
    showToast('辩论开始', '辩论已成功启动，请等待角色回答', 'success');
  } catch (error) {
    console.error('辩论启动失败:', error);
    showToast('启动失败', error.message, 'error');
  }
  
  hideLoading();
  elements.confirmRoles.disabled = false;
}

// 重新生成角色
async function regenerateRoles() {
  if (!window.currentPreviewData) {
    showToast('错误', '没有可用的议题数据', 'error');
    return;
  }
  
  const topic = window.currentPreviewData.topic;
  
  // 重新生成角色
  showLoading('正在重新生成角色...');
  elements.regenerateRoles.disabled = true;
  
  try {
    const config = getCurrentConfig();
    const result = await window.electronAPI.generateRoles(topic, config);
    
    if (result.success) {
      // 更新预览显示
      displayRolePreviewCards(result.data.roles);
      if (result.data.stats) {
        displayGenerationStats(result.data.stats);
      }
      
      // 更新存储的数据
      window.currentPreviewData.roles = result.data.roles;
      window.currentPreviewData.stats = result.data.stats;
      
      showToast('重新生成成功', `已成功重新生成${result.data.roles.length}个角色`, 'success');
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('重新生成失败:', error);
    showToast('重新生成失败', error.message, 'error');
  }
  
  hideLoading();
  elements.regenerateRoles.disabled = false;
}

// 返回输入界面
function backToInput() {
  elements.rolePreviewArea.style.display = 'none';
  elements.debateArea.style.display = 'none';
  elements.debateInput.style.display = 'block';
  
  // 清理缓存数据
  window.currentPreviewData = null;
}

// 显示角色思考状态
function showRoleThinking(data) {
  if (elements.thinkingIndicator && elements.thinkingText) {
    const typeText = getStatementTypeText(data.type);
    elements.thinkingText.textContent = `${data.roleName} 正在${typeText}中...`;
    elements.thinkingIndicator.style.display = 'block';
    
    // 滚动到底部
    setTimeout(() => {
      if (elements.chatMessages) {
        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
      }
    }, 100);
  }
}

// 隐藏角色思考状态
function hideRoleThinking() {
  if (elements.thinkingIndicator) {
    elements.thinkingIndicator.style.display = 'none';
  }
}

// 添加聊天消息
function addChatMessage(statement) {
  if (!elements.chatMessages) return;
  
  const messageDiv = document.createElement('div');
  messageDiv.className = 'chat-message';
  
  const timestamp = new Date(statement.timestamp).toLocaleTimeString('zh-CN');
  const typeText = getStatementTypeText(statement.type);
  
  // 创建角色头像（使用名字的第一个字符）
  const avatarText = statement.roleName.charAt(0);
  
  messageDiv.innerHTML = `
    <div class="chat-avatar">${avatarText}</div>
    <div class="chat-content">
      <div class="chat-header">
        <span class="chat-author">${statement.roleName}</span>
        <div class="chat-meta">
          <span class="chat-type type-${statement.type}">${typeText}</span>
          <span>${timestamp}</span>
        </div>
      </div>
      <p class="chat-text">${statement.content}</p>
    </div>
  `;
  
  elements.chatMessages.appendChild(messageDiv);
  
  // 滚动到最新消息
  setTimeout(() => {
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
  }, 100);
}

// 清空聊天消息
function clearChatMessages() {
  if (elements.chatMessages) {
    elements.chatMessages.innerHTML = '';
  }
  hideRoleThinking();
}

// 显示辩论区域
function showDebateArea() {
  elements.debateInput.style.display = 'none';
  elements.rolePreviewArea.style.display = 'none';
  elements.debateArea.style.display = 'block';
  
  if (currentDebate) {
    elements.currentTopic.textContent = currentDebate.topic;
    displayRoles(currentDebate.roles);
    updateDebateStatus(currentDebate.status, currentDebate.currentRound);
    
    // 清空旧的聊天消息
    clearChatMessages();
    
    // 如果有已有的发言，显示在聊天区域
    if (currentDebate.statements && currentDebate.statements.length > 0) {
      currentDebate.statements.forEach(statement => {
        addChatMessage(statement);
      });
    }
    
    if (currentDebate.consensus) {
      showConsensus(currentDebate.consensus);
    }
  }
}

// 显示角色信息
function displayRoles(roles) {
  elements.rolesGrid.innerHTML = '';
  
  roles.forEach(role => {
    const roleCard = document.createElement('div');
    roleCard.className = 'role-card';
    roleCard.innerHTML = `
      <div class="role-name">${role.name}</div>
      <div class="role-info"><strong>背景：</strong>${role.background}</div>
      <div class="role-info"><strong>立场：</strong>${role.stance}</div>
      <div class="role-info"><strong>性格：</strong>${role.personality}</div>
      <div class="role-expertise">
        ${role.expertise.map(exp => `<span class="expertise-tag">${exp}</span>`).join('')}
      </div>
    `;
    elements.rolesGrid.appendChild(roleCard);
  });
}

// 更新辩论状态
function updateDebateStatus(status, round) {
  const statusMap = {
    'preparing': '准备中',
    'in-progress': '进行中',
    'converging': '寻求共识',
    'completed': '已完成',
    'error': '发生错误'
  };
  
  elements.statusText.textContent = statusMap[status] || status;
  elements.statusText.className = `status-text status-${status}`;
  
  // 修复轮数显示逻辑
  if (round === 0) {
    elements.roundInfo.textContent = '开场陈述';
  } else if (round > 0) {
    elements.roundInfo.textContent = `第 ${round} 轮`;
  } else {
    elements.roundInfo.textContent = '';
  }
}

// 显示发言记录
function displayStatements(statements) {
  elements.statementsList.innerHTML = '';
  
  statements.forEach(statement => {
    const statementDiv = document.createElement('div');
    statementDiv.className = 'statement';
    
    const timestamp = new Date(statement.timestamp).toLocaleTimeString('zh-CN');
    const typeText = getStatementTypeText(statement.type);
    
    statementDiv.innerHTML = `
      <div class="statement-header">
        <span class="statement-author">${statement.roleName}</span>
        <div class="statement-meta">
          <span class="statement-type type-${statement.type}">${typeText}</span>
          <span>${timestamp}</span>
        </div>
      </div>
      <div class="statement-content">${statement.content}</div>
    `;
    
    elements.statementsList.appendChild(statementDiv);
  });
  
  // 滚动到最新发言
  elements.statementsList.scrollTop = elements.statementsList.scrollHeight;
}

// 获取发言类型文本
function getStatementTypeText(type) {
  const typeMap = {
    'opening': '开场',
    'argument': '论证',
    'rebuttal': '反驳',
    'consensus': '共识',
    'final': '总结'
  };
  return typeMap[type] || type;
}

// 显示共识
function showConsensus(consensus) {
  elements.consensusContent.textContent = consensus;
  elements.consensusSection.style.display = 'block';
  
  // 显示连续讨论按钮
  if (elements.continueDebate) {
    elements.continueDebate.style.display = 'inline-block';
  }
}

// 停止辩论
async function stopDebate() {
  try {
    // 禁用停止按钮防止重复点击
    elements.stopDebate.disabled = true;
    elements.stopDebate.textContent = '停止中...';
    
    const result = await window.electronAPI.stopDebate();
    
    if (result.success) {
      isDebating = false;
      showToast('辩论已停止', '辩论已手动停止', 'info');
      // 更新状态显示
      updateDebateStatus('completed', currentDebate?.currentRound || 0);
    } else {
      throw new Error(result.error || '停止失败');
    }
  } catch (error) {
    console.error('停止辩论失败:', error);
    showToast('停止失败', error.message, 'error');
  } finally {
    // 恢复停止按钮状态
    elements.stopDebate.disabled = false;
    elements.stopDebate.textContent = '停止辩论';
  }
}

// 导出辩论
async function exportDebate(format) {
  try {
    showLoading(`导出为 ${format.toUpperCase()}...`);
    const result = await window.electronAPI.exportDebate(format);
    hideLoading();
    
    if (result.success) {
      showToast('导出成功', `文件已保存到：${result.path}`, 'success');
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    hideLoading();
    showToast('导出失败', error.message, 'error');
  }
}

// 重置到新辩论
function resetToNewDebate() {
  isDebating = false;
  currentDebate = null;
  
  elements.debateInput.style.display = 'block';
  elements.debateArea.style.display = 'none';
  elements.rolePreviewArea.style.display = 'none';
  elements.consensusSection.style.display = 'none';
  
  elements.debateTopic.value = '';
  elements.statementsList.innerHTML = '';
  elements.rolesGrid.innerHTML = '';
  
  // 隐藏连续讨论按钮
  if (elements.continueDebate) {
    elements.continueDebate.style.display = 'none';
  }
  
  // 清理聊天消息
  clearChatMessages();
  
  // 清理缓存数据
  window.currentPreviewData = null;
}

// 更新AI状态
function updateAIStatus(connected) {
  if (connected) {
    elements.aiStatus.textContent = '已连接';
    elements.aiStatus.className = 'status-connected';
  } else {
    elements.aiStatus.textContent = '未连接';
    elements.aiStatus.className = 'status-disconnected';
  }
}

// 显示加载遮罩
function showLoading(text = '正在处理...') {
  elements.loadingText.textContent = text;
  elements.loadingOverlay.style.display = 'flex';
}

// 隐藏加载遮罩
function hideLoading() {
  elements.loadingOverlay.style.display = 'none';
}

// 显示消息提示
function showToast(title, message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-title">${title}</div>
    <div class="toast-message">${message}</div>
  `;
  
  elements.toastContainer.appendChild(toast);
  
  // 3秒后自动移除
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 3000);
}

// 监听辩论事件更新
if (window.electronAPI) {
  // 如果有实时更新的API，可以在这里添加监听器
  setInterval(async () => {
    if (isDebating) {
      try {
        const status = await window.electronAPI.getDebateStatus();
        if (status && status.currentDebate) {
          currentDebate = status.currentDebate;
          updateDebateStatus(currentDebate.status, currentDebate.currentRound);
          displayStatements(currentDebate.statements);
          
          if (currentDebate.consensus && currentDebate.status === 'completed') {
            showConsensus(currentDebate.consensus);
            isDebating = false;
          }
        }
      } catch (error) {
        console.warn('Failed to get debate status:', error);
      }
    }
  }, 2000);
}

// ========== 连续讨论功能 ==========

// 显示连续讨论模态框
async function showContinueDebateModal() {
  console.log('showContinueDebateModal 被调用');
  console.log('currentDebate:', currentDebate);
  console.log('currentDebate.consensus:', currentDebate?.consensus);
  
  if (!currentDebate || !currentDebate.consensus) {
    console.warn('无法继续讨论：currentDebate 或 consensus 为空');
    showToast('无法继续', '当前没有可用的讨论共识', 'warning');
    return;
  }

  // 显示前一轮共识
  if (elements.previousConsensusText) {
    elements.previousConsensusText.textContent = currentDebate.consensus;
  }

  // 清空自定义问题输入
  if (elements.customQuestion) {
    elements.customQuestion.value = '';
  }

  // 重置自动生成选项
  if (elements.autoGenerateTopic) {
    elements.autoGenerateTopic.checked = true;
  }

  // 显示模态框
  if (elements.continueDebateModal) {
    elements.continueDebateModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  // 加载建议问题
  await loadSuggestedQuestions();
}

// 关闭连续讨论模态框
function closeContinueDebateModal() {
  if (elements.continueDebateModal) {
    elements.continueDebateModal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

// 加载建议的后续问题
async function loadSuggestedQuestions() {
  if (!elements.suggestedQuestions) return;

  try {
    showLoading('生成后续问题建议...');
    const result = await window.electronAPI.generateFollowupQuestions();
    
    if (result.success && result.data && result.data.length > 0) {
      displaySuggestedQuestions(result.data);
    } else {
      // 如果无法生成建议问题，显示默认选项
      displayDefaultQuestions();
    }
  } catch (error) {
    console.error('加载建议问题失败:', error);
    displayDefaultQuestions();
  } finally {
    hideLoading();
  }
}

// 显示建议的问题
function displaySuggestedQuestions(questions) {
  if (!elements.suggestedQuestions) return;

  elements.suggestedQuestions.innerHTML = '';
  
  questions.forEach((question, index) => {
    const questionCard = document.createElement('div');
    questionCard.className = 'question-card';
    questionCard.innerHTML = `
      <div class="question-text">${question}</div>
      <button class="btn btn-small btn-outline" onclick="selectQuestion('${question.replace(/'/g, "\\'")}')">
        选择此问题
      </button>
    `;
    elements.suggestedQuestions.appendChild(questionCard);
  });
}

// 显示默认问题选项
function displayDefaultQuestions() {
  if (!elements.suggestedQuestions) return;

  const defaultQuestions = [
    '如何将共识应用到实际中？',
    '这个方案可能面临哪些挑战？',
    '从长远来看，这个议题会如何发展？',
    '还有哪些相关因素需要考虑？'
  ];

  displaySuggestedQuestions(defaultQuestions);
}

// 选择建议的问题
function selectQuestion(question) {
  if (elements.customQuestion) {
    elements.customQuestion.value = question;
  }
  // 取消自动生成议题选项
  if (elements.autoGenerateTopic) {
    elements.autoGenerateTopic.checked = false;
  }
}

// 开始连续讨论
async function startContinuationDebate() {
  if (!currentDebate) {
    showToast('错误', '没有可用的讨论会话', 'error');
    return;
  }

  let newTopic = '';
  let userQuestion = '';

  // 获取用户输入
  if (elements.autoGenerateTopic && elements.autoGenerateTopic.checked) {
    // 自动生成新议题
    if (elements.customQuestion && elements.customQuestion.value.trim()) {
      userQuestion = elements.customQuestion.value.trim();
    }
  } else {
    // 使用用户输入作为新议题
    if (elements.customQuestion && elements.customQuestion.value.trim()) {
      newTopic = elements.customQuestion.value.trim();
    } else {
      showToast('输入错误', '请输入新的讨论议题或选择自动生成', 'warning');
      return;
    }
  }

  try {
    closeContinueDebateModal();
    showLoading('开始连续讨论...');

    // 清空当前讨论显示，准备新的讨论
    clearChatMessages();
    hideConsensus();
    
    // 隐藏连续讨论按钮
    if (elements.continueDebate) {
      elements.continueDebate.style.display = 'none';
    }

    // 调用后端开始连续讨论
    const result = await window.electronAPI.startContinuationDebate(newTopic, userQuestion);
    
    if (result.success) {
      // 更新当前讨论数据
      currentDebate = result.data;
      isDebating = true;
      
      // 更新界面显示
      elements.currentTopic.textContent = currentDebate.topic;
      updateDebateStatus(currentDebate.status, currentDebate.currentRound);
      
      showToast('连续讨论开始', `新的讨论议题：${currentDebate.topic}`, 'success');
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('开始连续讨论失败:', error);
    showToast('开始失败', error.message, 'error');
    isDebating = false;
  } finally {
    hideLoading();
  }
}

// 隐藏共识区域
function hideConsensus() {
  if (elements.consensusSection) {
    elements.consensusSection.style.display = 'none';
  }
}

// 编辑角色
function editRole(roleIndex) {
  console.log('编辑角色:', roleIndex);
  
  if (!window.currentPreviewData || !window.currentPreviewData.roles) {
    showToast('错误', '没有可用的角色数据', 'error');
    return;
  }
  
  const role = window.currentPreviewData.roles[roleIndex];
  if (!role) return;
  
  // 设置当前编辑的角色索引
  currentEditingRoleIndex = roleIndex;
  
  // 填充编辑表单
  document.getElementById('editRoleName').value = role.name || '';
  document.getElementById('editRoleBackground').value = role.background || '';
  document.getElementById('editRoleStance').value = role.stance || '';
  document.getElementById('editRolePersonality').value = role.personality || '';
  document.getElementById('editRoleExpertise').value = role.expertise ? role.expertise.join(', ') : '';
  
  // 显示编辑模态框
  elements.roleEditModal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

// 重新生成单个角色
// 重新生成单个角色
async function regenerateSingleRole(roleIndex) {
  console.log('=== 重新生成角色开始 ===');
  console.log('角色索引:', roleIndex);
  
  // 检查currentPreviewData
  console.log('currentPreviewData:', window.currentPreviewData);
  console.log('topic存在:', !!window.currentPreviewData?.topic);
  
  if (!window.currentPreviewData || !window.currentPreviewData.topic) {
    console.error('没有可用的议题数据');
    showToast('错误', '没有可用的议题数据', 'error');
    return;
  }
  
  const topic = window.currentPreviewData.topic;
  console.log('议题:', topic);
  
  // 获取配置
  const config = getCurrentConfig();
  console.log('配置:', config);
  
  showLoading('重新生成角色...');
  
  try {
    // 调用后端的单张角色重新生成接口
    console.log('发送单张角色重新生成请求:', { topic, roleIndex, rolesCount: window.currentPreviewData.roles.length });
    
    const result = await window.electronAPI.regenerateSingleRole(
      topic, 
      roleIndex, 
      window.currentPreviewData.roles, 
      config
    );
    
    console.log('重新生成结果:', result);
    
    if (result.success) {
      const newRole = result.data;
      console.log('生成的新角色:', newRole);
      
      // 更新currentPreviewData中的角色
      window.currentPreviewData.roles[roleIndex] = newRole;
      
      // 只更新单个角色卡片，而不是重新渲染整个网格
      updateSingleRoleCard(roleIndex, newRole);
      hideLoading();
      showToast(`角色 "${newRole.name}" 重新生成成功！`, 'success');
    } else {
      throw new Error(result.error);
    }
    
  } catch (error) {
    console.error('重新生成角色失败:', error);
    hideLoading();
    
    // 提供更详细的错误信息
    let errorMessage = '重新生成角色失败';
    if (error.message.includes('401')) {
      errorMessage = 'API密钥无效，请检查配置';
    } else if (error.message.includes('403')) {
      errorMessage = 'API访问被拒绝，请检查权限';
    } else if (error.message.includes('404')) {
      errorMessage = 'API端点不存在，请检查配置';
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      errorMessage = '网络连接失败，请检查网络';
    } else if (error.message.includes('timeout')) {
      errorMessage = '请求超时，请稍后重试';
    } else {
      errorMessage = error.message;
    }
    
    showToast(errorMessage, 'error');
  }
}

// 辅助函数：从文本中提取字段
function extractField(text, fieldName) {
  const patterns = [
    new RegExp(`"${fieldName}"\\s*:\\s*"([^"]+)"`, 'i'),
    new RegExp(`${fieldName}\\s*[:：]\\s*([^\\n,]+)`, 'i'),
    new RegExp(`${fieldName}\\s*[:：]\\s*([^\\n]+)`, 'i')
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

// 生成角色头像
function generateAvatar(name) {
  const avatarEmojis = ['🤖', '🧠', '🎭', '🎨', '🔬', '📚', '🎯', '💡', '🔍', '⚖️', '🌟', '🎪'];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return avatarEmojis[hash % avatarEmojis.length];
}

// 关闭角色编辑模态框
function closeRoleEditModal() {
  elements.roleEditModal.style.display = 'none';
  document.body.style.overflow = '';
  currentEditingRoleIndex = -1;
}

// 保存角色编辑
function saveRoleEditChanges() {
  if (currentEditingRoleIndex === -1 || !window.currentPreviewData) {
    showToast('错误', '没有可编辑的角色', 'error');
    return;
  }
  
  const name = document.getElementById('editRoleName').value.trim();
  const background = document.getElementById('editRoleBackground').value.trim();
  const stance = document.getElementById('editRoleStance').value.trim();
  const personality = document.getElementById('editRolePersonality').value.trim();
  const expertiseText = document.getElementById('editRoleExpertise').value.trim();
  
  if (!name || !background || !stance) {
    showToast('输入错误', '请填写角色名称、背景和立场', 'warning');
    return;
  }
  
  // 解析专业领域
  const expertise = expertiseText ? expertiseText.split(',').map(s => s.trim()).filter(s => s) : ['综合'];
  
  // 更新角色数据
  const role = window.currentPreviewData.roles[currentEditingRoleIndex];
  role.name = name;
  role.background = background;
  role.stance = stance;
  role.personality = personality;
  role.expertise = expertise;
  
  // 如果没有头像，生成一个
  if (!role.avatar) {
    role.avatar = generateAvatar(name);
  }
  
  // 重新渲染角色预览
  displayRolePreviewCards(window.currentPreviewData.roles);
  
  // 关闭编辑模态框
  closeRoleEditModal();
  
  showToast('角色已更新', `角色 "${name}" 的信息已更新`, 'success');
}

// 全局函数，供HTML中的onclick使用
window.selectQuestion = selectQuestion;
window.editRole = editRole;
window.regenerateSingleRole = regenerateSingleRole;

// 历史记录管理功能
let currentHistory = [];

// 显示历史记录模态框
async function showHistoryModal() {
  elements.historyModal.style.display = 'flex';
  await loadHistory();
}

// 关闭历史记录模态框
function closeHistoryModal() {
  elements.historyModal.style.display = 'none';
}

// 加载历史记录
async function loadHistory() {
  try {
    showLoading('加载历史记录...');
    
    // 获取历史记录和统计信息
    const [historyResult, statsResult] = await Promise.all([
      window.electronAPI.getHistory(),
      window.electronAPI.getHistoryStats()
    ]);
    
    if (historyResult.success) {
      currentHistory = historyResult.data;
      updateHistoryDisplay(currentHistory);
    }
    
    if (statsResult.success) {
      updateHistoryStats(statsResult.data);
    }
    
  } catch (error) {
    console.error('加载历史记录失败:', error);
    showToast('加载历史记录失败', 'error');
  } finally {
    hideLoading();
  }
}

// 更新历史统计显示
function updateHistoryStats(stats) {
  elements.totalSessions.textContent = stats.totalSessions || 0;
  elements.completedSessions.textContent = stats.completedSessions || 0;
  elements.averageDuration.textContent = formatDuration(stats.averageDuration || 0);
  elements.continuationChains.textContent = stats.continuationChains || 0;
}

// 更新历史记录显示
function updateHistoryDisplay(history) {
  if (!history || history.length === 0) {
    elements.historyList.style.display = 'none';
    elements.emptyHistoryState.style.display = 'block';
    return;
  }
  
  elements.historyList.style.display = 'block';
  elements.emptyHistoryState.style.display = 'none';
  
  elements.historyList.innerHTML = '';
  
  history.forEach(item => {
    const historyItem = createHistoryItem(item);
    elements.historyList.appendChild(historyItem);
  });
}

// 创建历史记录项
function createHistoryItem(item) {
  const div = document.createElement('div');
  div.className = 'history-item';
  
  const header = document.createElement('div');
  header.className = 'history-item-header';
  
  const topic = document.createElement('div');
  topic.className = 'history-item-topic';
  topic.textContent = item.topic;
  
  if (item.isContinuation) {
    const badge = document.createElement('span');
    badge.className = 'continuation-badge';
    badge.textContent = '连续';
    topic.appendChild(badge);
  }
  
  header.appendChild(topic);
  
  const meta = document.createElement('div');
  meta.className = 'history-item-meta';
  
  const time = document.createElement('span');
  time.textContent = formatTime(item.createdAt);
  
  const duration = document.createElement('span');
  duration.textContent = `时长: ${formatDuration(item.duration)}`;
  
  const statements = document.createElement('span');
  statements.textContent = `发言: ${item.statementCount}`;
  
  const status = document.createElement('span');
  status.className = `history-item-status status-${item.status}`;
  status.textContent = getStatusText(item.status);
  
  meta.appendChild(time);
  meta.appendChild(duration);
  meta.appendChild(statements);
  meta.appendChild(status);
  
  const consensus = document.createElement('div');
  consensus.className = 'history-item-consensus';
  consensus.textContent = item.consensus || '无共识内容';
  
  const actions = document.createElement('div');
  actions.className = 'history-item-actions';
  
  const viewBtn = document.createElement('button');
  viewBtn.className = 'btn btn-secondary';
  viewBtn.textContent = '查看详情';
  viewBtn.onclick = () => viewHistoryItem(item);
  
  const restoreBtn = document.createElement('button');
  restoreBtn.className = 'btn btn-primary';
  restoreBtn.textContent = '恢复讨论';
  restoreBtn.onclick = () => restoreFromHistory(item);
  
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn btn-danger';
  deleteBtn.textContent = '删除';
  deleteBtn.onclick = () => deleteHistoryItem(item.id);
  
  actions.appendChild(viewBtn);
  actions.appendChild(restoreBtn);
  actions.appendChild(deleteBtn);
  
  div.appendChild(header);
  div.appendChild(meta);
  div.appendChild(consensus);
  div.appendChild(actions);
  
  return div;
}

// 查看历史记录详情
function viewHistoryItem(item) {
  // 显示详细信息对话框
  const detailModal = document.createElement('div');
  detailModal.className = 'modal-overlay';
  detailModal.style.display = 'flex';
  
  const content = document.createElement('div');
  content.className = 'modal-content';
  content.style.maxWidth = '800px';
  
  const header = document.createElement('div');
  header.className = 'modal-header';
  header.innerHTML = `
    <h2>讨论详情</h2>
    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
  `;
  
  const body = document.createElement('div');
  body.className = 'modal-body';
  body.innerHTML = `
    <div class="history-detail">
      <h3>议题：${item.topic}</h3>
      <div class="detail-meta">
        <span>时间：${formatTime(item.createdAt)}</span>
        <span>时长：${formatDuration(item.duration)}</span>
        <span>状态：${getStatusText(item.status)}</span>
        ${item.isContinuation ? '<span class="continuation-badge">连续讨论</span>' : ''}
      </div>
      <div class="detail-consensus">
        <h4>共识内容：</h4>
        <p>${item.consensus || '无共识内容'}</p>
      </div>
      <div class="detail-stats">
        <h4>统计信息：</h4>
        <p>角色数量：${item.roleCount} | 发言数量：${item.statementCount} | 讨论轮数：${Math.ceil(item.statementCount / item.roleCount)}</p>
      </div>
    </div>
  `;
  
  content.appendChild(header);
  content.appendChild(body);
  detailModal.appendChild(content);
  document.body.appendChild(detailModal);
  
  // 点击外部关闭
  detailModal.addEventListener('click', (e) => {
    if (e.target === detailModal) {
      detailModal.remove();
    }
  });
}

// 从历史记录恢复讨论
async function restoreFromHistory(item) {
  try {
    const confirmRestore = confirm(`确定要恢复讨论"${item.topic}"吗？这将创建一个新的讨论会话。`);
    if (!confirmRestore) return;
    
    closeHistoryModal();
    showLoading('恢复讨论...');
    
    // 基于历史记录创建新的讨论
    const result = await window.electronAPI.startDebate(
      item.topic,
      currentConfig
    );
    
    if (result.success) {
      currentDebate = result.data;
      showDebateArea();
      updateDebateDisplay();
      showToast('讨论已恢复', 'success');
    } else {
      showToast('恢复讨论失败: ' + result.error, 'error');
    }
    
  } catch (error) {
    console.error('恢复讨论失败:', error);
    showToast('恢复讨论失败', 'error');
  } finally {
    hideLoading();
  }
}

// 删除历史记录项
async function deleteHistoryItem(id) {
  try {
    const confirmDelete = confirm('确定要删除这条历史记录吗？');
    if (!confirmDelete) return;
    
    showLoading('删除历史记录...');
    
    const result = await window.electronAPI.deleteHistoryItem(id);
    
    if (result.success) {
      await loadHistory(); // 重新加载历史记录
      showToast('历史记录已删除', 'success');
    } else {
      showToast('删除失败: ' + result.error, 'error');
    }
    
  } catch (error) {
    console.error('删除历史记录失败:', error);
    showToast('删除历史记录失败', 'error');
  } finally {
    hideLoading();
  }
}

// 导出历史记录
async function exportHistoryData() {
  try {
    const result = await window.electronAPI.exportHistory();
    
    if (result.success) {
      showToast('历史记录已导出到: ' + result.path, 'success');
    } else {
      showToast('导出失败: ' + result.error, 'error');
    }
    
  } catch (error) {
    console.error('导出历史记录失败:', error);
    showToast('导出历史记录失败', 'error');
  }
}

// 导入历史记录
async function importHistoryData() {
  try {
    const result = await window.electronAPI.importHistory();
    
    if (result.success) {
      await loadHistory(); // 重新加载历史记录
      showToast('历史记录已导入', 'success');
    } else {
      showToast('导入失败: ' + result.error, 'error');
    }
    
  } catch (error) {
    console.error('导入历史记录失败:', error);
    showToast('导入历史记录失败', 'error');
  }
}

// 清空历史记录
async function clearHistoryData() {
  try {
    const confirmClear = confirm('确定要清空所有历史记录吗？此操作不可撤销。');
    if (!confirmClear) return;
    
    showLoading('清空历史记录...');
    
    const result = await window.electronAPI.clearAllHistory();
    
    if (result.success) {
      await loadHistory(); // 重新加载历史记录
      showToast('历史记录已清空', 'success');
    } else {
      showToast('清空失败: ' + result.error, 'error');
    }
    
  } catch (error) {
    console.error('清空历史记录失败:', error);
    showToast('清空历史记录失败', 'error');
  } finally {
    hideLoading();
  }
}

// 筛选历史记录
async function filterHistory() {
  try {
    const options = {
      search: elements.historySearch.value,
      status: elements.statusFilter.value,
      sortBy: elements.sortBy.value,
      sortOrder: elements.sortOrder.value
    };
    
    const result = await window.electronAPI.getHistory(options);
    
    if (result.success) {
      updateHistoryDisplay(result.data);
    }
    
  } catch (error) {
    console.error('筛选历史记录失败:', error);
  }
}

// 格式化时间
function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN');
}

// 格式化时长
function formatDuration(milliseconds) {
  if (milliseconds < 1000) return `${milliseconds}ms`;
  
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

// 获取状态文本
function getStatusText(status) {
  const statusMap = {
    'completed': '已完成',
    'stopped': '已停止',
    'error': '错误'
  };
  return statusMap[status] || status;
}

// 扫描并导入文件系统历史记录
async function scanAndImportFileHistory() {
  try {
    showLoading('扫描文件系统...');
    
    const result = await window.electronAPI.scanAndImportFileHistory();
    
    if (result.success) {
      const { success: imported, failed } = result.data;
      let message = `扫描完成`;
      if (imported > 0) {
        message += `，成功导入 ${imported} 条记录`;
      }
      if (failed > 0) {
        message += `，${failed} 条记录导入失败`;
      }
      if (imported === 0 && failed === 0) {
        message += '，未发现新的历史记录';
      }
      
      showToast(message, imported > 0 ? 'success' : 'info');
      
      // 重新加载历史记录
      await loadHistory();
    } else {
      showToast('扫描失败: ' + result.error, 'error');
    }
    
  } catch (error) {
    console.error('扫描文件系统失败:', error);
    showToast('扫描文件系统失败', 'error');
  } finally {
    hideLoading();
  }
}