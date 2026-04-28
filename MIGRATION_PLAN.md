# 宜礼商城 Supabase 迁移与上线计划

**启动时间**: 2026-04-22
**当前状态**: 🟢 Phase 1-3 已完成，Steps 5-8 已上线
**最新部署**: https://yili-mall.vercel.app

---

## 执行记录

### 2026-04-22（Phase 1 启动）
- [x] 编写完整商城数据库 schema：`supabase-schema-full.sql`
- [x] 编写底层 Supabase 客户端：`shop/supabase-client.js`
- [x] 重写 `shop/shop-data.js`：保持 API 兼容，内部接 Supabase
- [x] 更新所有商城页面引用（index, product, login, checkout, orders, cart, admin）
- [x] 在 Supabase Dashboard 执行 SQL 创建商城表
- [x] 测试注册 → 登录 → 加购 → 下单 → 查订单（全流程通过）

### 2026-04-26（库存函数修复）
- [x] 修复 `decrement_stock` 函数重载冲突（bigint + integer 两个版本）
- [x] 前端改为 `decrement_stock_batch(JSONB)` 事务性批量扣减
- [x] `createShopOrder` 增加前置库存检查
- [x] 代码推送到 GitHub

### 2026-04-27（商用三大件）
- [x] 支付确认页 `shop/payment.html`（企业统一结算为默认，微信/支付宝标记「即将上线」）
- [x] 隐私政策页 `shop/privacy.html`
- [x] 用户协议页 `shop/terms.html`
- [x] 全站页脚统一添加隐私政策与用户协议链接

### 2026-04-28 上午（自动化基础设施）
- [x] 修复 GitHub Actions 自动部署（替换失效的 `vercel/action-deploy@v1`）
- [x] 配置 GitHub secrets（VERCEL_TOKEN / ORG_ID / PROJECT_ID）
- [x] 编写全流程 E2E 测试脚本 `test/e2e/full-flow.test.js`
- [x] 部署后自动跑 E2E 测试（CI 跑通）

### 2026-04-28 下午（Steps 5-8 + 图床迁移 + 原子库存）
- [x] 图床迁至 Supabase Storage（`product-images` bucket，8 张商品图已上传）
- [x] **Step 5 物流发货管理**：后台发货弹窗支持实物/虚拟商品，用户端订单详情展示物流/卡券
- [x] **Step 6 消息通知**：用户端 `showToast` 函数，关键操作后自动提示
- [x] **Step 7 数据统计看板**：Admin 订单页 4 张统计卡片（今日订单/销售额/待发货/库存预警）
- [x] **Step 8 客服售后入口**：用户端「申请退款」+「联系客服」，Admin 后台「退款/确认收货/取消」
- [x] 补充后台「确认收款」按钮（待付款订单 → 确认收款 → 待发货）
- [x] 代码提交 GitHub + 自动部署成功

---

## 已完成的模块清单

### Phase 1: 数据持久化 ✅
| 任务 | 状态 |
|------|------|
| 创建 `shop_users` 表（用户注册/登录） | ✅ |
| 创建 `shop_products` 表（商城商品） | ✅ |
| 创建 `shop_orders` 表（订单主表） | ✅ |
| 创建 `shop_order_items` 表（订单明细） | ✅ |
| 创建 `shop_addresses` 表（收货地址） | ✅ |
| `shop/shop-data.js` 接入 Supabase REST API | ✅ |
| 保留 localStorage 作为离线缓存 | ✅ |
| 用户注册/登录/会话（JWT token） | ✅ |
| 下单 → 写入 Supabase | ✅ |
| 订单状态流 | ✅ 从数据库读取 |
| 库存扣减 | ✅ 数据库原子操作 `decrement_stock_batch` |
| 用户订单查询 | ✅ 从数据库读取 |
| 后台订单管理 | ✅ 从数据库读取 |
| 全链路测试 | ✅ E2E 脚本 + CI 自动跑 |

### Phase 2: 安全与权限 ✅
| 任务 | 状态 |
|------|------|
| 后台登录认证 | ✅ 用户名+密码+验证码 |
| 接口层面校验 | ✅ `ADMIN_SECRET` + Bearer Token |
| 商品图片自有化 | ✅ Supabase Storage `product-images` bucket |
| RLS 策略 | ✅ 已配置 |

### Phase 3: 体验优化 ✅
| 任务 | 状态 |
|------|------|
| 全站移动端适配 | ✅ Tailwind 响应式 |
| 支付确认页 | ✅ 企业统一结算 |
| 隐私政策/用户协议 | ✅ 独立页面 + 页脚链接 |
| 商用页脚 | ✅ 全站统一 |

### Steps 5-8（物流/通知/统计/售后）✅
| 任务 | 状态 |
|------|------|
| 物流发货管理 | ✅ 实物/虚拟商品均支持 |
| 消息通知 | ✅ 页面内 Toast 提示 |
| 数据统计看板 | ✅ Admin 4 张统计卡片 |
| 客服售后入口 | ✅ 退款申请 + 联系客服 |
| 后台确认收款 | ✅ 待付款 → 确认收款 → 待发货 |

---

## 待解决问题

### 🔴 需要手动执行（1项）
1. **清理数据库旧函数**：在 Supabase Dashboard SQL Editor 执行：
   ```sql
   DROP FUNCTION IF EXISTS public.decrement_stock(bigint, integer);
   ```
   > 说明：前端已统一使用 `decrement_stock_batch(JSONB)`，旧版 `decrement_stock(bigint, integer)` 不再使用。

### 🟡 建议验证（1项）
2. **线上全链路手动验证**：访问 https://1gift.co/shop/，走一遍：
   - 注册 → 登录 → 加购 → 下单 → 支付 → 查订单
   - 后台：确认收款 → 发货（填物流单号）→ 查看物流
   - 用户端：申请退款 → 后台处理退款

### 🟢 后续规划（按需推进）
3. **真实支付接入**：微信支付/支付宝（需企业资质申请）
4. **订单导出 Excel**、**用户统计面板**、**销售数据报表**
5. **SEO**：sitemap、结构化数据
6. **性能**：图片懒加载、CDN、JS/CSS 压缩

---

## 技术架构

| 组件 | 选择 |
|------|------|
| 数据库 | Supabase (PostgreSQL) |
| 认证 | 自定义 JWT（localStorage） |
| 图片存储 | Supabase Storage (`product-images`) |
| 部署 | Vercel + GitHub Actions 自动部署 |
| 支付 | 企业统一结算（微信/支付宝沙箱待接入） |
| 测试 | Playwright E2E（CI 自动跑） |

---

## 如何手动测试

```bash
# 本地测试
TEST_URL=http://localhost:8080 node test/e2e/full-flow.test.js

# 线上测试
TEST_URL=https://yili-mall.vercel.app node test/e2e/full-flow.test.js
```

---

**文档更新时间**: 2026-04-28
**最新代码 Commit**: `d7a79ce`
