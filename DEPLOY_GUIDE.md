# 宜礼官网部署指南 - 绑定 www.1gift.cn

## 方式一：Vercel 部署（推荐）

### 步骤 1：创建 GitHub 仓库

1. 访问 https://github.com/new
2. 仓库名称：`yili-website`
3. 选择 **Public** 或 **Private**
4. 点击 **Create repository**

### 步骤 2：上传代码

**方法 A - 直接上传：**
1. 下载 `yili-website-v1.0.tar.gz` 压缩包
2. 解压到本地
3. 在 GitHub 仓库页面点击 "uploading an existing file"
4. 拖拽上传所有文件

**方法 B - Git 命令行：**
```bash
# 克隆空仓库
git clone https://github.com/你的用户名/yili-website.git
cd yili-website

# 解压项目文件到此处
# 然后提交
git add .
git commit -m "Initial commit"
git push origin main
```

### 步骤 3：部署到 Vercel

1. 访问 https://vercel.com/new
2. 用 GitHub 账号登录
3. 选择 `yili-website` 仓库
4. Framework Preset 选择 **Other**
5. 点击 **Deploy**

### 步骤 4：绑定域名

1. Vercel 项目控制台 → **Settings** → **Domains**
2. 输入：`www.1gift.co`
3. 点击 **Add**
4. 按提示配置 DNS：
   - 类型: CNAME
   - 名称: www
   - 值: cname.vercel-dns.com

### 步骤 5：配置 DNS

登录你的域名管理后台，添加解析：

| 记录类型 | 主机记录 | 记录值 | TTL |
|----------|----------|--------|-----|
| CNAME | www | cname.vercel-dns.com | 默认 |

等待 5-30 分钟生效。

---

## 方式二：Cloudflare Pages（更简单）

1. 访问 https://dash.cloudflare.com
2. Pages → Create a project
3. 上传 `yili-website-v1.0.tar.gz` 压缩包
4. 项目设置 → Custom domains
5. 添加 `www.1gift.cn`
6. 按提示修改 DNS（自动或手动）

---

## 完成验证

访问 https://www.1gift.co 确认网站正常显示。

---

## 需要帮助？

部署过程中遇到任何问题，随时告诉我。
