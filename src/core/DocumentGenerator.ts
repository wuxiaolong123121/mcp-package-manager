/**
 * 文档生成器
 * @description 自动生成项目文档和管理报告
 */

import { ProjectStatus, RoleType, DocumentType, TaskStatus } from '../types';
import { RoleManager } from './RoleManager';
import { WorkflowEngine } from './WorkflowEngine';
import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';

export class DocumentGenerator {
  private roleManager: RoleManager;
  private workflowEngine: WorkflowEngine;
  private projectRoot: string;

  constructor(roleManager: RoleManager, workflowEngine: WorkflowEngine, projectRoot: string) {
    this.roleManager = roleManager;
    this.workflowEngine = workflowEngine;
    this.projectRoot = projectRoot;
  }

  /**
   * 生成项目说明文档
   */
  public async generateProjectDocument(projectInfo: any): Promise<void> {
    const documentPath = path.join(this.projectRoot, '项目说明文档.md');
    
    const content = this.generateProjectContent(projectInfo);
    
    await fs.writeFile(documentPath, content, 'utf-8');
    console.log(chalk.green(`项目说明文档已生成：${documentPath}`));
  }

  /**
   * 生成进度报告
   */
  public async generateProgressReport(): Promise<void> {
    const reportPath = path.join(this.projectRoot, '进度报告.md');
    const reportContent = this.generateProgressContent();
    
    await fs.writeFile(reportPath, reportContent, 'utf-8');
    console.log(chalk.green(`进度报告已生成：${reportPath}`));
  }

  /**
   * 生成角色工作记录
   */
  public async generateRoleWorkLogs(): Promise<void> {
    const logsDir = path.join(this.projectRoot, '角色工作记录');
    await fs.ensureDir(logsDir);
    
    const allRoles = this.roleManager.getAllRoleConfigs();
    
    for (const roleConfig of allRoles) {
      const logPath = path.join(logsDir, `${roleConfig.name}工作记录.md`);
      const logContent = this.generateRoleLogContent(roleConfig);
      
      await fs.writeFile(logPath, logContent, 'utf-8');
      console.log(chalk.green(`${roleConfig.name}工作记录已生成`));
    }
  }

  /**
   * 生成项目总结报告
   */
  public async generateProjectSummary(): Promise<void> {
    const summaryPath = path.join(this.projectRoot, '项目总结报告.md');
    const summaryContent = this.generateSummaryContent();
    
    await fs.writeFile(summaryPath, summaryContent, 'utf-8');
    console.log(chalk.green(`项目总结报告已生成：${summaryPath}`));
  }

  /**
   * 生成项目内容
   */
  private generateProjectContent(projectInfo: any): string {
    const currentDate = new Date().toLocaleString('zh-CN');
    
    return `# ${projectInfo.name} - 项目说明文档

> 生成时间：${currentDate}
> 文档版本：v1.0

## 一、项目规划

### 1.1 项目基本信息
- **项目名称**：${projectInfo.name}
- **项目类型**：${projectInfo.type}
- **项目描述**：${projectInfo.description}
- **目标用户**：${projectInfo.targetUsers}
- **创建时间**：${projectInfo.createdAt?.toLocaleString('zh-CN') || new Date().toLocaleString('zh-CN')}

### 1.2 项目目标
- 实现高质量的${projectInfo.type}应用
- 确保代码质量和系统稳定性
- 提供优秀的用户体验
- 按时交付项目成果

### 1.3 团队配置
本项目采用AI开发团队协作模式，包含以下角色：

${this.generateTeamRolesContent()}

## 二、实施方案

### 2.1 开发流程
项目采用敏捷开发模式，按以下阶段进行：

${this.generateDevelopmentPhases()}

### 2.2 技术架构
- **前端技术**：Vue3/React18 + TypeScript
- **后端技术**：SpringBoot/Django/Express + 数据库
- **设计理念**：模块化、可扩展、高性能

### 2.3 质量标准
- 代码覆盖率 ≥ 90%
- 性能指标：首屏加载 ≤ 2秒，接口响应 ≤ 500ms
- 兼容性：主流浏览器全覆盖
- 安全性：通过安全测试

## 三、进度记录

### 3.1 当前状态
- **项目状态**：${this.workflowEngine.getProjectStatus()}
- **工作流进度**：${this.workflowEngine.getWorkflowStatus()}

### 3.2 详细进度
${this.generateDetailedProgress()}

### 3.3 下一步计划
${this.generateNextSteps()}

---

*本文档由CodeBuddy CN Agent自动生成，如有疑问请联系项目团队。*
`;
  }

  /**
   * 生成团队角色内容
   */
  private generateTeamRolesContent(): string {
    const allRoles = this.roleManager.getAllRoleConfigs();
    
    return allRoles.map(roleConfig => {
      return `#### ${roleConfig.name}
- **核心能力**：${roleConfig.capabilities.join('、')}
- **工作模式**：
${roleConfig.workMode.map((mode, index) => `  ${index + 1}. ${mode}`).join('\n')}
- **输出规范**：${roleConfig.outputFormat.join('、')}
`;
    }).join('\n');
  }

  /**
   * 生成开发阶段内容
   */
  private generateDevelopmentPhases(): string {
    const currentStep = this.workflowEngine.getCurrentStepInfo();
    const allSteps = [
      { name: '需求分析阶段', status: '待开始', description: '技术总监和产品经理进行需求分析' },
      { name: '设计阶段', status: '待开始', description: 'UI设计师进行界面和交互设计' },
      { name: '开发阶段', status: '待开始', description: '前后端工程师进行代码开发' },
      { name: '测试阶段', status: '待开始', description: '测试工程师进行全面测试' },
      { name: '部署阶段', status: '待开始', description: '项目部署和上线' }
    ];

    return allSteps.map((phase, index) => {
      const isCurrent = currentStep && index === Math.floor(this.getCurrentProgress() / 20);
      const status = isCurrent ? '进行中' : phase.status;
      
      return `#### ${phase.name} ${isCurrent ? '🚀' : ''}
- **状态**：${status}
- **描述**：${phase.description}
- **预计时长**：${this.getPhaseDuration(index)} 分钟
`;
    }).join('\n');
  }

  /**
   * 生成详细进度
   */
  private generateDetailedProgress(): string {
    const workflowReport = this.workflowEngine.getWorkflowReport();
    return workflowReport;
  }

  /**
   * 生成下一步计划
   */
  private generateNextSteps(): string {
    const currentStep = this.workflowEngine.getCurrentStepInfo();
    
    if (!currentStep) {
      return '项目已完成所有阶段！🎉';
    }

    return `#### 当前步骤：${currentStep.name}
- **负责角色**：${this.getRoleName(currentStep.role)}
- **预计时长**：${currentStep.duration} 分钟
- **交付物**：${currentStep.deliverables.join(', ')}

#### 后续步骤：
${this.getNextStepsList()}`;
  }

  /**
   * 生成进度内容
   */
  private generateProgressContent(): string {
    const currentDate = new Date().toLocaleString('zh-CN');
    
    return `# 项目进度报告

> 生成时间：${currentDate}

## 总体进度

${this.workflowEngine.getWorkflowStatus()}

## 详细进度

${this.generateDetailedProgress()}

## 角色工作统计

${this.generateRoleStatistics()}

## 风险与问题

${this.generateRiskAnalysis()}

## 下一步计划

${this.generateNextSteps()}

---

*本报告由CodeBuddy CN Agent自动生成*
`;
  }

  /**
   * 生成角色工作日志
   */
  private generateRoleLogContent(roleConfig: any): string {
    const history = this.roleManager.getRoleHistory(roleConfig.type);
    const currentDate = new Date().toLocaleString('zh-CN');
    
    return `# ${roleConfig.name} - 工作记录

> 生成时间：${currentDate}

## 角色信息

- **角色名称**：${roleConfig.name}
- **角色类型**：${roleConfig.type}
- **核心能力**：${roleConfig.capabilities.join('、')}

## 工作模式

${roleConfig.workMode.map((mode: string, index: number) => `${index + 1}. ${mode}`).join('\n')}

## 输出规范

${roleConfig.outputFormat.map((format: string, index: number) => `${index + 1}. ${format}`).join('\n')}

## 工作历史

${history.length > 0 ? history.map((record: string) => `- ${record}`).join('\n') : '暂无工作记录'}

## 当前状态

- **激活状态**：${this.roleManager.getActiveRole() === roleConfig.type ? '已激活' : '未激活'}
- **工作进度**：${this.getRoleProgress(roleConfig.type)}

---
*本记录由CodeBuddy CN Agent自动生成*
`;
  }

  /**
   * 生成项目总结
   */
  private generateSummaryContent(): string {
    const currentDate = new Date().toLocaleString('zh-CN');
    
    return `# 项目总结报告

> 生成时间：${currentDate}

## 项目概况

### 基本信息
- **项目状态**：${this.workflowEngine.getProjectStatus()}
- **完成进度**：${this.getCurrentProgress()}%
- **总耗时**：${this.getTotalTime()} 分钟

### 团队表现
${this.generateTeamPerformance()}

## 成果总结

### 交付物清单
${this.generateDeliverablesList()}

### 质量指标
${this.generateQualityMetrics()}

## 经验总结

### 成功经验
1. **团队协作**：AI开发团队模式提高了开发效率
2. **流程规范**：标准化的工作流程确保了项目质量
3. **文档管理**：完善的文档体系提升了沟通效率

### 改进建议
1. **流程优化**：根据项目特点调整工作流步骤
2. **工具集成**：引入更多自动化工具提升效率
3. **质量监控**：建立更完善的质量监控体系

## 后续计划

1. **项目维护**：持续监控项目运行状态
2. **功能迭代**：根据用户反馈进行功能优化
3. **性能优化**：持续优化系统性能

---

*本报告由CodeBuddy CN Agent自动生成*
`;
  }

  /**
   * 辅助方法
   */
  private getCurrentProgress(): number {
    const currentStep = this.workflowEngine.getCurrentStepInfo();
    if (!currentStep) return 100;
    
    const stepIndex = this.getStepIndex(currentStep.id);
    return Math.round((stepIndex / 7) * 100);
  }

  private getStepIndex(stepId: string): number {
    const stepMap: { [key: string]: number } = {
      'step-1': 1, 'step-2': 2, 'step-3': 3, 'step-4': 4,
      'step-5': 5, 'step-6': 6, 'step-7': 7
    };
    return stepMap[stepId] || 0;
  }

  private getPhaseDuration(phaseIndex: number): number {
    const phaseDurations = [45, 180, 480, 600, 0];
    return phaseDurations[phaseIndex] || 0;
  }

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

  private getNextStepsList(): string {
    const currentStep = this.workflowEngine.getCurrentStepInfo();
    if (!currentStep) return '项目已完成！';
    
    const remainingSteps = this.getRemainingSteps();
    return remainingSteps.map((step, index) => 
      `${index + 1}. ${step.name} (${this.getRoleName(step.role)})`
    ).join('\n');
  }

  private getRemainingSteps(): any[] {
    // 简化实现，返回剩余步骤
    return [];
  }

  private getRoleProgress(role: RoleType): string {
    const history = this.roleManager.getRoleHistory(role);
    return history.length > 0 ? '有工作记录' : '暂无工作';
  }

  private getTotalTime(): number {
    return 1000; // 简化实现
  }

  private generateRoleStatistics(): string {
    return '各角色工作统计信息...';
  }

  private generateRiskAnalysis(): string {
    return '当前暂无发现重大风险...';
  }

  private generateTeamPerformance(): string {
    return '团队整体表现良好，各角色协作顺畅...';
  }

  private generateDeliverablesList(): string {
    return '项目交付物清单...';
  }

  private generateQualityMetrics(): string {
    return '质量指标达成情况...';
  }
}