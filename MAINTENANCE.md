# 宜礼官网维护架构

## 项目概览

| 项目 | 说明 |
|------|------|
| 品牌名称 | 宜礼 |
| 项目类型 | 企业员工福利解决方案官网 |
| 技术栈 | 静态HTML + Tailwind CSS + Vanilla JS |
| 部署平台 | Vercel (推荐) |
| 维护方式 | 托管维护 |

## 文件结构

```
company-website/
├── index.html          # 首页
├── about.html          # 关于我们
├── products.html       # 产品服务
├── merchants.html      # 商户网络
├── contact.html        # 联系我们
├── admin/              # 后台管理
│   └── index.html
├── data/               # 数据文件
│   └── content.json    # 所有内容数据
├── assets/             # 静态资源
│   ├── logo.png        # 蓝色LOGO (后台用)
│   ├── logo-purple.jpg # 紫色LOGO (官网用)
│   └── wechat-qr.jpg   # 微信公众号二维码
├── css/                # 样式文件
├── js/                 # 脚本文件
├── vercel.json         # Vercel部署配置
└── .github/            # GitHub工作流
    └── workflows/
        └── deploy.yml  # 自动部署
```

## 内容更新指南

### 快速修改清单

**修改电话号码**
- 文件: `data/content.json` → `company.phone`
- 文件: `contact.html` (检查页面底部)
- 文件: `index.html` (检查页面底部)

**修改产品信息**
- 文件: `data/content.json` → `products` 数组
- 字段: `name`, `description`, `features`, `image`, `imageAlt`

**修改商户信息**
- 文件: `data/content.json` → `merchants` 数组
- 字段: `name`, `city`, `address`, `couponTypes`, `lat`, `lng`

**修改公司介绍**
- 文件: `data/content.json` → `about` 对象
- 字段: `story`, `mission`, `vision`, `values`, `timeline`

### 图片替换

**LOGO**
- 官网紫色LOGO: `assets/logo-purple.jpg`
- 后台蓝色LOGO: `assets/logo.png`

**产品图片**
- 推荐尺寸: 400x300
- 格式: JPG/PNG
- 存放: `assets/` 目录

**微信公众号二维码**
- 文件: `assets/wechat-qr.jpg`

## 部署流程

### 自动部署 (推荐)

1. 代码推送到 GitHub main 分支
2. Vercel 自动检测并部署
3. 约 1-2 分钟完成

### 手动部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

## 后台管理

### 登录凭据
- 管理员: `admin` / `admin123`
- 运营人员: `manager` / `manager123`

### 功能模块
- 商户管理 (增删改查、批量导入)
- 内容管理 (关于我们编辑)
- 账户管理 (修改密码)

### 注意事项
- 当前为演示模式，数据修改后需手动同步到 `data/content.json`
- 批量导入支持 Excel (.xlsx/.xls) 和 CSV 格式

## 维护记录

| 日期 | 操作 | 备注 |
|------|------|------|
| 2026-04-05 | 项目初始化 | 完成品牌重构、页面开发 |

## 联系方式

- 维护负责人: AI Assistant
- 紧急联系: 通过 Kimi 对话

---

**最后更新**: 2026-04-05
