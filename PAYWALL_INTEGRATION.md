# 付费墙集成文档

## 概述

本项目已集成付费墙功能，当用户调用次数超过免费限制时，系统会自动创建Stripe支付会话并返回支付链接。

## 环境配置

1. 复制 `.env.example` 文件为 `.env`
2. 在 `.env` 文件中设置你的 Stripe 密钥：
   ```
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
   ```

## 功能说明

### 1. 付费墙检查

在 `RoleManager.ts` 的 `runAllSteps` 方法中，系统会：
- 生成设备ID
- 检查调用次数是否超过免费限制
- 如需要付费，创建Stripe支付会话
- 返回支付URL

### 2. 支付会话创建

`StripeSandbox.ts` 文件中的 `createSandboxSession` 函数：
- 使用Stripe创建支付会话
- 配置0.99美元的产品价格
- 设置支付成功和取消的回调URL

### 3. 调用次数管理

`Paywall.ts` 文件管理用户的调用次数：
- 跟踪每个设备的调用次数
- 提供免费的调用次数（默认3次）
- 检查是否需要付费

## 测试

运行以下命令测试付费墙功能：

```bash
node dist/core/PaywallTest.js
```

## 使用示例

当用户调用 `runAllSteps` 方法时，如果超过免费次数限制，系统会返回：

```json
{
  "status": "payment_required",
  "paymentUrl": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

## 注意事项

- 确保已安装Stripe依赖：`npm install stripe @types/stripe`
- 在生产环境中使用正式的Stripe密钥
- 根据实际需求调整免费调用次数限制