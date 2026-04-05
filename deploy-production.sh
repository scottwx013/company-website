#!/bin/bash
# 宜礼官网 - Vercel 生产部署脚本
# 用法: ./deploy-production.sh

echo "🚀 宜礼官网生产部署"
echo "===================="
echo ""

# 检查 vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "📦 安装 Vercel CLI..."
    npm install -g vercel
fi

# 检查是否已登录
echo "🔑 检查 Vercel 登录状态..."
vercel whoami > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "⚠️ 未登录 Vercel"
    echo "请运行: vercel login"
    exit 1
fi

# 确认部署
echo ""
echo "📋 部署信息:"
echo "   项目: 宜礼官网 (yili-website)"
echo "   域名: www.1gift.cn"
echo ""
read -p "确认部署到生产环境? (y/N): " confirm

if [[ $confirm != [yY] ]]; then
    echo "❌ 已取消"
    exit 0
fi

# 部署
echo ""
echo "🚀 开始部署..."
vercel --prod --confirm

echo ""
echo "✅ 部署完成!"
echo ""
echo "下一步:"
echo "1. 在 Vercel Dashboard 添加自定义域名: www.1gift.cn"
echo "2. 在域名 DNS 添加 CNAME: www.1gift.cn → cname.vercel-dns.com"
echo ""
