-- ============================================================
-- 宜礼商城数据库完整修复脚本 v2
-- 解决：注册/下单/购物车数据无法写入数据库的问题
-- 根因：RLS 策略阻止匿名用户插入数据
-- ============================================================

-- --------------------------------------------------
-- 第1步：修复 shop_users 表 — 允许匿名注册
-- --------------------------------------------------

-- 先禁用再启用 RLS（清理旧策略）
ALTER TABLE public.shop_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_users ENABLE ROW LEVEL SECURITY;

-- 删除旧策略（如果存在）
DROP POLICY IF EXISTS shop_users_select_own ON public.shop_users;
DROP POLICY IF EXISTS shop_users_insert_own ON public.shop_users;
DROP POLICY IF EXISTS shop_users_update_own ON public.shop_users;
DROP POLICY IF EXISTS shop_users_delete_own ON public.shop_users;

-- 创建新策略：
-- 1. 任何人都可以 INSERT（注册场景）
-- 2. 用户只能查看/修改自己的记录
CREATE POLICY shop_users_insert_all ON public.shop_users FOR INSERT WITH CHECK (true);
CREATE POLICY shop_users_select_own ON public.shop_users FOR SELECT USING (auth.uid() = id);
CREATE POLICY shop_users_update_own ON public.shop_users FOR UPDATE USING (auth.uid() = id);

-- 授予权限
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_users TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_users TO authenticated;

-- --------------------------------------------------
-- 第2步：创建缺失的购物车表
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shop_carts (
    user_id UUID NOT NULL,
    items JSONB NOT NULL DEFAULT '[]',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id)
);

COMMENT ON TABLE public.shop_carts IS '用户购物车持久化存储';

ALTER TABLE public.shop_carts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS shop_carts_select_own ON public.shop_carts;
DROP POLICY IF EXISTS shop_carts_insert_own ON public.shop_carts;
DROP POLICY IF EXISTS shop_carts_update_own ON public.shop_carts;
DROP POLICY IF EXISTS shop_carts_delete_own ON public.shop_carts;

-- 注意：购物车操作需要用户已登录（有有效的 auth.uid）
-- 但由于前端使用自定义 token 而非 Supabase Auth，
-- 这里允许 anon 角色读写以便前端通过 API key 操作
CREATE POLICY shop_carts_select_own ON public.shop_carts FOR SELECT USING (true);
CREATE POLICY shop_carts_insert_own ON public.shop_carts FOR INSERT WITH CHECK (true);
CREATE POLICY shop_carts_update_own ON public.shop_carts FOR UPDATE USING (true);
CREATE POLICY shop_carts_delete_own ON public.shop_carts FOR DELETE USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_carts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_carts TO authenticated;

-- --------------------------------------------------
-- 第3步：查看所有商城表的结构（调试用）
-- --------------------------------------------------
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name IN ('shop_products', 'shop_orders', 'shop_order_items', 'shop_users', 'shop_addresses', 'shop_carts')
ORDER BY table_name, ordinal_position;

-- --------------------------------------------------
-- 第4步：查看现有数据量
-- --------------------------------------------------
SELECT 'shop_products' as table_name, COUNT(*) as count FROM shop_products
UNION ALL
SELECT 'shop_orders', COUNT(*) FROM shop_orders
UNION ALL
SELECT 'shop_order_items', COUNT(*) FROM shop_order_items
UNION ALL
SELECT 'shop_users', COUNT(*) FROM shop_users
UNION ALL
SELECT 'shop_addresses', COUNT(*) FROM shop_addresses
UNION ALL
SELECT 'shop_carts', COUNT(*) FROM shop_carts;
