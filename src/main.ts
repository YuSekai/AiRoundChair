import { app, BrowserWindow, Menu, ipcMain, dialog } from 'electron';
import * as path from 'path';
import { DebateManager } from './core/DebateManager';
import { FileExporter } from './utils/FileExporter';
import { AIDiagnosticTool } from './utils/AIDiagnosticTool';
import { AIConnectionFixer } from './utils/AIConnectionFixer';

let mainWindow: BrowserWindow;
let debateManager: DebateManager;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('src/renderer/index.html');

  // 开发模式下打开开发者工具
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createWindow();
  debateManager = new DebateManager();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC 处理程序
ipcMain.handle('start-debate', async (event, topic: string, config: any) => {
  try {
    // 初始化AI模型
    await debateManager.initializeAI(config.aiModel);
    
    // 开始辩论
    const result = await debateManager.startDebate(topic, config);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

// 只生成角色，不开始辩论
ipcMain.handle('generate-roles', async (event, topic: string, config: any) => {
  try {
    // 初始化AI模型
    await debateManager.initializeAI(config.aiModel);
    
    // 生成角色
    const result = await debateManager.generateRolesOnly(topic, config);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

// 使用已生成的角色开始辩论
ipcMain.handle('start-debate-with-roles', async (event, topic: string, roles: any[], config: any) => {
  try {
    // 监听实时事件并转发到前端
    debateManager.removeAllListeners(); // 清理之前的监听器
    
    // 角色思考中事件
    debateManager.on('role-thinking', (data) => {
      mainWindow.webContents.send('role-thinking', data);
    });
    
    // 角色回答完成事件
    debateManager.on('role-statement-ready', (statement) => {
      mainWindow.webContents.send('role-statement-ready', statement);
    });
    
    // 角色错误事件
    debateManager.on('role-error', (data) => {
      mainWindow.webContents.send('role-error', data);
    });
    
    // 辩论状态事件
    debateManager.on('debate-completed', (session) => {
      mainWindow.webContents.send('debate-completed', session);
    });
    
    // 新增：辩论状态更新事件
    debateManager.on('debate-status-update', (data) => {
      mainWindow.webContents.send('debate-status-update', data);
    });
    
    // AI已经初始化，直接开始辩论
    const result = await debateManager.startDebateWithRoles(topic, roles, config);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('get-debate-status', async () => {
  return debateManager.getStatus();
});

ipcMain.handle('test-connection', async (event, aiConfig: any) => {
  try {
    const result = await debateManager.testAIConnection(aiConfig);
    if (result) {
      return { success: true };
    } else {
      // 进行详细诊断
      const diagnosis = await AIDiagnosticTool.diagnoseConnection(aiConfig);
      return { 
        success: false, 
        error: '连接失败',
        diagnosis: diagnosis
      };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('stop-debate', async () => {
  try {
    debateManager.stopDebate();
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('diagnose-ai', async (event, aiConfig: any) => {
  try {
    const diagnosis = await AIDiagnosticTool.diagnoseConnection(aiConfig);
    return { success: true, data: diagnosis };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('set-role-generation-mode', async (event, useParallel: boolean) => {
  try {
    debateManager.setRoleGenerationMode(useParallel);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('auto-fix-connection', async (event, aiConfig: any) => {
  try {
    const result = await AIConnectionFixer.autoFixConnection(aiConfig);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('quick-connection-test', async (event, aiConfig: any) => {
  try {
    const result = await AIConnectionFixer.quickConnectionTest(aiConfig);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('export-debate', async (event, format: 'json' | 'markdown') => {
  try {
    const debate = debateManager.getCurrentDebate();
    if (!debate) {
      throw new Error('No active debate to export');
    }

    const result = await dialog.showSaveDialog(mainWindow, {
      filters: [
        format === 'json' 
          ? { name: 'JSON Files', extensions: ['json'] }
          : { name: 'Markdown Files', extensions: ['md'] }
      ]
    });

    if (!result.canceled && result.filePath) {
      await FileExporter.export(debate, result.filePath, format);
      return { success: true, path: result.filePath };
    }
    return { success: false, error: 'Export cancelled' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

// 新增：生成后续讨论问题建议
ipcMain.handle('generate-followup-questions', async (event) => {
  try {
    const currentDebate = debateManager.getCurrentDebate();
    if (!currentDebate) {
      throw new Error('No active debate session');
    }
    
    const questions = await debateManager.generateFollowUpQuestions(currentDebate);
    return { success: true, data: questions };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

// 新增：开始连续讨论
ipcMain.handle('start-continuation-debate', async (event, newTopic: string, userQuestion?: string) => {
  try {
    const currentDebate = debateManager.getCurrentDebate();
    if (!currentDebate) {
      throw new Error('No active debate session to continue from');
    }
    
    // 生成新的议题或使用用户提供的议题
    let finalTopic = newTopic;
    if (!finalTopic) {
      finalTopic = await debateManager.generateContinuationTopic(currentDebate, userQuestion);
    }
    
    // 使用相同的角色开始新的讨论
    const config = currentDebate.config;
    const result = await debateManager.startDebateWithRoles(finalTopic, currentDebate.roles, config, currentDebate);
    
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

// 历史记录管理 IPC 处理程序
ipcMain.handle('get-history', async (event, options?: any) => {
  try {
    const history = options ? debateManager.getFilteredHistory(options) : debateManager.getHistory();
    return { success: true, data: history };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('get-history-stats', async () => {
  try {
    const stats = debateManager.getHistoryStats();
    return { success: true, data: stats };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('delete-history-item', async (event, id: string) => {
  try {
    const result = debateManager.deleteHistoryItem(id);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('clear-all-history', async () => {
  try {
    const result = debateManager.clearAllHistory();
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('export-history', async () => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: [
        { name: 'JSON Files', extensions: ['json'] }
      ]
    });

    if (!result.canceled && result.filePath) {
      const exportData = debateManager.exportHistory();
      require('fs').writeFileSync(result.filePath, exportData);
      return { success: true, path: result.filePath };
    }
    return { success: false, error: 'Export cancelled' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('import-history', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      filters: [
        { name: 'JSON Files', extensions: ['json'] }
      ],
      properties: ['openFile']
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const jsonData = require('fs').readFileSync(result.filePaths[0], 'utf8');
      const importResult = debateManager.importHistory(jsonData);
      return { success: true, data: importResult };
    }
    return { success: false, error: 'Import cancelled' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('get-session-chain', async (event, sessionId: string) => {
  try {
    const chain = debateManager.getSessionChain(sessionId);
    return { success: true, data: chain };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('get-related-sessions', async (event, topic: string, limit?: number) => {
  try {
    const related = debateManager.getRelatedSessions(topic, limit);
    return { success: true, data: related };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

// 扫描并导入文件系统历史记录
ipcMain.handle('scan-and-import-file-history', async () => {
  try {
    const result = debateManager.scanAndImportFileHistory();
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

// 设置菜单
const template: Electron.MenuItemConstructorOptions[] = [
  {
    label: '文件',
    submenu: [
      {
        label: '新建辩论',
        accelerator: 'CmdOrCtrl+N',
        click: () => {
          mainWindow.webContents.send('new-debate');
        }
      },
      {
        label: '导出',
        submenu: [
          {
            label: '导出为 JSON',
            click: () => {
              mainWindow.webContents.send('export-debate', 'json');
            }
          },
          {
            label: '导出为 Markdown',
            click: () => {
              mainWindow.webContents.send('export-debate', 'markdown');
            }
          }
        ]
      },
      {
        label: '历史记录',
        submenu: [
          {
            label: '查看历史记录',
            accelerator: 'CmdOrCtrl+H',
            click: () => {
              mainWindow.webContents.send('show-history');
            }
          },
          {
            label: '导出历史记录',
            click: () => {
              mainWindow.webContents.send('export-history');
            }
          },
          {
            label: '导入历史记录',
            click: () => {
              mainWindow.webContents.send('import-history');
            }
          },
          { type: 'separator' },
          {
            label: '清空历史记录',
            click: () => {
              mainWindow.webContents.send('clear-history');
            }
          }
        ]
      },
      { type: 'separator' },
      {
        label: '退出',
        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
        click: () => {
          app.quit();
        }
      }
    ]
  },
  {
    label: '查看',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' }
    ]
  }
];

Menu.setApplicationMenu(Menu.buildFromTemplate(template));