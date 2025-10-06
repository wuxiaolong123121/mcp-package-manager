/**
 * MCP客户端管理器
 * @description 管理和调用其他MCP服务器的工具，支持自动安装和运行MCP服务器
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import chalk from 'chalk';

export interface MCPServerConfig {
  name: string;
  type: 'stdio' | 'sse';
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  timeout?: number;
  disabled?: boolean;
  retryConfig?: {
    maxRetries?: number;
    retryDelay?: number;
    backoffMultiplier?: number;
    maxDelay?: number;
  };
  circuitBreaker?: {
    failureThreshold?: number;
    resetTimeout?: number;
    monitoringPeriod?: number;
  };
}

export interface MCPClient {
  client: Client;
  transport: StdioClientTransport | SSEClientTransport;
  connected: boolean;
  tools: any[];
  config: MCPServerConfig;
  circuitBreaker: {
    failures: number;
    lastFailureTime: number;
    state: 'closed' | 'open' | 'half-open';
    nextRetryTime: number;
  };
}

export class MCPClientManager {
  private clients: Map<string, MCPClient> = new Map();
  private config: Record<string, MCPServerConfig>;
  private readonly defaultRetryConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
    maxDelay: 30000
  };
  private readonly defaultCircuitBreakerConfig = {
    failureThreshold: 5,
    resetTimeout: 60000,
    monitoringPeriod: 30000
  };

  constructor(config: Record<string, MCPServerConfig>) {
    this.config = config;
  }

  /**
   * 初始化所有MCP客户端
   */
  async initializeClients(): Promise<void> {
    for (const [name, serverConfig] of Object.entries(this.config)) {
      if (serverConfig.disabled) {
        console.log(`跳过禁用的MCP服务器: ${name}`);
        continue;
      }

      try {
        await this.initializeClient(name, serverConfig);
        console.log(`✅ MCP服务器连接成功: ${name}`);
      } catch (error) {
        console.error(`❌ MCP服务器连接失败 ${name}:`, error);
      }
    }
  }

  /**
   * 初始化单个MCP客户端
   */
  private async initializeClient(name: string, config: MCPServerConfig): Promise<void> {
    let transport: StdioClientTransport | SSEClientTransport;

    if (config.type === 'stdio') {
      if (!config.command) {
        throw new Error(`stdio类型的MCP服务器 ${name} 缺少command配置`);
      }

      // 构建环境变量，确保所有值都是字符串类型
      const env: Record<string, string> = {};
      Object.entries(process.env).forEach(([key, value]) => {
        if (value !== undefined) {
          env[key] = value;
        }
      });
      
      if (config.env) {
        Object.entries(config.env).forEach(([key, value]) => {
          if (value !== undefined) {
            env[key] = value;
          }
        });
      }

      transport = new StdioClientTransport({
        command: config.command,
        args: config.args || [],
        env: env,
      });
    } else if (config.type === 'sse') {
      if (!config.url) {
        throw new Error(`SSE类型的MCP服务器 ${name} 缺少url配置`);
      }

      transport = new SSEClientTransport(new URL(config.url));
    } else {
      throw new Error(`不支持的MCP服务器类型: ${config.type}`);
    }

    const client = new Client(
      {
        name: 'codebuddy-client',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    await client.connect(transport);

    // 获取可用工具列表
    const toolsResult = await client.listTools();
    const tools = toolsResult.tools || [];

    this.clients.set(name, {
      client,
      transport,
      connected: true,
      tools,
      config,
      circuitBreaker: {
        failures: 0,
        lastFailureTime: 0,
        state: 'closed',
        nextRetryTime: 0
      }
    });
  }

  /**
   * 获取所有可用的MCP工具
   */
  getAllAvailableTools(): Array<{
    serverName: string;
    toolName: string;
    description: string;
    inputSchema: any;
  }> {
    const allTools: Array<any> = [];

    for (const [serverName, client] of this.clients) {
      if (client.connected && client.tools) {
        for (const tool of client.tools) {
          allTools.push({
            serverName,
            toolName: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
          });
        }
      }
    }

    return allTools;
  }

  /**
   * 调用指定MCP服务器的工具（带重试和熔断器）
   */
  async callTool(
    serverName: string,
    toolName: string,
    arguments_: Record<string, any> = {}
  ): Promise<any> {
    const client = this.clients.get(serverName);
    
    if (!client) {
      throw new Error(`MCP服务器未找到: ${serverName}`);
    }
    
    if (!client.connected) {
      throw new Error(`MCP服务器 ${serverName} 未连接`);
    }

    // 检查熔断器状态
    if (!this.isCircuitBreakerOpen(client)) {
      throw new Error(`MCP服务器 ${serverName} 熔断器已开启，暂时不可用`);
    }

    // 获取重试配置
    const retryConfig = {
      ...this.defaultRetryConfig,
      ...client.config.retryConfig
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        const result = await this.executeToolCall(client, toolName, arguments_);
        
        // 调用成功，重置熔断器
        this.resetCircuitBreakerInternal(client);
        
        return result;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        console.error(`调用MCP工具失败 ${serverName}.${toolName} (尝试 ${attempt + 1}/${retryConfig.maxRetries + 1}):`, lastError.message);
        
        // 记录失败到熔断器
        this.recordFailure(client);
        
        if (attempt < retryConfig.maxRetries) {
          // 计算退避延迟
          const delay = Math.min(
            retryConfig.retryDelay * Math.pow(retryConfig.backoffMultiplier, attempt),
            retryConfig.maxDelay
          );
          
          console.log(`等待 ${delay}ms 后重试...`);
          await this.delay(delay);
        }
      }
    }

    // 所有重试都失败
    console.error(`MCP工具调用最终失败: ${serverName}.${toolName}`);
    throw lastError;
  }

  /**
   * 执行工具调用（内部方法）
   */
  private async executeToolCall(
    client: MCPClient,
    toolName: string,
    arguments_: Record<string, any>
  ): Promise<any> {
    return await client.client.callTool({
      name: toolName,
      arguments: arguments_,
    });
  }

  /**
   * 检查熔断器状态
   */
  private isCircuitBreakerOpen(client: MCPClient): boolean {
    const now = Date.now();
    const circuitConfig = {
      ...this.defaultCircuitBreakerConfig,
      ...client.config.circuitBreaker
    };

    // 如果熔断器是开启状态，检查是否到了重试时间
    if (client.circuitBreaker.state === 'open') {
      if (now >= client.circuitBreaker.nextRetryTime) {
        // 转为半开状态
        client.circuitBreaker.state = 'half-open';
        client.circuitBreaker.failures = 0;
        console.log(`熔断器进入半开状态，尝试恢复连接`);
        return true;
      } else {
        return false; // 熔断器仍然开启
      }
    }

    return true; // 熔断器关闭或半开
  }

  /**
   * 记录失败到熔断器
   */
  private recordFailure(client: MCPClient): void {
    const now = Date.now();
    const circuitConfig = {
      ...this.defaultCircuitBreakerConfig,
      ...client.config.circuitBreaker
    };

    client.circuitBreaker.failures++;
    client.circuitBreaker.lastFailureTime = now;

    // 检查是否达到失败阈值
    if (client.circuitBreaker.failures >= circuitConfig.failureThreshold) {
      client.circuitBreaker.state = 'open';
      client.circuitBreaker.nextRetryTime = now + circuitConfig.resetTimeout;
      console.warn(`熔断器开启: ${client.config.name}，将在 ${circuitConfig.resetTimeout}ms 后重试`);
    }
  }

  /**
   * 重置熔断器（私有方法）
   */
  private resetCircuitBreakerInternal(client: MCPClient): void {
    if (client.circuitBreaker.state !== 'closed') {
      console.log(`熔断器重置: ${client.config.name}`);
    }
    
    client.circuitBreaker.state = 'closed';
    client.circuitBreaker.failures = 0;
    client.circuitBreaker.lastFailureTime = 0;
    client.circuitBreaker.nextRetryTime = 0;
  }

  /**
   * 获取MCP服务器状态
   */
  getServerStatus(): Record<string, {
    connected: boolean;
    toolCount: number;
    tools: string[];
  }> {
    const status: Record<string, any> = {};

    for (const [name, client] of this.clients) {
      status[name] = {
        connected: client.connected,
        toolCount: client.tools?.length || 0,
        tools: client.tools?.map((tool: any) => tool.name) || [],
      };
    }

    return status;
  }

  /**
   * 断开所有MCP客户端连接
   */
  async disconnectAll(): Promise<void> {
    for (const [name, client] of this.clients) {
      try {
        if (client.transport) {
          await client.transport.close();
        }
        console.log(`🔌 MCP服务器已断开: ${name}`);
      } catch (error) {
        console.error(`断开MCP服务器失败 ${name}:`, error);
      }
    }

    this.clients.clear();
  }

  /**
   * 延迟工具函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取熔断器状态统计
   */
  getCircuitBreakerStats(): Record<string, {
    state: string;
    failures: number;
    lastFailureTime: number;
    nextRetryTime: number;
  }> {
    const stats: Record<string, any> = {};

    for (const [name, client] of this.clients) {
      stats[name] = {
        state: client.circuitBreaker.state,
        failures: client.circuitBreaker.failures,
        lastFailureTime: client.circuitBreaker.lastFailureTime,
        nextRetryTime: client.circuitBreaker.nextRetryTime
      };
    }

    return stats;
  }

  /**
   * 重置指定服务器的熔断器
   */
  resetCircuitBreaker(serverName: string): boolean {
    const client = this.clients.get(serverName);
    if (client) {
      this.resetCircuitBreakerInternal(client);
      return true;
    }
    return false;
  }

  /**
   * 强制重连指定服务器
   */
  async reconnectServer(serverName: string): Promise<boolean> {
    const client = this.clients.get(serverName);
    if (!client) {
      return false;
    }

    try {
      // 断开现有连接
      if (client.transport) {
        await client.transport.close();
      }

      // 重新初始化
      const config = this.config[serverName];
      await this.initializeClient(serverName, config);
      
      console.log(`🔄 MCP服务器重新连接成功: ${serverName}`);
      return true;
    } catch (error) {
      console.error(`重新连接MCP服务器失败 ${serverName}:`, error);
      return false;
    }
  }
}