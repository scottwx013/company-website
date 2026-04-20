#!/bin/bash
# 创建新的 Vercel 项目并部署

cd /root/.openclaw/workspace/company-website

# 删除旧的 vercel 配置
rm -rf .vercel

# 使用新的项目名部署
vercel --name yili-new 2>&1
