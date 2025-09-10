"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// 暴露安全的 API 给渲染进程
const electronAPI = {
    startDebate: (topic, config) => electron_1.ipcRenderer.invoke('start-debate', topic, config),
    startDebateWithRoles: (topic, roles, config) => electron_1.ipcRenderer.invoke('start-debate-with-roles', topic, roles, config),
    generateRoles: (topic, config) => electron_1.ipcRenderer.invoke('generate-roles', topic, config),
    getDebateStatus: () => electron_1.ipcRenderer.invoke('get-debate-status'),
    testConnection: (aiConfig) => electron_1.ipcRenderer.invoke('test-connection', aiConfig),
    diagnoseAI: (aiConfig) => electron_1.ipcRenderer.invoke('diagnose-ai', aiConfig),
    autoFixConnection: (aiConfig) => electron_1.ipcRenderer.invoke('auto-fix-connection', aiConfig),
    quickConnectionTest: (aiConfig) => electron_1.ipcRenderer.invoke('quick-connection-test', aiConfig),
    setRoleGenerationMode: (useParallel) => electron_1.ipcRenderer.invoke('set-role-generation-mode', useParallel),
    stopDebate: () => electron_1.ipcRenderer.invoke('stop-debate'),
    exportDebate: (format) => electron_1.ipcRenderer.invoke('export-debate', format),
    onNewDebate: (callback) => {
        electron_1.ipcRenderer.on('new-debate', callback);
    },
    onExportDebate: (callback) => {
        electron_1.ipcRenderer.on('export-debate', (event, format) => callback(format));
    },
    onYAMLConfigLoaded: (callback) => {
        electron_1.ipcRenderer.on('yaml-config-loaded', (event, config) => callback(config));
    },
    // 新增：实时辩论事件监听器
    onRoleThinking: (callback) => {
        electron_1.ipcRenderer.on('role-thinking', (event, data) => callback(data));
    },
    onRoleStatementReady: (callback) => {
        electron_1.ipcRenderer.on('role-statement-ready', (event, statement) => callback(statement));
    },
    onRoleError: (callback) => {
        electron_1.ipcRenderer.on('role-error', (event, data) => callback(data));
    },
    onDebateCompleted: (callback) => {
        electron_1.ipcRenderer.on('debate-completed', (event, session) => callback(session));
    },
    onDebateStatusUpdate: (callback) => {
        electron_1.ipcRenderer.on('debate-status-update', (event, data) => callback(data));
    },
    // 新增：历史记录管理
    getHistory: (options) => electron_1.ipcRenderer.invoke('get-history', options),
    getHistoryStats: () => electron_1.ipcRenderer.invoke('get-history-stats'),
    deleteHistoryItem: (id) => electron_1.ipcRenderer.invoke('delete-history-item', id),
    clearAllHistory: () => electron_1.ipcRenderer.invoke('clear-all-history'),
    exportHistory: () => electron_1.ipcRenderer.invoke('export-history'),
    importHistory: () => electron_1.ipcRenderer.invoke('import-history'),
    getSessionChain: (sessionId) => electron_1.ipcRenderer.invoke('get-session-chain', sessionId),
    getRelatedSessions: (topic, limit) => electron_1.ipcRenderer.invoke('get-related-sessions', topic, limit),
    scanAndImportFileHistory: () => electron_1.ipcRenderer.invoke('scan-and-import-file-history'),
    importYAMLConfig: () => electron_1.ipcRenderer.invoke('import-yaml-config'),
    regenerateSingleRole: (topic, roleIndex, existingRoles, config) => electron_1.ipcRenderer.invoke('regenerate-single-role', topic, roleIndex, existingRoles, config),
    onShowHistory: (callback) => {
        electron_1.ipcRenderer.on('show-history', callback);
    },
    onExportHistory: (callback) => {
        electron_1.ipcRenderer.on('export-history', callback);
    },
    onImportHistory: (callback) => {
        electron_1.ipcRenderer.on('import-history', callback);
    },
    onClearHistory: (callback) => {
        electron_1.ipcRenderer.on('clear-history', callback);
    }
};
electron_1.contextBridge.exposeInMainWorld('electronAPI', electronAPI);
//# sourceMappingURL=preload.js.map