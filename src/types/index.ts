/**
 * CodeBuddy CN Agent 类型定义
 * @description 定义AI开发团队六角色的核心数据结构和接口
 */

/**
 * AI角色类型枚举
 */
export enum RoleType {
  TECH_LEAD = '技术总监',
  PRODUCT_MANAGER = '产品经理',
  UI_DESIGNER = 'UI设计师',
  FRONTEND_DEVELOPER = '前端工程师',
  BACKEND_DEVELOPER = '后端工程师',
  TEST_ENGINEER = '测试工程师'
}

/**
 * 项目状态枚举
 */
export enum ProjectStatus {
  INIT = '初始化',
  INITIATED = '已启动',
  PLANNING = '规划中',
  DEVELOPING = '开发中',
  TESTING = '测试中',
  COMPLETED = '已完成',
  PAUSED = '已暂停',
  IN_PROGRESS = '进行中'
}

/**
 * 任务优先级枚举
 */
export enum TaskPriority {
  P0 = 'P0-致命',
  P1 = 'P1-严重',
  P2 = 'P2-一般',
  P3 = 'P3-轻微'
}

/**
 * 任务状态枚举
 */
export enum TaskStatus {
  PENDING = '⏳待开始',
  IN_PROGRESS = '🔄进行中',
  PAUSED = '⏸️已暂停',
  COMPLETED = '✅已完成',
  CANCELLED = '❌已取消'
}

/**
 * AI角色配置接口
 */
export interface RoleConfig {
  type: RoleType;
  name: string;
  capabilities: string[];
  workMode: string[];
  outputFormat: string[];
  activationPrompt: string;
  workflow: WorkflowStep[];
}

/**
 * MCP调用配置
 */
export interface MCPCall {
  server: string;      // MCP服务器名称
  tool: string;        // 工具名称
  arguments?: Record<string, any>;  // 调用参数
  condition?: string;  // 调用条件表达式
  useResult?: boolean; // 是否使用结果
}

/**
 * 工作流步骤
 */
export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  role: RoleType;
  duration: number; // 分钟
  deliverables: string[];
  prerequisites: string[];
  status?: TaskStatus;
  mcpCalls?: MCPCall[];  // MCP调用配置
}

/**
 * 项目信息接口
 */
export interface ProjectInfo {
  name: string;
  type: string;
  description: string;
  targetUsers: string;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
  currentRole?: RoleType;
  progress: number;
}

/**
 * 任务接口
 */
export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignee: RoleType;
  estimatedHours: number;
  actualHours?: number;
  startDate?: Date;
  endDate?: Date;
  dependencies: string[];
  deliverables: string[];
  acceptanceCriteria: string[];
}

/**
 * 需求信息接口
 */
export interface Requirement {
  id: string;
  title: string;
  description: string;
  category: '功能需求' | '非功能需求';
  priority: TaskPriority;
  status: TaskStatus;
  acceptanceCriteria: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 项目文档接口
 */
export interface ProjectDocument {
  id: string;
  type: DocumentType;
  title: string;
  content: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  author: RoleType;
}

/**
 * 文档类型枚举
 */
export enum DocumentType {
  REQUIREMENT_SPEC = '需求拆解说明书',
  TECH_ARCHITECTURE = '技术架构方案',
  TASK_ASSIGNMENT = '任务分配表',
  PRODUCT_REQUIREMENT = '产品需求文档',
  DESIGN_SPEC = '设计规范',
  API_DOCUMENT = 'API接口文档',
  TEST_PLAN = '测试计划',
  PROGRESS_REPORT = '进度报告'
}

/**
 * 角色激活请求接口
 */
export interface RoleActivationRequest {
  role: RoleType;
  projectInfo: ProjectInfo;
  context?: string;
  previousOutput?: string;
  autoMode?: boolean;  // 自动模式标识
}

/**
 * 角色激活响应接口
 */
export interface RoleActivationResponse {
  success: boolean;
  role: RoleType;
  status: string;
  output?: string;
  nextSteps?: string[];
  error?: string;
}

/**
 * 项目配置接口
 */
export interface ProjectConfig {
  project: ProjectInfo;
  requirements: Requirement[];
  tasks: Task[];
  documents: ProjectDocument[];
  team: TeamMember[];
  settings: ProjectSettings;
}

/**
 * 团队成员接口
 */
export interface TeamMember {
  role: RoleType;
  name: string;
  status: 'active' | 'inactive';
  currentTask?: string;
  completedTasks: number;
}

/**
 * 项目设置接口
 */
export interface ProjectSettings {
  autoSave: boolean;
  notificationEnabled: boolean;
  workingHours: {
    start: string;
    end: string;
  };
  qualityThresholds: {
    codeCoverage: number;
    bugRate: number;
    performance: number;
  };
}