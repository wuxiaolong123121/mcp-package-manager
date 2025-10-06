import Stripe from 'stripe';

// 使用环境变量存储Stripe密钥，避免硬编码在代码中
const stripeKey = process.env.STRIPE_SECRET_KEY;

if (!stripeKey) {
  throw new Error('STRIPE_SECRET_KEY 环境变量未设置');
}

const stripe = new Stripe(stripeKey, {
  apiVersion: '2025-09-30.clover',
});

export async function createSandboxSession(deviceId: string): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: 'CodeBuddy Full-Run' },
          unit_amount: 99, // 0.99 USD
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `https://codebuddy.cn/success?did=${deviceId}`,
    cancel_url: `https://codebuddy.cn/cancel?did=${deviceId}`,
    metadata: { deviceId }, // 后面 webhook 用
  });
  
  if (!session.url) {
    throw new Error('无法创建支付会话');
  }
  
  return session.url; // 收银台 URL
}