import Stripe from 'stripe';

// 使用环境变量存储Stripe密钥，避免硬编码在代码中
const stripeKey = process.env.STRIPE_SECRET_KEY;

// 如果环境变量未设置，使用空字符串作为默认值（测试用）
const stripe = stripeKey ? new Stripe(stripeKey, {
  apiVersion: '2025-09-30.clover',
}) : null;

export async function createSandboxSession(deviceId: string): Promise<string> {
  if (!stripe) {
    // 测试模式：返回模拟的支付URL
    return `https://checkout.stripe.com/c/pay/test_session_${deviceId}`;
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'MCP Package Manager Pro',
              description: '解锁所有AI角色功能',
            },
            unit_amount: 99, // $0.99
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `https://example.com/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://example.com/cancel`,
      client_reference_id: deviceId,
    });

    if (!session.url) {
      throw new Error('无法创建支付会话');
    }

    return session.url;
  } catch (error) {
    console.error('创建支付会话失败:', error);
    throw error;
  }
}