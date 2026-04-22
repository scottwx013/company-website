# 宜礼商城 Supabase 迁移与上线计划

**启动时间**: 2026-04-22
**目标**: 将宜礼官网+商城从纯前端 Demo 升级为可商用的真实系统

---

## 当前状态诊断

### 已完成的
- [x] 官网前端页面（index, about, contact, products, merchants）
- [x] 商城前端页面（shop/*）
- [x] 后台管理页面（admin/index.html）
- [x] Vercel 部署 + 自定义域名 1gift.co
- [x] GitHub 仓库 + CI/CD
- [x] Supabase 基础配置（官网数据表已接入）

### 致命问题
- [ ] 商城数据全在 localStorage，换设备/清缓存全丢
- [ ] 用户系统是假的，没有真实注册/登录/会话
- [ ] 支付是模拟的，直接改订单状态
- [ ] 后台没有权限校验，URL 直接进
- [ ] 订单数据前后端不一致

---

## Phase 1: 阻断级 — 数据持久化（本周完成）

### 1.1 扩展 Supabase Schema
- [ ] 创建 `shop_users` 表（用户注册/登录）
- [ ] 创建 `shop_products` 表（商城商品）
- [ ] 创建 `shop_orders` 表（订单主表）
- [ ] 创建 `shop_order_items` 表（订单商品明细）
- [ ] 创建 `shop_addresses` 表（收货地址）
- [ ] 创建 `contact_messages` 表（联系表单）
- [ ] 配置 RLS 策略（行级安全）

### 1.2 重写数据层
- [ ] `shop/shop-data.js` → 接入 Supabase REST API
- [ ] 保留 localStorage 作为离线缓存/降级
- [ ] `api/data.js` → 废弃或改为 Supabase 代理

### 1.3 用户系统真实化
- [ ] 注册：邮箱/手机验证 + 密码加密
- [ ] 登录：JWT token 存储
- [ ] 登出：清除会话
- [ ] 密码重置流程

### 1.4 订单系统真实化
- [ ] 下单 → 写入 Supabase
- [ ] 订单状态流转 → 同步到数据库
- [ ] 库存扣减 → 数据库原子操作
- [ ] 用户订单查询 → 从数据库读取
- [ ] 后台订单管理 → 从数据库读取

### 1.5 测试验证
- [ ] 注册 → 登录 → 加购 → 结算 → 下单 → 查订单（全流程）
- [ ] 后台查看订单/商品
- [ ] 数据跨浏览器/跨设备验证

---

## Phase 2: 高风险级 — 安全与权限（下周完成）

### 2.1 后台权限加固
- [ ] 登录页加验证码（已有，检查是否有效）
- [ ] 登录状态持久化（session/token）
- [ ] 未登录访问 admin 自动跳转登录页
- [ ] 接口层面校验（不是只靠前端 JS）

### 2.2 资源安全
- [ ] 商品图片替换为自有图床/阿里云 OSS
- [ ] Unsplash 外链逐步替换
- [ ] 配置 CSP（内容安全策略）

### 2.3 数据安全
- [ ] 密码不存储明文（bcrypt/argon2）
- [ ] 敏感接口加 rate limit
- [ ] 配置自动备份

---

## Phase 3: 体验级 — 优化与完善（持续）

### 3.1 移动端
- [ ] 全站移动端测试
- [ ] 微信内置浏览器兼容性
- [ ] 触摸交互优化

### 3.2 性能
- [ ] 图片懒加载
- [ ] JS/CSS 压缩
- [ ] CDN 加速

### 3.3 SEO
- [ ] 添加 meta 标签
- [ ] 生成 sitemap
- [ ] 结构化数据

### 3.4 运营工具
- [ ] 订单导出 Excel
- [ ] 用户统计面板
- [ ] 销售数据报表

---

## 技术选型确认

| 组件 | 选择 | 理由 |
|------|------|------|
| 数据库 | Supabase (PostgreSQL) | 已有基础配置，免费额度够用 |
| 认证 | Supabase Auth | 自带用户系统、邮箱验证、JWT |
| 存储 | Supabase Storage | 图片上传、CDN |
| 部署 | Vercel (保持) | 自动部署，域名已配 |
| 支付 | 微信支付（企业版申请中） | 先接入沙箱环境 |

---

## 执行记录

### 2026-04-22（Phase 1 启动）
- [x] 编写完整商城数据库 schema：`supabase-schema-full.sql`
- [x] 编写底层 Supabase 客户端：`shop/supabase-client.js`
- [x] 重写 `shop/shop-data.js`：保持 API 兼容，内部接 Supabase
- [x] 更新所有商城页面引用（index, product, login, checkout, orders, cart, admin）
- [x] 代码提交 GitHub + Vercel 自动部署
- [ ] 在 Supabase Dashboard 执行 SQL 创建商城表
- [ ] 测试注册 → 登录 → 加购 → 下单 → 查订单（全流程）
- [ ] 验证后台订单管理

---

## 🚨 你还需要手动完成的步骤

### 步骤 1：登录 Supabase Dashboard
1. 访问 https://app.supabase.com
2. 选择项目 `yili-website`（已创建）

### 步骤 2：执行 SQL 创建商城表
1. 左侧菜单 → **SQL Editor**
2. 点击 **New query**
3. 复制 `supabase-schema-full.sql` 全部内容（或粘贴以下核心部分）
4. 点击 **Run**

> ⚠️ 注意：执行前请确认现有 `merchants`、`products`、`company`、`about`、`home_config` 表中的数据是否需要备份。如果已有数据，SQL 中的 `ON CONFLICT DO NOTHING` 会跳过已存在记录，不会覆盖。

### 步骤 3：验证表是否创建成功
在 SQL Editor 中执行：
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

应该看到以下表：
- `about` ✅
- `admin_login_logs` ✅
- `company` ✅
- `contact_messages` ✅
- `home_config` ✅
- `merchants` ✅
- `products` ✅
- `shop_addresses` ✅
- `shop_order_items` ✅
- `shop_orders` ✅
- `shop_products` ✅
- `shop_users` ✅
- `shop_virtual_deliveries` ✅

### 步骤 4：测试全流程
访问 https://1gift.co/shop/login.html
1. 注册一个新用户
2. 登录
3. 浏览商品 → 加购物车 → 结算 → 下单
4. 查看订单页面
5. 换浏览器/换设备登录同一账号，验证数据是否同步

---

**当前状态**: 🟡 Phase 1 代码已部署，等待 SQL 执行 + 测试验证
