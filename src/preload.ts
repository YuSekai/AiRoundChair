import { contextBridge, ipcRenderer } from 'electron';

// 定义 API 接口
interface ElectronAPI {
  startDebate: (topic: string, config: any) => Promise<any>;
  startDebateWithRoles: (topic: string, roles: any[], config: any) => Promise<any>;
  generateRoles: (topic: string, config: any) => Promise<any>;
  getDebateStatus: () => Promise<any>;
  testConnection: (aiConfig: any) => Promise<any>;
  diagnoseAI: (aiConfig: any) => Promise<any>;
  autoFixConnection: (aiConfig: any) => Promise<any>;
  quickConnectionTest: (aiConfig: any) => Promise<any>;
  setRoleGenerationMode: (useParallel: boolean) => Promise<any>;
  stopDebate: () => Promise<any>;
  exportDebate: (format: 'json' | 'markdown') => Promise<any>;
  onNewDebate: (callback: () => void) => void;
  onExportDebate: (callback: (format: string) => void) => void;
  onYAMLConfigLoaded: (callback: (config: any) => void) => void;
  // 新增：实时辩论事件监听
  onRoleThinking: (callback: (data: any) => void) => void;
  onRoleStatementReady: (callback: (statement: any) => void) => void;
  onRoleError: (callback: (data: any) => void) => void;
  onDebateCompleted: (callback: (session: any) => void) => void;
  onDebateStatusUpdate: (callback: (data: any) => void) => void;
  // 新增：历史记录管理
  getHistory: (options?: any) => Promise<any>;
  getHistoryStats: () => Promise<any>;
  deleteHistoryItem: (id: string) => Promise<any>;
  clearAllHistory: () => Promise<any>;
  exportHistory: () => Promise<any>;
  importHistory: () => Promise<any>;
  getSessionChain: (sessionId: string) => Promise<any>;
  getRelatedSessions: (topic: string, limit?: number) => Promise<any>;
  scanAndImportFileHistory: () => Promise<any>;
  importYAMLConfig: () => Promise<any>;
  regenerateSingleRole: (topic: string, roleIndex: number, existingRoles: any[], config: any) => Promise<any>;
  onShowHistory: (callback: () => void) => void;
  onExportHistory: (callback: () => void) => void;
  onImportHistory: (callback: () => void) => void;
  onClearHistory: (callback: () => void) => void;
}

// 暴露安全的 API 给渲染进程
const electronAPI: ElectronAPI = {
  startDebate: (topic: string, config: any) => ipcRenderer.invoke('start-debate', topic, config),
  startDebateWithRoles: (topic: string, roles: any[], config: any) => ipcRenderer.invoke('start-debate-with-roles', topic, roles, config),
  generateRoles: (topic: string, config: any) => ipcRenderer.invoke('generate-roles', topic, config),
  getDebateStatus: () => ipcRenderer.invoke('get-debate-status'),
  testConnection: (aiConfig: any) => ipcRenderer.invoke('test-connection', aiConfig),
  diagnoseAI: (aiConfig: any) => ipcRenderer.invoke('diagnose-ai', aiConfig),
  autoFixConnection: (aiConfig: any) => ipcRenderer.invoke('auto-fix-connection', aiConfig),
  quickConnectionTest: (aiConfig: any) => ipcRenderer.invoke('quick-connection-test', aiConfig),
  setRoleGenerationMode: (useParallel: boolean) => ipcRenderer.invoke('set-role-generation-mode', useParallel),
  stopDebate: () => ipcRenderer.invoke('stop-debate'),
  exportDebate: (format: 'json' | 'markdown') => ipcRenderer.invoke('export-debate', format),
  onNewDebate: (callback: () => void) => {
    ipcRenderer.on('new-debate', callback);
  },
  onExportDebate: (callback: (format: string) => void) => {
    ipcRenderer.on('export-debate', (event, format) => callback(format));
  },
  onYAMLConfigLoaded: (callback: (config: any) => void) => {
    ipcRenderer.on('yaml-config-loaded', (event, config) => callback(config));
  },
  // 新增：实时辩论事件监听器
  onRoleThinking: (callback: (data: any) => void) => {
    ipcRenderer.on('role-thinking', (event, data) => callback(data));
  },
  onRoleStatementReady: (callback: (statement: any) => void) => {
    ipcRenderer.on('role-statement-ready', (event, statement) => callback(statement));
  },
  onRoleError: (callback: (data: any) => void) => {
    ipcRenderer.on('role-error', (event, data) => callback(data));
  },
  onDebateCompleted: (callback: (session: any) => void) => {
    ipcRenderer.on('debate-completed', (event, session) => callback(session));
  },
  onDebateStatusUpdate: (callback: (data: any) => void) => {
    ipcRenderer.on('debate-status-update', (event, data) => callback(data));
  },
  // 新增：历史记录管理
  getHistory: (options?: any) => ipcRenderer.invoke('get-history', options),
  getHistoryStats: () => ipcRenderer.invoke('get-history-stats'),
  deleteHistoryItem: (id: string) => ipcRenderer.invoke('delete-history-item', id),
  clearAllHistory: () => ipcRenderer.invoke('clear-all-history'),
  exportHistory: () => ipcRenderer.invoke('export-history'),
  importHistory: () => ipcRenderer.invoke('import-history'),
  getSessionChain: (sessionId: string) => ipcRenderer.invoke('get-session-chain', sessionId),
  getRelatedSessions: (topic: string, limit?: number) => ipcRenderer.invoke('get-related-sessions', topic, limit),
  scanAndImportFileHistory: () => ipcRenderer.invoke('scan-and-import-file-history'),
  importYAMLConfig: () => ipcRenderer.invoke('import-yaml-config'),
  regenerateSingleRole: (topic: string, roleIndex: number, existingRoles: any[], config: any) => ipcRenderer.invoke('regenerate-single-role', topic, roleIndex, existingRoles, config),
  onShowHistory: (callback: () => void) => {
    ipcRenderer.on('show-history', callback);
  },
  onExportHistory: (callback: () => void) => {
    ipcRenderer.on('export-history', callback);
  },
  onImportHistory: (callback: () => void) => {
    ipcRenderer.on('import-history', callback);
  },
  onClearHistory: (callback: () => void) => {
    ipcRenderer.on('clear-history', callback);
  }
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// 类型声明
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}