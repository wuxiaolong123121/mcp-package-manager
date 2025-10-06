import { join, dirname } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';

const COUNTER_FILE = join(process.env.HOME || process.env.USERPROFILE || './', '.codebuddy', 'counter.json');

/**
 * 付费墙管理器
 * @description 管理用户调用次数和付费状态
 */
export class Paywall {
  private counterFile: string;
  private freeCalls: number;
  private paymentUrl: string;

  constructor(freeCalls: number = 3, paymentUrl: string = 'https://buy.stripe.com/xxx') {
    this.counterFile = COUNTER_FILE;
    this.freeCalls = freeCalls;
    this.paymentUrl = paymentUrl;
  }

  /**
   * 获取设备唯一ID
   * @description 生成或获取设备唯一标识符
   */
  private getDeviceId(): string {
    // 尝试从环境变量或生成新的UUID
    let deviceId = process.env.CODEBUDDY_DEVICE_ID;
    
    if (!deviceId) {
      // 如果环境变量中没有，生成新的UUID
      deviceId = randomUUID();
      // 可以在这里将deviceId保存到本地文件，以便后续使用
      const deviceIdFile = join(dirname(this.counterFile), 'device_id.txt');
      if (!existsSync(deviceIdFile)) {
        mkdirSync(dirname(deviceIdFile), { recursive: true });
        writeFileSync(deviceIdFile, deviceId, 'utf-8');
      } else {
        deviceId = readFileSync(deviceIdFile, 'utf-8').trim();
      }
    }
    
    return deviceId;
  }

  /**
   * 增加调用次数
   * @description 记录用户调用次数并返回当前次数
   */
  public incrementCalls(deviceId?: string): number {
    const id = deviceId || this.getDeviceId();
    
    // 确保目录存在
    if (!existsSync(dirname(this.counterFile))) {
      mkdirSync(dirname(this.counterFile), { recursive: true });
    }
    
    // 读取现有计数
    let counterMap: Record<string, number> = {};
    if (existsSync(this.counterFile)) {
      try {
        counterMap = JSON.parse(readFileSync(this.counterFile, 'utf-8'));
      } catch (error) {
        console.warn('无法读取计数文件，创建新文件');
      }
    }
    
    // 增加计数
    counterMap[id] = (counterMap[id] || 0) + 1;
    
    // 保存计数
    writeFileSync(this.counterFile, JSON.stringify(counterMap, null, 2));
    
    return counterMap[id];
  }

  /**
   * 获取调用次数
   * @description 获取指定设备的调用次数
   */
  public getCalls(deviceId?: string): number {
    const id = deviceId || this.getDeviceId();
    
    if (!existsSync(this.counterFile)) {
      return 0;
    }
    
    try {
      const counterMap: Record<string, number> = JSON.parse(readFileSync(this.counterFile, 'utf-8'));
      return counterMap[id] || 0;
    } catch (error) {
      console.warn('无法读取计数文件');
      return 0;
    }
  }

  /**
   * 检查是否需要付费
   * @description 检查用户是否超过免费调用次数
   */
  public needsPayment(deviceId?: string): boolean {
    const calls = this.getCalls(deviceId);
    return calls >= this.freeCalls;
  }

  /**
   * 获取支付URL
   * @description 返回支付链接
   */
  public getPaymentUrl(): string {
    return this.paymentUrl;
  }

  /**
   * 获取剩余免费次数
   * @description 返回剩余免费调用次数
   */
  public getRemainingFreeCalls(deviceId?: string): number {
    const calls = this.getCalls(deviceId);
    return Math.max(0, this.freeCalls - calls);
  }

  /**
   * 重置计数
   * @description 重置指定设备的调用计数（用于测试或付费后）
   */
  public resetCalls(deviceId?: string): void {
    const id = deviceId || this.getDeviceId();
    
    if (!existsSync(this.counterFile)) {
      return;
    }
    
    try {
      const counterMap: Record<string, number> = JSON.parse(readFileSync(this.counterFile, 'utf-8'));
      delete counterMap[id];
      writeFileSync(this.counterFile, JSON.stringify(counterMap, null, 2));
    } catch (error) {
      console.warn('无法重置计数文件');
    }
  }

  /**
   * 获取付费墙状态
   * @description 获取完整的付费墙状态信息
   */
  public getStatus(deviceId?: string): {
    deviceId: string;
    calls: number;
    freeCalls: number;
    remainingFreeCalls: number;
    needsPayment: boolean;
    paymentUrl: string;
  } {
    const id = deviceId || this.getDeviceId();
    const calls = this.getCalls(id);
    
    return {
      deviceId: id,
      calls,
      freeCalls: this.freeCalls,
      remainingFreeCalls: this.getRemainingFreeCalls(id),
      needsPayment: this.needsPayment(id),
      paymentUrl: this.paymentUrl
    };
  }
}