/**
 * CodeBuddy CN Agent CLI 入口文件
 * @description 提供命令行界面，管理AI开发团队工作流程
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import * as fs from 'fs-extra';
import * as path from 'path';
import { RoleManager } from '../core/RoleManager';
import { WorkflowEngine } from '../core/WorkflowEngine';
import { DocumentGenerator } from '../core/DocumentGenerator';
import { RoleType, ProjectStatus, RoleConfig, WorkflowStep } from '../types';

class CodeBuddyCLI {
  private program: Command;
  private roleManager!: RoleManager;
  private workflowEngine!: WorkflowEngine;
  private documentGenerator!: DocumentGenerator;
  private projectRoot: string;

  constructor() {
    this.program = new Command();
    this.projectRoot = process.cwd();
    this.initializeComponents();
    this.setupCommands();
  }

  /**
   * 初始化组件
   */
  private initializeComponents(): void {
    this.roleManager = new RoleManager();
    this.workflowEngine = new WorkflowEngine(this.roleManager);
    this.documentGenerator = new DocumentGenerator(this.roleManager, this.workflowEngine, this.projectRoot);
  }

  /**
   * 设置命令
   */
  private setupCommands(): void {
    this.program
      .name('codebuddy')
      .description('CodeBuddy CN Agent - AI开发团队管理工具')
      .version('1.0.0');

    // 初始化项目
    this.program
      .command('init')
      .description('初始化新项目')
      .action(() => this.initProject());

    // 激活角色
    this.program
      .command('activate <role>')
      .description('激活指定角色')
      .action((role) => this.activateRole(role));

    // 启动工作流
    this.program
      .command('start')
      .description('启动工作流程')
      .action(() => this.startWorkflow());

    // 查看状态
    this.program
      .command('status')
      .description('查看项目状态')
      .action(() => this.showStatus());

    // 切换角色
    this.program
      .command('switch <role>')
      .description('切换到指定角色')
      .action((role) => this.switchRole(role));

    // 生成文档
    this.program
      .command('docs')
      .description('生成项目文档')
      .action(() => this.generateDocuments());

    // 查看角色列表
    this.program
      .command('roles')
      .description('查看所有可用角色')
      .action(() => this.listRoles());

    // 下一步
    this.program
      .command('next')
      .description('执行工作流程的下一步')
      .action(() => this.executeNextStep());

    // 重置工作流
    this.program
      .command('reset')
      .description('重置工作流程')
      .action(() => this.resetWorkflow());

    // 自动模式
    this.program
      .command('auto')
      .description('全自动运行整个工作流程')
      .action(() => this.runAutoMode());

    // 帮助命令
    this.program
      .command('help')
      .description('显示帮助信息')
      .action(() => this.showHelp());

    // 打包项目
    this.program
      .command('pack')
      .description('打包项目并生成下载链接')
      .action(() => this.packProject());
  }

  /**
   * 初始化项目
   */
  private async initProject(): Promise<void> {
    console.log(chalk.blue('=== CodeBuddy CN Agent 项目初始化 ===\n'));

    try {
      // 收集项目信息
      const projectInfo = await this.collectProjectInfo();
      
      // 创建项目目录结构
      await this.createProjectStructure();
      
      // 生成项目文档
      await this.documentGenerator.generateProjectDocument(projectInfo);
      
      console.log(chalk.green('\n✓ 项目初始化完成！'));
      console.log(chalk.cyan('\n下一步：'));
      console.log(chalk.white('1. 使用 "codebuddy start" 启动工作流程'));
      console.log(chalk.white('2. 使用 "codebuddy roles" 查看可用角色'));
      console.log(chalk.white('3. 使用 "codebuddy activate <role>" 激活特定角色'));
      
    } catch (error) {
      console.error(chalk.red('项目初始化失败：'), error);
    }
  }

  /**
   * 收集项目信息
   */
  private async collectProjectInfo(): Promise<any> {
    const questions = [
      {
        type: 'input',
        name: 'name',
        message: '项目名称：',
        default: '我的AI项目'
      },
      {
        type: 'list',
        name: 'type',
        message: '项目类型：',
        choices: [
          'Web应用',
          '移动应用',
          '小程序',
          '桌面应用',
          'API服务',
          '其他'
        ],
        default: 'Web应用'
      },
      {
        type: 'input',
        name: 'description',
        message: '项目描述：',
        default: '一个基于AI开发团队的项目'
      },
      {
        type: 'input',
        name: 'targetUsers',
        message: '目标用户：',
        default: '普通用户'
      },
      {
        type: 'input',
        name: 'deadline',
        message: '预期完成时间（可选）：',
        default: ''
      }
    ];

    const answers = await inquirer.prompt(questions);
    
    return {
      ...answers,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: ProjectStatus.INITIATED,
      progress: 0
    };
  }

  /**
   * 创建项目目录结构
   */
  private async createProjectStructure(): Promise<void> {
    const directories = [
      'docs',
      'src',
      'tests',
      'scripts',
      'assets',
      'logs'
    ];

    for (const dir of directories) {
      const dirPath = path.join(this.projectRoot, dir);
      await fs.ensureDir(dirPath);
      console.log(chalk.gray(`创建目录：${dir}`));
    }
  }

  /**
   * 激活角色
   */
  private async activateRole(roleInput: string): Promise<void> {
    const role = this.parseRole(roleInput);
    
    if (!role) {
      console.error(chalk.red(`无效的角色：${roleInput}`));
      console.log(chalk.cyan('可用角色：'));
      this.listRoles();
      return;
    }

    console.log(chalk.blue(`=== 激活角色：${this.getRoleDisplayName(role)} ===\n`));

    try {
      // 收集上下文信息
      const context = await this.collectContextInfo();
      
      // 激活角色
      const result = await this.roleManager.activateRole({
        role,
        projectInfo: await this.getCurrentProjectInfo(),
        context: context.description,
        previousOutput: context.previousOutput
      });

      if (result.success) {
        console.log(result.output);
        
        // 等待用户输入需求
        const userInput = await inquirer.prompt([
          {
            type: 'editor',
            name: 'requirement',
            message: '请输入你的项目需求（按Ctrl+D保存并退出）：',
            default: '请详细描述你的项目需求...'
          }
        ]);
        
        console.log(chalk.green('\n✓ 需求已接收，开始处理...'));
        
      } else {
        console.error(chalk.red(`激活失败：${result.error}`));
      }
      
    } catch (error) {
      console.error(chalk.red('激活过程中出错：'), error);
    }
  }

  /**
   * 启动工作流程
   */
  private async startWorkflow(): Promise<void> {
    console.log(chalk.blue('=== 启动AI开发团队工作流程 ===\n'));

    try {
      // 获取项目信息
      const projectInfo = await this.getCurrentProjectInfo();
      
      if (!projectInfo) {
        console.log(chalk.yellow('未找到项目信息，请先初始化项目'));
        return;
      }

      // 启动工作流
      await this.workflowEngine.executeNextStep(projectInfo);
      
      console.log(chalk.green('\n✓ 工作流程已启动！'));
      console.log(chalk.cyan('\n提示：'));
      console.log(chalk.white('使用 "codebuddy next" 执行下一步'));
      console.log(chalk.white('使用 "codebuddy status" 查看当前状态'));
      
    } catch (error) {
      console.error(chalk.red('启动工作流程失败：'), error);
    }
  }

  /**
   * 查看状态
   */
  private async showStatus(): Promise<void> {
    console.log(chalk.cyan('=== 项目状态 ===\n'));
    
    const projectInfo = await this.getCurrentProjectInfo();
    if (projectInfo) {
      console.log(chalk.yellow('项目信息：'));
    console.log(`- 名称：${projectInfo.name}`);
    console.log(`- 类型：${projectInfo.type}`);
    console.log(`- 状态：${this.workflowEngine.getProjectStatus()}`);
    console.log(`- 进度：${this.workflowEngine.getProjectProgress()}%`);
      console.log();
    }
    
    // 工作流状态
    console.log(chalk.yellow('工作流状态：'));
    console.log(this.workflowEngine.getWorkflowStatus());
    console.log();
    
    // 当前步骤
    const currentStep = this.workflowEngine.getCurrentStepInfo();
    if (currentStep) {
      console.log(chalk.yellow('当前步骤：'));
      console.log(`- 名称：${currentStep.name}`);
      console.log(`- 角色：${currentStep.role}`);
      console.log(`- 状态：${currentStep.status}`);
      console.log(`- 预计时长：${currentStep.duration}分钟`);
    } else {
      console.log('所有步骤已完成');
    }
    
    // 激活角色
    const activeRole = this.roleManager.getActiveRole();
    if (activeRole) {
      console.log(chalk.yellow('\n激活角色：'));
      console.log(`- ${this.getRoleDisplayName(activeRole)}`);
    } else {
      console.log('无激活角色');
    }
  }

  /**
   * 切换角色
   */
  private async switchRole(roleInput: string): Promise<void> {
    const role = this.parseRole(roleInput);
    
    if (!role) {
      console.error(chalk.red(`无效的角色：${roleInput}`));
      return;
    }

    console.log(chalk.blue(`=== 切换到角色：${this.getRoleDisplayName(role)} ===\n`));

    try {
      const result = await this.roleManager.switchRole(role, '用户主动切换');
      
      if (result.success) {
        console.log(result.output);
      } else {
        console.error(chalk.red(`切换失败：${result.error}`));
      }
      
    } catch (error) {
      console.error(chalk.red('切换过程中出错：'), error);
    }
  }

  /**
   * 生成文档
   */
  private async generateDocuments(): Promise<void> {
    console.log(chalk.blue('=== 生成项目文档 ===\n'));

    try {
      // 生成进度报告
      await this.documentGenerator.generateProgressReport();
      
      // 生成角色工作记录
      await this.documentGenerator.generateRoleWorkLogs();
      
      // 生成项目总结（如果项目已完成）
      if (this.workflowEngine.getProjectStatus() === ProjectStatus.COMPLETED) {
        await this.documentGenerator.generateProjectSummary();
      }
      
      console.log(chalk.green('\n✓ 文档生成完成！'));
      
    } catch (error) {
      console.error(chalk.red('文档生成失败：'), error);
    }
  }

  /**
   * 查看角色列表
   */
  private listRoles(): void {
    console.log(chalk.blue('=== 可用角色 ===\n'));
    
    const roles = this.roleManager.getAllRoleConfigs();
    
    roles.forEach((roleConfig, index) => {
      const isActive = this.roleManager.getActiveRole() === roleConfig.type;
      const status = isActive ? chalk.green('(已激活)') : '';
      
      console.log(chalk.yellow(`${index + 1}. ${roleConfig.name} ${status}`));
      console.log(chalk.gray(`   能力：${roleConfig.capabilities.join('、')}`));
      console.log(chalk.gray(`   激活命令：codebuddy activate ${roleConfig.type.toLowerCase()}`));
      console.log();
    });
    
    console.log(chalk.cyan('使用提示：'));
    console.log(chalk.white('1. 使用 "codebuddy activate <角色名>" 激活角色'));
    console.log(chalk.white('2. 使用 "codebuddy switch <角色名>" 切换角色'));
    console.log(chalk.white('3. 使用 "codebuddy start" 启动完整工作流程'));
  }

  /**
   * 执行下一步
   */
  private async executeNextStep(): Promise<void> {
    console.log(chalk.blue('=== 执行工作流程下一步 ===\n'));
    
    const success = await this.workflowEngine.executeNextStep();
    
    if (success) {
      console.log(chalk.green('\n✓ 步骤执行成功！'));
      
      // 显示工作流报告
      console.log(chalk.cyan('\n工作流报告：'));
      console.log(this.workflowEngine.getWorkflowReport());
      
    } else {
      console.log(chalk.red('\n✗ 步骤执行失败'));
    }
  }

  /**
   * 重置工作流
   */
  private async resetWorkflow(): Promise<void> {
    const confirm = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'reset',
        message: '确定要重置工作流程吗？这将清除所有进度。',
        default: false
      }
    ]);

    if (confirm.reset) {
      this.workflowEngine.resetWorkflow();
      console.log(chalk.green('工作流程已重置'));
    }
  }

  /**
   * 打包项目
   */
  private async packProject(): Promise<void> {
    console.log(chalk.blue('=== 打包项目 ===\n'));
    
    try {
      // 动态导入DocumentGenerator
      const { DocumentGenerator } = await import('../core/DocumentGenerator');
      const docGenerator = new DocumentGenerator(this.roleManager, this.workflowEngine, this.projectRoot);
      
      console.log(chalk.yellow('正在打包项目，请稍候...'));
      
      // 调用打包上传方法（包含Vercel预览部署）
      const result = await docGenerator.packAndUpload();
      
      if (result.downloadUrl) {
        console.log(chalk.green('\n✓ 项目打包完成！'));
        console.log(chalk.cyan('下载链接：'));
        console.log(chalk.white(result.downloadUrl));
        console.log(chalk.yellow('\n注意：链接24小时内有效'));
        
        // 保存链接到本地文件
        const linkFile = path.join(this.projectRoot, '下载链接.txt');
        await fs.writeFile(linkFile, `项目下载链接：${result.downloadUrl}\n有效期：24小时\n生成时间：${new Date().toLocaleString()}`, 'utf-8');
        console.log(chalk.cyan(`\n下载链接已保存到：${linkFile}`));
      } else {
        console.log(chalk.red('\n✗ 打包失败，请检查项目目录'));
      }
      
      // 显示预览部署结果
      if (result.previewUrl) {
        console.log(chalk.green('\n✓ Vercel预览部署完成！'));
        console.log(chalk.cyan('预览链接：'));
        console.log(chalk.white(result.previewUrl));
        
        // 保存预览链接到本地文件
        const previewLinkFile = path.join(this.projectRoot, '预览链接.txt');
        await fs.writeFile(previewLinkFile, `项目预览链接：${result.previewUrl}\n生成时间：${new Date().toLocaleString()}`, 'utf-8');
        console.log(chalk.cyan(`\n预览链接已保存到：${previewLinkFile}`));
      }
      
    } catch (error) {
      console.error(chalk.red('打包失败：'), error);
    }
  }

  /**
   * 全自动运行模式
   */
  private async runAutoMode(): Promise<void> {
    console.log(chalk.blue('=== 启动全自动运行模式 ===\n'));
    
    try {
      // 获取项目信息
      const projectInfo = await this.getCurrentProjectInfo();
      
      if (!projectInfo) {
        console.log(chalk.yellow('未找到项目信息，请先初始化项目'));
        console.log(chalk.cyan('请先运行：codebuddy init'));
        return;
      }

      console.log(chalk.green('项目信息确认：'));
      console.log(chalk.white(`- 项目名称：${projectInfo.name}`));
      console.log(chalk.white(`- 项目类型：${projectInfo.type}`));
      console.log(chalk.white(`- 项目描述：${projectInfo.description}`));
      console.log();

      // 确认开始自动运行
      const confirm = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'start',
          message: '确认开始全自动运行整个开发流程？',
          default: true
        }
      ]);

      if (!confirm.start) {
        console.log(chalk.yellow('已取消自动运行'));
        return;
      }

      // 启动自动工作流
      await this.workflowEngine.startAutoWorkflow(projectInfo);
      
      console.log(chalk.green('\n✓ 自动运行已完成！'));
      console.log(chalk.cyan('\n提示：'));
      console.log(chalk.white('使用 "codebuddy docs" 生成项目文档'));
      console.log(chalk.white('使用 "codebuddy status" 查看最终状态'));
      console.log(chalk.white('使用 "codebuddy pack" 打包项目并生成下载链接'));
      
    } catch (error) {
      console.error(chalk.red('自动运行失败：'), error);
    }
  }

  /**
   * 显示帮助
   */
  private showHelp(): void {
    console.log(chalk.blue('=== CodeBuddy CN Agent 帮助 ===\n'));
    
    console.log(chalk.yellow('基本命令：'));
    console.log(chalk.white('  codebuddy init          - 初始化新项目'));
    console.log(chalk.white('  codebuddy start         - 启动工作流程'));
    console.log(chalk.white('  codebuddy next          - 执行下一步'));
    console.log(chalk.white('  codebuddy auto          - 全自动运行整个流程'));
    console.log(chalk.white('  codebuddy status        - 查看项目状态'));
    console.log(chalk.white('  codebuddy roles         - 查看可用角色'));
    console.log(chalk.white('  codebuddy activate <角色> - 激活角色'));
    console.log(chalk.white('  codebuddy switch <角色>   - 切换角色'));
    console.log(chalk.white('  codebuddy docs          - 生成文档'));
    console.log(chalk.white('  codebuddy reset         - 重置工作流程'));
    console.log(chalk.white('  codebuddy help          - 显示帮助'));
    console.log(chalk.white('  codebuddy pack          - 打包项目并生成下载链接'));
    
    console.log(chalk.yellow('\n使用流程：'));
    console.log(chalk.white('1. codebuddy init     - 初始化项目'));
    console.log(chalk.white('2. codebuddy auto     - 全自动运行（推荐）'));
    console.log(chalk.white('3. codebuddy docs     - 生成文档'));
    console.log(chalk.white('4. codebuddy pack     - 打包项目（可选）'));
    
    console.log(chalk.yellow('\n模式选择：'));
    console.log(chalk.white('  • 自动模式：codebuddy auto - 一键完成所有步骤'));
    console.log(chalk.white('  • 手动模式：codebuddy start + codebuddy next - 逐步控制'));
    
    console.log(chalk.yellow('\n高级选项：'));
    console.log(chalk.white('  • MCP集成：自动安装和运行MCP服务器，无需手动配置'));
    console.log(chalk.white('  • 智能降级：MCP服务器不可用时提供优雅的错误处理'));
    console.log(chalk.white('  • 项目打包：自动打包项目并生成24小时有效的下载链接'));
    
    console.log(chalk.cyan('\n更多帮助：'));
    console.log(chalk.white('查看完整文档：项目说明文档.md'));
    console.log(chalk.white('查看进度报告：进度报告.md'));
  }

  /**
   * 辅助方法
   */
  private parseRole(roleInput: string): RoleType | null {
    const roleMap: { [key: string]: RoleType } = {
      'tech-lead': RoleType.TECH_LEAD,
      'techlead': RoleType.TECH_LEAD,
      '技术总监': RoleType.TECH_LEAD,
      'product-manager': RoleType.PRODUCT_MANAGER,
      'productmanager': RoleType.PRODUCT_MANAGER,
      '产品经理': RoleType.PRODUCT_MANAGER,
      'ui-designer': RoleType.UI_DESIGNER,
      'uidesigner': RoleType.UI_DESIGNER,
      'ui设计师': RoleType.UI_DESIGNER,
      'frontend-developer': RoleType.FRONTEND_DEVELOPER,
      'frontend': RoleType.FRONTEND_DEVELOPER,
      '前端工程师': RoleType.FRONTEND_DEVELOPER,
      'backend-developer': RoleType.BACKEND_DEVELOPER,
      'backend': RoleType.BACKEND_DEVELOPER,
      '后端工程师': RoleType.BACKEND_DEVELOPER,
      'test-engineer': RoleType.TEST_ENGINEER,
      'test': RoleType.TEST_ENGINEER,
      '测试工程师': RoleType.TEST_ENGINEER
    };

    return roleMap[roleInput.toLowerCase()] || null;
  }

  private getRoleDisplayName(role: RoleType): string {
    const roleNames = {
      [RoleType.TECH_LEAD]: '技术总监',
      [RoleType.PRODUCT_MANAGER]: '产品经理',
      [RoleType.UI_DESIGNER]: 'UI设计师',
      [RoleType.FRONTEND_DEVELOPER]: '前端工程师',
      [RoleType.BACKEND_DEVELOPER]: '后端工程师',
      [RoleType.TEST_ENGINEER]: '测试工程师'
    };
    return roleNames[role];
  }

  private async collectContextInfo(): Promise<any> {
    return await inquirer.prompt([
      {
        type: 'input',
        name: 'description',
        message: '请提供项目背景信息（可选）：',
        default: ''
      },
      {
        type: 'input',
        name: 'previousOutput',
        message: '上一个角色的输出（如果有）：',
        default: ''
      }
    ]);
  }

  private async getCurrentProjectInfo(): Promise<any> {
    try {
      const docPath = path.join(this.projectRoot, '项目说明文档.md');
      if (await fs.pathExists(docPath)) {
        const content = await fs.readFile(docPath, 'utf-8');
        // 简单的解析逻辑
        return {
          name: '当前项目',
          type: 'Web应用',
          description: '基于AI开发团队的项目',
          targetUsers: '普通用户',
          status: ProjectStatus.IN_PROGRESS,
          createdAt: new Date(),
          updatedAt: new Date(),
          progress: 50
        };
      }
    } catch (error) {
      // 忽略错误，返回默认信息
    }
    
    return {
      name: '当前项目',
      type: 'Web应用',
      description: '基于AI开发团队的项目',
      targetUsers: '普通用户',
      status: ProjectStatus.INITIATED,
      createdAt: new Date(),
      updatedAt: new Date(),
      progress: 0
    };
  }

  /**
   * 运行CLI
   */
  public run(): void {
    this.program.parse(process.argv);
  }
}

// 主函数
async function main() {
  const cli = new CodeBuddyCLI();
  cli.run();
}

// 如果直接运行此文件
if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('程序运行错误：'), error);
    process.exit(1);
  });
}

export { CodeBuddyCLI };