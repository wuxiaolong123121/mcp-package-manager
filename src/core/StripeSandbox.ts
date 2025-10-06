import Stripe from 'stripe';

// 使用环境变量存储Stripe密钥，避免硬编码在代码中
const stripeKey = process.env.STRIPE_SECRET_KEY;

// 如果环境变量未设置，使用空字符串作为默认值（测试用）
const stripe = stripeKey ? new Stripe(stripeKey, {
  apiVersion: '2025-09-30.clover',
}) : null;

export async function createSandboxSession(deviceId: string): Promise<string> {
  // 使用 PayPal.Me 固定金额链接，用户点击后直接跳转到 0.99 美元收银台
  return 'https://paypal.me/xiaoyi11/0.99USD';
}