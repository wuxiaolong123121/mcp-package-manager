#!/usr/bin/env node

/**
 * CodeBuddy MCP 服务器入口文件
 * @description AI开发团队MCP服务器的主入口
 */

import { CodeBuddyMCPServer } from './server';

/**
 * 启动MCP服务器
 */
async function main(): Promise<void> {
  console.log('🚀 启动 CodeBuddy MCP 服务器...');
  
  try {
    const server = new CodeBuddyMCPServer();
    await server.run();
  } catch (error) {
    console.error('❌ MCP服务器运行错误:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 程序运行错误:', error);
    process.exit(1);
  });
}

export { CodeBuddyMCPServer } from './server';