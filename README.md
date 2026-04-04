# 福利云 - 企业官网

## 项目简介

这是一个专为企业服务型公司（员工福利解决方案）设计的官方网站，采用华为风格设计，包含完整的前端页面和后台管理系统。

## 功能特性

### 前端页面
- **首页**：公司介绍、核心优势、产品预览、成功案例
- **产品服务**：6大福利产品展示
- **商户网络**：全国商户列表，支持地理定位排序
- **成功案例**：客户案例展示
- **关于我们**：公司介绍、发展历程、团队
- **联系我们**：联系表单和联系方式

### 后台管理
- ✅ 公司信息管理
- ✅ **商户列表管理**（增删改查）
- ✅ 产品管理
- ✅ 案例管理
- ✅ 首页配置

## 项目结构

```
company-website/
├── index.html          # 首页
├── products.html       # 产品服务
├── merchants.html      # 商户网络
├── cases.html          # 成功案例
├── about.html          # 关于我们
├── contact.html        # 联系我们
├── js/
│   └── main.js         # 主要脚本
├── data/
│   └── content.json    # 网站内容数据
├── admin/
│   └── index.html      # 后台管理
└── README.md
```

## 设计风格

- **主色调**：华为蓝 (#0052D9)
- **辅助色**：白色、灰色
- **风格**：简约、专业、科技感
- **布局**：大量留白、网格系统

## 技术栈

- HTML5
- Tailwind CSS (CDN)
- Vanilla JavaScript
- JSON 数据存储

## 部署说明

### 1. 静态部署（简单）

直接将整个文件夹上传到任意静态托管服务：
- Vercel
- Netlify
- GitHub Pages
- 阿里云 OSS
- 腾讯云 COS

### 2. 添加后端（推荐生产环境）

当前版本使用 JSON 文件存储数据，如需持久化，需要添加后端：

#### 方案 A：Node.js + Express
```javascript
// 提供 API 接口读写 content.json
app.get('/api/data', ...)
app.post('/api/data', ...)
```

#### 方案 B：Serverless
- Vercel Functions
- Netlify Functions
- 阿里云函数计算

#### 方案 C：使用 CMS
- Strapi
- Directus
- WordPress Headless

## 后台使用说明

1. 访问 `https://你的网站.com/admin/`
2. 点击左侧菜单切换管理模块
3. **商户管理**：
   - 点击"+ 添加商户"添加新商户
   - 点击"编辑"修改商户信息
   - 点击"删除"移除商户
   - 需要填写：名称、城市、类别、地址、经纬度、标签

## 数据格式

### 商户数据示例
```json
{
  "id": 1,
  "name": "华润万家",
  "category": "超市",
  "city": "北京",
  "address": "北京市朝阳区建国路88号",
  "lat": 39.9042,
  "lng": 116.4074,
  "tags": ["大型连锁", "品类齐全"]
}
```

### 获取经纬度

使用百度地图或高德地图的坐标拾取工具：
- 百度地图：https://api.map.baidu.com/lbsapi/getpoint/
- 高德地图：https://lbs.amap.com/console/show/picker

## 定制修改

### 修改公司信息
编辑 `data/content.json` 中的 `company` 对象

### 修改颜色主题
在所有 HTML 文件中搜索 `#0052D9` 替换为你想要的颜色

### 添加新页面
1. 复制 `about.html` 作为模板
2. 修改内容和标题
3. 在导航栏添加链接

## 注意事项

1. **当前版本**：后台管理为纯前端演示，刷新页面后数据会丢失
2. **生产环境**：需要接入后端 API 或使用数据库
3. **地理定位**：商户列表页面需要用户授权位置权限才能按距离排序

## 联系方式

如需技术支持或定制开发，请联系：
- 邮箱：your-email@example.com
- 电话：400-XXX-XXXX

---

© 2024 福利云. All rights reserved.