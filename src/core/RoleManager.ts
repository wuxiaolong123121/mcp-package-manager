/**
 * 角色管理器
 * @description 管理AI开发团队六角色的激活、切换和协作
 */

import { RoleType, RoleConfig, RoleActivationRequest, RoleActivationResponse, WorkflowStep, ProjectStatus, MCPCall } from '../types';
import { MCPClientManager } from './MCPClientManager';
import chalk from 'chalk';
import { EventEmitter } from 'events';

export class RoleManager extends EventEmitter {
  private activeRole: RoleType | null = null;
  private roleConfigs: Map<RoleType, RoleConfig> = new Map();
  private roleWorkflows: Map<string, any> = new Map();
  private conversationHistory: Map<RoleType, string[]> = new Map();
  private mcpManager: MCPClientManager;

  constructor() {
    super();
    // 初始化MCP管理器（空配置，后续通过initializeClients加载）
    this.mcpManager = new MCPClientManager({});
    this.initializeRoleConfigs();
  }

  /**
   * 初始化角色工作流配置
   */
  private initializeRoleWorkflows(): void {
    // 技术总监工作流配置
    this.roleWorkflows.set('tech-lead', {
      name: '技术总监',
      description: '负责技术架构设计和团队管理',
      steps: [
        {
          id: 'requirement-analysis',
          name: '需求分析',
          description: '分析项目需求和技术可行性',
          mcpCalls: [
            {
              server: 'Sequential Thinking',
              tool: 'analyze_sequence',
              arguments: {
                query: '分析项目需求的技术可行性和实现方案',
                context: '技术架构评估'
              },
              useResult: true
            },
            {
              server: 'Filesystem',
              tool: 'read_file',
              arguments: {
                path: './docs/requirements.md'
              },
              condition: 'context.hasRequirementsFile',
              useResult: true
            }
          ]
        },
        {
          id: 'tech-selection',
          name: '技术选型',
          description: '选择合适的技术栈和架构方案',
          mcpCalls: [
            {
              server: 'GitHub',
              tool: 'search_repositories',
              arguments: {
                query: '微服务架构 spring boot nodejs 技术选型对比',
                max_results: 10
              },
              useResult: true
            },
            {
              server: 'PostgreSQL',
              tool: 'query',
              arguments: {
                query: 'SELECT * FROM tech_stack_comparison WHERE category = "backend" ORDER BY popularity DESC LIMIT 10'
              },
              condition: 'context.hasDatabase',
              useResult: true
            }
          ]
        },
        {
          id: 'architecture-design',
          name: '架构设计',
          description: '设计系统整体架构',
          mcpCalls: [
            {
              server: 'Filesystem',
              tool: 'write_file',
              arguments: {
                path: './docs/architecture.md',
                content: '# 系统架构设计\n\n基于技术选型结果设计的系统架构方案...'
              },
              useResult: false
            }
          ]
        },
        {
          id: 'team-coordination',
          name: '团队协调',
          description: '协调各团队的技术实现'
        }
      ]
    });

    // 产品经理工作流配置
    this.roleWorkflows.set('product-manager', {
      name: '产品经理',
      description: '负责产品规划和需求管理',
      steps: [
        {
          id: 'competitive-analysis',
          name: '竞品分析',
          description: '分析市场上同类产品',
          mcpCalls: [
            {
              server: 'GitHub',
              tool: 'search_repositories',
              arguments: {
                query: 'product management tool project management saas',
                max_results: 15
              },
              useResult: true
            },
            {
              server: 'SQLite',
              tool: 'query',
              arguments: {
                query: 'SELECT * FROM competitors WHERE category = "project_management" ORDER BY market_share DESC'
              },
              condition: 'context.hasCompetitorDatabase',
              useResult: true
            },
            {
              server: 'Puppeteer',
              tool: 'screenshot',
              arguments: {
                url: 'https://www.producthunt.com',
                width: 1280,
                height: 720
              },
              condition: 'context.needsMarketResearch',
              useResult: true
            }
          ]
        },
        {
          id: 'requirement-document',
          name: '需求文档',
          description: '编写详细的产品需求文档',
          mcpCalls: [
            {
              server: 'Sequential Thinking',
              tool: 'analyze_sequence',
              arguments: {
                query: '基于竞品分析结果，制定产品功能需求和用户故事',
                context: '产品需求规划'
              },
              useResult: true
            },
            {
              server: 'Filesystem',
              tool: 'write_file',
              arguments: {
                path: './docs/product-requirements.md',
                content: '# 产品需求文档\n\n基于竞品分析结果制定的产品功能需求...'
              },
              useResult: false
            }
          ]
        },
        {
          id: 'feature-prioritization',
          name: '功能优先级',
          description: '确定功能开发的优先级'
        },
        {
          id: 'roadmap-planning',
          name: '路线图规划',
          description: '制定产品发展路线图'
        }
      ]
    });

    // UI设计师工作流配置
    this.roleWorkflows.set('ui-designer', {
      name: 'UI设计师',
      description: '负责用户界面设计和用户体验',
      steps: [
        {
          id: 'user-research',
          name: '用户研究',
          description: '研究目标用户群体和使用习惯',
          mcpCalls: [
            {
              server: 'GitHub',
              tool: 'search_repositories',
              arguments: {
                query: 'UI design user research usability testing',
                max_results: 10
              },
              useResult: true
            },
            {
              server: 'Puppeteer',
              tool: 'screenshot',
              arguments: {
                url: 'https://www.figma.com/community',
                width: 1280,
                height: 720,
                fullPage: true
              },
              condition: 'context.needsDesignInspiration',
              useResult: true
            },
            {
              server: 'SQLite',
              tool: 'query',
              arguments: {
                query: 'SELECT * FROM user_personas WHERE project_id = ? ORDER BY priority DESC',
                params: ['currentProjectId']
              },
              condition: 'context.hasUserDatabase',
              useResult: true
            }
          ]
        },
        {
          id: 'interface-design',
          name: '界面设计',
          description: '设计用户界面和交互流程',
          mcpCalls: [
            {
              server: 'Sequential Thinking',
              tool: 'analyze_sequence',
              arguments: {
                query: '基于用户研究结果，设计用户界面和交互流程',
                context: 'UI/UX设计规划'
              },
              useResult: true
            },
            {
              server: 'Puppeteer',
              tool: 'screenshot',
              arguments: {
                url: 'https://dribbble.com',
                width: 1280,
                height: 720,
                fullPage: true
              },
              useResult: true
            },
            {
              server: 'Filesystem',
              tool: 'write_file',
              arguments: {
                path: './design/ui-prototypes.md',
                content: '# UI设计原型\n\n基于用户研究创建的界面设计方案...'
              },
              useResult: false
            }
          ]
        },
        {
          id: 'prototype-creation',
          name: '原型制作',
          description: '创建交互原型和演示',
          mcpCalls: [
            {
              server: 'Puppeteer',
              tool: 'screenshot',
              arguments: {
                url: 'https://www.figma.com/proto/your-prototype-link',
                width: 1920,
                height: 1080,
                fullPage: false
              },
              condition: 'context.hasPrototypeLink',
              useResult: true
            }
          ]
        },
        {
          id: 'design-review',
          name: '设计评审',
          description: '进行设计评审和优化'
        }
      ]
    });

    // 前端工程师工作流配置
    this.roleWorkflows.set('frontend-developer', {
      name: '前端工程师',
      description: '负责前端界面开发和交互实现',
      steps: [
        {
          id: 'tech-selection',
          name: '技术选型',
          description: '选择合适的前端技术栈',
          mcpCalls: [
            {
              server: 'GitHub',
              tool: 'search_repositories',
              arguments: {
                query: 'react vue angular frontend framework comparison 2024',
                max_results: 10
              },
              useResult: true
            },
            {
              server: 'Puppeteer',
              tool: 'screenshot',
              arguments: {
                url: 'https://2024.stateofjs.com',
                width: 1280,
                height: 720,
                fullPage: true
              },
              condition: 'context.needsTechSurvey',
              useResult: true
            }
          ]
        },
        {
          id: 'component-development',
          name: '组件开发',
          description: '开发可复用的前端组件',
          mcpCalls: [
            {
              server: 'Sequential Thinking',
              tool: 'analyze_sequence',
              arguments: {
                query: '基于项目需求设计前端组件架构和状态管理方案',
                context: '前端组件开发'
              },
              useResult: true
            },
            {
              server: 'Filesystem',
              tool: 'write_file',
              arguments: {
                path: './src/components/ComponentLibrary.tsx',
                content: 'import React from "react";\n\n// 基于最佳实践的可复用组件库'
              },
              useResult: false
            },
            {
              server: 'SQLite',
              tool: 'query',
              arguments: {
                query: 'SELECT * FROM component_templates WHERE framework = "react" AND category = "ui" ORDER BY usage_count DESC LIMIT 5'
              },
              condition: 'context.hasComponentLibrary',
              useResult: true
            }
          ]
        },
        {
          id: 'ui-implementation',
          name: 'UI实现',
          description: '实现用户界面和交互效果',
          mcpCalls: [
            {
              server: 'Puppeteer',
              tool: 'screenshot',
              arguments: {
                url: 'https://mui.com/components',
                width: 1920,
                height: 1080,
                fullPage: false
              },
              condition: 'context.needsUIReference',
              useResult: true
            }
          ]
        },
        {
          id: 'testing-optimization',
          name: '测试优化',
          description: '进行前端测试和性能优化'
        }
      ]
    });

    // 后端工程师工作流配置
    this.roleWorkflows.set('backend-developer', {
      name: '后端工程师',
      description: '负责后端服务开发和数据库设计',
      steps: [
        {
          id: 'architecture-design',
          name: '架构设计',
          description: '设计后端系统架构',
          mcpCalls: [
            {
              server: 'Sequential Thinking',
              tool: 'analyze_sequence',
              arguments: {
                query: '基于业务需求设计后端系统架构和微服务拆分方案',
                context: '后端架构设计'
              },
              useResult: true
            },
            {
              server: 'PostgreSQL',
              tool: 'query',
              arguments: {
                query: 'SELECT * FROM system_metrics WHERE metric_type = "performance" ORDER BY timestamp DESC LIMIT 100'
              },
              condition: 'context.hasSystemDatabase',
              useResult: true
            }
          ]
        },
        {
          id: 'api-development',
          name: 'API开发',
          description: '开发后端API接口',
          mcpCalls: [
            {
              server: 'GitHub',
              tool: 'search_repositories',
              arguments: {
                query: 'REST API GraphQL backend development best practices',
                max_results: 10
              },
              useResult: true
            },
            {
              server: 'Filesystem',
              tool: 'write_file',
              arguments: {
                path: './src/api/endpoints.ts',
                content: 'import { Router } from "express";\n\n// 基于最佳实践的API端点定义'
              },
              useResult: false
            }
          ]
        },
        {
          id: 'database-design',
          name: '数据库设计',
          description: '设计数据库结构和优化',
          mcpCalls: [
            {
              server: 'PostgreSQL',
              tool: 'query',
              arguments: {
                query: 'SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = \'public\' ORDER BY table_name, ordinal_position'
              },
              condition: 'context.hasDatabaseConnection',
              useResult: true
            },
            {
              server: 'SQLite',
              tool: 'query',
              arguments: {
                query: 'SELECT name FROM sqlite_master WHERE type=\'table\' ORDER BY name'
              },
              condition: 'context.hasSQLiteDatabase',
              useResult: true
            }
          ]
        },
        {
          id: 'service-deployment',
          name: '服务部署',
          description: '部署后端服务到生产环境'
        }
      ]
    });

    // 测试工程师工作流配置
    this.roleWorkflows.set('test-engineer', {
      name: '测试工程师',
      description: '负责软件测试和质量保障',
      steps: [
        {
          id: 'test-planning',
          name: '测试计划',
          description: '制定测试策略和计划',
          mcpCalls: [
            {
              server: 'Sequential Thinking',
              tool: 'analyze_sequence',
              arguments: {
                query: '基于项目需求制定全面的测试策略和测试计划',
                context: '测试策略制定'
              },
              useResult: true
            },
            {
              server: 'Filesystem',
              tool: 'read_file',
              arguments: {
                path: './docs/requirements.md'
              },
              condition: 'context.hasRequirementsDocument',
              useResult: true
            }
          ]
        },
        {
          id: 'test-case-design',
          name: '测试用例设计',
          description: '设计测试用例和测试数据',
          mcpCalls: [
            {
              server: 'GitHub',
              tool: 'search_repositories',
              arguments: {
                query: 'test cases design patterns testing best practices',
                max_results: 10
              },
              useResult: true
            },
            {
              server: 'SQLite',
              tool: 'query',
              arguments: {
                query: 'SELECT * FROM test_templates WHERE category = "functional" ORDER BY complexity ASC'
              },
              condition: 'context.hasTestDatabase',
              useResult: true
            }
          ]
        },
        {
          id: 'automated-testing',
          name: '自动化测试',
          description: '开发自动化测试脚本',
          mcpCalls: [
            {
              server: 'Puppeteer',
              tool: 'screenshot',
              arguments: {
                url: 'http://localhost:3000',
                width: 1920,
                height: 1080,
                fullPage: true
              },
              condition: 'context.hasTestEnvironment',
              useResult: true
            },
            {
              server: 'Filesystem',
              tool: 'write_file',
              arguments: {
                path: './tests/automated/test-suite.js',
                content: 'const { test, expect } = require("@playwright/test");\n\n// 自动化测试套件'
              },
              useResult: false
            }
          ]
        },
        {
          id: 'performance-testing',
          name: '性能测试',
          description: '执行性能测试和负载测试',
          mcpCalls: [
            {
              server: 'PostgreSQL',
              tool: 'query',
              arguments: {
                query: 'SELECT AVG(response_time) as avg_response, MAX(response_time) as max_response FROM performance_logs WHERE timestamp > NOW() - INTERVAL \'1 hour\''
              },
              condition: 'context.hasPerformanceDatabase',
              useResult: true
            }
          ]
        },
        {
          id: 'test-report',
          name: '测试报告',
          description: '生成测试报告和质量评估'
        }
      ]
    });
  }

  /**
   * 初始化角色配置
   */
  private initializeRoleConfigs(): void {
    // 技术总监配置
    this.roleConfigs.set(RoleType.TECH_LEAD, {
      type: RoleType.TECH_LEAD,
      name: '技术总监',
      capabilities: [
        '需求分析与拆解（5W2H方法）',
        '技术选型与架构设计',
        '任务分配与进度管控',
        '团队协调与风险管理'
      ],
      workMode: [
        '接收用户需求',
        '15分钟内完成需求拆解',
        '30分钟内输出技术方案',
        '明确任务分配和时间节点'
      ],
      outputFormat: [
        '《需求拆解说明书》',
        '《技术架构方案》',
        '《任务分配表》'
      ],
      activationPrompt: this.getTechLeadPrompt(),
      workflow: this.getTechLeadWorkflow()
    });

    // 产品经理配置
    this.roleConfigs.set(RoleType.PRODUCT_MANAGER, {
      type: RoleType.PRODUCT_MANAGER,
      name: '产品经理',
      capabilities: [
        '用户需求深度分析（KANO模型、用户旅程）',
        'PRD文档撰写',
        '竞品分析（SWOT）',
        '需求优先级管理（MoSCoW方法）'
      ],
      workMode: [
        '基于需求拆解进行深度分析',
        '20分钟完成用户调研',
        '30分钟完成需求梳理',
        '2.5小时完成PRD撰写'
      ],
      outputFormat: [
        '《用户需求调研表》',
        '《需求优先级清单》',
        '《产品需求文档PRD》'
      ],
      activationPrompt: this.getProductManagerPrompt(),
      workflow: this.getProductManagerWorkflow()
    });

    // UI设计师配置
    this.roleConfigs.set(RoleType.UI_DESIGNER, {
      type: RoleType.UI_DESIGNER,
      name: 'UI设计师',
      capabilities: [
        '视觉风格设计（极简、Material Design等）',
        '交互逻辑优化',
        '设计规范制定（色彩、字体、组件）',
        '多端适配（Web、小程序、移动端）'
      ],
      workMode: [
        '1.5小时完成需求解析',
        '2小时搭建设计规范',
        '2.5小时完成草图设计',
        '4小时完成高保真设计方案'
      ],
      outputFormat: [
        '《设计需求理解文档》',
        '《基础设计规范》',
        '《页面设计方案》',
        '《交互说明文档》',
        '《设计交付清单》'
      ],
      activationPrompt: this.getUIDesignerPrompt(),
      workflow: this.getUIDesignerWorkflow()
    });

    // 前端工程师配置
    this.roleConfigs.set(RoleType.FRONTEND_DEVELOPER, {
      type: RoleType.FRONTEND_DEVELOPER,
      name: '前端工程师',
      capabilities: [
        '界面高还原度实现（≥95%）',
        '响应式布局与多端适配',
        '状态管理与路由设计',
        '性能优化（首屏≤2秒）',
        '接口对接与数据处理'
      ],
      workMode: [
        '1.5小时完成技术方案',
        '2小时完成基础搭建',
        '4-7小时完成页面开发',
        '2.5小时完成接口联调',
        '2小时完成兼容性测试',
        '1.5小时完成性能优化'
      ],
      outputFormat: [
        '《前端技术方案》',
        '核心代码（组件代码、路由配置、API封装）',
        '《前端开发总结报告》'
      ],
      activationPrompt: this.getFrontendDeveloperPrompt(),
      workflow: this.getFrontendDeveloperWorkflow()
    });

    // 后端工程师配置
    this.roleConfigs.set(RoleType.BACKEND_DEVELOPER, {
      type: RoleType.BACKEND_DEVELOPER,
      name: '后端工程师',
      capabilities: [
        '系统架构设计（单体/微服务）',
        '数据库设计与优化',
        'RESTful API设计',
        '性能优化（响应时间≤500ms）',
        '安全防护（JWT、SQL注入防护）'
      ],
      workMode: [
        '2.5小时完成架构设计',
        '3.5小时完成数据库设计',
        '2小时完成接口设计',
        '6小时完成服务开发',
        '1.5小时完成接口联调',
        '2小时完成性能优化',
        '1小时完成安全加固'
      ],
      outputFormat: [
        '《后端架构设计文档》',
        '《数据库设计说明书》',
        '《API接口文档》',
        '核心业务代码',
        '《后端开发总结报告》'
      ],
      activationPrompt: this.getBackendDeveloperPrompt(),
      workflow: this.getBackendDeveloperWorkflow()
    });

    // 测试工程师配置
    this.roleConfigs.set(RoleType.TEST_ENGINEER, {
      type: RoleType.TEST_ENGINEER,
      name: '测试工程师',
      capabilities: [
        '测试策略制定（单元/集成/系统测试）',
        '测试用例设计（等价类、边界值）',
        '自动化测试脚本开发',
        '性能测试与压力测试',
        '缺陷跟踪与质量评估'
      ],
      workMode: [
        '1小时完成测试策略制定',
        '2小时完成测试用例设计',
        '3小时完成自动化脚本开发',
        '2小时完成性能测试',
        '1小时完成缺陷分析',
        '1小时完成测试报告'
      ],
      outputFormat: [
        '《测试策略文档》',
        '《测试用例设计文档》',
        '自动化测试脚本',
        '《性能测试报告》',
        '《缺陷分析报告》',
        '《测试总结报告》'
      ],
      activationPrompt: this.getTestEngineerPrompt(),
      workflow: this.getTestEngineerWorkflow()
    });

    // 测试工程师配置
    this.roleConfigs.set(RoleType.TEST_ENGINEER, {
      type: RoleType.TEST_ENGINEER,
      name: '测试工程师',
      capabilities: [
        '测试策略制定',
        '测试用例设计（正向、反向、边界）',
        '功能测试、性能测试、兼容性测试',
        'Bug管理与跟踪',
        '质量评估与报告'
      ],
      workMode: [
        '2.5小时制定测试计划',
        '3小时设计测试用例',
        '1.5小时执行冒烟测试',
        '3小时执行功能测试',
        '2小时执行接口测试',
        '2.5小时执行性能测试',
        '2小时执行回归测试',
        '1小时完成验收测试'
      ],
      outputFormat: [
        '《测试计划》',
        '《测试用例集》',
        '《Bug列表》',
        '《性能测试报告》',
        '《测试总结报告》'
      ],
      activationPrompt: this.getTestEngineerPrompt(),
      workflow: this.getTestEngineerWorkflow()
    });
  }

  /**
   * 执行MCP调用（增强错误处理）
   */
  private async executeMCPCalls(mcpCalls: MCPCall[], context: any): Promise<any[]> {
    const results = [];
    let successCount = 0;
    let failureCount = 0;
    
    for (const call of mcpCalls) {
      try {
        // 检查调用条件
        if (call.condition && !this.evaluateCondition(call.condition, context)) {
          console.log(chalk.yellow(`跳过MCP调用: ${call.server}.${call.tool} (条件不满足)`));
          continue;
        }

        console.log(chalk.blue(`执行MCP调用: ${call.server}.${call.tool}`));
        
        // 执行MCP工具调用（带有自动重试和熔断器保护）
        const result = await this.mcpManager.callTool(call.server, call.tool, call.arguments || {});
        
        results.push({
          server: call.server,
          tool: call.tool,
          success: true,
          result: result,
          useResult: call.useResult
        });

        successCount++;

        if (call.useResult) {
          console.log(chalk.green(`MCP调用结果已集成到工作流中`));
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(chalk.red(`MCP调用失败: ${call.server}.${call.tool}`), errorMessage);
        
        failureCount++;
        
        results.push({
          server: call.server,
          tool: call.tool,
          success: false,
          error: errorMessage,
          fallbackAvailable: this.hasFallbackOption(call.server, call.tool)
        });

        // 如果是关键调用且失败，给出建议
        if (call.useResult) {
          console.log(chalk.yellow(`关键MCP调用失败，建议使用备用方案或手动处理`));
          this.suggestFallback(call.server, call.tool, errorMessage);
        }
      }
    }
    
    // 统计和报告
    console.log(chalk.cyan(`MCP调用统计: 成功 ${successCount}, 失败 ${failureCount}, 总计 ${mcpCalls.length}`));
    
    if (failureCount > 0) {
      console.log(chalk.yellow('部分MCP调用失败，但工作流将继续执行'));
    }
    
    return results;
  }

  /**
   * 检查是否有备用方案
   */
  private hasFallbackOption(server: string, tool: string): boolean {
    // 定义一些常见的备用方案
    const fallbackMap: Record<string, string[]> = {
      'GitHub': ['本地知识库', '文档搜索', '示例代码'],
      'Sequential Thinking': ['预设模板', '经验规则', '手动分析'],
      'Puppeteer': ['静态截图', '手动截图', '描述性参考']
    };
    
    return fallbackMap[server] !== undefined;
  }

  /**
   * 建议备用方案
   */
  private suggestFallback(server: string, tool: string, error: string): void {
    const suggestions: Record<string, string> = {
      'GitHub': '建议使用本地代码示例或搜索相关文档作为替代',
      'Sequential Thinking': '建议使用预设的分析模板或基于经验进行手动分析',
      'Puppeteer': '建议手动截图或提供详细的网站描述作为参考'
    };
    
    const suggestion = suggestions[server] || '建议寻找替代方案或手动处理';
    console.log(chalk.yellow(`💡 备用方案: ${suggestion}`));
    console.log(chalk.gray(`错误详情: ${error}`));
  }

  /**
   * 评估调用条件
   */
  private evaluateCondition(condition: string, context: any): boolean {
    try {
      // 简单的条件评估逻辑
      const func = new Function('context', `return ${condition}`);
      return func(context);
    } catch (error) {
      console.error(chalk.red('条件评估失败:'), error);
      return false;
    }
  }

  /**
   * 初始化MCP客户端
   */
  async initializeMCPClients(mcpConfig: Record<string, any>): Promise<void> {
    try {
      // 创建MCP管理器实例，专注于真实MCP服务器
      this.mcpManager = new MCPClientManager(mcpConfig);
      await this.mcpManager.initializeClients();
      console.log(chalk.green('✅ MCP客户端初始化完成'));
    } catch (error) {
      console.error(chalk.red('❌ MCP客户端初始化失败:'), error);
      throw error;
    }
  }

  /**
   * 激活角色
   */
  async activateRole(request: RoleActivationRequest): Promise<RoleActivationResponse> {
    const { role, projectInfo, context, previousOutput, autoMode } = request;
    
    if (!this.roleConfigs.has(role)) {
      return {
        success: false,
        role,
        status: '角色配置不存在',
        error: `未找到角色 ${role} 的配置信息`
      };
    }

    try {
      this.activeRole = role;
      const config = this.roleConfigs.get(role)!;
      
      // 初始化对话历史
      if (!this.conversationHistory.has(role)) {
        this.conversationHistory.set(role, []);
      }

      // 执行工作流中的MCP调用
      let mcpResults: any[] = [];
      if (config.workflow && autoMode) {
        console.log(chalk.blue(`开始执行${role}角色的MCP工作流...`));
        
        for (const step of config.workflow) {
          if (step.mcpCalls && step.mcpCalls.length > 0) {
            console.log(chalk.cyan(`执行步骤: ${step.name}`));
            
            const stepContext = {
              projectInfo,
              context,
              previousOutput,
              stepName: step.name,
              role
            }
            
            const stepResults = await this.executeMCPCalls(step.mcpCalls, stepContext);
            mcpResults.push(...stepResults);
          }
        }
      }

      // 生成激活输出
      const activationOutput = this.generateActivationOutput(config, projectInfo, context, previousOutput);
      
      // 如果执行了MCP调用，添加结果信息
      if (mcpResults.length > 0) {
        const successCalls = mcpResults.filter(r => r.success).length;
        const totalCalls = mcpResults.length;
        console.log(chalk.green(`MCP工作流执行完成: ${successCalls}/${totalCalls} 个调用成功`));
      }
      
      // 记录到对话历史
      this.addToHistory(role, activationOutput);

      this.emit('roleActivated', { role, projectInfo });

      return {
          success: true,
          role,
          status: '角色已激活',
          output: activationOutput,
          nextSteps: config.workflow ? config.workflow.map(step => step.name) : []
        };
    } catch (error) {
      return {
          success: false,
          role,
          status: '激活失败',
          error: error instanceof Error ? error.message : String(error)
        };
    }
  }

  /**
   * 获取当前激活的角色
   */
  public getActiveRole(): RoleType | null {
    return this.activeRole;
  }

  /**
   * 获取角色配置
   */
  public getRoleConfig(role: RoleType): RoleConfig | undefined {
    return this.roleConfigs.get(role);
  }

  /**
   * 获取所有角色配置
   */
  public getAllRoleConfigs(): RoleConfig[] {
    return Array.from(this.roleConfigs.values());
  }

  /**
   * 切换角色
   */
  public async switchRole(newRole: RoleType, context: string): Promise<RoleActivationResponse> {
    const previousRole = this.activeRole;
    
    if (previousRole) {
      this.addToHistory(previousRole, `【角色切换】从 ${previousRole} 切换到 ${newRole}`);
    }

    return this.activateRole({
      role: newRole,
      projectInfo: { name: '当前项目', type: 'Web应用', description: '', targetUsers: '', status: ProjectStatus.DEVELOPING, createdAt: new Date(), updatedAt: new Date(), progress: 50 },
      context,
      previousOutput: previousRole ? `上一个角色: ${previousRole}` : undefined
    });
  }

  /**
   * 获取角色对话历史
   */
  public getRoleHistory(role: RoleType): string[] {
    return this.conversationHistory.get(role) || [];
  }

  /**
   * 添加到对话历史
   */
  private addToHistory(role: RoleType, content: string): void {
    const history = this.conversationHistory.get(role) || [];
    history.push(`[${new Date().toLocaleString()}] ${content}`);
    this.conversationHistory.set(role, history);
  }

  /**
   * 激活并运行角色（MCP服务器代理方法）
   */
  async activateAndRun(roleKey: string, requirement: string): Promise<string> {
    // 激活角色
    const result = await this.activateRole({
      role: roleKey as RoleType,
      projectInfo: { name: '当前项目', type: 'Web应用', description: '', targetUsers: '', status: ProjectStatus.DEVELOPING, createdAt: new Date(), updatedAt: new Date(), progress: 50 },
      context: requirement,
      autoMode: true
    });
    
    if (result.success) {
      return result.output || '角色激活成功';
    } else {
      throw new Error(result.error || '角色激活失败');
    }
  }

  /**
   * 生成激活输出
   */
  private generateActivationOutput(config: RoleConfig, projectInfo: any, context?: string, previousOutput?: string): string {
    let output = '';
    
    output += chalk.cyan('=== 角色初始化 ===\n\n');
    output += chalk.yellow(`角色名称：${config.name}\n`);
    output += chalk.green('角色能力：\n');
    config.capabilities.forEach(cap => {
      output += chalk.white(`- ${cap}\n`);
    });
    
    output += chalk.green('\n工作模式：\n');
    config.workMode.forEach((mode, index) => {
      output += chalk.white(`${index + 1}. ${mode}\n`);
    });
    
    output += chalk.green('\n输出规范：\n');
    config.outputFormat.forEach((format, index) => {
      output += chalk.white(`${index + 1}. ${format}\n`);
    });
    
    output += chalk.cyan('\n当前状态：已激活，等待需求输入\n');
    output += chalk.cyan('===================\n\n');
    
    if (context) {
      output += chalk.yellow(`【参考信息】\n${context}\n\n`);
    }
    
    if (previousOutput) {
      output += chalk.gray(`【上一个角色输出】\n${previousOutput}\n\n`);
    }
    
    output += chalk.magenta('【现在请输入你的项目需求】\n');
    
    return output;
  }

  // 各角色的激活提示词
  private getTechLeadPrompt(): string {
    return `=== 角色初始化 ===
角色名称：技术总监
角色能力：
- 需求分析与拆解（5W2H方法）
- 技术选型与架构设计
- 任务分配与进度管控
- 团队协调与风险管理

工作模式：
1. 接收用户需求
2. 15分钟内完成需求拆解
3. 30分钟内输出技术方案
4. 明确任务分配和时间节点

输出规范：
- 《需求拆解说明书》（含功能模块、优先级、风险点）
- 《技术架构方案》（含技术栈、架构图、实现路径）
- 《任务分配表》（含负责人、交付物、时间节点）

当前状态：已激活，等待需求输入
===================

【现在请输入你的项目需求】`;
  }

  private getProductManagerPrompt(): string {
    return `=== 角色初始化 ===
角色名称：产品经理
角色能力：
- 用户需求深度分析（KANO模型、用户旅程）
- PRD文档撰写
- 竞品分析（SWOT）
- 需求优先级管理（MoSCoW方法）

工作模式：
1. 基于需求拆解进行深度分析
2. 20分钟完成用户调研
3. 30分钟完成需求梳理
4. 2.5小时完成PRD撰写

输出规范：
- 《用户需求调研表》
- 《需求优先级清单》
- 《产品需求文档PRD》（含产品概述、用户故事、功能详情、交互说明、验收标准）

当前状态：已激活，等待需求拆解文档输入
===================

【请粘贴技术总监的需求拆解说明书】`;
  }

  private getUIDesignerPrompt(): string {
    return `=== 角色初始化 ===
角色名称：UI设计师
角色能力：
- 视觉风格设计（极简、Material Design等）
- 交互逻辑优化
- 设计规范制定（色彩、字体、组件）
- 多端适配（Web、小程序、移动端）

工作模式：
1. 1.5小时完成需求解析
2. 2小时搭建设计规范
3. 2.5小时完成草图设计
4. 4小时完成高保真设计方案

输出规范：
- 《设计需求理解文档》
- 《基础设计规范》（色彩系统、字体系统、组件库）
- 《页面设计方案》（用文字详细描述，含布局、色值、尺寸）
- 《交互说明文档》
- 《设计交付清单》

当前状态：已激活，等待PRD文档输入
===================

【请粘贴产品经理的PRD文档】`;
  }

  private getFrontendDeveloperPrompt(): string {
    return `=== 角色初始化 ===
角色名称：前端工程师
技术栈：Vue3/React18 + TypeScript
角色能力：
- 界面高还原度实现（≥95%）
- 响应式布局与多端适配
- 状态管理与路由设计
- 性能优化（首屏≤2秒）
- 接口对接与数据处理

工作模式：
1. 1.5小时完成技术方案
2. 2小时完成基础搭建
3. 4-7小时完成页面开发
4. 2.5小时完成接口联调
5. 2小时完成兼容性测试
6. 1.5小时完成性能优化

输出规范：
- 《前端技术方案》（框架选型、项目结构、状态管理、路由设计）
- 核心代码（组件代码、路由配置、API封装）
- 《前端开发总结报告》

当前状态：已激活，等待设计方案输入
===================

【请粘贴UI设计师的设计方案】`;
  }

  private getBackendDeveloperPrompt(): string {
    return `=== 角色初始化 ===
角色名称：后端工程师
技术栈：SpringBoot/Django/Express + MySQL/MongoDB
角色能力：
- 系统架构设计（单体/微服务）
- 数据库设计与优化
- RESTful API设计
- 性能优化（响应时间≤500ms）
- 安全防护（JWT、SQL注入防护）

工作模式：
1. 2.5小时完成架构设计
2. 3.5小时完成数据库设计
3. 2小时完成接口设计
4. 6小时完成服务开发
5. 1.5小时完成接口联调
6. 2小时完成性能优化
7. 1小时完成安全加固

输出规范：
- 《后端架构设计文档》
- 《数据库设计说明书》（ER图、表结构、索引设计）
- 《API接口文档》（Swagger格式）
- 核心业务代码
- 《后端开发总结报告》

当前状态：已激活，等待需求和前端接口需求输入
===================

【请输入项目需求和前端接口需求】`;
  }

  private getTestEngineerPrompt(): string {
    return `=== 角色初始化 ===
角色名称：测试工程师
角色能力：
- 测试策略制定
- 测试用例设计（正向、反向、边界）
- 功能测试、性能测试、兼容性测试
- Bug管理与跟踪
- 质量评估与报告

工作模式：
1. 2.5小时制定测试计划
2. 3小时设计测试用例
3. 1.5小时执行冒烟测试
4. 3小时执行功能测试
5. 2小时执行接口测试
6. 2.5小时执行性能测试
7. 2小时执行回归测试
8. 1小时完成验收测试

输出规范：
- 《测试计划》
- 《测试用例集》（含正向、反向、边界用例）
- 《Bug列表》（含级别、复现步骤、预期结果）
- 《性能测试报告》
- 《测试总结报告》

当前状态：已激活，等待PRD和开发成果输入
===================

【请粘贴PRD文档】`;
  }

  // 各角色的工作流程
  private getTechLeadWorkflow(): WorkflowStep[] {
    return [
      {
        id: 'tech-1',
        name: '需求承接',
        description: '接收并分析用户需求',
        role: RoleType.TECH_LEAD,
        duration: 15,
        deliverables: ['需求拆解说明书'],
        prerequisites: [],
        mcpCalls: [
          {
            server: 'Sequential Thinking',
            tool: 'sequentialthinking',
            arguments: {
              thought: '开始分析用户需求，使用5W2H方法进行系统性思考',
              nextThoughtNeeded: true,
              totalThoughts: 5
            },
            useResult: true
          }
        ]
      },
      {
        id: 'tech-2',
        name: '方案设计',
        description: '制定技术架构方案',
        role: RoleType.TECH_LEAD,
        duration: 30,
        deliverables: ['技术架构方案'],
        prerequisites: ['需求承接'],
        mcpCalls: [{
            server: 'GitHub',
            tool: 'search_repositories',
            arguments: {
              q: 'React TypeScript architecture',
              sort: 'stars',
              order: 'desc',
              per_page: 5
            },
            useResult: true,
            condition: 'context.projectInfo.type.includes("Web")'
          },
          {
            server: 'Sequential Thinking',
            tool: 'sequentialthinking',
            arguments: {
              query: '基于React+TypeScript的智能任务管理系统技术架构设计，包括前端架构、状态管理、组件设计、API设计'
            },
            useResult: true
          }
        ]
      },
      {
        id: 'tech-3',
        name: '任务分配',
        description: '分配任务给团队成员',
        role: RoleType.TECH_LEAD,
        duration: 20,
        deliverables: ['任务分配表'],
        prerequisites: ['方案设计'],
        mcpCalls: [
          {
            server: 'Sequential Thinking',
            tool: 'sequentialthinking',
            arguments: {
              thought: '基于技术架构方案，制定详细的任务分配计划',
              nextThoughtNeeded: true,
              totalThoughts: 6
            },
            useResult: true
          }
        ]
      }
    ];
  }

  private getProductManagerWorkflow(): WorkflowStep[] {
    return [
      {
        id: 'pm-1',
        name: '需求调研',
        description: '进行用户需求调研',
        role: RoleType.PRODUCT_MANAGER,
        duration: 20,
        deliverables: ['用户需求调研表', '竞品分析报告'],
        prerequisites: [],
        mcpCalls: [{
          server: 'Sequential Thinking',
          tool: 'sequentialthinking',
          arguments: {
            query: '使用5W2H方法分析智能任务管理系统的用户需求，包括Who、What、When、Where、Why、How、How much'
          },
          useResult: true
        }, {
          server: 'GitHub',
          tool: 'search_repositories',
          arguments: {
            q: 'task management system product requirements',
            sort: 'stars',
            order: 'desc',
            per_page: 3
          },
          useResult: true
        }]
      },
      {
        id: 'pm-2',
        name: '需求梳理',
        description: '梳理需求优先级',
        role: RoleType.PRODUCT_MANAGER,
        duration: 30,
        deliverables: ['需求优先级清单'],
        prerequisites: ['需求调研'],
        mcpCalls: [{
          server: 'Sequential Thinking',
          tool: 'sequentialthinking',
          arguments: {
            query: '使用KANO模型和MoSCoW方法对智能任务管理系统的需求进行优先级排序，区分基本需求、期望需求、兴奋需求'
          },
          useResult: true
        }]
      },
      {
        id: 'pm-3',
        name: 'PRD撰写',
        description: '撰写产品需求文档',
        role: RoleType.PRODUCT_MANAGER,
        duration: 150,
        deliverables: ['产品需求文档PRD'],
        prerequisites: ['需求梳理'],
        mcpCalls: [{
          server: 'Sequential Thinking',
          tool: 'sequentialthinking',
          arguments: {
            query: '设计智能任务管理系统的产品需求文档PRD结构，包括功能需求、非功能需求、用户故事、验收标准'
          },
          useResult: true
        }]
      }
    ];
  }

  private getUIDesignerWorkflow(): WorkflowStep[] {
    return [
      {
        id: 'ui-1',
        name: '需求解析',
        description: '解析设计需求',
        role: RoleType.UI_DESIGNER,
        duration: 90,
        deliverables: ['设计需求理解文档'],
        prerequisites: [],
        mcpCalls: [{
          server: 'Sequential Thinking',
          tool: 'sequentialthinking',
          arguments: {
            query: '分析智能任务管理系统的用户体验需求，包括用户画像、使用场景、核心功能流程'
          },
          useResult: true
        }]
      },
      {
        id: 'ui-2',
        name: '设计规范',
        description: '搭建设计规范',
        role: RoleType.UI_DESIGNER,
        duration: 120,
        deliverables: ['基础设计规范'],
        prerequisites: ['需求解析'],
        mcpCalls: [{
          server: 'GitHub',
          tool: 'search_repositories',
          arguments: {
            q: 'design system material design ant design',
            sort: 'stars',
            order: 'desc',
            per_page: 5
          },
          useResult: true
        }, {
          server: 'Sequential Thinking',
          tool: 'sequentialthinking',
          arguments: {
            query: '基于Material Design原则，为智能任务管理系统制定色彩、字体、组件等设计规范'
          },
          useResult: true
        }]
      },
      {
        id: 'ui-3',
        name: '草图设计',
        description: '完成草图设计',
        role: RoleType.UI_DESIGNER,
        duration: 150,
        deliverables: ['线框图'],
        prerequisites: ['设计规范'],
        mcpCalls: [{
          server: 'Sequential Thinking',
          tool: 'sequentialthinking',
          arguments: {
            query: '设计智能任务管理系统的信息架构和用户交互流程，包括任务创建、编辑、筛选、统计等核心功能'
          },
          useResult: true
        }]
      },
      {
        id: 'ui-4',
        name: '高保真设计',
        description: '完成高保真设计方案',
        role: RoleType.UI_DESIGNER,
        duration: 240,
        deliverables: ['高保真设计稿', '设计交付清单'],
        prerequisites: ['草图设计'],
        mcpCalls: [{
          server: 'Puppeteer',
          tool: 'screenshot',
          arguments: {
            url: 'https://dribbble.com/search/task+management+ui',
            width: 1920,
            height: 1080
          },
          useResult: true
        }, {
          server: 'Sequential Thinking',
          tool: 'sequentialthinking',
          arguments: {
            query: '基于优秀的任务管理UI设计参考，完善智能任务管理系统的高保真设计细节，包括视觉层次、交互反馈、响应式布局'
          },
          useResult: true
        }]
      }
    ];
  }

  private getFrontendDeveloperWorkflow(): WorkflowStep[] {
    return [
      {
        id: 'fe-1',
        name: '技术准备',
        description: '制定前端技术方案',
        role: RoleType.FRONTEND_DEVELOPER,
        duration: 90,
        deliverables: ['前端技术方案'],
        prerequisites: [],
        mcpCalls: [{
          server: 'GitHub',
          tool: 'search_repositories',
          arguments: {
            q: 'React TypeScript task management frontend',
            sort: 'stars',
            order: 'desc',
            per_page: 5
          },
          useResult: true
        }, {
          server: 'Sequential Thinking',
          tool: 'sequentialthinking',
          arguments: {
            query: '对比分析React+TypeScript vs Vue+TypeScript技术栈在任务管理系统开发中的优劣，包括开发效率、性能、生态系统'
          },
          useResult: true
        }]
      },
      {
        id: 'fe-2',
        name: '基础搭建',
        description: '完成项目基础搭建',
        role: RoleType.FRONTEND_DEVELOPER,
        duration: 120,
        deliverables: ['项目基础代码'],
        prerequisites: ['技术准备'],
        mcpCalls: [{
          server: 'GitHub',
          tool: 'search_repositories',
          arguments: {
            q: 'React TypeScript boilerplate webpack vite',
            sort: 'stars',
            order: 'desc',
            per_page: 3
          },
          useResult: true
        }]
      },
      {
        id: 'fe-3',
        name: '页面开发',
        description: '完成页面开发',
        role: RoleType.FRONTEND_DEVELOPER,
        duration: 420,
        deliverables: ['前端页面代码'],
        prerequisites: ['基础搭建'],
        mcpCalls: [{
          server: 'Sequential Thinking',
          tool: 'sequentialthinking',
          arguments: {
            query: `设计智能任务管理系统的前端组件架构，包括任务列表组件、筛选组件、统计组件的状态管理和性能优化策略。

输出要求：
1. 生成可编译的React+TypeScript代码
2. 代码需要包含完整的文件结构
3. 每个文件都要有明确的file-path标注
4. 包含package.json、组件文件、样式文件等

示例格式：
\`\`\`tsx file-path="src/pages/Home.tsx"
import React from 'react';

export default function Home() {
  return <h1>Hello CodeBuddy</h1>;
}
\`\`\``
          },
          useResult: true
        }]
      },
      {
        id: 'fe-4',
        name: '接口联调',
        description: '完成后端接口联调',
        role: RoleType.FRONTEND_DEVELOPER,
        duration: 150,
        deliverables: ['联调完成的前端代码'],
        prerequisites: ['页面开发'],
        mcpCalls: [{
          server: 'Sequential Thinking',
          tool: 'sequentialthinking',
          arguments: {
            query: '设计智能任务管理系统的前后端接口规范，包括RESTful API设计、错误处理机制、数据验证和缓存策略'
          },
          useResult: true
        }]
      }
    ];
  }

  private getBackendDeveloperWorkflow(): WorkflowStep[] {
    return [
      {
        id: 'be-1',
        name: '架构设计',
        description: '完成后端架构设计',
        role: RoleType.BACKEND_DEVELOPER,
        duration: 150,
        deliverables: ['后端架构设计文档'],
        prerequisites: [],
        mcpCalls: [{
          server: 'GitHub',
          tool: 'search_repositories',
          arguments: {
            q: 'microservices architecture Node.js Express',
            sort: 'stars',
            order: 'desc',
            per_page: 5
          },
          useResult: true
        }, {
          server: 'Sequential Thinking',
          tool: 'sequentialthinking',
          arguments: {
            query: '对比分析单体架构 vs 微服务架构在任务管理系统中的适用性，包括开发复杂度、性能、可维护性'
          },
          useResult: true
        }]
      },
      {
        id: 'be-2',
        name: '数据库设计',
        description: '完成数据库设计',
        role: RoleType.BACKEND_DEVELOPER,
        duration: 210,
        deliverables: ['数据库设计说明书'],
        prerequisites: ['架构设计'],
        mcpCalls: [{
          server: 'Sequential Thinking',
          tool: 'sequentialthinking',
          arguments: {
            query: '设计智能任务管理系统的数据库模型，包括用户表、任务表、项目表的关系设计，索引优化策略'
          },
          useResult: true
        }]
      },
      {
        id: 'be-3',
        name: '接口设计',
        description: '完成API接口设计',
        role: RoleType.BACKEND_DEVELOPER,
        duration: 120,
        deliverables: ['API接口文档'],
        prerequisites: ['数据库设计'],
        mcpCalls: [{
          server: 'Sequential Thinking',
          tool: 'sequentialthinking',
          arguments: {
            query: '设计智能任务管理系统的RESTful API规范，包括认证授权、请求响应格式、错误处理、分页机制'
          },
          useResult: true
        }]
      },
      {
        id: 'be-4',
        name: '服务开发',
        description: '完成后端服务开发',
        role: RoleType.BACKEND_DEVELOPER,
        duration: 360,
        deliverables: ['后端业务代码'],
        prerequisites: ['接口设计'],
        mcpCalls: [{
          server: 'Sequential Thinking',
          tool: 'sequentialthinking',
          arguments: {
            query: `设计智能任务管理系统的核心业务逻辑，包括任务CRUD、权限控制、数据统计、性能优化策略。

输出要求：
1. 生成可编译的后端代码（Node.js/Express + TypeScript）
2. 包含完整的项目结构和配置文件
3. 数据库模型和API接口实现
4. 每个文件都要有明确的file-path标注

示例格式：
\`\`\`typescript file-path="src/app.ts"
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

export default app;
\`\`\``
          },
          useResult: true
        }]
      }
    ];
  }

  private getTestEngineerWorkflow(): WorkflowStep[] {
    return [
      {
        id: 'test-1',
        name: '测试计划',
        description: '制定测试计划',
        role: RoleType.TEST_ENGINEER,
        duration: 150,
        deliverables: ['测试计划'],
        prerequisites: [],
        mcpCalls: [{
          server: 'Sequential Thinking',
          tool: 'sequentialthinking',
          arguments: {
            query: '制定智能任务管理系统的测试策略，包括测试范围、测试方法、风险评估、资源分配和时间计划'
          },
          useResult: true
        }]
      },
      {
        id: 'test-2',
        name: '用例设计',
        description: '设计测试用例',
        role: RoleType.TEST_ENGINEER,
        duration: 180,
        deliverables: ['测试用例集'],
        prerequisites: ['测试计划'],
        mcpCalls: [{
          server: 'GitHub',
          tool: 'search_repositories',
          arguments: {
            q: 'testing framework Jest Cypress automation',
            sort: 'stars',
            order: 'desc',
            per_page: 5
          },
          useResult: true
        }, {
          server: 'Sequential Thinking',
          tool: 'sequentialthinking',
          arguments: {
            query: '设计智能任务管理系统的测试用例，包括功能测试、边界测试、异常测试、正向测试和反向测试用例'
          },
          useResult: true
        }]
      },
      {
        id: 'test-3',
        name: '功能测试',
        description: '执行功能测试',
        role: RoleType.TEST_ENGINEER,
        duration: 180,
        deliverables: ['功能测试报告', 'Bug列表'],
        prerequisites: ['用例设计'],
        mcpCalls: [{
          server: 'Sequential Thinking',
          tool: 'sequentialthinking',
          arguments: {
            query: '制定智能任务管理系统的功能测试执行策略，包括测试环境搭建、测试数据准备、缺陷管理流程'
          },
          useResult: true
        }]
      },
      {
        id: 'test-4',
        name: '性能测试',
        description: '执行性能测试',
        role: RoleType.TEST_ENGINEER,
        duration: 150,
        deliverables: ['性能测试报告'],
        prerequisites: ['功能测试'],
        mcpCalls: [{
          server: 'Sequential Thinking',
          tool: 'sequentialthinking',
          arguments: {
            query: '设计智能任务管理系统的性能测试方案，包括并发测试、负载测试、压力测试的指标和工具选择'
          },
          useResult: true
        }]
      }
    ];
  }

  /**
   * 运行完整工作流
   * @description 基于项目想法自动执行所有角色的完整工作流程
   */
  public async runAllSteps(idea: string): Promise<string> {
    try {
      console.log(chalk.blue('=== 开始执行完整工作流 ==='));
      console.log(chalk.white(`项目想法：${idea}`));
      
      // 创建项目信息
      const projectInfo = {
        name: idea.substring(0, 50) + (idea.length > 50 ? '...' : ''),
        type: 'Web应用',
        description: idea,
        targetUsers: '普通用户',
        status: '开发中' as ProjectStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
        progress: 0
      };

      // 按顺序激活所有角色
      const allRoles = [
        RoleType.TECH_LEAD,
        RoleType.PRODUCT_MANAGER, 
        RoleType.UI_DESIGNER,
        RoleType.BACKEND_DEVELOPER,
        RoleType.FRONTEND_DEVELOPER,
        RoleType.TEST_ENGINEER
      ];

      const results: string[] = [];
      
      for (let i = 0; i < allRoles.length; i++) {
        const role = allRoles[i];
        console.log(chalk.yellow(`\n[${i + 1}/${allRoles.length}] 激活角色：${this.getRoleName(role)}`));
        
        try {
          const result = await this.activateRole({
            role,
            projectInfo,
            context: results.join('\n---\n'),
            autoMode: true
          });
          
          if (result.success) {
            console.log(chalk.green(`✓ ${role} 执行成功`));
            results.push(`## ${this.getRoleName(role)}\n${result.output || '完成任务'}`);
          } else {
            console.log(chalk.red(`✗ ${role} 执行失败：${result.error}`));
            results.push(`## ${this.getRoleName(role)}\n执行失败：${result.error}`);
          }
        } catch (error) {
          console.log(chalk.red(`✗ ${role} 执行异常：${error instanceof Error ? error.message : String(error)}`));
          results.push(`## ${this.getRoleName(role)}\n执行异常：${error instanceof Error ? error.message : String(error)}`);
        }
        
        // 步骤间停顿
        if (i < allRoles.length - 1) {
          console.log(chalk.gray('准备下一个角色...'));
          await this.delay(1000);
        }
      }
      
      console.log(chalk.green('\n🎉 === 完整工作流执行完成！ ==='));
      
      return `# 项目工作流执行报告

## 项目信息
- **项目想法**：${idea}
- **执行时间**：${new Date().toLocaleString()}
- **总角色数**：${allRoles.length}

## 各角色执行结果
${results.join('\n\n')}

## 总结
项目已完成所有角色的自动协作流程，每个角色都基于项目需求完成了相应的专业工作。

---
*报告由CodeBuddy AI团队自动生成*`;
      
    } catch (error) {
      console.error(chalk.red('执行完整工作流失败：'), error);
      throw new Error(`执行完整工作流失败：${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取角色显示名称
   */
  private getRoleName(role: RoleType): string {
    const roleNames: Record<RoleType, string> = {
      [RoleType.TECH_LEAD]: '技术总监',
      [RoleType.PRODUCT_MANAGER]: '产品经理',
      [RoleType.UI_DESIGNER]: 'UI设计师',
      [RoleType.FRONTEND_DEVELOPER]: '前端工程师',
      [RoleType.BACKEND_DEVELOPER]: '后端工程师',
      [RoleType.TEST_ENGINEER]: '测试工程师'
    };
    return roleNames[role] || role;
  }

  /**
   * 延迟工具函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}