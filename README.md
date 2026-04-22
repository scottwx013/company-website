# 宜礼官网

企业员工福利解决方案官方网站。

## 在线预览

- **生产环境**: [待部署]
- **预览环境**: https://screening-stand-scholarship-reverse.trycloudflare.com (临时)

## 技术栈

- **前端**: HTML5 + Tailwind CSS + Vanilla JavaScript
- **地图**: Leaflet.js
- **图标**: Font Awesome
- **部署**: Vercel

## 页面结构

| 页面 | 路径 | 说明 |
|------|------|------|
| 首页 | `/index.html` | 品牌展示、产品入口 |
| 产品服务 | `/products.html` | 福利方案介绍 |
| 商户网络 | `/merchants.html` | 全国商户分布地图 |
| 关于我们 | `/about.html` | 公司介绍、发展历程 |
| 联系我们 | `/contact.html` | 联系方式、公众号 |
| 后台管理 | `/admin/index.html` | 商户/内容管理系统 |

## 快速开始

### 本地预览

```bash
# 使用 Python 简易服务器
python3 -m http.server 8888

# 或使用 Node.js serve
npx serve .
```

### 部署

```bash
# 一键部署
./deploy.sh

# 或使用 Vercel CLI
vercel --prod
```

## 内容管理

所有内容数据存储在 `data/content.json`，可直接修改：

- 公司信息 (`company`)
- 首页内容 (`home`)
- 产品列表 (`products`)
- 商户数据 (`merchants`)
- 关于我们 (`about`)

详见 [MAINTENANCE.md](./MAINTENANCE.md)

## 维护

本项目采用 **托管维护** 模式：

- 日常内容更新 → 修改 `data/content.json`
- 功能迭代/bug修复 → 联系维护人员
- 紧急问题 → 通过 Vercel 控制台一键回滚

## 品牌规范

- **品牌名称**: 宜礼
- **主色调**: 紫色 (#7c3aed)
- **服务热线**: 400-928-9028
- **LOGO**: 
  - 官网: `assets/logo-purple.jpg`
  - 后台: `assets/logo.png`

## 许可证

私有项目，未经授权不得转载或使用。

---

**维护方**: AI Assistant  
**最后更新**: 2026-04-05
# Vercel deploy trigger 1776842041
