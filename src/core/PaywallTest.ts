import { Paywall } from './Paywall';
import { createSandboxSession } from './StripeSandbox';

/**
 * 付费墙测试工具
 * @description 用于测试付费墙逻辑和Stripe支付流程
 */
export class PaywallTest {
  private paywall: Paywall;

  constructor() {
    this.paywall = new Paywall();
  }

  /**
   * 测试付费墙逻辑
   * @param deviceId 设备ID
   */
  async testPaywall(deviceId: string): Promise<void> {
    console.log(`\n🧪 测试设备ID: ${deviceId}`);
    
    // 检查是否需要付费
    const needsPayment = this.paywall.needsPayment(deviceId);
    console.log(`💳 需要付费: ${needsPayment}`);
    
    if (needsPayment) {
      console.log('🚀 创建支付会话...');
      try {
        const paymentUrl = await createSandboxSession(deviceId);
        console.log(`✅ 支付会话创建成功: ${paymentUrl}`);
        console.log('🎯 请使用测试卡号 4242424242424242 进行支付');
      } catch (error) {
        console.error('❌ 支付会话创建失败:', error);
      }
    } else {
      console.log('✅ 免费使用，无需付费');
      
      // 模拟多次调用以达到付费阈值
      console.log('🔄 模拟多次调用以达到付费阈值...');
      for (let i = 0; i < 3; i++) {
        this.paywall.incrementCalls(deviceId);
        console.log(`第${i + 1}次调用，当前调用次数: ${this.paywall.getCalls(deviceId)}`);
      }
      
      // 再次检查是否需要付费
      const needsPaymentAfter = this.paywall.needsPayment(deviceId);
      console.log(`💳 达到阈值后需要付费: ${needsPaymentAfter}`);
      
      if (needsPaymentAfter) {
        console.log('🚀 创建支付会话...');
        try {
          const paymentUrl = await createSandboxSession(deviceId);
          console.log(`✅ 支付会话创建成功: ${paymentUrl}`);
        } catch (error) {
          console.error('❌ 支付会话创建失败:', error);
        }
      }
    }
  }

  /**
   * 获取调用次数
   * @param deviceId 设备ID
   */
  getCalls(deviceId: string): number {
    return this.paywall.getCalls(deviceId);
  }
}

// 测试函数
export async function runPaywallTest(): Promise<void> {
  const tester = new PaywallTest();
  const deviceId = 'test-device-' + Date.now();
  
  console.log('🎯 开始付费墙测试...');
  await tester.testPaywall(deviceId);
  console.log('🎉 付费墙测试完成！');
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  runPaywallTest().catch(console.error);
}