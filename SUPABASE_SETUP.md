# Supabase 后端配置指南

## 概述

使用 Supabase 作为后端数据库，实现后台管理数据实时同步到官网。

## 快速开始

### 1. 创建 Supabase 项目

1. 访问 https://supabase.com
2. 注册/登录账号
3. 点击 "New Project"
4. 填写项目名称：yili-website
5. 设置数据库密码（请牢记）
6. 选择区域：建议选择 Asia Pacific (Singapore) 或 Asia Northeast (Tokyo)
7. 点击 "Create new project"

### 2. 获取 API 密钥

项目创建后，进入项目 Dashboard：

1. 左侧菜单 → **Settings** → **API**
2. 找到以下信息：
   - **Project URL**: `https://xxxxxxxx.supabase.co`
   - **anon public**: 公钥（用于前端读取）
   - **service_role secret**: 私钥（用于后台管理，请勿泄露）

### 3. 创建数据库表

1. 左侧菜单 → **SQL Editor**
2. 点击 **New query**
3. 复制 `supabase/schema.sql` 文件内容
4. 粘贴到 SQL Editor
5. 点击 **Run**

### 4. 配置项目

#### 修改前端配置

编辑 `js/main.js`：
```javascript
const SUPABASE_URL = 'https://你的项目.supabase.co';
const SUPABASE_ANON_KEY = '你的anon-key';
```

#### 修改后台配置

编辑 `admin/index.html`：
```javascript
const SUPABASE_URL = 'https://你的项目.supabase.co';
const SUPABASE_ANON_KEY = '你的anon-key';
const SUPABASE_SERVICE_KEY = '你的service-role-key';
```

### 5. 初始化数据

首次使用时，需要导入初始数据：

在 SQL Editor 中运行：

```sql
-- 插入示例商户
INSERT INTO merchants (name, city, address, phone, coupon_types, lat, lng) VALUES
('星巴克咖啡', '北京', '北京市朝阳区建国路88号', '010-12345678', ARRAY['餐饮券'], 39.9042, 116.4074),
('万达影城', '上海', '上海市黄浦区南京东路100号', '021-87654321', ARRAY['电影通兑券'], 31.2304, 121.4737);

-- 插入产品
INSERT INTO products (name, description, features, image, image_alt, sort_order) VALUES
('节日福利套餐', '春节、端午、中秋等节日福利一站式解决方案', ARRAY['多档位选择', '全国配送', '个性化定制'], 'https://images.unsplash.com/photo-1586880244406-556ebe35f282?w=400&h=300&fit=crop', '礼品配送', 1),
('员工关怀计划', '生日福利、入职周年、婚育礼金等全场景关怀', ARRAY['自动化发放', '智能提醒', '数据分析'], 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=300&fit=crop', '员工关怀', 2);
```

### 6. 部署更新

修改配置后，重新部署到 Vercel：

```bash
cd company-website
vercel --prod
```

## 数据表结构

### merchants（商户表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 主键 |
| name | TEXT | 商户名称 |
| city | TEXT | 城市 |
| address | TEXT | 详细地址 |
| phone | TEXT | 联系电话 |
| coupon_types | TEXT[] | 卡券类型数组 |
| lat | NUMERIC | 纬度 |
| lng | NUMERIC | 经度 |
| status | TEXT | 状态(online/offline) |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### products（产品表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 主键 |
| name | TEXT | 产品名称 |
| description | TEXT | 产品描述 |
| features | TEXT[] | 特性数组 |
| image | TEXT | 图片URL |
| image_alt | TEXT | 图片alt文本 |
| sort_order | INTEGER | 排序 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### company_info（公司信息表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键(固定为1) |
| name | TEXT | 公司名称 |
| slogan | TEXT | 口号 |
| description | TEXT | 描述 |
| phone | TEXT | 电话 |
| email | TEXT | 邮箱 |
| address | TEXT | 地址 |
| story | TEXT | 公司故事 |
| mission | TEXT | 使命 |
| vision | TEXT | 愿景 |
| values | JSONB | 核心价值观 |
| timeline | JSONB | 发展历程 |
| updated_at | TIMESTAMP | 更新时间 |

## 安全说明

### 行级安全策略 (RLS)

已配置以下安全策略：
- **匿名用户(anon)**: 只允许读取数据
- **认证用户(authenticated)**: 允许读写所有数据

### 密钥保护

- **anon key**: 可以公开，用于前端读取
- **service_role key**: 必须保密，仅用于后台管理

## 故障排查

### 连接失败

检查：
1. SUPABASE_URL 是否正确
2. 密钥是否过期
3. 网络连接是否正常

### 权限错误

检查：
1. RLS 策略是否正确配置
2. 使用的密钥是否有足够权限

### 数据不更新

检查：
1. 浏览器控制台是否有错误
2. Supabase Dashboard 中数据是否正确保存
3. 官网是否正确加载 Supabase SDK

## 费用说明

Supabase 免费版包含：
- 500MB 数据库空间
- 2GB 带宽/月
- 无限 API 请求

对于企业官网来说完全够用。如需更多资源，可升级到 Pro 版。

---

**配置完成后，后台管理修改将实时同步到官网！**
