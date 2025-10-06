/**
 * CodeBuddy MCP 服务器
 * @description 将AI开发团队功能包装为MCP工具，并集成其他MCP服务器调用功能
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { RoleManager } from '../core/RoleManager';
import { WorkflowEngine } from '../core/WorkflowEngine';
import { DocumentGenerator } from '../core/DocumentGenerator';
import { MCPClientManager } from '../core/MCPClientManager';
import { Paywall } from '../core/Paywall';
import { ProjectInfo, WorkflowStep, RoleType, ProjectStatus } from '../types';
import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';

/**
 * CodeBuddy MCP服务器类
 */
export class CodeBuddyMCPServer {
  private server: Server;
  private roleManager: RoleManager;
  private workflowEngine: WorkflowEngine;
  private documentGenerator: DocumentGenerator;
  private mcpClientManager: MCPClientManager;
  private paywall: Paywall;

  constructor() {
    this.server = new Server(
      {
        name: 'codebuddy-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.roleManager = new RoleManager();
    this.workflowEngine = new WorkflowEngine(this.roleManager);
    this.documentGenerator = new DocumentGenerator(this.roleManager, this.workflowEngine, process.cwd());
    this.paywall = new Paywall(3, 'https://paypal.me/xiaoyi11/0.99USD'); // 3次免费调用
    
    // 初始化MCP客户端管理器
    this.mcpClientManager = this.initializeMCPClientManager();

    this.setupToolHandlers();
  }

  /**
   * 初始化MCP客户端管理器
   */
  private initializeMCPClientManager(): MCPClientManager {
    try {
      // 读取mcp.json配置文件
      const configPath = path.join(process.cwd(), 'mcp.json');
      let mcpConfig = {};
      
      if (fs.existsSync(configPath)) {
        const configContent = fs.readFileSync(configPath, 'utf-8');
        mcpConfig = JSON.parse(configContent).mcpServers || {};
      }
      
      const clientManager = new MCPClientManager(mcpConfig);
      
      // 异步初始化客户端连接
      clientManager.initializeClients().catch(error => {
        console.error('初始化MCP客户端失败:', error);
      });
      
      return clientManager;
    } catch (error) {
      console.error('创建MCP客户端管理器失败:', error);
      // 返回一个空的客户端管理器作为降级方案
      return new MCPClientManager({});
    }
  }

  /**
   * 设置工具处理器
   */
  private setupToolHandlers(): void {
    // 工具列表请求处理
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.getAvailableTools(),
      };
    });

    // 工具调用请求处理
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      return await this.handleToolCall(request.params.name, request.params.arguments || {});
    });
  }

  /**
   * 获取可用工具列表
   */
  private getAvailableTools(): Tool[] {
    return [
      // 角色管理工具
      {
        name: 'get_available_roles',
        description: '获取所有可用的AI角色',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'activate_role',
        description: '激活指定的AI角色',
        inputSchema: {
          type: 'object',
          properties: {
            roleName: {
              type: 'string',
              description: '角色名称',
            },
          },
          required: ['roleName'],
        },
      },
      {
        name: 'get_role_capabilities',
        description: '获取角色的核心能力',
        inputSchema: {
          type: 'object',
          properties: {
            roleName: {
              type: 'string',
              description: '角色名称',
            },
          },
          required: ['roleName'],
        },
      },

      // 核心AI角色工具
      {
        name: 'tech_lead_analyze',
        description: '技术总监：需求拆解 + 架构 + 任务分配',
        inputSchema: {
          type: 'object',
          properties: {
            requirement: {
              type: 'string',
              description: '需求描述',
            },
            deviceId: {
              type: 'string',
              description: '设备ID（可选，用于付费墙统计）',
            },
          },
          required: ['requirement'],
        },
      },
      {
        name: 'product_manager_write_prd',
        description: '产品经理：输出 PRD 与优先级',
        inputSchema: {
          type: 'object',
          properties: {
            requirement: {
              type: 'string',
              description: '需求描述',
            },
            deviceId: {
              type: 'string',
              description: '设备ID（可选，用于付费墙统计）',
            },
          },
          required: ['requirement'],
        },
      },
      {
        name: 'ui_designer_design',
        description: 'UI 设计师：页面草图 + 设计规范',
        inputSchema: {
          type: 'object',
          properties: {
            requirement: {
              type: 'string',
              description: '需求描述',
            },
            deviceId: {
              type: 'string',
              description: '设备ID（可选，用于付费墙统计）',
            },
          },
          required: ['requirement'],
        },
      },
      {
        name: 'frontend_dev_code',
        description: '前端工程师：生成可编译页面代码',
        inputSchema: {
          type: 'object',
          properties: {
            requirement: {
              type: 'string',
              description: '需求描述',
            },
            deviceId: {
              type: 'string',
              description: '设备ID（可选，用于付费墙统计）',
            },
          },
          required: ['requirement'],
        },
      },
      {
        name: 'backend_dev_api',
        description: '后端工程师：RESTful API + 数据库设计',
        inputSchema: {
          type: 'object',
          properties: {
            requirement: {
              type: 'string',
              description: '需求描述',
            },
            deviceId: {
              type: 'string',
              description: '设备ID（可选，用于付费墙统计）',
            },
          },
          required: ['requirement'],
        },
      },
      {
        name: 'test_engineer_plan',
        description: '测试工程师：测试用例 + Bug 清单',
        inputSchema: {
          type: 'object',
          properties: {
            requirement: {
              type: 'string',
              description: '需求描述',
            },
            deviceId: {
              type: 'string',
              description: '设备ID（可选，用于付费墙统计）',
            },
          },
          required: ['requirement'],
        },
      },
      {
        name: 'run_full_workflow',
        description: '一键全流程：输入一句话需求，返回 6 合 1 报告',
        inputSchema: {
          type: 'object',
          properties: {
            idea: {
              type: 'string',
              description: '项目想法',
            },
            deviceId: {
              type: 'string',
              description: '设备ID（可选，用于付费墙统计）',
            },
          },
          required: ['idea'],
        },
      },

      // 工作流管理工具
      {
        name: 'create_workflow',
        description: '创建新的项目工作流',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: '项目名称',
            },
            type: {
              type: 'string',
              description: '项目类型',
              enum: ['Web应用', '移动应用', 'API服务', '桌面应用'],
            },
            description: {
              type: 'string',
              description: '项目描述',
            },
            requirements: {
              type: 'string',
              description: '项目需求',
            },
          },
          required: ['name', 'type', 'description'],
        },
      },
      {
        name: 'get_workflow_status',
        description: '获取当前工作流状态',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'execute_workflow_step',
        description: '执行工作流的下一步',
        inputSchema: {
          type: 'object',
          properties: {
            mode: {
              type: 'string',
              description: '执行模式',
              enum: ['auto', 'manual'],
              default: 'manual',
            },
          },
          required: [],
        },
      },
      {
        name: 'get_workflow_report',
        description: '获取工作流执行报告',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },

      // 文档生成工具
      {
        name: 'generate_document',
        description: '生成项目文档',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              description: '文档类型',
              enum: ['需求文档', '技术方案', '设计文档', '测试报告', '项目总结'],
            },
            requirements: {
              type: 'object',
              description: '文档需求',
              properties: {
                projectName: { type: 'string' },
                projectType: { type: 'string' },
                features: { type: 'array', items: { type: 'string' } },
                techStack: { type: 'array', items: { type: 'string' } },
              },
            },
          },
          required: ['type', 'requirements'],
        },
      },
      {
        name: 'get_document_templates',
        description: '获取可用的文档模板',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },

      // MCP客户端管理工具
      {
        name: 'get_mcp_servers_status',
        description: '获取所有MCP服务器的状态',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'get_available_mcp_tools',
        description: '获取所有可用的MCP工具',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'call_mcp_tool',
        description: '调用指定的MCP工具',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: {
              type: 'string',
              description: 'MCP服务器名称',
            },
            toolName: {
              type: 'string',
              description: '工具名称',
            },
            arguments: {
              type: 'object',
              description: '工具参数',
              default: {},
            },
          },
          required: ['serverName', 'toolName'],
        },
      },
      {
        name: 'reload_mcp_servers',
        description: '重新加载MCP服务器配置',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
    ];
  }

  /**
 * 处理工具调用
   */
  private async handleToolCall(name: string, args: Record<string, any>): Promise<any> {
    try {
      switch (name) {
        // 角色管理工具
        case 'get_available_roles':
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  activeRole: this.roleManager.getActiveRole(),
                  allRoles: this.roleManager.getAllRoleConfigs()
                }, null, 2)
              }
            ]
          };

        case 'activate_role':
          const roleResult = await this.roleManager.activateRole({
            role: args.roleName as RoleType,
            projectInfo: { name: 'MCP项目', type: 'Web应用', description: '通过MCP创建的项目', targetUsers: '', status: ProjectStatus.DEVELOPING, createdAt: new Date(), updatedAt: new Date(), progress: 0 }
          });
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(roleResult, null, 2)
              }
            ]
          };

        case 'get_role_info':
          const roleConfig = this.roleManager.getRoleConfig(args.roleName);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  roleName: args.roleName,
                  name: roleConfig?.name || args.roleName,
                  capabilities: roleConfig?.capabilities || [],
                  workMode: roleConfig?.workMode || [],
                  outputFormat: roleConfig?.outputFormat || []
                }, null, 2)
              }
            ]
          };

        // 工作流管理工具
        case 'start_workflow':
          const projectInfo: ProjectInfo = {
            name: args.projectName || 'MCP项目',
            type: args.projectType || 'Web应用',
            description: args.description || '通过MCP创建的项目',
            targetUsers: args.targetUsers || '通用用户',
            status: ProjectStatus.DEVELOPING,
            createdAt: new Date(),
            updatedAt: new Date(),
            progress: 0
          };
          
          await this.workflowEngine.startAutoWorkflow(projectInfo);
          return {
            content: [
              {
                type: 'text',
                text: `✅ 工作流已启动！项目：${projectInfo.name}`
              }
            ]
          };

        case 'get_workflow_status':
          const status = this.workflowEngine.getProjectStatus();
          const progress = this.workflowEngine.getProjectProgress();
          const currentStep = this.workflowEngine.getCurrentStepInfo();
          
          return {
            projectStatus: status,
            progress: progress,
            currentStep: currentStep,
            totalSteps: 7,
          };

        case 'execute_workflow_step':
          if (args.mode === 'auto') {
            // 获取当前项目信息用于自动模式
            const projectInfo = {
              name: '当前项目',
              type: 'Web应用',
              description: 'AI开发团队协作项目',
            };
            await this.workflowEngine.startAutoWorkflow(projectInfo);
          } else {
            await this.workflowEngine.executeNextStep();
          }
          
          const newStatus = this.workflowEngine.getProjectStatus();
          return {
            success: true,
            newStatus: newStatus,
            message: '工作流步骤执行完成',
          };

        case 'get_workflow_report':
          const report = this.workflowEngine.getWorkflowReport();
          return {
            report: report,
            generatedAt: new Date().toISOString(),
          };

        // 文档生成工具
        case 'generate_document':
          const documentContent = this.simulateDocumentGeneration(args.type, args.requirements);
          return {
            content: [
              {
                type: 'text',
                text: documentContent
              }
            ]
          };

        case 'get_document_templates':
          const templates = this.getDocumentTemplates();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ templates }, null, 2)
              }
            ]
          };

        // MCP客户端管理工具
        case 'get_mcp_servers_status':
          const serverStatus = this.mcpClientManager.getServerStatus();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ mcpServers: serverStatus }, null, 2)
              }
            ]
          };

        case 'get_available_mcp_tools':
          const availableTools = this.mcpClientManager.getAllAvailableTools();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ availableTools }, null, 2)
              }
            ]
          };

        case 'call_mcp_tool':
          try {
            const toolResult = await this.mcpClientManager.callTool(
              args.serverName,
              args.toolName,
              args.arguments || {}
            );
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({ 
                    success: true,
                    result: toolResult 
                  }, null, 2)
                }
              ]
            };
          } catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({ 
                    success: false,
                    error: error instanceof Error ? error.message : '调用工具失败'
                  }, null, 2)
                }
              ]
            };
          }

        case 'reload_mcp_servers':
          try {
            // 断开现有连接
            await this.mcpClientManager.disconnectAll();
            
            // 重新初始化客户端管理器
            this.mcpClientManager = this.initializeMCPClientManager();
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({ 
                    success: true,
                    message: 'MCP服务器已重新加载'
                  }, null, 2)
                }
              ]
            };
          } catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({ 
                    success: false,
                    error: error instanceof Error ? error.message : '重新加载失败'
                  }, null, 2)
                }
              ]
            };
          }

        // 核心AI角色工具处理
        case 'tech_lead_analyze':
        case 'product_manager_write_prd':
        case 'ui_designer_design':
        case 'frontend_dev_code':
        case 'backend_dev_api':
        case 'test_engineer_plan': {
          const roleMap: Record<string, RoleType> = {
            'tech_lead_analyze': RoleType.TECH_LEAD,
            'product_manager_write_prd': RoleType.PRODUCT_MANAGER,
            'ui_designer_design': RoleType.UI_DESIGNER,
            'frontend_dev_code': RoleType.FRONTEND_DEVELOPER,
            'backend_dev_api': RoleType.BACKEND_DEVELOPER,
            'test_engineer_plan': RoleType.TEST_ENGINEER
          };
          
          const roleType = roleMap[name];
          if (!roleType) {
            throw new Error(`未知的角色工具: ${name}`);
          }

          try {
            // 检查付费墙
            const deviceId = args.deviceId || this.paywall.getStatus().deviceId;
            const calls = this.paywall.incrementCalls(deviceId);
            
            if (this.paywall.needsPayment(deviceId)) {
              return {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify({ 
                      success: false,
                      payment_required: true,
                      payment_url: this.paywall.getPaymentUrl(),
                      message: `您已使用 ${calls} 次免费调用，请扫码付费继续使用`,
                      calls_used: calls,
                      free_calls: 3
                    }, null, 2)
                  }
                ]
              };
            }
            
            const result = await this.roleManager.activateAndRun(roleType, args.requirement);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({ 
                    success: true,
                    result: result,
                    calls_used: calls,
                    remaining_free_calls: this.paywall.getRemainingFreeCalls(deviceId),
                    message: `执行成功，剩余免费次数：${this.paywall.getRemainingFreeCalls(deviceId)}`
                  }, null, 2)
                }
              ]
            };
          } catch (error) {
            throw new Error(`执行角色任务失败: ${error instanceof Error ? error.message : '未知错误'}`);
          }
        }

        case 'run_full_workflow': {
          try {
            // 检查付费墙
            const deviceId = args.deviceId || this.paywall.getStatus().deviceId;
            const calls = this.paywall.incrementCalls(deviceId);
            
            if (this.paywall.needsPayment(deviceId)) {
              return {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify({ 
                      success: false,
                      payment_required: true,
                      payment_url: this.paywall.getPaymentUrl(),
                      message: `您已使用 ${calls} 次免费调用，请扫码付费继续使用`,
                      calls_used: calls,
                      free_calls: 3
                    }, null, 2)
                  }
                ]
              };
            }
            
            // 执行完整工作流
            const result = await this.roleManager.runAllSteps(args.idea, { deviceId });
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({ 
                    success: true,
                    result: result,
                    calls_used: calls,
                    remaining_free_calls: this.paywall.getRemainingFreeCalls(deviceId),
                    message: `执行成功，剩余免费次数：${this.paywall.getRemainingFreeCalls(deviceId)}`
                  }, null, 2)
                }
              ]
            };
          } catch (error) {
            throw new Error(`执行完整工作流失败: ${error instanceof Error ? error.message : '未知错误'}`);
          }
        }

        default:
          throw new Error(`未知的工具: ${name}`);
      }
    } catch (error) {
      console.error(chalk.red(`处理工具调用失败: ${name}`), error);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ 
              success: false,
              error: error instanceof Error ? error.message : '处理工具调用失败'
            }, null, 2)
          }
        ]
      };
    }
  }

  /**
   * 模拟文档生成
   */
  private simulateDocumentGeneration(type: string, requirements: any): string {
    return `# ${type}

## 项目信息
- **项目名称**: ${requirements?.projectName || '未命名项目'}
- **项目类型**: ${requirements?.projectType || 'Web应用'}
- **生成时间**: ${new Date().toLocaleString()}

## 需求概述
${requirements?.description || '根据需求生成相应文档内容...'}

## 主要功能
${requirements?.features?.map((feature: string) => `- ${feature}`).join('\n') || '- 功能待定义'}

## 技术栈
${requirements?.techStack?.map((tech: string) => `- ${tech}`).join('\n') || '- 技术栈待确定'}

---
*本文档由CodeBuddy MCP服务器自动生成*`;
  }

  /**
   * 获取文档模板列表
   */
  private getDocumentTemplates(): string[] {
    return [
      '需求文档',
      '技术方案',
      'UI设计文档',
      '前端开发文档',
      '后端API文档',
      '测试计划',
      '项目进度报告',
      '代码审查报告'
    ];
  }

  /**
   * 启动MCP服务器
   */
  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('CodeBuddy MCP服务器已启动');
    
    // 设置关闭处理
    process.on('SIGINT', async () => {
      console.error('\n正在断开MCP客户端连接...');
      await this.mcpClientManager.disconnectAll();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.error('\n正在断开MCP客户端连接...');
      await this.mcpClientManager.disconnectAll();
      process.exit(0);
    });
  }
}

/**
 * 主函数 - MCP服务器入口点
 */
async function main(): Promise<void> {
  const server = new CodeBuddyMCPServer();
  await server.run();
}

// 如果直接运行此文件
if (require.main === module) {
  main().catch(error => {
    console.error('❌ MCP服务器运行错误:', error);
    process.exit(1);
  });
}