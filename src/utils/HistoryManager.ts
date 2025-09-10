import { DebateSession, DebateHistory, HistoryStats, HistoryFilterOptions } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export class HistoryManager {
  private static readonly STORAGE_KEY = 'intelliround_history';
  private static readonly STATS_KEY = 'intelliround_history_stats';
  private static readonly MAX_HISTORY_ITEMS = 1000; // 最大历史记录数量
  private static readonly HISTORY_DIR = path.join(process.cwd(), 'history');

  // 检测是否在浏览器环境中
  private static isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  // 安全的localStorage操作
  private static saveToLocalStorage(key: string, data: string): void {
    if (this.isBrowser()) {
      try {
        localStorage.setItem(key, data);
      } catch (error) {
        console.warn('localStorage保存失败:', error);
      }
    }
  }

  private static loadFromLocalStorage(key: string): string | null {
    if (this.isBrowser()) {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.warn('localStorage读取失败:', error);
        return null;
      }
    }
    return null;
  }

  private static removeFromLocalStorage(key: string): void {
    if (this.isBrowser()) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn('localStorage删除失败:', error);
      }
    }
  }

  // 保存辩论会话到历史记录
  static saveDebateSession(session: DebateSession): void {
    try {
      // 获取现有历史记录
      const history = this.getHistory();
      
      // 创建历史记录项
      const historyItem: DebateHistory = {
        id: session.id,
        sessionId: session.sessionId || session.id,
        topic: session.topic,
        consensus: session.consensus,
        startTime: session.startTime,
        endTime: session.endTime || Date.now(),
        duration: (session.endTime || Date.now()) - session.startTime,
        roleCount: session.roles.length,
        statementCount: session.statements.length,
        status: session.status as 'completed' | 'stopped' | 'error',
        isContinuation: !!session.parentSessionId,
        parentSessionId: session.parentSessionId,
        continuationCount: session.continuationCount,
        createdAt: session.startTime,
        updatedAt: Date.now()
      };

      // 检查是否已存在相同ID的记录（更新情况）
      const existingIndex = history.findIndex(item => item.id === session.id);
      if (existingIndex >= 0) {
        // 更新现有记录
        history[existingIndex] = { ...history[existingIndex], ...historyItem };
      } else {
        // 添加新记录
        history.unshift(historyItem); // 新记录添加到开头
        
        // 限制历史记录数量
        if (history.length > this.MAX_HISTORY_ITEMS) {
          history.splice(this.MAX_HISTORY_ITEMS);
        }
      }

      // 保存到本地存储
      this.saveToLocalStorage(this.STORAGE_KEY, JSON.stringify(history));
      
      // 更新统计信息
      this.updateStats(history);
      
      // 保存到文件系统
      this.saveToFileSystem(historyItem);
      
      console.log('辩论会话已保存到历史记录:', historyItem.topic);
    } catch (error) {
      console.error('保存历史记录失败:', error);
    }
  }

  
  // 获取过滤后的历史记录
  static getFilteredHistory(options: HistoryFilterOptions = {}): DebateHistory[] {
    let history = this.getHistory();

    // 搜索过滤
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      history = history.filter(item => 
        item.topic.toLowerCase().includes(searchLower) ||
        (item.consensus && item.consensus.toLowerCase().includes(searchLower))
      );
    }

    // 状态过滤
    if (options.status && options.status !== 'all') {
      history = history.filter(item => item.status === options.status);
    }

    // 连续讨论过滤
    if (options.isContinuation !== undefined) {
      history = history.filter(item => item.isContinuation === options.isContinuation);
    }

    // 日期范围过滤
    if (options.dateRange) {
      history = history.filter(item => 
        item.createdAt >= options.dateRange!.start && 
        item.createdAt <= options.dateRange!.end
      );
    }

    // 排序
    if (options.sortBy) {
      history.sort((a, b) => {
        let aValue: any = a[options.sortBy as keyof DebateHistory];
        let bValue: any = b[options.sortBy as keyof DebateHistory];
        
        // 特殊处理字符串类型
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }
        
        if (options.sortOrder === 'desc') {
          return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
        } else {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        }
      });
    }

    return history;
  }

  // 获取单个历史记录
  static getHistoryItem(id: string): DebateHistory | null {
    try {
      const history = this.getHistory();
      return history.find(item => item.id === id) || null;
    } catch (error) {
      console.error('获取历史记录项失败:', error);
      return null;
    }
  }

  // 删除历史记录
  static deleteHistoryItem(id: string): boolean {
    try {
      const history = this.getHistory();
      const filteredHistory = history.filter(item => item.id !== id);
      
      if (filteredHistory.length === history.length) {
        return false; // 没有找到要删除的记录
      }
      
      this.saveToLocalStorage(this.STORAGE_KEY, JSON.stringify(filteredHistory));
      this.updateStats(filteredHistory);
      return true;
    } catch (error) {
      console.error('删除历史记录失败:', error);
      return false;
    }
  }

  // 清空所有历史记录
  static clearAllHistory(): boolean {
    try {
      this.removeFromLocalStorage(this.STORAGE_KEY);
      this.removeFromLocalStorage(this.STATS_KEY);
      return true;
    } catch (error) {
      console.error('清空历史记录失败:', error);
      return false;
    }
  }

  // 获取历史记录统计
  static getStats(): HistoryStats {
    try {
      const statsJson = this.loadFromLocalStorage(this.STATS_KEY);
      if (statsJson) {
        return JSON.parse(statsJson);
      }
    } catch (error) {
      console.error('读取统计信息失败:', error);
    }

    // 如果没有统计信息，则计算
    const history = this.getHistory();
    return this.calculateStats(history);
  }

  // 计算统计信息
  private static calculateStats(history: DebateHistory[]): HistoryStats {
    const stats: HistoryStats = {
      totalSessions: history.length,
      totalDuration: 0,
      averageDuration: 0,
      totalStatements: 0,
      completedSessions: 0,
      continuationChains: 0
    };

    if (history.length === 0) {
      return stats;
    }

    // 计算基本统计
    history.forEach(item => {
      stats.totalDuration += item.duration;
      stats.totalStatements += item.statementCount;
      
      if (item.status === 'completed') {
        stats.completedSessions++;
      }
    });

    // 计算平均时长
    stats.averageDuration = Math.round(stats.totalDuration / history.length);

    // 计算连续讨论链数量（统计具有相同sessionId的记录组）
    const sessionGroups = new Set<string>();
    history.forEach(item => {
      sessionGroups.add(item.sessionId);
    });
    stats.continuationChains = sessionGroups.size;

    return stats;
  }

  // 更新统计信息
  private static updateStats(history: DebateHistory[]): void {
    try {
      const stats = this.calculateStats(history);
      this.saveToLocalStorage(this.STATS_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error('更新统计信息失败:', error);
    }
  }

  // 获取会话链（相关联的连续讨论）
  static getSessionChain(sessionId: string): DebateHistory[] {
    try {
      const history = this.getHistory();
      return history
        .filter(item => item.sessionId === sessionId)
        .sort((a, b) => a.createdAt - b.createdAt); // 按创建时间排序
    } catch (error) {
      console.error('获取会话链失败:', error);
      return [];
    }
  }

  // 导出历史记录
  static exportHistory(): string {
    try {
      const history = this.getHistory();
      const stats = this.getStats();
      
      const exportData = {
        exportTime: Date.now(),
        stats,
        history
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('导出历史记录失败:', error);
      return '';
    }
  }

  // 导入历史记录
  static importHistory(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (!data.history || !Array.isArray(data.history)) {
        throw new Error('无效的历史记录格式');
      }

      // 合并现有历史记录和新导入的记录
      const existingHistory = this.getHistory();
      const existingIds = new Set(existingHistory.map(item => item.id));
      
      // 只添加不重复的记录
      const newRecords = data.history.filter((item: DebateHistory) => !existingIds.has(item.id));
      const mergedHistory = [...newRecords, ...existingHistory];
      
      // 限制数量并保存
      if (mergedHistory.length > this.MAX_HISTORY_ITEMS) {
        mergedHistory.splice(this.MAX_HISTORY_ITEMS);
      }
      
      this.saveToLocalStorage(this.STORAGE_KEY, JSON.stringify(mergedHistory));
      this.updateStats(mergedHistory);
      
      console.log(`成功导入 ${newRecords.length} 条历史记录`);
      return true;
    } catch (error) {
      console.error('导入历史记录失败:', error);
      return false;
    }
  }

  // 获取相关会话建议（基于历史记录推荐相关讨论）
  static getRelatedSessions(topic: string, limit: number = 5): DebateHistory[] {
    try {
      const history = this.getHistory();
      const topicLower = topic.toLowerCase();
      
      // 计算相关性分数
      const scoredHistory = history
        .filter(item => item.id !== topic) // 排除当前会话
        .map(item => {
          let score = 0;
          
          // 主题相似性
          const topicWords = topicLower.split(/\s+/);
          const itemWords = item.topic.toLowerCase().split(/\s+/);
          
          topicWords.forEach(word => {
            if (word.length > 1 && itemWords.some(itemWord => itemWord.includes(word))) {
              score++;
            }
          });
          
          // 共识相似性
          if (item.consensus && topicLower.length > 5) {
            const consensusWords = item.consensus.toLowerCase().split(/\s+/);
            topicWords.forEach(word => {
              if (word.length > 1 && consensusWords.some(consensusWord => consensusWord.includes(word))) {
                score += 0.5;
              }
            });
          }
          
          return { item, score };
        })
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
      
      return scoredHistory.map(({ item }) => item);
    } catch (error) {
      console.error('获取相关会话失败:', error);
      return [];
    }
  }

  // 保存到文件系统
  private static saveToFileSystem(historyItem: DebateHistory): void {
    try {
      // 确保history文件夹存在
      if (!fs.existsSync(this.HISTORY_DIR)) {
        fs.mkdirSync(this.HISTORY_DIR, { recursive: true });
      }

      // 生成文件名：使用ID和时间戳
      const timestamp = new Date(historyItem.createdAt).toISOString().replace(/[:.]/g, '-');
      const filename = `debate_${historyItem.id}_${timestamp}.json`;
      const filepath = path.join(this.HISTORY_DIR, filename);

      // 创建完整的保存数据（包含详细信息）
      const saveData = {
        history: historyItem,
        fullSession: {
          topic: historyItem.topic,
          roles: [], // 这里可以保存完整的角色信息
          statements: [], // 这里可以保存完整的发言记录
          consensus: historyItem.consensus,
          startTime: historyItem.startTime,
          endTime: historyItem.endTime,
          status: historyItem.status
        },
        exportTime: Date.now()
      };

      // 保存到文件
      fs.writeFileSync(filepath, JSON.stringify(saveData, null, 2));
      console.log('历史记录已保存到文件:', filepath);
    } catch (error) {
      console.error('保存到文件系统失败:', error);
    }
  }

  // 从文件系统加载历史记录
  private static loadFromFileSystem(): DebateHistory[] {
    try {
      if (!fs.existsSync(this.HISTORY_DIR)) {
        return [];
      }

      const files = fs.readdirSync(this.HISTORY_DIR);
      const historyItems: DebateHistory[] = [];

      files.forEach(file => {
        if (file.endsWith('.json')) {
          try {
            const filepath = path.join(this.HISTORY_DIR, file);
            const content = fs.readFileSync(filepath, 'utf8');
            const data = JSON.parse(content);
            
            if (data.history) {
              historyItems.push(data.history);
            }
          } catch (error) {
            console.warn(`读取文件失败: ${file}`, error);
          }
        }
      });

      // 按创建时间降序排序
      return historyItems.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error('从文件系统加载历史记录失败:', error);
      return [];
    }
  }

  // 获取所有历史记录（包括文件系统）
  static getHistory(): DebateHistory[] {
    try {
      // 获取本地存储的历史记录
      const localHistory: DebateHistory[] = [];
      const historyJson = this.loadFromLocalStorage(this.STORAGE_KEY);
      if (historyJson) {
        localHistory.push(...JSON.parse(historyJson));
      }

      // 获取文件系统中的历史记录
      const fileHistory = this.loadFromFileSystem();

      // 合并并去重
      const allHistory = [...localHistory, ...fileHistory];
      const uniqueHistory = this.removeDuplicates(allHistory);

      // 按创建时间降序排序并限制数量
      return uniqueHistory
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, this.MAX_HISTORY_ITEMS);
    } catch (error) {
      console.error('读取历史记录失败:', error);
      return [];
    }
  }

  // 去重函数
  private static removeDuplicates(history: DebateHistory[]): DebateHistory[] {
    const seen = new Set<string>();
    return history.filter(item => {
      if (seen.has(item.id)) {
        return false;
      }
      seen.add(item.id);
      return true;
    });
  }

  // 扫描并导入文件系统中的历史记录
  static scanAndImportFileHistory(): { success: number; failed: number } {
    try {
      const fileHistory = this.loadFromFileSystem();
      const localHistory = this.getHistory();
      
      let imported = 0;
      let failed = 0;

      fileHistory.forEach(fileItem => {
        const exists = localHistory.some(localItem => localItem.id === fileItem.id);
        if (!exists) {
          try {
            // 添加到本地存储
            localHistory.unshift(fileItem);
            imported++;
          } catch (error) {
            console.error('导入历史记录失败:', error);
            failed++;
          }
        }
      });

      if (imported > 0) {
        // 保存更新后的历史记录
        this.saveToLocalStorage(this.STORAGE_KEY, JSON.stringify(localHistory));
        this.updateStats(localHistory);
        console.log(`成功导入 ${imported} 条历史记录`);
      }

      return { success: imported, failed };
    } catch (error) {
      console.error('扫描文件系统历史记录失败:', error);
      return { success: 0, failed: 0 };
    }
  }
}