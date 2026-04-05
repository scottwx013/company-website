# Supabase 配置指南

## 快速开始

### 1. 创建 Supabase 项目

1. 访问 https://app.supabase.com
2. 点击 "New Project"
3. 填写项目名称：yili-website
4. 选择区域：Asia Pacific (Singapore) 最接近中国
5. 等待项目创建完成（约 1-2 分钟）

### 2. 获取连接信息

在项目 Dashboard 中：

1. 点击左侧 Settings → API
2. 复制以下信息：
   - **URL**: `https://xxxxxxxx.supabase.co`
   - **anon public**: `eyJhbG...` (长字符串)

### 3. 配置网站

编辑 `js/supabase-api.js`，替换配置：

```javascript
const SUPABASE_CONFIG = {
    url: 'https://你的项目.supabase.co',  // 替换为你的 URL
    anonKey: '你的-anon-key'               // 替换为你的 anon key
};
```

### 4. 创建数据库表

在 Supabase Dashboard 中：

1. 点击左侧 SQL Editor
2. 新建查询
3. 复制 `supabase-schema.sql` 的全部内容
4. 点击 Run

这会创建：
- `merchants` - 商户表
- `products` - 产品表
- `company` - 公司信息表
- `about` - 关于我们表
- `home_config` - 首页配置表

并插入默认数据（8 商户 + 6 产品）

### 5. 部署网站

```bash
vercel --prod
```

## 数据持久化说明

- 后台管理修改的数据会实时保存到 Supabase
- 网站所有页面从 Supabase 读取数据
- 数据永久保存，不会因部署而丢失
- 支持商户、产品、公司信息、关于我们、首页配置的增删改查

## API 限制

Supabase 免费套餐限制：
- 500MB 数据库空间
- 2GB 带宽/月
- 无限 API 请求

对于宜礼官网足够使用。

## 备份数据

定期在 Supabase Dashboard → Database → Backups 中下载备份。
