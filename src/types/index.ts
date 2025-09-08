// AI 模型配置接口
export interface AIModelConfig {
  type: 'ollama' | 'openai';
  baseUrl: string;
  apiKey?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  timeoutSeconds?: number;
}

// 辩论角色接口
export interface DebateRole {
  id: string;
  name: string;
  background: string;
  stance: string;
  personality: string;
  expertise: string[];
}

// 发言记录接口
export interface Statement {
  id: string;
  roleId: string;
  roleName: string;
  content: string;
  timestamp: number;
  round: number;
  type: 'opening' | 'argument' | 'rebuttal' | 'consensus' | 'final';
}

// 辩论会话接口
export interface DebateSession {
  id: string;
  topic: string;
  roles: DebateRole[];
  statements: Statement[];
  currentRound: number;
  status: 'preparing' | 'in-progress' | 'converging' | 'completed' | 'error';
  consensus?: string;
  startTime: number;
  endTime?: number;
  config: DebateConfig;
  // 新增：连续讨论支持
  sessionId?: string; // 会话ID，用于链接相关讨论
  parentSessionId?: string; // 父会话ID
  continuationCount?: number; // 连续讨论次数
  previousConsensus?: string; // 前一轮的共识内容
}

// 辩论配置接口
export interface DebateConfig {
  maxRounds: number;
  convergenceThreshold: number;
  aiModel: AIModelConfig;
  enableRealTimeAnalysis: boolean;
}

// AI 响应接口
export interface AIResponse {
  content: string;
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

// 历史记录接口
export interface DebateHistory {
  id: string;
  sessionId: string; // 会话系列ID
  topic: string;
  consensus?: string;
  startTime: number;
  endTime: number;
  duration: number; // 讨论时长（毫秒）
  roleCount: number;
  statementCount: number;
  status: 'completed' | 'stopped' | 'error';
  isContinuation: boolean; // 是否为连续讨论
  parentSessionId?: string; // 父会话ID
  continuationCount?: number; // 连续讨论次数
  createdAt: number; // 创建时间
  updatedAt: number; // 更新时间
}

// 历史记录统计接口
export interface HistoryStats {
  totalSessions: number;
  totalDuration: number;
  averageDuration: number;
  totalStatements: number;
  completedSessions: number;
  continuationChains: number; // 连续讨论链数量
}

// 历史记录过滤选项
export interface HistoryFilterOptions {
  search?: string;
  status?: 'all' | 'completed' | 'stopped' | 'error';
  dateRange?: {
    start: number;
    end: number;
  };
  isContinuation?: boolean;
  sortBy?: 'createdAt' | 'duration' | 'statementCount' | 'topic';
  sortOrder?: 'asc' | 'desc';
}