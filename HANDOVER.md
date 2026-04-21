# 宜礼商城项目 — 完整资源交接文档

## 1. 项目概述
- **项目名称**: 宜礼商城 / 1gift
- **公司官网 + 商城**: 同一个仓库，商城是公司官网的一个板块
- **线上地址**: https://1gift.co
- **技术栈**: 纯前端 HTML/CSS/JS + Vercel 部署
- **数据存储**: localStorage（解决 Vercel serverless /tmp 不持久问题）

---

## 2. GitHub 仓库

### 仓库信息
- **仓库地址**: https://github.com/scottwx013/company-website
- **默认分支**: main
- **本地路径**: `/root/.openclaw/workspace/company-website/`

### GitHub Token
- **Token**: [见本地 WORKSPACE/HANDOVER.md 或询问 Kimi Claw]
- **权限**: repo + workflow
- **用途**: 代码推送、CI/CD workflow 管理

### GitHub 账户（备用）
- **用户名**: scottwx013
- **邮箱**: [见本地 WORKSPACE/HANDOVER.md 或询问 Kimi Claw]
- **密码**: [见本地 WORKSPACE/HANDOVER.md 或询问 Kimi Claw]

---

## 3. Vercel 部署

### 项目信息
- **项目名称**: yili-mall
- **Vercel 账户**: 通过 GitHub (scottwx013) 登录
- **线上域名**: https://1gift.co
- **Vercel 临时域名**: https://yili-mall.vercel.app

### DNS 配置
- **域名**: 1gift.co
- **A 记录**: `@` → `76.76.21.21`（Vercel Anycast IP）
- **DNS 服务商**: 阿里云/万网
- **SSL**: 自动签发，已启用 HSTS

### Vercel CLI 凭证
- 已在本机配置好，可直接使用 `vercel` 命令
- 项目 ID 绑定在 `.vercel/project.json`

---

## 4. 项目结构

```
company-website/
├── index.html              # 公司官网首页
├── about.html              # 关于我们
├── contact.html            # 联系我们
├── shop/                   # 商城模块
│   ├── index.html          # 商城首页（商品列表）
│   ├── product.html        # 商品详情
│   ├── cart.html           # 购物车
│   ├── checkout.html       # 结算页
│   ├── orders.html         # 我的订单
│   ├── login.html          # 登录/注册
│   └── shop-data.js        # ⭐ 统一数据层（核心文件）
├── admin/                  # 后台管理
│   └── index.html          # 管理后台（含商城商品/订单管理）
├── api/                    # Vercel API 路由
│   └── data.js             # Serverless API（默认商品数据）
├── assets/                 # 静态资源
│   └── logo-purple.jpg     # Logo
└── vercel.json             # Vercel 配置
```

---

## 5. 核心架构说明

### 数据层 (shop-data.js)
- **存储方式**: localStorage（键名 `yili_shop_data`）
- **数据结构**:
  ```json
  {
    "users": [],      // 注册用户
    "products": [],   // 商品数据（admin 修改后覆盖默认）
    "orders": [],     // 订单数据
    "addresses": [],  // 收货地址
    "settings": {}    // 其他设置
  }
  ```
- **前后台共享**: admin/index.html 和 shop/ 所有页面共用同一数据层
- **默认商品**: 内置 3 个示例商品（京东卡 100元/200元、定制礼盒）

### API 层 (api/data.js)
- **用途**: 提供默认商品数据（Vercel serverless 函数）
- **限制**: /tmp 目录数据不持久，仅用于默认数据 fallback
- **重要**: 所有用户数据（注册、订单、购物车）都走 localStorage，不走 API

---

## 6. 账户密码清单

### GitHub
| 项目 | 值 |
|------|-----|
| 用户名 | scottwx013 |
| 邮箱 | [敏感信息 - 询问 Kimi Claw] |
| 密码 | [敏感信息 - 询问 Kimi Claw] |
| Token | [敏感信息 - 询问 Kimi Claw] |

### Vercel
| 项目 | 值 |
|------|-----|
| 登录方式 | GitHub OAuth |
| 项目名 | yili-mall |

### 商城后台管理
| 项目 | 值 |
|------|-----|
| 后台地址 | https://1gift.co/admin/index.html |
| 默认用户名 | admin |
| 默认密码 | admin123 |

---

## 7. 部署流程

### 自动部署（推荐）
1. 修改代码 → `git add -A`
2. `git commit -m "描述"`
3. `git push origin master:main`
4. Vercel 自动拉取最新代码部署

### 手动部署
```bash
cd /root/.openclaw/workspace/company-website
vercel --prod --yes
```

---

## 8. 已知问题与注意事项

### 当前限制
1. **localStorage 数据隔离**: 不同浏览器/设备数据不互通，这是设计选择（简单架构）
2. **无真实支付**: 支付流程为模拟，点击"立即支付"直接改订单状态为"已付款"
3. **微信/手机验证码登录**: 占位功能，未接入真实 API
4. **图片资源**: 商品图使用 Unsplash 外链，建议后续替换为自有 CDN

### 待优化项
1. 接入真实后端数据库（Supabase/Firebase）替代 localStorage
2. 接入微信支付/支付宝
3. 商品图片上传功能
4. 物流查询接口
5. 用户头像上传
6. 订单导出 Excel

---

## 9. 最近修改记录

### 2026-04-21 商城重构
- 新增 `shop/shop-data.js` 统一数据层
- 解决 Vercel /tmp 数据不持久问题
- 前后台数据联动
- 完整测试通过：注册→登录→加购→结算→下单→查看订单

---

## 10. 联系方式

- **客服热线**: 400-928-9028
- **技术维护**: K2.6 Agent / Kimi Claw

---

*此文档为公开版本，敏感信息已脱敏。完整凭证请查看本地 `/root/.openclaw/workspace/HANDOVER.md` 或询问 Kimi Claw。*
