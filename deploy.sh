#!/bin/bash
# 宜礼官网快速部署脚本

echo "🚀 宜礼官网部署脚本"
echo "===================="

# 检查 vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ 未安装 Vercel CLI，正在安装..."
    npm install -g vercel
fi

# 检查登录状态
echo "🔑 检查 Vercel 登录状态..."
vercel whoami &> /dev/null
if [ $? -ne 0 ]; then
    echo "请登录 Vercel:"
    vercel login
fi

# 询问部署方式
echo ""
echo "选择部署方式:"
echo "1) 部署到预览环境 (Preview)"
echo "2) 部署到生产环境 (Production)"
read -p "请输入选项 (1/2): " choice

case $choice in
    1)
        echo "🚀 部署到预览环境..."
        vercel
        ;;
    2)
        echo "🚀 部署到生产环境..."
        vercel --prod
        ;;
    *)
        echo "❌ 无效选项"
        exit 1
        ;;
esac

echo ""
echo "✅ 部署完成!"
