import { Paywall } from './Paywall';

/**
 * 付费墙测试工具
 * @description 用于测试付费墙逻辑和支付流程
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
    const needsPayment = await this.paywall.needsPayment(deviceId);
    console.log(`💳 需要付费: ${needsPayment}`);
    
    if (needsPayment) {
      const paymentUrl = this.paywall.getPaymentUrl();
      console.log(`✅ 请访问支付链接: ${paymentUrl}`);
    } else {
      console.log('✅ 免费使用，无需付费');
      
      // 模拟多次调用以达到付费阈值
      console.log('🔄 模拟多次调用以达到付费阈值...');
      for (let i = 0; i < 3; i++) {
        await this.paywall.incrementCalls(deviceId);
        console.log(`第${i + 1}次调用，当前调用次数: ${await this.paywall.getCalls(deviceId)}`);
      }
      
      // 再次检查是否需要付费
      const needsPaymentAfter = await this.paywall.needsPayment(deviceId);
      console.log(`💳 达到阈值后需要付费: ${needsPaymentAfter}`);
      
      if (needsPaymentAfter) {
        const paymentUrl = this.paywall.getPaymentUrl();
        console.log(`✅ 请访问支付链接: ${paymentUrl}`);
      }
    }
  }

  /**
   * 获取调用次数
   * @param deviceId 设备ID
   */
  async getCalls(deviceId: string): Promise<number> {
    return await this.paywall.getCalls(deviceId);
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