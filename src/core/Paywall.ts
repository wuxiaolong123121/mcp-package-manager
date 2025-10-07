import { randomUUID } from 'crypto';
import { t } from '../i18n';

// ===== 云端计数器版 - 0 服务器 =====
const WORKER = 'https://codebuddy-counter.xiaolongwu996.workers.dev'; // 你的 Worker 域名

/** 检查是否需要付费 */
export async function needPay(deviceId: string): Promise<boolean> {
  const res = await fetch(`${WORKER}?action=check&d=${deviceId}`);
  const data = await res.json() as { needPay: boolean };
  return data.needPay;
}

/** 标记已付费（支付成功后调用）*/
export async function markPaid(deviceId: string): Promise<void> {
  await fetch(`${WORKER}?action=pay&d=${deviceId}`);
}

/**
 * 付费墙管理器（云端版）
 * @description 管理用户调用次数和付费状态 - 使用云端计数器
 */
export class Paywall {
  private freeCalls: number;
  private paymentUrl: string;

  constructor(freeCalls: number = 3, paymentUrl: string = 'https://paypal.me/xiaoyi11/0.99USD') {
    this.freeCalls = freeCalls;
    this.paymentUrl = paymentUrl;
  }

  /**
   * 获取设备唯一ID（云端版）
   * @description 生成或获取设备唯一标识符
   */
  private getDeviceId(): string {
    // 尝试从环境变量获取，否则生成新的UUID
    let deviceId = process.env.CODEBUDDY_DEVICE_ID;
    
    if (!deviceId) {
      // 如果环境变量中没有，生成新的UUID
      deviceId = randomUUID();
    }
    
    return deviceId;
  }

  /**
   * 增加调用次数（云端版）
   * @description 通过云端API记录用户调用次数
   */
  public async incrementCalls(deviceId?: string): Promise<number> {
    const id = deviceId || this.getDeviceId();
    
    try {
      const res = await fetch(`${WORKER}?action=increment&d=${id}`);
      const data = await res.json() as { calls: number };
      return data.calls;
    } catch (error) {
      console.warn(t('paywall.cloudCounterFailed'), error);
      return 0;
    }
  }

  /**
   * 获取调用次数（云端版）
   * @param deviceId 设备ID
   * @returns 调用次数
   */
  public async getCalls(deviceId?: string): Promise<number> {
    const id = deviceId || this.getDeviceId();
    
    try {
      const res = await fetch(`${WORKER}?action=getCalls&d=${id}`);
      const data = await res.json() as { calls: number };
      return data.calls;
    } catch (error) {
      console.warn(t('paywall.getCallsFailed'), error);
      return 0;
    }
  }

  /**
   * 检查是否需要付费（云端版）
   * @description 检查用户是否超过免费调用次数
   */
  public async needsPayment(deviceId?: string): Promise<boolean> {
    const id = deviceId || this.getDeviceId();
    
    try {
      const res = await fetch(`${WORKER}?action=check&d=${id}`);
      const data = await res.json() as { needPay: boolean };
      return data.needPay;
    } catch (error) {
      console.warn(t('paywall.cloudCheckFailed'), error);
      return false;
    }
  }

  /**
   * 获取支付URL
   * @returns 支付URL
   */
  public getPaymentUrl(): string {
    return this.paymentUrl;
  }

  /**
   * 获取剩余免费次数（云端版）
   * @description 返回剩余免费调用次数
   */
  public async getRemainingFreeCalls(deviceId?: string): Promise<number> {
    const calls = await this.getCalls(deviceId);
    return Math.max(0, this.freeCalls - calls);
  }

  /**
   * 重置计数（云端版）
   * @description 重置指定设备的调用计数（用于测试或付费后）
   */
  public async resetCalls(deviceId?: string): Promise<void> {
    const id = deviceId || this.getDeviceId();
    
    try {
      await fetch(`${WORKER}?action=reset&d=${id}`);
    } catch (error) {
      console.warn(t('paywall.resetFailed'), error);
    }
  }

  /**
   * 获取付费墙状态（云端版）
   * @description 获取完整的付费墙状态信息
   */
  public async getStatus(deviceId?: string): Promise<{
    deviceId: string;
    calls: number;
    freeCalls: number;
    remainingFreeCalls: number;
    needsPayment: boolean;
    paymentUrl: string;
  }> {
    const id = deviceId || this.getDeviceId();
    const calls = await this.getCalls(id);
    
    return {
      deviceId: id,
      calls,
      freeCalls: this.freeCalls,
      remainingFreeCalls: await this.getRemainingFreeCalls(id),
      needsPayment: await this.needsPayment(id),
      paymentUrl: this.paymentUrl
    };
  }
}