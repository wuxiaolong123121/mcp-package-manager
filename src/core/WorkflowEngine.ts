/**
 * 工作流引擎
 * @description 管理AI开发团队的工作流程，确保各角色按顺序协作
 */

import { RoleType, ProjectStatus, WorkflowStep, TaskPriority, TaskStatus } from '../types';
import { RoleManager } from './RoleManager';
import chalk from 'chalk';

export class WorkflowEngine {
  private roleManager: RoleManager;
  private projectStatus: ProjectStatus;
  private currentStep: number = 0;
  private workflowSteps: WorkflowStep[] = [];
  private taskHistory: Map<string, any> = new Map();
  private projectInfo: any = null;

  constructor(roleManager: RoleManager) {
    this.roleManager = roleManager;
    this.projectStatus = ProjectStatus.INITIATED;
    this.initializeWorkflow();
    this.loadWorkflowState();
  }

  /**
   * 初始化工作流程
   */
  private initializeWorkflow(): void {
    this.workflowSteps = [
      {
        id: 'step-1',
        name: '技术总监需求分析',
        description: '技术总监接收需求并进行技术拆解',
        role: RoleType.TECH_LEAD,
        duration: 45,
        deliverables: ['需求拆解说明书', '技术架构方案', '任务分配表'],
        prerequisites: [],
        status: TaskStatus.PENDING
      },
      {
        id: 'step-2',
        name: '产品经理需求分析',
        description: '产品经理基于技术拆解进行深度需求分析',
        role: RoleType.PRODUCT_MANAGER,
        duration: 180,
        deliverables: ['用户需求调研表', '需求优先级清单', '产品需求文档PRD'],
        prerequisites: ['step-1'],
        status: TaskStatus.PENDING
      },
      {
        id: 'step-3',
        name: 'UI设计师方案设计',
        description: 'UI设计师基于PRD进行视觉和交互设计',
        role: RoleType.UI_DESIGNER,
        duration: 480,
        deliverables: ['设计需求理解文档', '基础设计规范', '页面设计方案', '交互说明文档', '设计交付清单'],
        prerequisites: ['step-2'],
        status: TaskStatus.PENDING
      },
      {
        id: 'step-4',
        name: '前端工程师开发',
        description: '前端工程师基于设计方案进行前端开发',
        role: RoleType.FRONTEND_DEVELOPER,
        duration: 600,
        deliverables: ['前端技术方案', '前端页面代码', '前端开发总结报告'],
        prerequisites: ['step-3'],
        status: TaskStatus.PENDING
      },
      {
        id: 'step-5',
        name: '后端工程师开发',
        description: '后端工程师进行后端架构设计和API开发',
        role: RoleType.BACKEND_DEVELOPER,
        duration: 660,
        deliverables: ['后端架构设计文档', '数据库设计说明书', 'API接口文档', '后端业务代码', '后端开发总结报告'],
        prerequisites: ['step-2'],
        status: TaskStatus.PENDING
      },
      {
        id: 'step-6',
        name: '前后端联调',
        description: '前后端工程师进行接口联调',
        role: RoleType.FRONTEND_DEVELOPER, // 主要角色，但后端也需要参与
        duration: 150,
        deliverables: ['联调完成的前端代码', '联调完成的后端代码'],
        prerequisites: ['step-4', 'step-5'],
        status: TaskStatus.PENDING
      },
      {
        id: 'step-7',
        name: '测试工程师测试',
        description: '测试工程师进行全面的质量测试',
        role: RoleType.TEST_ENGINEER,
        duration: 600,
        deliverables: ['测试计划', '测试用例集', 'Bug列表', '性能测试报告', '测试总结报告'],
        prerequisites: ['step-6'],
        status: TaskStatus.PENDING
      }
    ];
  }

  /**
   * 启动自动工作流程 - 全自动模式
   */
  public async startAutoWorkflow(projectInfo: any): Promise<void> {
    console.log(chalk.blue('=== 启动AI开发团队自动工作流程 ===\n'));
    
    this.projectInfo = projectInfo;
    this.projectStatus = ProjectStatus.IN_PROGRESS;
    this.currentStep = 0;
    
    console.log(chalk.green(`项目信息：`));
    console.log(chalk.white(`- 项目名称：${projectInfo.name}`));
    console.log(chalk.white(`- 项目类型：${projectInfo.type}`));
    console.log(chalk.white(`- 项目描述：${projectInfo.description}`));
    console.log(chalk.white(`- 目标用户：${projectInfo.targetUsers}`));
    console.log();
    
    console.log(chalk.yellow('🤖 自动模式已启动，将自动执行所有步骤...'));
    console.log(chalk.cyan('整个流程预计需要约 30-40 分钟'));
    console.log();
    
    // 重置工作流状态
    this.resetWorkflow();
    
    // 自动执行所有步骤
    await this.executeAllStepsAutomatically(projectInfo);
    
    // 更新项目状态为已完成
    this.projectStatus = ProjectStatus.COMPLETED;
    
    // 保存最终状态
    this.saveWorkflowState();
  }

  /**
   * 自动执行所有步骤
   */
  private async executeAllStepsAutomatically(projectInfo: any): Promise<void> {
    let stepCount = 0;
    const totalSteps = this.workflowSteps.length;
    
    while (this.currentStep < totalSteps) {
      stepCount++;
      const currentWorkflowStep = this.workflowSteps[this.currentStep];
      
      console.log(chalk.blue(`\n=== 自动执行步骤 ${stepCount}/${totalSteps} ===`));
      console.log(chalk.cyan(`步骤名称：${currentWorkflowStep.name}`));
      console.log(chalk.white(`负责角色：${this.getRoleName(currentWorkflowStep.role)}`));
      console.log(chalk.white(`预计时长：${currentWorkflowStep.duration}分钟`));
      
      // 检查前置条件
      if (!this.checkPrerequisites(currentWorkflowStep)) {
        console.log(chalk.red('前置条件未满足，跳过此步骤'));
        this.currentStep++;
        continue;
      }

      // 激活对应角色（自动模式）
      const activationResult = await this.roleManager.activateRole({
        role: currentWorkflowStep.role,
        projectInfo: projectInfo,
        context: this.getPreviousOutputs(),
        autoMode: true  // 添加自动模式标识
      });

      if (activationResult.success) {
        console.log(chalk.green('✓ 角色激活成功！'));
        
        // 执行自动工作过程
      await this.executeAutoWorkProcess(currentWorkflowStep);
        
        // 标记步骤完成
        currentWorkflowStep.status = TaskStatus.COMPLETED;
        
        // 记录任务历史
        this.taskHistory.set(currentWorkflowStep.id, {
          step: currentWorkflowStep,
          activationResult,
          completedAt: new Date()
        });
        
        this.currentStep++;
        
        // 显示进度
        const progress = Math.round((this.currentStep / totalSteps) * 100);
        console.log(chalk.green(`\n✓ 步骤完成！总进度：${progress}%`));
        
      } else {
        console.log(chalk.red(`✗ 角色激活失败：${activationResult.error}`));
        console.log(chalk.yellow('跳过此步骤，继续下一个...'));
        this.currentStep++;
      }
      
      // 步骤间短暂停顿
      if (this.currentStep < totalSteps) {
        console.log(chalk.gray('\n准备下一个步骤...'));
        await this.delay(2000); // 2秒停顿
      }
    }
    
    // 所有步骤完成
    console.log(chalk.green('\n🎉 === 所有步骤自动执行完成！ ==='));
    
    // 生成最终报告
    await this.generateAutoFinalReport();
    
    // 更新项目状态为已完成
    this.projectStatus = ProjectStatus.COMPLETED;
  }

  /**
   * 执行自动工作过程
   */
  private async executeAutoWorkProcess(step: WorkflowStep): Promise<void> {
    console.log(chalk.cyan(`\n🔄 正在自动执行：${step.name}`));
    
    // 执行工作进度
    const workDuration = Math.min(step.duration * 100, 10000); // 最多10秒
    const progressInterval = workDuration / 10;
    
    for (let i = 0; i <= 10; i++) {
      const progress = i * 10;
      const bar = '█'.repeat(i) + '░'.repeat(10 - i);
      process.stdout.write(`\r[${bar}] ${progress}%`);
      await this.delay(progressInterval);
    }
    
    console.log(chalk.green('\n✓ 工作完成！'));
    
    // 显示交付物
    if (step.deliverables && step.deliverables.length > 0) {
      console.log(chalk.cyan('交付物：'));
      step.deliverables.forEach(deliverable => {
        console.log(chalk.white(`  - ${deliverable}`));
      });
    }
  }

  /**
   * 生成自动模式最终报告
   */
  private async generateAutoFinalReport(): Promise<void> {
    console.log(chalk.blue('\n=== 自动生成最终报告 ==='));
    
    const completedSteps = this.workflowSteps.filter(step => step.status === TaskStatus.COMPLETED).length;
    const totalSteps = this.workflowSteps.length;
    
    console.log(chalk.green(`\n📊 项目总结：`));
    console.log(chalk.white(`- 总步骤数：${totalSteps}`));
    console.log(chalk.white(`- 完成步骤：${completedSteps}`));
    console.log(chalk.white(`- 完成率：${Math.round((completedSteps / totalSteps) * 100)}%`));
    
    console.log(chalk.cyan(`\n📋 完成的工作：`));
    this.workflowSteps.forEach((step, index) => {
      const status = step.status === TaskStatus.COMPLETED ? chalk.green('✓') : chalk.red('✗');
      console.log(chalk.white(`${status} ${index + 1}. ${step.name}`));
    });
    
    console.log(chalk.yellow('\n💡 提示：'));
    console.log(chalk.white('使用 "codebuddy docs" 生成详细文档'));
    console.log(chalk.white('使用 "codebuddy status" 查看当前状态'));
  }

  /**
   * 延迟工具函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 执行下一步
   */
  public async executeNextStep(context?: any): Promise<boolean> {
    if (this.currentStep >= this.workflowSteps.length) {
      console.log(chalk.green('\n=== 工作流程已完成 ==='));
      this.projectStatus = ProjectStatus.COMPLETED;
      return false;
    }

    const currentWorkflowStep = this.workflowSteps[this.currentStep];
    
    console.log(chalk.yellow(`\n=== 步骤 ${this.currentStep + 1}/${this.workflowSteps.length} ===`));
    console.log(chalk.cyan(`步骤名称：${currentWorkflowStep.name}`));
    console.log(chalk.white(`描述：${currentWorkflowStep.description}`));
    console.log(chalk.white(`负责角色：${this.getRoleName(currentWorkflowStep.role)}`));
    console.log(chalk.white(`预计时长：${currentWorkflowStep.duration}分钟`));
    console.log(chalk.white(`交付物：${currentWorkflowStep.deliverables.join(', ')}`));
    
    // 检查前置条件
    if (!this.checkPrerequisites(currentWorkflowStep)) {
      console.log(chalk.red('前置条件未满足，无法执行此步骤'));
      return false;
    }

    // 激活对应角色
    const activationResult = await this.roleManager.activateRole({
      role: currentWorkflowStep.role,
      projectInfo: context || { name: '当前项目', type: 'Web应用', description: '', targetUsers: '', status: '开发中', createdAt: new Date(), updatedAt: new Date(), progress: 50 },
      context: this.getPreviousOutputs()
    });

    if (activationResult.success) {
      console.log(chalk.green('\n角色激活成功！'));
      console.log(activationResult.output);
      
      // 更新步骤状态
      currentWorkflowStep.status = TaskStatus.IN_PROGRESS;
      
      // 等待用户输入
      await this.waitForUserInput();
      
      // 标记步骤完成
      currentWorkflowStep.status = TaskStatus.COMPLETED;
      
      // 记录任务历史
      this.taskHistory.set(currentWorkflowStep.id, {
        step: currentWorkflowStep,
        activationResult,
        completedAt: new Date()
      });
      
      this.currentStep++;
      return true;
    } else {
      console.log(chalk.red(`角色激活失败：${activationResult.error}`));
      return false;
    }
  }

  /**
   * 获取工作流状态
   */
  public getWorkflowStatus(): string {
    const completedSteps = this.workflowSteps.filter(step => step.status === TaskStatus.COMPLETED).length;
    const totalSteps = this.workflowSteps.length;
    const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
    
    return `工作流进度：${completedSteps}/${totalSteps} (${progress}%)`;
  }

  /**
   * 获取当前步骤信息
   */
  public getCurrentStepInfo(): WorkflowStep | null {
    // 如果所有步骤都已完成，返回null
    const completedSteps = this.workflowSteps.filter(step => 
      step.status === TaskStatus.COMPLETED
    ).length;
    
    if (completedSteps === this.workflowSteps.length && this.workflowSteps.length > 0) {
      return null;
    }
    
    if (this.currentStep >= this.workflowSteps.length) {
      return null;
    }
    
    return this.workflowSteps[this.currentStep];
  }

  /**
   * 获取项目状态
   */
  public getProjectStatus(): string {
    const statusMap = {
      [ProjectStatus.INIT]: '初始化',
      [ProjectStatus.INITIATED]: '已启动',
      [ProjectStatus.PLANNING]: '规划中',
      [ProjectStatus.DEVELOPING]: '开发中',
      [ProjectStatus.TESTING]: '测试中',
      [ProjectStatus.COMPLETED]: '已完成',
      [ProjectStatus.PAUSED]: '已暂停',
      [ProjectStatus.IN_PROGRESS]: '进行中'
    };
    
    return statusMap[this.projectStatus] || '未知状态';
  }

  /**
   * 获取项目进度
   */
  public getProjectProgress(): number {
    if (this.workflowSteps.length === 0) return 0;
    
    const completedSteps = this.workflowSteps.filter(step => 
      step.status === TaskStatus.COMPLETED
    ).length;
    
    return Math.round((completedSteps / this.workflowSteps.length) * 100);
  }

  /**
   * 重置工作流程
   */
  public resetWorkflow(): void {
    this.currentStep = 0;
    this.projectStatus = ProjectStatus.INITIATED;
    this.workflowSteps.forEach(step => {
      step.status = TaskStatus.PENDING;
    });
    this.taskHistory.clear();
    this.saveWorkflowState();
  }

  /**
   * 保存工作流状态
   */
  private saveWorkflowState(): void {
    const state = {
      projectStatus: this.projectStatus,
      currentStep: this.currentStep,
      workflowSteps: this.workflowSteps.map(step => ({
        id: step.id,
        status: step.status
      })),
      timestamp: new Date().toISOString()
    };
    
    // 保存到文件系统
    try {
      const fs = require('fs');
      const path = require('path');
      const statePath = path.join(process.cwd(), '.workflow-state.json');
      fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
    } catch (error) {
      console.warn('无法保存工作流状态到文件:', error);
    }
  }

  /**
   * 加载工作流状态
   */
  private loadWorkflowState(): void {
    try {
      const fs = require('fs');
      const path = require('path');
      const statePath = path.join(process.cwd(), '.workflow-state.json');
      
      if (fs.existsSync(statePath)) {
        const stateData = fs.readFileSync(statePath, 'utf-8');
        const state = JSON.parse(stateData);
        
        this.projectStatus = state.projectStatus;
        this.currentStep = state.currentStep;
        
        // 更新工作流步骤状态
        state.workflowSteps.forEach((stepState: any) => {
          const step = this.workflowSteps.find(s => s.id === stepState.id);
          if (step) {
            step.status = stepState.status;
          }
        });
        
        console.log(chalk.green('✓ 工作流状态已恢复'));
      }
    } catch (error) {
      console.warn('无法加载工作流状态:', error);
    }
  }

  /**
   * 检查前置条件
   */
  private checkPrerequisites(step: WorkflowStep): boolean {
    if (!step.prerequisites || step.prerequisites.length === 0) {
      return true;
    }

    return step.prerequisites.every(prereq => {
      const prereqStep = this.workflowSteps.find(s => s.id === prereq);
      return prereqStep && prereqStep.status === TaskStatus.COMPLETED;
    });
  }

  /**
   * 获取角色名称
   */
  private getRoleName(role: RoleType): string {
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

  /**
   * 获取之前步骤的输出
   */
  private getPreviousOutputs(): string {
    if (this.taskHistory.size === 0) {
      return '这是第一步，没有之前步骤的输出';
    }

    const outputs: string[] = [];
    this.taskHistory.forEach((task, stepId) => {
      const step = this.workflowSteps.find(s => s.id === stepId);
      if (step) {
        outputs.push(`${step.name}: ${step.deliverables.join(', ')}`);
      }
    });

    return outputs.join('\n');
  }

  /**
   * 等待用户输入（实际应用中需要真正的用户交互）
   */
  private async waitForUserInput(): Promise<void> {
    console.log(chalk.yellow('\n【等待用户输入需求...】'));
    
    // 等待时间
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log(chalk.green('用户输入已接收，开始处理...'));
    
    // 处理时间
    const currentStep = this.workflowSteps[this.currentStep];
    const processingTime = Math.min(currentStep.duration * 1000, 5000); // 最多5秒
    
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    console.log(chalk.green(`\n【${currentStep.name} 完成】`));
    console.log(chalk.white(`交付物：${currentStep.deliverables.join(', ')}`));
  }

  /**
   * 获取工作流程报告
   */
  public getWorkflowReport(): string {
    let report = '=== 工作流程报告 ===\n\n';
    
    report += `项目状态：${this.getProjectStatus()}\n`;
    report += `当前步骤：${this.currentStep + 1}/${this.workflowSteps.length}\n`;
    report += `完成进度：${Math.round((this.currentStep / this.workflowSteps.length) * 100)}%\n\n`;
    
    report += '步骤详情：\n';
    
    this.workflowSteps.forEach((step, index) => {
      const status = step.status === TaskStatus.COMPLETED ? '✓' :
                    step.status === TaskStatus.IN_PROGRESS ? '→' :
                    '○';
      
      report += `${status} ${index + 1}. ${step.name} (${this.getRoleName(step.role)}) - ${step.status}\n`;
      
      if (step.status === TaskStatus.COMPLETED) {
        const task = this.taskHistory.get(step.id);
        if (task) {
          report += `   完成时间：${task.completedAt.toLocaleString()}\n`;
        }
      }
    });
    
    return report;
  }
}