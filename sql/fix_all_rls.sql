-- ============================================================
-- 宜礼商城数据库紧急修复脚本 v3
-- 解决：所有数据操作被 RLS 阻止的问题
-- 根因：前端使用自定义 token，Supabase 无法识别 auth.uid()
-- ============================================================

-- --------------------------------------------------
-- 核心问题说明：
-- 前端登录时生成自定义 token（'yili_' + user.id + '_' + Date.now()）
-- 这个 token 不是 Supabase Auth 的 JWT，Supabase 不认识它
-- 所以 auth.uid() 始终为 null，RLS 策略全部失效
-- 
-- 短期方案：放宽商城所有表的 RLS 为开放读写
-- 长期方案：迁移到 Supabase Auth（signUp/signInWithPassword）
-- --------------------------------------------------

-- 1. shop_users — 允许任何人注册和查询
ALTER TABLE public.shop_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS shop_users_insert_all ON public.shop_users;
DROP POLICY IF EXISTS shop_users_select_own ON public.shop_users;
DROP POLICY IF EXISTS shop_users_update_own ON public.shop_users;
DROP POLICY IF EXISTS shop_users_delete_own ON public.shop_users;
CREATE POLICY shop_users_all ON public.shop_users FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON public.shop_users TO anon, authenticated;

-- 2. shop_orders — 允许开放读写（后续应加更细粒度控制）
ALTER TABLE public.shop_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS shop_orders_all ON public.shop_orders;
CREATE POLICY shop_orders_all ON public.shop_orders FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON public.shop_orders TO anon, authenticated;

-- 3. shop_order_items — 允许开放读写
ALTER TABLE public.shop_order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS shop_order_items_all ON public.shop_order_items;
CREATE POLICY shop_order_items_all ON public.shop_order_items FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON public.shop_order_items TO anon, authenticated;

-- 4. shop_carts — 创建表并开放读写
CREATE TABLE IF NOT EXISTS public.shop_carts (
    user_id UUID NOT NULL,
    items JSONB NOT NULL DEFAULT '[]',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id)
);
ALTER TABLE public.shop_carts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS shop_carts_all ON public.shop_carts;
CREATE POLICY shop_carts_all ON public.shop_carts FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON public.shop_carts TO anon, authenticated;

-- 5. shop_addresses — 开放读写
ALTER TABLE public.shop_addresses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS shop_addresses_all ON public.shop_addresses;
CREATE POLICY shop_addresses_all ON public.shop_addresses FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON public.shop_addresses TO anon, authenticated;

-- 6. shop_products — 保持现有策略（只读对匿名开放，写操作需要认证）
-- 但为了后台管理功能正常，也开放
ALTER TABLE public.shop_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS shop_products_all ON public.shop_products;
CREATE POLICY shop_products_all ON public.shop_products FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON public.shop_products TO anon, authenticated;

-- --------------------------------------------------
-- 验证：查看修复后的策略
-- --------------------------------------------------
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('shop_users', 'shop_orders', 'shop_order_items', 'shop_carts', 'shop_addresses', 'shop_products')
ORDER BY tablename;

-- --------------------------------------------------
-- 验证：查看各表数据量
-- --------------------------------------------------
SELECT 'shop_products' as table_name, COUNT(*) as count FROM shop_products
UNION ALL SELECT 'shop_orders', COUNT(*) FROM shop_orders
UNION ALL SELECT 'shop_order_items', COUNT(*) FROM shop_order_items
UNION ALL SELECT 'shop_users', COUNT(*) FROM shop_users
UNION ALL SELECT 'shop_addresses', COUNT(*) FROM shop_addresses
UNION ALL SELECT 'shop_carts', COUNT(*) FROM shop_carts;
