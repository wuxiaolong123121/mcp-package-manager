/**
 * CodeBuddy CN Agent 主入口文件
 * @description AI开发团队管理系统的核心启动文件
 */

import { CodeBuddyCLI } from './cli';
import chalk from 'chalk';

/**
 * 主函数
 * @description 启动CodeBuddy CN Agent系统
 */
async function main(): Promise<void> {
  console.log(chalk.cyan('=== CodeBuddy CN Agent 启动中 ===\n'));
  
  try {
    // 创建CLI实例
    const cli = new CodeBuddyCLI();
    
    // 启动CLI
    cli.run();
    
  } catch (error) {
    console.error(chalk.red('系统启动失败：'), error);
    process.exit(1);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('程序运行错误：'), error);
    process.exit(1);
  });
}

export { CodeBuddyCLI } from './cli';
export { RoleManager } from './core/RoleManager';
export { WorkflowEngine } from './core/WorkflowEngine';
export { DocumentGenerator } from './core/DocumentGenerator';
export * from './types';